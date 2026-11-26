import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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

function parseDurationSeconds(raw: unknown): number {
  if (typeof raw !== "string") return 0;
  const m = raw.match(/^([\d.]+)s$/);
  return m ? Math.round(Number(m[1])) : 0;
}

function parseTollInr(tollInfo: Record<string, any> | undefined): number | null {
  const prices = tollInfo?.estimatedPrice;
  if (!Array.isArray(prices) || prices.length === 0) return null;
  const inrEntry =
    prices.find((p: any) => p?.currencyCode === "INR") ?? prices[0];
  if (!inrEntry || inrEntry.currencyCode !== "INR") return null;
  const units = Number(inrEntry.units ?? 0);
  const nanos = Number(inrEntry.nanos ?? 0) / 1e9;
  const total = Math.round(units + nanos);
  return Number.isFinite(total) && total > 0 ? total : null;
}

const NEARBY_LAYER_TYPES: Record<string, string[]> = {
  petrol: ["gas_station"],
  ev_charging: ["electric_vehicle_charging_station"],
  restaurants: ["restaurant"],
  hotels: ["lodging"],
  parking: ["parking"],
  attractions: ["tourist_attraction"],
  hospitals: ["hospital"],
  emergency: ["hospital", "police", "fire_station"],
};

const TEXT_LAYER_QUERIES: Record<string, string> = {
  diesel: "diesel petrol pump",
  cng: "CNG filling station",
  toll_plazas: "toll plaza",
};

const PLACE_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.regularOpeningHours.openNow",
  "places.nationalPhoneNumber",
  "places.googleMapsUri",
  "places.types",
].join(",");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const apiKey = (Deno.env.get("GOOGLE_MAPS_SERVER_API_KEY") ?? "").trim();
  if (!apiKey) {
    return jsonResponse(
      {
        configured: false,
        code: "MAPS_API_KEY_NOT_CONFIGURED",
        message:
          "Set GOOGLE_MAPS_SERVER_API_KEY in Supabase Edge Function secrets to enable live Routes, Places, and Geocoding.",
      },
      200
    );
  }

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, any>;
    const action = typeof body.action === "string" ? body.action.trim() : "";

    // 1. Places API (New) Autocomplete
    if (action === "autocomplete") {
      const input = typeof body.input === "string" ? body.input.trim() : "";
      if (input.length < 2) {
        return jsonResponse({ configured: true, suggestions: [] });
      }

      const payload: Record<string, unknown> = {
        input,
        includedRegionCodes: ["in"],
      };
      if (
        typeof body.lat === "number" &&
        typeof body.lng === "number" &&
        Number.isFinite(body.lat) &&
        Number.isFinite(body.lng)
      ) {
        payload.locationBias = {
          circle: {
            center: { latitude: body.lat, longitude: body.lng },
            radius: 50000.0,
          },
        };
      }

      const res = await fetch(
        "https://places.googleapis.com/v1/places:autocomplete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return jsonResponse(
          {
            configured: true,
            error: "PLACES_AUTOCOMPLETE_ERROR",
            message:
              data?.error?.message || `Places autocomplete failed (${res.status})`,
          },
          res.status
        );
      }

      const suggestions = (data.suggestions ?? [])
        .map((s: any) => s.placePrediction)
        .filter(Boolean)
        .slice(0, 7)
        .map((p: any) => ({
          placeId: p.placeId,
          label: p.text?.text || "",
          primaryText: p.structuredFormat?.mainText?.text || p.text?.text || "",
          secondaryText: p.structuredFormat?.secondaryText?.text || "",
        }));

      return jsonResponse({ configured: true, suggestions });
    }

    // 2. Places API (New) Details
    if (action === "place_details") {
      const placeId = typeof body.placeId === "string" ? body.placeId.trim() : "";
      if (!placeId) {
        return jsonResponse(
          { configured: true, error: "BAD_REQUEST", message: "placeId is required." },
          400
        );
      }

      const res = await fetch(
        `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
        {
          method: "GET",
          headers: {
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": "id,displayName,formattedAddress,location",
          },
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.location) {
        return jsonResponse(
          {
            configured: true,
            error: "PLACE_DETAILS_ERROR",
            message: data?.error?.message || "Failed to fetch place details.",
          },
          res.ok ? 404 : res.status
        );
      }

      return jsonResponse({
        configured: true,
        place: {
          placeId: data.id || placeId,
          label:
            data.displayName?.text || data.formattedAddress || "Selected Location",
          formattedAddress: data.formattedAddress || "",
          lat: data.location.latitude,
          lng: data.location.longitude,
        },
      });
    }

    // 3. Geocoding API (Forward Address or Reverse Lat/Lng)
    if (action === "geocode") {
      const address = typeof body.address === "string" ? body.address.trim() : "";
      const lat = typeof body.lat === "number" ? body.lat : null;
      const lng = typeof body.lng === "number" ? body.lng : null;

      let url = "";
      if (lat !== null && lng !== null && Number.isFinite(lat) && Number.isFinite(lng)) {
        url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${encodeURIComponent(apiKey)}`;
      } else if (address) {
        url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&region=in&key=${encodeURIComponent(apiKey)}`;
      } else {
        return jsonResponse(
          { configured: true, error: "BAD_REQUEST", message: "Provide address or lat/lng." },
          400
        );
      }

      const res = await fetch(url);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.status !== "OK" || !data.results?.length) {
        return jsonResponse(
          {
            configured: true,
            error: "GEOCODE_ERROR",
            message: data.error_message || `Geocoding failed (${data.status || res.status}).`,
          },
          400
        );
      }

      const top = data.results[0];
      return jsonResponse({
        configured: true,
        place: {
          placeId: top.place_id,
          label: top.formatted_address,
          formattedAddress: top.formatted_address,
          lat: top.geometry?.location?.lat,
          lng: top.geometry?.location?.lng,
        },
      });
    }

    // 4. Google Routes API v2
    if (action === "compute_routes") {
      const origin = body.origin;
      const destination = body.destination;
      const intermediates = Array.isArray(body.intermediates) ? body.intermediates : [];

      const toWaypoint = (pt: any) => {
        if (pt && typeof pt.lat === "number" && typeof pt.lng === "number") {
          return { location: { latLng: { latitude: pt.lat, longitude: pt.lng } } };
        }
        if (pt && typeof pt.placeId === "string" && pt.placeId) {
          return { placeId: pt.placeId };
        }
        if (pt && typeof pt.address === "string" && pt.address.trim()) {
          return { address: pt.address.trim() };
        }
        return null;
      };

      const originWp = toWaypoint(origin);
      const destWp = toWaypoint(destination);
      if (!originWp || !destWp) {
        return jsonResponse(
          { configured: true, error: "BAD_REQUEST", message: "Valid origin and destination required." },
          400
        );
      }

      const waypointList = intermediates.map(toWaypoint).filter(Boolean);
      const requestBody: Record<string, unknown> = {
        origin: originWp,
        destination: destWp,
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
        computeAlternativeRoutes: waypointList.length === 0,
        extraComputations: ["TOLLS"],
        languageCode: "en-IN",
        units: "METRIC",
      };
      if (waypointList.length > 0) {
        requestBody.intermediates = waypointList;
      }

      const res = await fetch(
        "https://routes.googleapis.com/directions/v2:computeRoutes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": [
              "routes.duration",
              "routes.distanceMeters",
              "routes.polyline.encodedPolyline",
              "routes.description",
              "routes.routeLabels",
              "routes.travelAdvisory.tollInfo",
              "routes.legs.distanceMeters",
              "routes.legs.duration",
            ].join(","),
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return jsonResponse(
          {
            configured: true,
            error: "ROUTES_API_ERROR",
            message: data?.error?.message || `Routes API error (${res.status})`,
          },
          res.status
        );
      }

      const rawRoutes = Array.isArray(data.routes) ? data.routes : [];
      if (rawRoutes.length === 0) {
        return jsonResponse({ configured: true, routes: [] });
      }

      const mapped = rawRoutes.map((r: any, idx: number) => {
        const distanceKm = Number(((Number(r.distanceMeters ?? 0)) / 1000).toFixed(1));
        const durationSec = parseDurationSeconds(r.duration);
        const tollInr = parseTollInr(r.travelAdvisory?.tollInfo);
        return {
          index: idx,
          description: r.description || `Route ${idx + 1}`,
          routeLabels: Array.isArray(r.routeLabels) ? r.routeLabels : [],
          distanceMeters: Number(r.distanceMeters ?? 0),
          distanceKm,
          durationSeconds: durationSec,
          durationMinutes: Math.max(1, Math.round(durationSec / 60)),
          encodedPolyline: r.polyline?.encodedPolyline || "",
          estimatedTollInr: tollInr,
          legs: (r.legs ?? []).map((leg: any) => ({
            distanceKm: Number(((Number(leg.distanceMeters ?? 0)) / 1000).toFixed(1)),
            durationMinutes: Math.max(1, Math.round(parseDurationSeconds(leg.duration) / 60)),
          })),
        };
      });

      // Classify into Fastest, Shortest, and Alternative (never falsely labeling "Scenic")
      const fastestIdx = mapped.reduce(
        (best: number, cur: any, idx: number, arr: any[]) =>
          cur.durationSeconds < arr[best].durationSeconds ? idx : best,
        0
      );
      const shortestIdx = mapped.reduce(
        (best: number, cur: any, idx: number, arr: any[]) =>
          cur.distanceMeters < arr[best].distanceMeters ? idx : best,
        0
      );

      const routes = mapped.map((r: any, idx: number) => {
        let category: "fastest" | "shortest" | "alternative" = "alternative";
        let label = "ALTERNATIVE ROUTE";
        if (idx === fastestIdx) {
          category = "fastest";
          label = "FASTEST ROUTE";
        } else if (idx === shortestIdx) {
          category = "shortest";
          label = "SHORTEST ROUTE";
        }
        return { ...r, category, label };
      });

      return jsonResponse({ configured: true, routes });
    }

    // 5. Places API (New) Nearby Facility Search
    if (action === "nearby_places") {
      const layer = typeof body.layer === "string" ? body.layer.trim() : "";
      const lat = Number(body.lat);
      const lng = Number(body.lng);
      const radiusMeters = Math.min(Math.max(Number(body.radiusMeters ?? 15000), 1000), 50000);

      if (!layer || !Number.isFinite(lat) || !Number.isFinite(lng)) {
        return jsonResponse(
          { configured: true, error: "BAD_REQUEST", message: "layer, lat, and lng required." },
          400
        );
      }

      const textQuery = TEXT_LAYER_QUERIES[layer];
      const primaryTypes = NEARBY_LAYER_TYPES[layer];

      let placesRes: Response;
      if (textQuery) {
        placesRes = await fetch("https://places.googleapis.com/v1/places:searchText", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": PLACE_FIELD_MASK,
          },
          body: JSON.stringify({
            textQuery,
            regionCode: "IN",
            maxResultCount: 12,
            locationBias: {
              circle: {
                center: { latitude: lat, longitude: lng },
                radius: radiusMeters,
              },
            },
          }),
        });
      } else if (primaryTypes) {
        placesRes = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": PLACE_FIELD_MASK,
          },
          body: JSON.stringify({
            includedTypes: primaryTypes,
            maxResultCount: 12,
            locationRestriction: {
              circle: {
                center: { latitude: lat, longitude: lng },
                radius: radiusMeters,
              },
            },
          }),
        });
      } else {
        return jsonResponse(
          { configured: true, error: "BAD_REQUEST", message: `Unsupported layer: ${layer}` },
          400
        );
      }

      const data = await placesRes.json().catch(() => ({}));
      if (!placesRes.ok) {
        return jsonResponse(
          {
            configured: true,
            error: "PLACES_NEARBY_ERROR",
            message: data?.error?.message || `Places nearby failed (${placesRes.status})`,
          },
          placesRes.status
        );
      }

      const places = (data.places ?? []).map((p: any) => ({
        id: p.id,
        layer,
        name: p.displayName?.text || "Unnamed Facility",
        address: p.formattedAddress || "",
        lat: p.location?.latitude,
        lng: p.location?.longitude,
        rating: typeof p.rating === "number" ? p.rating : null,
        userRatingCount: typeof p.userRatingCount === "number" ? p.userRatingCount : null,
        openNow:
          typeof p.regularOpeningHours?.openNow === "boolean"
            ? p.regularOpeningHours.openNow
            : null,
        phone: p.nationalPhoneNumber || null,
        googleMapsUri: p.googleMapsUri || null,
        types: Array.isArray(p.types) ? p.types : [],
      }));

      return jsonResponse({ configured: true, layer, places });
    }

    return jsonResponse(
      { configured: true, error: "BAD_REQUEST", message: `Unknown action: ${action}` },
      400
    );
  } catch (err) {
    return jsonResponse(
      {
        configured: true,
        error: "ROUTECRAFT_API_ERROR",
        message: err instanceof Error ? err.message : "Unexpected maps proxy error.",
      },
      500
    );
  }
});
