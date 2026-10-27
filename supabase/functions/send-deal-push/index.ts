// =========================================================================
// SUPABASE EDGE FUNCTION: send-deal-push
// Handles newly published offers and delivers push notifications to
// eligible SmartShopper Consumer (SSC) devices strictly within 5,000 metres.
// =========================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

// Earth radius in metres
const EARTH_RADIUS_METRES = 6371e3;

function calculateDistanceInMeters(
  coord1: { latitude: number; longitude: number },
  coord2: { latitude: number; longitude: number }
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.latitude)) *
      Math.cos(toRad(coord2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METRES * c);
}

function isKakkanadDefault(lat: number, lng: number): boolean {
  return Math.abs(lat - 10.0159) < 0.0001 && Math.abs(lng - 76.3419) < 0.0001;
}

// Chunk an array into batches of at most size N (Expo recommends <= 100)
function chunkArray<T>(items: T[], size = 100): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const webhookSecret = Deno.env.get("WEBHOOK_SECRET") ?? "";
    const expoAccessToken = Deno.env.get("EXPO_ACCESS_TOKEN") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase server credentials in environment." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Verify Authentication / Webhook Secret
    const authHeader = req.headers.get("authorization") || "";
    const customSecretHeader = req.headers.get("x-webhook-secret") || "";

    if (webhookSecret) {
      const isBearerSecretValid = authHeader === `Bearer ${webhookSecret}`;
      const isCustomSecretValid = customSecretHeader === webhookSecret;
      const isServiceRoleValid = authHeader === `Bearer ${supabaseServiceKey}`;

      if (!isBearerSecretValid && !isCustomSecretValid && !isServiceRoleValid) {
        return new Response(
          JSON.stringify({ error: "Unauthorized: invalid webhook signature or secret." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Parse Incoming Payload
    let payload: any = null;
    try {
      payload = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter table if payload is from a table-wide database webhook
    if (payload.table && payload.table !== "offers") {
      return new Response(
        JSON.stringify({ skipped: true, reason: `Ignored table '${payload.table}'. Expected 'offers'.` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const eventType: string = (payload.type || "INSERT").toUpperCase();
    const record: any = payload.record || payload.deal || payload;
    const oldRecord: any = payload.old_record || null;

    if (!record || !record.id) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Missing offer record or offer ID." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const offerId = String(record.id);

    // 3. Process Newly Published Offers Only
    // On UPDATE events: Only process if the deal transitioned from unpublished/draft/deleted to published
    if (eventType === "UPDATE") {
      const wasDeleted = oldRecord?.is_deleted === true;
      const isDeleted = record.is_deleted === true;
      const wasDraft = oldRecord?.status === "draft";
      const isNowActive = record.status === "active" || record.status === "published";

      const becameActive = (wasDeleted && !isDeleted) || (wasDraft && isNowActive);
      if (!becameActive && oldRecord) {
        return new Response(
          JSON.stringify({
            skipped: true,
            reason: "Offer update did not transition from draft/deleted to published. Skipped re-notification.",
            offerId
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Ignore soft-deleted offers
    if (record.is_deleted) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Offer is marked as deleted.", offerId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Ignore expired offers
    if (record.end_at && new Date(record.end_at).getTime() <= Date.now()) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Offer has already expired.", offerId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Ignore offers scheduled for the future (> 5 mins away)
    if (record.start_at && new Date(record.start_at).getTime() > Date.now() + 5 * 60 * 1000) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Offer is scheduled for future publication.", offerId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Resolve & Confirm Merchant Coordinates
    let storeLat = parseFloat(record.lat ?? record.latitude ?? 0);
    let storeLng = parseFloat(record.lng ?? record.longitude ?? 0);
    const storeAddress = String(record.address || "").toLowerCase();
    const isOfferKakkanad = isKakkanadDefault(storeLat, storeLng) && !storeAddress.includes("kakkanad");

    // If offer coordinates are missing or fabricated default, query store profile
    if ((isNaN(storeLat) || isNaN(storeLng) || (storeLat === 0 && storeLng === 0) || isOfferKakkanad) && record.store_id) {
      const { data: storeRow } = await supabase
        .from("stores")
        .select("lat, lng, address")
        .eq("id", record.store_id)
        .maybeSingle();

      if (storeRow) {
        const sLat = parseFloat(storeRow.lat);
        const sLng = parseFloat(storeRow.lng);
        const sAddress = String(storeRow.address || "").toLowerCase();
        if (!isNaN(sLat) && !isNaN(sLng) && (sLat !== 0 || sLng !== 0)) {
          if (!isKakkanadDefault(sLat, sLng) || sAddress.includes("kakkanad")) {
            storeLat = sLat;
            storeLng = sLng;
          }
        }
      }
    }

    // Confirm merchant coordinates are strictly valid before calculating distance
    if (
      isNaN(storeLat) ||
      isNaN(storeLng) ||
      (storeLat === 0 && storeLng === 0) ||
      (isKakkanadDefault(storeLat, storeLng) && !storeAddress.includes("kakkanad"))
    ) {
      return new Response(
        JSON.stringify({
          skipped: true,
          reason: "Merchant coordinates are missing, invalid, or unverified fabricated fallback.",
          offerId
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const storeName = record.store_name || "Partner Store";
    const discountTag = record.discount_tag || "Exclusive Deal";
    const description = record.description || "Limited-time flash discount available near you!";

    // 5. Query Eligible Consumers within 5,000 metres (using RPC or robust JS fallback)
    interface EligibleRecipient {
      deviceId: string;
      userId: string | null;
      pushToken: string;
      tokenType: string;
      platform: string;
      distanceMeters: number;
      locationSource: string;
    }

    let eligibleRecipients: EligibleRecipient[] = [];

    // Attempt calling server-side stored procedure
    const { data: rpcRows, error: rpcErr } = await supabase.rpc(
      "get_eligible_push_tokens_for_deal",
      {
        p_offer_id: offerId,
        p_store_lat: storeLat,
        p_store_lng: storeLng,
        p_max_distance_meters: 5000,
      }
    );

    if (!rpcErr && Array.isArray(rpcRows)) {
      eligibleRecipients = rpcRows.map((r: any) => ({
        deviceId: r.device_id,
        userId: r.user_id,
        pushToken: r.push_token,
        tokenType: r.token_type || "expo",
        platform: r.platform || "android",
        distanceMeters: Number(r.distance_meters),
        locationSource: r.location_source || "unknown",
      }));
    } else {
      // Robust fallback if RPC is not installed: execute query + Haversine calculation
      console.warn("RPC get_eligible_push_tokens_for_deal unavailable, falling back to direct query:", rpcErr?.message);

      // Fetch active tokens for SSC
      const { data: tokens, error: tokenErr } = await supabase
        .from("user_push_tokens")
        .select("device_id, user_id, push_token, token_type, platform, last_lat, last_lng, location_source")
        .eq("is_active", true)
        .eq("app_name", "ssc");

      if (tokenErr || !tokens || tokens.length === 0) {
        return new Response(
          JSON.stringify({ skipped: true, reason: "no_active_tokens", error: tokenErr?.message }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check already notified devices for idempotency
      const { data: logs } = await supabase
        .from("push_delivery_logs")
        .select("device_id")
        .eq("event_type", "deal_drop")
        .eq("event_reference_id", offerId);

      const alreadyNotified = new Set((logs || []).map((l: any) => l.device_id));

      for (const t of tokens) {
        if (alreadyNotified.has(t.device_id)) continue;

        let consumerCoords: { latitude: number; longitude: number } | null = null;
        let source = "none";

        // Priority 1: Verified GPS coordinates
        const isGpsKakkanad = isKakkanadDefault(Number(t.last_lat), Number(t.last_lng));
        if (
          t.location_source === "gps" &&
          t.last_lat !== null &&
          t.last_lng !== null &&
          (Number(t.last_lat) !== 0 || Number(t.last_lng) !== 0) &&
          !isGpsKakkanad
        ) {
          consumerCoords = { latitude: Number(t.last_lat), longitude: Number(t.last_lng) };
          source = "gps";
        }
        // Priority 2: Primary saved address from app_users
        else if (t.user_id) {
          const { data: userRow } = await supabase
            .from("app_users")
            .select("address")
            .eq("id", t.user_id)
            .maybeSingle();

          const addr = userRow?.address;
          if (addr && addr.lat && addr.lng) {
            const aLat = Number(addr.lat);
            const aLng = Number(addr.lng);
            const fullAddr = `${addr.city || ""} ${addr.streetArea || ""} ${addr.houseDetails || ""}`.toLowerCase();
            const isAddrKakkanad = isKakkanadDefault(aLat, aLng) && !fullAddr.includes("kakkanad");

            if ((aLat !== 0 || aLng !== 0) && !isAddrKakkanad) {
              consumerCoords = { latitude: aLat, longitude: aLng };
              source = "saved_address";
            }
          }
        }

        // Priority 3: Saved address coordinates on push token record
        if (!consumerCoords && t.last_lat !== null && t.last_lng !== null) {
          const cLat = Number(t.last_lat);
          const cLng = Number(t.last_lng);
          if ((cLat !== 0 || cLng !== 0) && !isKakkanadDefault(cLat, cLng)) {
            consumerCoords = { latitude: cLat, longitude: cLng };
            source = "saved_address";
          }
        }

        if (!consumerCoords) continue;

        const distanceMeters = calculateDistanceInMeters(consumerCoords, {
          latitude: storeLat,
          longitude: storeLng,
        });

        // Strictly enforce 5,000 metres
        if (distanceMeters <= 5000) {
          eligibleRecipients.push({
            deviceId: t.device_id,
            userId: t.user_id,
            pushToken: t.push_token,
            tokenType: t.token_type || "expo",
            platform: t.platform || "android",
            distanceMeters,
            locationSource: source,
          });
        }
      }
    }

    if (eligibleRecipients.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          eligibleCount: 0,
          sentCount: 0,
          reason: "no_consumers_within_5000m",
          offerId,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Build Expo Push Messages
    const messages = eligibleRecipients.map((rec) => {
      const distanceKm = (rec.distanceMeters / 1000).toFixed(1);
      return {
        to: rec.pushToken,
        title: `🔥 New Deal Drop at ${storeName}!`,
        body: `${discountTag}: ${description} (${distanceKm} km away)`,
        sound: "default",
        priority: "high",
        channelId: "deals_and_messages",
        data: {
          type: "deal_drop",
          offerId,
          storeName,
          storeId: record.store_id || "",
          distanceMeters: rec.distanceMeters,
          deviceId: rec.deviceId,
        },
      };
    });

    // 7. Dispatch via Expo Push API (chunked up to 100 per request)
    const chunks = chunkArray(messages, 100);
    const tickets: any[] = [];
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
    };
    if (expoAccessToken) {
      headers["Authorization"] = `Bearer ${expoAccessToken}`;
    }

    for (const chunk of chunks) {
      try {
        const expoRes = await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers,
          body: JSON.stringify(chunk),
        });
        const expoData = await expoRes.json();
        if (Array.isArray(expoData?.data)) {
          tickets.push(...expoData.data);
        } else {
          // If top-level error occurred for this chunk
          const errMessage = expoData?.errors?.[0]?.message || "Expo API error";
          tickets.push(...chunk.map(() => ({ status: "error", message: errMessage })));
        }
      } catch (postErr: any) {
        tickets.push(...chunk.map(() => ({ status: "error", message: postErr?.message || "Network error" })));
      }
    }

    // 8. Process Tickets: Idempotency Logging & Deactivating Unregistered Devices
    const invalidTokensToDeactivate: string[] = [];
    const logInserts: any[] = [];

    eligibleRecipients.forEach((rec, idx) => {
      const ticket = tickets[idx];
      const isError = ticket?.status === "error";
      const errorCode = ticket?.details?.error;
      const errorMessage = ticket?.message || errorCode || null;

      if (errorCode === "DeviceNotRegistered") {
        invalidTokensToDeactivate.push(rec.pushToken);
      }

      logInserts.push({
        event_type: "deal_drop",
        event_reference_id: offerId,
        device_id: rec.deviceId,
        user_id: rec.userId,
        push_token: rec.pushToken,
        distance_meters: rec.distanceMeters,
        status: isError ? "failed" : "sent",
        provider: "expo",
        ticket_id: ticket?.id || null,
        error_message: errorMessage,
      });
    });

    // Deactivate invalid tokens safely
    if (invalidTokensToDeactivate.length > 0) {
      await supabase
        .from("user_push_tokens")
        .update({ is_active: false })
        .in("push_token", invalidTokensToDeactivate);
    }

    // Insert idempotency logs (using upsert on event_type, event_reference_id, device_id)
    if (logInserts.length > 0) {
      await supabase
        .from("push_delivery_logs")
        .upsert(logInserts, { onConflict: "event_type,event_reference_id,device_id" });
    }

    return new Response(
      JSON.stringify({
        success: true,
        offerId,
        eligibleCount: eligibleRecipients.length,
        sentCount: messages.length,
        deactivatedTokens: invalidTokensToDeactivate.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
