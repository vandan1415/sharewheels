import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function formatInrFromPaise(paise: number): string {
  const inr = Math.round(paise / 100);
  return `₹${inr.toLocaleString("en-IN")}`;
}

function calculateHourlyRatePaise(dailyPricePaise: number): number {
  const dailyInr = Math.max(0, Math.round(dailyPricePaise / 100));
  if (dailyInr <= 0) return 0;
  return Math.round((dailyInr / 12) * 1.5) * 100;
}

async function computeHmacSha256Hex(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function constantTimeEqualHex(a: string, b: string): boolean {
  const normA = a.trim().toLowerCase();
  const normB = b.trim().toLowerCase();
  if (normA.length !== normB.length) return false;
  let diff = 0;
  for (let i = 0; i < normA.length; i += 1) {
    diff |= normA.charCodeAt(i) ^ normB.charCodeAt(i);
  }
  return diff === 0;
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
      return jsonResponse({ error: "UNAUTHORIZED", message: "Please sign in to book a vehicle." }, 401);
    }

    const { data: userRes, error: authErr } = await supabase.auth.getUser(bearer);
    if (authErr || !userRes?.user) {
      return jsonResponse({ error: "UNAUTHORIZED", message: "Invalid or expired customer session." }, 401);
    }
    const authUser = userRes.user;

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action.trim() : "";

    let keyId = (Deno.env.get("RAZORPAY_KEY_ID") ?? "").trim();
    let keySecret = (Deno.env.get("RAZORPAY_KEY_SECRET") ?? "").trim();

    if (!keyId || !keySecret) {
      const { data: cfg } = await supabase
        .from("payment_gateway_config")
        .select("key_id, key_secret")
        .eq("provider", "razorpay")
        .maybeSingle();

      if (cfg) {
        keyId = String(cfg.key_id ?? "").trim();
        keySecret = String(cfg.key_secret ?? "").trim();
      }
    }

    if (!keyId || !keySecret) {
      return jsonResponse(
        { error: "GATEWAY_NOT_CONFIGURED", message: "Razorpay gateway credentials are not configured." },
        500
      );
    }

    if (action === "create_order") {
      const vehicleId = typeof body.vehicleId === "string" ? body.vehicleId.trim() : "";
      const rawMode = typeof body.rentalMode === "string" ? body.rentalMode.trim().toUpperCase() : "DAILY";
      const rentalMode: "DAILY" | "HOURLY" = rawMode === "HOURLY" ? "HOURLY" : "DAILY";
      const agreementAccepted = body.agreementAccepted === true;

      if (!vehicleId) {
        return jsonResponse({ error: "BAD_REQUEST", message: "Valid vehicle ID is required." }, 400);
      }
      if (!agreementAccepted) {
        return jsonResponse({ error: "AGREEMENT_REQUIRED", message: "Please accept rental terms before paying." }, 400);
      }

      let startAt: Date;
      let endAt: Date;

      if (typeof body.startAt === "string" && typeof body.endAt === "string") {
        startAt = new Date(body.startAt);
        endAt = new Date(body.endAt);
      } else {
        const startDate = typeof body.startDate === "string" ? body.startDate.trim() : "";
        const days = Number(body.days);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !Number.isInteger(days) || days < 1 || days > 30) {
          return jsonResponse({ error: "BAD_REQUEST", message: "Valid pickup and return schedule is required." }, 400);
        }
        startAt = new Date(`${startDate}T09:00:00Z`);
        endAt = new Date(startAt.getTime() + days * 86400_000);
      }

      if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
        return jsonResponse({ error: "BAD_REQUEST", message: "Invalid pickup or return timestamp." }, 400);
      }
      if (startAt.getTime() < Date.now() - 5 * 60_000) {
        return jsonResponse({ error: "PAST_PICKUP", message: "Pickup date and time cannot be in the past." }, 400);
      }
      if (endAt.getTime() <= startAt.getTime()) {
        return jsonResponse({ error: "INVALID_DURATION", message: "Return time must be later than pickup time." }, 400);
      }

      const startAtIso = startAt.toISOString();
      const endAtIso = endAt.toISOString();

      const { data: vehicle, error: vErr } = await supabase
        .from("vehicles")
        .select("id, name, location, owner_id, price_per_day_paise, security_deposit_paise, min_rental_days, max_rental_days, listing_status, available, is_paused")
        .eq("id", vehicleId)
        .maybeSingle();

      if (vErr || !vehicle) {
        return jsonResponse({ error: "NOT_FOUND", message: "Vehicle listing not found." }, 404);
      }
      if (!vehicle.available || vehicle.is_paused || vehicle.listing_status !== "APPROVED") {
        return jsonResponse({ error: "UNAVAILABLE", message: "This vehicle is not currently available for booking." }, 400);
      }

      const diffMs = endAt.getTime() - startAt.getTime();
      let billableUnits = 1;
      let appliedRatePaise = Math.round(Number(vehicle.price_per_day_paise));

      if (rentalMode === "HOURLY") {
        billableUnits = Math.max(1, Math.ceil(diffMs / 3_600_000 - 1e-6));
        if (billableUnits > 720) {
          return jsonResponse({ error: "INVALID_DURATION", message: "Hourly bookings cannot exceed 720 hours." }, 400);
        }
        appliedRatePaise = calculateHourlyRatePaise(Number(vehicle.price_per_day_paise));
      } else {
        billableUnits = Math.max(1, Math.ceil(diffMs / 86_400_000 - 1e-6));
        const minDays = Math.max(1, Number(vehicle.min_rental_days ?? 1));
        const maxDays = Math.min(30, Math.max(minDays, Number(vehicle.max_rental_days ?? 30)));
        if (billableUnits < minDays || billableUnits > maxDays) {
          return jsonResponse(
            {
              error: "INVALID_DURATION",
              message: `Daily booking duration must be between ${minDays} and ${maxDays} days.`,
            },
            400
          );
        }
        appliedRatePaise = Math.round(Number(vehicle.price_per_day_paise));
      }

      // Expire stale pending payment holds before checking overlaps
      await supabase.rpc("expire_stale_pending_bookings");

      // Half-open [) overlap check: rejects e.g. 10AM-2PM vs 1PM-5PM, allows 2PM-6PM
      const { data: overlaps } = await supabase
        .from("bookings")
        .select("id")
        .eq("vehicle_id", vehicle.id)
        .in("status", ["pending", "accepted", "confirmed", "active"])
        .lt("start_at", endAtIso)
        .gt("end_at", startAtIso)
        .limit(1);

      if (overlaps && overlaps.length > 0) {
        return jsonResponse(
          { error: "DATE_CONFLICT", message: "Selected date and time window overlaps an existing booking on this vehicle." },
          409
        );
      }

      const rentalTotalPaise = appliedRatePaise * billableUnits;
      const advancePaise = Math.round(rentalTotalPaise * 0.5);
      const balanceDuePaise = rentalTotalPaise - advancePaise;
      const depositPaise = Math.round(Number(vehicle.security_deposit_paise ?? 0));

      if (advancePaise < 100) {
        return jsonResponse({ error: "INVALID_AMOUNT", message: "Advance amount must be at least ₹1." }, 400);
      }

      const basicAuth = btoa(`${keyId}:${keySecret}`);
      const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${basicAuth}`,
        },
        body: JSON.stringify({
          amount: advancePaise,
          currency: "INR",
          receipt: `sw_${Date.now()}`,
          notes: {
            vehicle_id: vehicle.id,
            customer_id: authUser.id,
            rental_mode: rentalMode,
            billable_units: String(billableUnits),
            split: "50_percent_advance",
          },
        }),
      });

      const orderPayload = (await rzpRes.json().catch(() => ({}))) as Record<string, any>;
      if (!rzpRes.ok || !orderPayload.id) {
        const msg =
          orderPayload?.error?.description ||
          orderPayload?.message ||
          `Razorpay order creation failed (${rzpRes.status})`;
        return jsonResponse({ error: "RAZORPAY_ORDER_FAILED", message: msg }, 502);
      }

      const { data: createdBooking, error: bkErr } = await supabase
        .from("bookings")
        .insert({
          vehicle_id: vehicle.id,
          customer_id: authUser.id,
          start_at: startAtIso,
          end_at: endAtIso,
          rental_mode: rentalMode,
          billable_units: billableUnits,
          applied_rate_paise: appliedRatePaise,
          status: "pending",
          rental_total_paise: rentalTotalPaise,
          deposit_paise: depositPaise,
          advance_paid_paise: 0,
          balance_due_paise: rentalTotalPaise,
          payment_status: "awaiting_advance_payment",
          razorpay_order_id: orderPayload.id,
          agreement_accepted: true,
        })
        .select("id")
        .single();

      if (bkErr) {
        const isOverlap = bkErr.code === "23P01" || bkErr.message.includes("exclude");
        return jsonResponse(
          {
            error: isOverlap ? "DATE_CONFLICT" : "BOOKING_CREATE_FAILED",
            message: isOverlap
              ? "Selected date and time window overlaps an existing booking on this vehicle."
              : bkErr.message,
          },
          isOverlap ? 409 : 500
        );
      }

      return jsonResponse({
        ok: true,
        bookingId: createdBooking.id,
        orderId: orderPayload.id,
        amountPaise: advancePaise,
        rentalTotalPaise,
        balanceDuePaise,
        rentalMode,
        billableUnits,
        appliedRatePaise,
        startAt: startAtIso,
        endAt: endAtIso,
        currency: "INR",
        keyId,
        vehicleName: vehicle.name,
      });
    }

    if (action === "cancel_unpaid") {
      const bookingId = typeof body.bookingId === "string" ? body.bookingId.trim() : "";
      if (!bookingId) {
        return jsonResponse({ error: "BAD_REQUEST", message: "bookingId required." }, 400);
      }

      await supabase
        .from("bookings")
        .update({ status: "cancelled", payment_status: "checkout_cancelled" })
        .eq("id", bookingId)
        .eq("customer_id", authUser.id)
        .eq("status", "pending")
        .eq("payment_status", "awaiting_advance_payment");

      return jsonResponse({ ok: true, bookingId });
    }

    if (action === "verify_payment") {
      const bookingId = typeof body.bookingId === "string" ? body.bookingId.trim() : "";
      const razorpayOrderId = typeof body.razorpay_order_id === "string" ? body.razorpay_order_id.trim() : "";
      const razorpayPaymentId = typeof body.razorpay_payment_id === "string" ? body.razorpay_payment_id.trim() : "";
      const razorpaySignature = typeof body.razorpay_signature === "string" ? body.razorpay_signature.trim() : "";

      if (!bookingId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return jsonResponse(
          { error: "BAD_REQUEST", message: "Missing Razorpay payment verification fields." },
          400
        );
      }

      const { data: booking } = await supabase
        .from("bookings")
        .select("id, vehicle_id, customer_id, start_at, end_at, rental_mode, billable_units, applied_rate_paise, rental_total_paise, razorpay_order_id")
        .eq("id", bookingId)
        .maybeSingle();

      if (!booking) {
        return jsonResponse({ error: "NOT_FOUND", message: "Booking record not found." }, 404);
      }
      if (booking.customer_id !== authUser.id) {
        return jsonResponse({ error: "FORBIDDEN", message: "You do not own this booking." }, 403);
      }
      if (booking.razorpay_order_id !== razorpayOrderId) {
        return jsonResponse(
          { error: "ORDER_MISMATCH", message: "Razorpay order ID does not match booking." },
          400
        );
      }

      const expectedSig = await computeHmacSha256Hex(
        keySecret,
        `${razorpayOrderId}|${razorpayPaymentId}`
      );
      if (!constantTimeEqualHex(expectedSig, razorpaySignature)) {
        return jsonResponse(
          { error: "INVALID_SIGNATURE", message: "Razorpay signature verification failed." },
          400
        );
      }

      const rentalTotalPaise = Number(booking.rental_total_paise);
      const advancePaise = Math.round(rentalTotalPaise * 0.5);
      const balanceDuePaise = rentalTotalPaise - advancePaise;
      const nowIso = new Date().toISOString();

      const { error: updErr } = await supabase
        .from("bookings")
        .update({
          status: "confirmed",
          payment_status: "advance_50_paid",
          advance_paid_paise: advancePaise,
          balance_due_paise: balanceDuePaise,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: razorpaySignature,
          razorpay_verified_at: nowIso,
        })
        .eq("id", bookingId);

      if (updErr) {
        return jsonResponse({ error: "UPDATE_FAILED", message: updErr.message }, 500);
      }

      const [{ data: vehicle }, { data: customerProfile }] = await Promise.all([
        supabase
          .from("vehicles")
          .select("id, name, owner_id, location")
          .eq("id", booking.vehicle_id)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", authUser.id)
          .maybeSingle(),
      ]);

      const fmtOpts: Intl.DateTimeFormatOptions = {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };
      const startLabel = new Date(booking.start_at).toLocaleString("en-IN", fmtOpts);
      const endLabel = new Date(booking.end_at).toLocaleString("en-IN", fmtOpts);
      const unitWord = booking.rental_mode === "HOURLY" ? "hr" : "day";
      const durationStr = `${booking.billable_units ?? 1} ${unitWord}${(booking.billable_units ?? 1) > 1 ? "s" : ""}`;
      const customerLabel =
        customerProfile?.full_name || customerProfile?.email || authUser.email || "Customer";

      if (vehicle?.owner_id) {
        await supabase.from("notifications").insert({
          user_id: vehicle.owner_id,
          title: `Razorpay 50% Advance Confirmed (${booking.rental_mode || "DAILY"}) — ${vehicle.name}`,
          body: `${customerLabel} paid 50% advance (${formatInrFromPaise(advancePaise)}) via Razorpay (Payment ID: ${razorpayPaymentId}). Mode: ${booking.rental_mode || "DAILY"} (${durationStr}). Window: ${startLabel} to ${endLabel}. Remaining 50% balance due at pickup: ${formatInrFromPaise(balanceDuePaise)}.`,
        });
      }

      await supabase.from("notifications").insert({
        user_id: authUser.id,
        title: `Booking Confirmed (${booking.rental_mode || "DAILY"}) — ${vehicle?.name || "Vehicle"}`,
        body: `Razorpay payment ${razorpayPaymentId} verified (${formatInrFromPaise(advancePaise)} paid for ${durationStr}). Remaining ${formatInrFromPaise(balanceDuePaise)} due at pickup (${startLabel} to ${endLabel}).`,
      });

      return jsonResponse({
        ok: true,
        bookingId,
        status: "confirmed",
        paymentStatus: "advance_50_paid",
        razorpayPaymentId,
        advancePaidPaise: advancePaise,
        balanceDuePaise,
        ownerNotified: Boolean(vehicle?.owner_id),
      });
    }

    return jsonResponse({ error: "BAD_REQUEST", message: `Unknown action: ${action}` }, 400);
  } catch (err) {
    return jsonResponse(
      {
        error: "RAZORPAY_CHECKOUT_ERROR",
        message: err instanceof Error ? err.message : "Unexpected checkout error",
      },
      500
    );
  }
});
