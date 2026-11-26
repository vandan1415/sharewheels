import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PRIVATE_BUCKETS = new Set([
  "owner-kyc-documents",
  "owner-vehicle-documents",
  "owner-vehicle-photos",
]);

const PUBLIC_PHOTO_SLOT_ORDER = [
  "front",
  "left_side",
  "right_side",
  "rear",
  "dashboard",
  "front_seats",
  "rear_seats",
  "odometer",
  "additional",
];

function mapSlotToAngle(slotType: string): string {
  if (slotType === "front") return "front";
  if (slotType === "rear" || slotType === "left_side" || slotType === "right_side") {
    return "side";
  }
  if (
    slotType === "dashboard" ||
    slotType === "front_seats" ||
    slotType === "rear_seats" ||
    slotType === "odometer"
  ) {
    return "interior";
  }
  return "gallery";
}

function extensionForPhoto(fileName: string | null, mimeType: string | null): string {
  const fromName = (fileName ?? "").split(".").pop()?.toLowerCase();
  if (fromName === "jpg" || fromName === "jpeg" || fromName === "png" || fromName === "webp") {
    return fromName;
  }
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeE164Phone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !serviceKey) {
    return jsonResponse(
      { error: "SERVER_CONFIG_ERROR", message: "Service role configuration missing." },
      500
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!bearer) {
      return jsonResponse({ error: "UNAUTHORIZED", message: "Missing access token." }, 401);
    }

    const { data: userRes, error: authErr } = await supabase.auth.getUser(bearer);
    if (authErr || !userRes?.user) {
      return jsonResponse({ error: "UNAUTHORIZED", message: "Invalid or expired session." }, 401);
    }
    const authUser = userRes.user;

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action.trim() : "";

    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", authUser.id);
    const roles = new Set((rolesData ?? []).map((r: { role: string }) => r.role));
    let isSuperAdmin = roles.has("super_admin");
    let isAdmin = isSuperAdmin || roles.has("admin");
    let actorRole = isSuperAdmin ? "super_admin" : isAdmin ? "admin" : "non_admin";

    const writeAudit = async (
      auditAction: string,
      entityType: string,
      entityId: string | null,
      reason: string | null,
      metadata: Record<string, unknown> = {},
      overrideRole?: string
    ) => {
      await supabase.from("admin_audit_logs").insert({
        actor_id: authUser.id,
        actor_role: overrideRole ?? actorRole,
        action: auditAction,
        entity_type: entityType,
        entity_id: entityId,
        reason,
        metadata,
      });
    };

    // 1. Trusted Phone OTP SUPER_ADMIN Bootstrap Claim
    if (action === "claim_super_admin_bootstrap") {
      if (!authUser.phone || !authUser.phone_confirmed_at) {
        await writeAudit(
          "admin_login_rejected_unverified_phone",
          "auth_user",
          authUser.id,
          "Phone number is not OTP verified."
        );
        return jsonResponse(
          {
            error: "PHONE_NOT_VERIFIED",
            message: "Verified Phone OTP authentication is required before Admin access.",
          },
          403
        );
      }

      const phoneE164 = normalizeE164Phone(authUser.phone);
      const { data: allowRow } = await supabase
        .from("admin_bootstrap_allowlist")
        .select("*")
        .eq("phone_e164", phoneE164)
        .eq("is_active", true)
        .maybeSingle();

      if (allowRow) {
        if (allowRow.claimed_by_user_id && allowRow.claimed_by_user_id !== authUser.id) {
          await writeAudit(
            "super_admin_bootstrap_conflict",
            "admin_bootstrap_allowlist",
            allowRow.id,
            "Designated phone already linked to another user ID.",
            { phoneE164 }
          );
          return jsonResponse(
            {
              error: "BOOTSTRAP_ALREADY_CLAIMED",
              message: "This designated admin number is already claimed by another user.",
            },
            409
          );
        }

        const { error: roleErr } = await supabase
          .from("user_roles")
          .upsert(
            { user_id: authUser.id, role: allowRow.target_role },
            { onConflict: "user_id,role", ignoreDuplicates: true }
          );
        if (roleErr) {
          return jsonResponse({ error: "BOOTSTRAP_FAILED", message: roleErr.message }, 500);
        }

        if (!allowRow.claimed_by_user_id) {
          await supabase
            .from("admin_bootstrap_allowlist")
            .update({
              claimed_by_user_id: authUser.id,
              claimed_at: new Date().toISOString(),
            })
            .eq("id", allowRow.id);
        }

        isSuperAdmin = allowRow.target_role === "super_admin" || isSuperAdmin;
        isAdmin = true;
        actorRole = allowRow.target_role;

        await writeAudit(
          "super_admin_bootstrap_verified",
          "user_roles",
          authUser.id,
          "Phone OTP verified against server bootstrap allowlist.",
          { phoneE164, assignedRole: allowRow.target_role },
          allowRow.target_role
        );

        return jsonResponse({
          ok: true,
          userId: authUser.id,
          phone: phoneE164,
          role: actorRole,
          isSuperAdmin,
          bootstrapped: true,
        });
      }

      if (isAdmin) {
        await writeAudit(
          "admin_otp_login_verified",
          "auth_user",
          authUser.id,
          "Existing admin authenticated via verified Phone OTP.",
          { phoneE164 }
        );
        return jsonResponse({
          ok: true,
          userId: authUser.id,
          phone: phoneE164,
          role: actorRole,
          isSuperAdmin,
          bootstrapped: false,
        });
      }

      await writeAudit(
        "unauthorized_admin_login_attempt",
        "auth_user",
        authUser.id,
        "Verified phone has no admin role or bootstrap allowlist entry.",
        { phoneE164 }
      );
      return jsonResponse(
        {
          error: "NOT_AUTHORIZED_ADMIN",
          message: "This phone number is not authorized for SHAREWHEELS Admin Portal access.",
        },
        403
      );
    }

    // Require admin or super_admin for all remaining actions
    if (!isAdmin) {
      return jsonResponse(
        { error: "FORBIDDEN", message: "Administrator privileges required." },
        403
      );
    }

    if (action === "check_admin_session") {
      return jsonResponse({
        ok: true,
        userId: authUser.id,
        phone: normalizeE164Phone(authUser.phone),
        role: actorRole,
        isSuperAdmin,
      });
    }

    // 2. Signed Document URL with Mandatory Audit Logging
    if (action === "get_signed_document_url") {
      const bucket = typeof body.bucket === "string" ? body.bucket : "";
      const storagePath = typeof body.storagePath === "string" ? body.storagePath : "";
      const entityType = typeof body.entityType === "string" ? body.entityType : "private_document";
      const entityId = typeof body.entityId === "string" ? body.entityId : null;
      const ttl = Math.min(Math.max(Number(body.ttlSeconds ?? 120), 60), 300);

      if (!PRIVATE_BUCKETS.has(bucket) || !storagePath) {
        return jsonResponse({ error: "BAD_REQUEST", message: "Invalid bucket or path." }, 400);
      }

      const { data: signed, error: signErr } = await supabase.storage
        .from(bucket)
        .createSignedUrl(storagePath, ttl);

      if (signErr || !signed?.signedUrl) {
        return jsonResponse(
          { error: "SIGNED_URL_ERROR", message: signErr?.message || "Failed to sign object." },
          400
        );
      }

      await writeAudit(
        "sensitive_document_accessed",
        entityType,
        entityId,
        "Administrator generated short-lived signed URL for private document review.",
        { bucket, storagePath, ttlSeconds: ttl }
      );

      return jsonResponse({ ok: true, signedUrl: signed.signedUrl, expiresIn: ttl });
    }

    // 3. Owner Verification Workflow
    if (action === "review_owner") {
      const ownerId = typeof body.ownerId === "string" ? body.ownerId : "";
      const decision = typeof body.decision === "string" ? body.decision : "";
      const reason = typeof body.reason === "string" ? body.reason.trim() : "";

      if (!ownerId || !["approve", "reject", "request_resubmission", "suspend", "reopen"].includes(decision)) {
        return jsonResponse({ error: "BAD_REQUEST", message: "Invalid owner review payload." }, 400);
      }
      if (["reject", "request_resubmission", "suspend"].includes(decision) && reason.length < 3) {
        return jsonResponse(
          { error: "REASON_REQUIRED", message: "A clear reason is required for this decision." },
          400
        );
      }

      const { data: currentOwner } = await supabase
        .from("owner_profiles")
        .select("verification_status")
        .eq("id", ownerId)
        .maybeSingle();

      if (!currentOwner) {
        return jsonResponse({ error: "NOT_FOUND", message: "Owner profile not found." }, 404);
      }

      const statusMap: Record<string, string> = {
        approve: "VERIFIED",
        reject: "REJECTED",
        request_resubmission: "RESUBMISSION_REQUIRED",
        suspend: "SUSPENDED",
        reopen: "UNDER_REVIEW",
      };
      const nextStatus = statusMap[decision];
      const nowIso = new Date().toISOString();

      const { error: updErr } = await supabase
        .from("owner_profiles")
        .update({
          verification_status: nextStatus,
          reviewed_by: authUser.id,
          reviewed_at: nowIso,
          rejection_reason: decision === "approve" || decision === "reopen" ? null : reason,
          resubmission_notes: decision === "request_resubmission" ? reason : null,
        })
        .eq("id", ownerId);

      if (updErr) {
        return jsonResponse({ error: "UPDATE_FAILED", message: updErr.message }, 500);
      }

      if (decision === "approve") {
        await supabase
          .from("owner_identity_documents")
          .update({ review_status: "APPROVED", reviewed_by: authUser.id, reviewed_at: nowIso, rejection_reason: null })
          .eq("owner_id", ownerId);
      } else if (decision === "reject") {
        await supabase
          .from("owner_identity_documents")
          .update({ review_status: "REJECTED", reviewed_by: authUser.id, reviewed_at: nowIso, rejection_reason: reason })
          .eq("owner_id", ownerId);
      } else if (decision === "reopen") {
        await supabase
          .from("owner_identity_documents")
          .update({ review_status: "PENDING", rejection_reason: null })
          .eq("owner_id", ownerId);
      }

      const notifMap: Record<string, { title: string; body: string }> = {
        approve: {
          title: "Owner Identity Verified",
          body: "Your SHAREWHEELS Owner account is now VERIFIED. You can submit vehicles from the Owner Portal.",
        },
        reject: {
          title: "Owner Verification Rejected",
          body: `Your verification did not pass: ${reason}. Review details in Verification Status to resubmit.`,
        },
        request_resubmission: {
          title: "Additional KYC Documents Requested",
          body: `SHAREWHEELS requested updated documents: ${reason}.`,
        },
        suspend: {
          title: "Owner Account Suspended",
          body: `Your owner account has been suspended: ${reason}. Contact SHAREWHEELS support.`,
        },
        reopen: {
          title: "Owner Verification Reopened",
          body: "Your owner verification application has been reopened for administrative review.",
        },
      };

      await supabase.from("notifications").insert({
        user_id: ownerId,
        title: notifMap[decision].title,
        body: notifMap[decision].body,
      });

      await writeAudit(
        `owner_${decision}`,
        "owner_profile",
        ownerId,
        reason || `Owner moved from ${currentOwner.verification_status} to ${nextStatus}`,
        { fromStatus: currentOwner.verification_status, toStatus: nextStatus }
      );

      return jsonResponse({ ok: true, ownerId, status: nextStatus });
    }

    // 4. Vehicle Approval Workflow
    if (action === "review_vehicle") {
      const vehicleId = typeof body.vehicleId === "string" ? body.vehicleId : "";
      const decision = typeof body.decision === "string" ? body.decision : "";
      const reason = typeof body.reason === "string" ? body.reason.trim() : "";

      const validDecisions = [
        "approve",
        "reject",
        "request_documents",
        "request_photos",
        "suspend",
        "reinstate",
      ];
      if (!vehicleId || !validDecisions.includes(decision)) {
        return jsonResponse({ error: "BAD_REQUEST", message: "Invalid vehicle review payload." }, 400);
      }
      if (["reject", "request_documents", "request_photos", "suspend"].includes(decision) && reason.length < 3) {
        return jsonResponse(
          { error: "REASON_REQUIRED", message: "A clear reason is required for this vehicle action." },
          400
        );
      }

      const { data: vehicleRow } = await supabase
        .from("vehicles")
        .select("id, owner_id, name, listing_status")
        .eq("id", vehicleId)
        .maybeSingle();

      if (!vehicleRow) {
        return jsonResponse({ error: "NOT_FOUND", message: "Vehicle not found." }, 404);
      }

      if ((decision === "approve" || decision === "reinstate") && vehicleRow.owner_id) {
        const { data: ownerRow } = await supabase
          .from("owner_profiles")
          .select("verification_status")
          .eq("id", vehicleRow.owner_id)
          .maybeSingle();

        if (ownerRow?.verification_status !== "VERIFIED") {
          return jsonResponse(
            {
              error: "OWNER_NOT_VERIFIED",
              message: "Owner profile must be VERIFIED before approving or reinstating any vehicle.",
            },
            400
          );
        }
      }

      const nextStatusMap: Record<string, string> = {
        approve: "APPROVED",
        reject: "REJECTED",
        request_documents: "RESUBMISSION_REQUIRED",
        request_photos: "RESUBMISSION_REQUIRED",
        suspend: "SUSPENDED",
        reinstate: "APPROVED",
      };
      const nextStatus = nextStatusMap[decision];
      const nowIso = new Date().toISOString();

      const { error: vUpdErr } = await supabase
        .from("vehicles")
        .update({
          listing_status: nextStatus,
          reviewed_by: authUser.id,
          reviewed_at: nowIso,
          rejection_reason:
            decision === "approve" || decision === "reinstate" ? null : reason,
          available: decision === "suspend" ? false : true,
        })
        .eq("id", vehicleId);

      if (vUpdErr) {
        return jsonResponse({ error: "UPDATE_FAILED", message: vUpdErr.message }, 500);
      }

      await supabase
        .from("vehicle_submissions")
        .update({
          submission_status: nextStatus,
          reviewed_by: authUser.id,
          reviewed_at: nowIso,
          rejection_reason:
            decision === "approve" || decision === "reinstate" ? null : reason,
        })
        .eq("vehicle_id", vehicleId);

      let publishedPhotosCount = 0;

      if (decision === "approve" || decision === "reinstate") {
        await supabase
          .from("vehicle_documents")
          .update({
            review_status: "APPROVED",
            reviewed_by: authUser.id,
            reviewed_at: nowIso,
            rejection_reason: null,
          })
          .eq("vehicle_id", vehicleId);

        // Publish non-plate vehicle photos to public bucket + public.vehicle_images
        const { data: subPhotos } = await supabase
          .from("vehicle_submission_photos")
          .select("slot_type, storage_bucket, storage_path, file_name, mime_type, sort_order, created_at")
          .eq("vehicle_id", vehicleId)
          .neq("slot_type", "registration_plate");

        const sortedPhotos = [...(subPhotos ?? [])].sort((a, b) => {
          const idxA = PUBLIC_PHOTO_SLOT_ORDER.indexOf(a.slot_type);
          const idxB = PUBLIC_PHOTO_SLOT_ORDER.indexOf(b.slot_type);
          const rankA = idxA === -1 ? 999 : idxA;
          const rankB = idxB === -1 ? 999 : idxB;
          if (rankA !== rankB) return rankA - rankB;
          if ((a.sort_order ?? 0) !== (b.sort_order ?? 0)) {
            return (a.sort_order ?? 0) - (b.sort_order ?? 0);
          }
          return String(a.created_at ?? "").localeCompare(String(b.created_at ?? ""));
        });

        const publishedRows: Record<string, unknown>[] = [];
        for (let idx = 0; idx < sortedPhotos.length; idx += 1) {
          const photo = sortedPhotos[idx];
          const sourceBucket = photo.storage_bucket || "owner-vehicle-photos";
          const { data: fileBlob, error: dlErr } = await supabase.storage
            .from(sourceBucket)
            .download(photo.storage_path);
          if (dlErr || !fileBlob) {
            throw new Error(
              `Failed to read vehicle photo (${photo.slot_type}): ${dlErr?.message || "missing file"}`
            );
          }

          const ext = extensionForPhoto(photo.file_name, photo.mime_type);
          const publicPath = `vehicles/${vehicleId}/${String(idx).padStart(2, "0")}_${photo.slot_type}.${ext}`;
          const bytes = new Uint8Array(await fileBlob.arrayBuffer());

          const { error: upErr } = await supabase.storage
            .from("public-vehicle-photos")
            .upload(publicPath, bytes, {
              contentType: photo.mime_type || "image/jpeg",
              upsert: true,
            });
          if (upErr) {
            throw new Error(
              `Failed to publish vehicle photo (${photo.slot_type}): ${upErr.message}`
            );
          }

          const { data: pubUrlData } = supabase.storage
            .from("public-vehicle-photos")
            .getPublicUrl(publicPath);

          publishedRows.push({
            vehicle_id: vehicleId,
            storage_path: publicPath,
            image_url: pubUrlData.publicUrl,
            is_primary: idx === 0,
            sort_order: idx,
            angle: mapSlotToAngle(photo.slot_type),
            source_site: "Owner Submission",
          });
        }

        if (publishedRows.length > 0) {
          await supabase.from("vehicle_images").delete().eq("vehicle_id", vehicleId);
          const { error: imgInsErr } = await supabase
            .from("vehicle_images")
            .insert(publishedRows);
          if (imgInsErr) {
            throw new Error(`Failed to save public vehicle images: ${imgInsErr.message}`);
          }
          publishedPhotosCount = publishedRows.length;
        }
      } else if (decision === "reject" || decision === "request_documents") {
        await supabase
          .from("vehicle_documents")
          .update({
            review_status: "REJECTED",
            reviewed_by: authUser.id,
            reviewed_at: nowIso,
            rejection_reason: reason,
          })
          .eq("vehicle_id", vehicleId)
          .eq("is_mandatory", true);
      }

      if (vehicleRow.owner_id) {
        await supabase.from("notifications").insert({
          user_id: vehicleRow.owner_id,
          title: `Vehicle ${nextStatus.replace(/_/g, " ")}: ${vehicleRow.name}`,
          body:
            reason ||
            `Admin marked ${vehicleRow.name} as ${nextStatus}. Public marketplace visibility enforces both verified owner and valid documents.`,
        });
      }

      await writeAudit(
        `vehicle_${decision}`,
        "vehicle",
        vehicleId,
        reason || `Vehicle moved from ${vehicleRow.listing_status} to ${nextStatus}`,
        { fromStatus: vehicleRow.listing_status, toStatus: nextStatus, publishedPhotosCount }
      );

      return jsonResponse({
        ok: true,
        vehicleId,
        listingStatus: nextStatus,
        publishedPhotosCount,
      });
    }

    // 5. Customer Suspension & Reinstatement
    if (action === "manage_customer") {
      const customerId = typeof body.customerId === "string" ? body.customerId : "";
      const decision = typeof body.decision === "string" ? body.decision : "";
      const reason = typeof body.reason === "string" ? body.reason.trim() : "";

      if (!customerId || !["suspend", "reinstate"].includes(decision)) {
        return jsonResponse({ error: "BAD_REQUEST", message: "Invalid customer action." }, 400);
      }
      if (decision === "suspend" && reason.length < 3) {
        return jsonResponse({ error: "REASON_REQUIRED", message: "Suspension reason is required." }, 400);
      }

      const nextStatus = decision === "suspend" ? "suspended" : "active";
      const { error: custErr } = await supabase
        .from("profiles")
        .update({
          account_status: nextStatus,
          suspended_reason: decision === "suspend" ? reason : null,
          suspended_at: decision === "suspend" ? new Date().toISOString() : null,
          suspended_by: decision === "suspend" ? authUser.id : null,
        })
        .eq("id", customerId);

      if (custErr) {
        return jsonResponse({ error: "UPDATE_FAILED", message: custErr.message }, 500);
      }

      await supabase.from("notifications").insert({
        user_id: customerId,
        title: decision === "suspend" ? "Account Suspended" : "Account Reinstated",
        body:
          decision === "suspend"
            ? `Your SHAREWHEELS customer account has been suspended: ${reason}.`
            : "Your SHAREWHEELS customer account has been reinstated.",
      });

      await writeAudit(`customer_${decision}`, "profile", customerId, reason || "Customer reinstated");
      return jsonResponse({ ok: true, customerId, accountStatus: nextStatus });
    }

    // 6. Booking Management
    if (action === "manage_booking") {
      const bookingId = typeof body.bookingId === "string" ? body.bookingId : "";
      const bookingAction = typeof body.bookingAction === "string" ? body.bookingAction : "";
      const reason = typeof body.reason === "string" ? body.reason.trim() : "";

      if (!bookingId || !["cancel", "confirm", "complete", "flag_overdue", "add_note"].includes(bookingAction) || reason.length < 3) {
        return jsonResponse({ error: "BAD_REQUEST", message: "Valid bookingId, action, and reason are required." }, 400);
      }

      const patch: Record<string, unknown> = { admin_notes: reason };
      if (bookingAction === "cancel") patch.status = "cancelled";
      if (bookingAction === "confirm") patch.status = "confirmed";
      if (bookingAction === "complete") patch.status = "completed";

      const { error: bkErr } = await supabase
        .from("bookings")
        .update(patch)
        .eq("id", bookingId);

      if (bkErr) {
        return jsonResponse({ error: "UPDATE_FAILED", message: bkErr.message }, 500);
      }

      await writeAudit(`booking_${bookingAction}`, "booking", bookingId, reason);
      return jsonResponse({ ok: true, bookingId, action: bookingAction });
    }

    // 7. Central Commission Configuration
    if (action === "update_commission_config") {
      const commissionBps = Number(body.commissionBps);
      const gstBps = Number(body.gstOnCommissionBps ?? 1800);
      const tdsBps = Number(body.tdsBps ?? 0);
      const notes = typeof body.notes === "string" ? body.notes.trim() : "";

      if (
        !Number.isFinite(commissionBps) ||
        commissionBps < 0 ||
        commissionBps > 5000 ||
        !Number.isFinite(gstBps) ||
        gstBps < 0 ||
        gstBps > 3000 ||
        !Number.isFinite(tdsBps) ||
        tdsBps < 0 ||
        tdsBps > 1000
      ) {
        return jsonResponse({ error: "BAD_REQUEST", message: "Commission percentages out of allowed range." }, 400);
      }

      const { error: cfgErr } = await supabase
        .from("platform_commission_config")
        .update({
          commission_bps: Math.round(commissionBps),
          gst_on_commission_bps: Math.round(gstBps),
          tds_bps: Math.round(tdsBps),
          notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("config_key", "default_owner_rental");

      if (cfgErr) {
        return jsonResponse({ error: "UPDATE_FAILED", message: cfgErr.message }, 500);
      }

      await writeAudit(
        "commission_config_updated",
        "platform_commission_config",
        "default_owner_rental",
        `Updated commission=${commissionBps}bps, gst=${gstBps}bps, tds=${tdsBps}bps`,
        { commissionBps, gstBps, tdsBps }
      );
      return jsonResponse({ ok: true, commissionBps, gstBps, tdsBps });
    }

    // 8. City Management
    if (action === "manage_city") {
      const cityAction = typeof body.cityAction === "string" ? body.cityAction : "";
      if (cityAction === "toggle") {
        const locationId = typeof body.locationId === "string" ? body.locationId : "";
        const isActive = Boolean(body.isActive);
        const { error: locErr } = await supabase
          .from("locations")
          .update({ is_active: isActive })
          .eq("id", locationId);
        if (locErr) return jsonResponse({ error: "UPDATE_FAILED", message: locErr.message }, 500);
        await writeAudit("city_toggled", "location", locationId, `City active=${isActive}`);
        return jsonResponse({ ok: true });
      }

      if (cityAction === "create") {
        const name = typeof body.name === "string" ? body.name.trim() : "";
        const state = typeof body.state === "string" ? body.state.trim() : "";
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        if (!name || !state || !slug) {
          return jsonResponse({ error: "BAD_REQUEST", message: "City name and state are required." }, 400);
        }
        const { data: created, error: crErr } = await supabase
          .from("locations")
          .insert({ slug, name, state, is_active: true, sort_order: 50 })
          .select("*")
          .single();
        if (crErr) return jsonResponse({ error: "CREATE_FAILED", message: crErr.message }, 500);
        await writeAudit("city_added", "location", created.id, `Added supported market ${name}, ${state}`);
        return jsonResponse({ ok: true, location: created });
      }

      return jsonResponse({ error: "BAD_REQUEST", message: "Unsupported cityAction." }, 400);
    }

    // 9. Notifications Broadcast
    if (action === "send_notification") {
      const audience = typeof body.audience === "string" ? body.audience : "";
      const targetUserId = typeof body.targetUserId === "string" ? body.targetUserId.trim() : null;
      const title = typeof body.title === "string" ? body.title.trim() : "";
      const message = typeof body.body === "string" ? body.body.trim() : "";

      if (!["single_user", "all_owners", "all_customers", "all_users"].includes(audience) || !title || !message) {
        return jsonResponse({ error: "BAD_REQUEST", message: "Audience, title, and message body are required." }, 400);
      }

      let recipientIds: string[] = [];
      if (audience === "single_user") {
        if (!targetUserId) {
          return jsonResponse({ error: "BAD_REQUEST", message: "Target user ID is required." }, 400);
        }
        recipientIds = [targetUserId];
      } else if (audience === "all_owners") {
        const { data: owners } = await supabase.from("owner_profiles").select("id");
        recipientIds = (owners ?? []).map((o: { id: string }) => o.id);
      } else if (audience === "all_customers") {
        const { data: custs } = await supabase.from("profiles").select("id");
        recipientIds = (custs ?? []).map((c: { id: string }) => c.id);
      } else {
        const { data: users } = await supabase.from("profiles").select("id");
        recipientIds = (users ?? []).map((u: { id: string }) => u.id);
      }

      if (recipientIds.length > 0) {
        await supabase.from("notifications").insert(
          recipientIds.map((uid) => ({ user_id: uid, title, body: message }))
        );
      }

      await supabase.from("admin_notification_logs").insert({
        sent_by: authUser.id,
        audience,
        target_user_id: audience === "single_user" ? targetUserId : null,
        title,
        body: message,
        recipient_count: recipientIds.length,
      });

      await writeAudit("notification_sent", "notification", targetUserId, title, {
        audience,
        recipientCount: recipientIds.length,
      });

      return jsonResponse({ ok: true, recipientCount: recipientIds.length });
    }

    // 10. SUPER_ADMIN-Only Role Management (Normal admins strictly blocked with 403)
    if (action === "manage_admin_role") {
      if (!isSuperAdmin) {
        await writeAudit(
          "admin_privilege_escalation_blocked",
          "user_roles",
          typeof body.targetUserId === "string" ? body.targetUserId : null,
          "Non-super-admin attempted to modify administrative roles."
        );
        return jsonResponse(
          { error: "SUPER_ADMIN_REQUIRED", message: "Only SUPER_ADMIN can grant or revoke admin roles." },
          403
        );
      }

      const targetUserId = typeof body.targetUserId === "string" ? body.targetUserId.trim() : "";
      const roleAction = typeof body.roleAction === "string" ? body.roleAction : "";
      if (!targetUserId || !["grant_admin", "revoke_admin"].includes(roleAction)) {
        return jsonResponse({ error: "BAD_REQUEST", message: "Valid targetUserId and roleAction required." }, 400);
      }
      if (targetUserId === authUser.id) {
        return jsonResponse({ error: "BAD_REQUEST", message: "Cannot modify your own super_admin role." }, 400);
      }

      if (roleAction === "grant_admin") {
        const { error: grErr } = await supabase
          .from("user_roles")
          .upsert({ user_id: targetUserId, role: "admin" }, { onConflict: "user_id,role", ignoreDuplicates: true });
        if (grErr) return jsonResponse({ error: "ROLE_FAILED", message: grErr.message }, 500);
        await writeAudit("admin_role_granted", "user_roles", targetUserId, "SUPER_ADMIN granted admin role.");
        return jsonResponse({ ok: true, action: "granted" });
      } else {
        const { error: rvErr } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", targetUserId)
          .eq("role", "admin");
        if (rvErr) return jsonResponse({ error: "ROLE_FAILED", message: rvErr.message }, 500);
        await writeAudit("admin_role_revoked", "user_roles", targetUserId, "SUPER_ADMIN revoked admin role.");
        return jsonResponse({ ok: true, action: "revoked" });
      }
    }

    return jsonResponse({ error: "BAD_REQUEST", message: `Unknown action: ${action}` }, 400);
  } catch (err) {
    return jsonResponse(
      {
        error: "ADMIN_API_ERROR",
        message: err instanceof Error ? err.message : "Unknown Edge Function error",
      },
      500
    );
  }
});
