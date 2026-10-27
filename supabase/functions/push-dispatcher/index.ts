// =========================================================================
// SUPABASE EDGE FUNCTION: push-dispatcher
// Complete Server-Side Remote Push Dispatcher for SmartShopper
// Handles:
//   A. New Deals & Offers -> Targeted SSC Consumer devices within store radius.
//   B. Customer Chat Messages -> Store Merchant SSM devices.
//   C. Merchant Chat Replies -> Recipient Customer SSC devices.
// Features:
//   - Expo Push API v2 batch delivery (chunks <= 100)
//   - Idempotent delivery tracking via push_delivery_logs
//   - Automatic deactivation of 'DeviceNotRegistered' tokens
//   - Strict payload validation and sender suppression (no self-notifications)
// =========================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EARTH_RADIUS_METRES = 6371e3;

interface ExpoPushMessage {
  to: string;
  sound: "default";
  title: string;
  body: string;
  data: Record<string, any>;
  channelId?: string;
  priority?: "default" | "normal" | "high";
  badge?: number;
}

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

    const table = payload.table || (payload.record?.discount_percent ? "offers" : "chat_messages");
    const record = payload.record || payload;
    const eventType = payload.type || "INSERT";

    console.log(`[push-dispatcher] Received event on table='${table}' type='${eventType}'`);

    const messagesToSend: ExpoPushMessage[] = [];
    const dispatchMetadata: {
      deviceId: string;
      userId: string | null;
      pushToken: string;
      eventType: string;
      eventRefId: string;
      distanceMeters?: number;
    }[] = [];

    // =========================================================================
    // CASE A: NEW DEAL / OFFER -> CONSUMER (SSC) DEVICES WITHIN GEOFENCE
    // =========================================================================
    if (table === "offers") {
      const offerId = record.id;
      if (!offerId || record.is_deleted === true) {
        return new Response(
          JSON.stringify({ skipped: true, reason: "Offer is deleted or invalid id." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if expired
      if (record.end_at && new Date(record.end_at).getTime() < Date.now()) {
        return new Response(
          JSON.stringify({ skipped: true, reason: "Offer has already expired." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Resolve store coordinates
      let storeLat: number | null = record.store_lat ?? null;
      let storeLng: number | null = record.store_lng ?? null;
      let storeRadiusMeters = record.radar_radius_meters ?? 5000;

      if (!storeLat || !storeLng) {
        if (record.store_id) {
          const { data: storeRow } = await supabase
            .from("stores")
            .select("latitude, longitude, radar_radius_meters")
            .eq("id", record.store_id)
            .maybeSingle();

          if (storeRow?.latitude && storeRow?.longitude) {
            storeLat = Number(storeRow.latitude);
            storeLng = Number(storeRow.longitude);
            storeRadiusMeters = Number(storeRow.radar_radius_meters) || storeRadiusMeters;
          }
        }
      }

      if (!storeLat || !storeLng) {
        return new Response(
          JSON.stringify({ error: "Store location coordinates unavailable for geo-dispatch." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Query eligible devices using database geo-function
      const { data: eligibleDevices, error: rpcError } = await supabase.rpc(
        "get_eligible_push_tokens_for_deal",
        {
          p_offer_id: String(offerId),
          p_store_lat: storeLat,
          p_store_lng: storeLng,
          p_max_distance_meters: storeRadiusMeters,
        }
      );

      if (rpcError) {
        console.warn("[push-dispatcher] rpc get_eligible_push_tokens_for_deal error:", rpcError);
      }

      const devices = eligibleDevices || [];
      const offerTitle = record.title || "Exclusive Flash Deal!";
      const discountText = record.discount_percent ? `${record.discount_percent}% OFF: ` : "";
      const bodySnippet = (record.description || "Tap to view this instant deal!").substring(0, 100);

      for (const dev of devices) {
        if (!dev.push_token) continue;
        messagesToSend.push({
          to: dev.push_token,
          sound: "default",
          title: offerTitle,
          body: `${discountText}${bodySnippet}`,
          channelId: "deals_and_messages",
          priority: "high",
          data: {
            type: "deal_drop",
            offerId: String(offerId),
            storeId: record.store_id,
            storeName: record.store_name,
          },
        });
        dispatchMetadata.push({
          deviceId: dev.device_id,
          userId: dev.user_id || null,
          pushToken: dev.push_token,
          eventType: "deal_drop",
          eventRefId: String(offerId),
          distanceMeters: dev.distance_meters,
        });
      }
    }

    // =========================================================================
    // CASE B & C: CHAT MESSAGES
    // =========================================================================
    else if (table === "chat_messages") {
      const msgId = String(record.id || `msg_${Date.now()}`);
      const sender = record.sender; // 'customer', 'user', or 'store'
      const storeId = record.store_id;
      const customerId = record.customer_id;
      const text = (record.text || "").trim();
      const previewText = text.length > 80 ? `${text.substring(0, 80)}...` : text;

      // CASE B: Customer sent a message -> Notify Merchant's SSM Devices
      if (sender === "customer" || sender === "user") {
        if (!storeId) {
          return new Response(
            JSON.stringify({ skipped: true, reason: "Missing store_id in customer message." }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Find store owner user_id
        const { data: storeRow } = await supabase
          .from("stores")
          .select("owner_id, name")
          .eq("id", storeId)
          .maybeSingle();

        const ownerId = storeRow?.owner_id || storeId;

        // Query active SSM tokens for this merchant
        const { data: ssmTokens } = await supabase
          .from("user_push_tokens")
          .select("device_id, user_id, push_token")
          .eq("app_name", "ssm")
          .eq("is_active", true)
          .or(`user_id.eq.${ownerId},user_id.eq.${storeId}`);

        const tokens = ssmTokens || [];
        const customerName = record.customer_name || "Customer";

        for (const tok of tokens) {
          // Check idempotency in push_delivery_logs
          const { data: existingLog } = await supabase
            .from("push_delivery_logs")
            .select("id")
            .eq("event_type", "customer_chat")
            .eq("event_reference_id", msgId)
            .eq("device_id", tok.device_id)
            .maybeSingle();

          if (existingLog) continue;

          messagesToSend.push({
            to: tok.push_token,
            sound: "default",
            title: customerName,
            body: previewText || "Sent a message regarding in-store inventory.",
            channelId: "merchant_orders_and_chats",
            priority: "high",
            data: {
              type: "customer_message",
              threadId: record.thread_id,
              customerId: customerId,
              storeId: storeId,
            },
          });

          dispatchMetadata.push({
            deviceId: tok.device_id,
            userId: tok.user_id,
            pushToken: tok.push_token,
            eventType: "customer_chat",
            eventRefId: msgId,
          });
        }
      }

      // CASE C: Merchant sent a reply -> Notify Customer's SSC Devices
      else if (sender === "store") {
        if (!customerId) {
          return new Response(
            JSON.stringify({ skipped: true, reason: "Missing customer_id in store message." }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Query active SSC tokens for customer
        const { data: sscTokens } = await supabase
          .from("user_push_tokens")
          .select("device_id, user_id, push_token")
          .eq("app_name", "ssc")
          .eq("is_active", true)
          .eq("user_id", customerId);

        const tokens = sscTokens || [];
        const storeName = record.store_name || "Store Partner";

        for (const tok of tokens) {
          // Check idempotency in push_delivery_logs
          const { data: existingLog } = await supabase
            .from("push_delivery_logs")
            .select("id")
            .eq("event_type", "store_chat")
            .eq("event_reference_id", msgId)
            .eq("device_id", tok.device_id)
            .maybeSingle();

          if (existingLog) continue;

          messagesToSend.push({
            to: tok.push_token,
            sound: "default",
            title: storeName,
            body: previewText || "Replied to your inquiry.",
            channelId: "deals_and_messages",
            priority: "high",
            data: {
              type: "merchant_message",
              threadId: record.thread_id,
              storeId: storeId,
              storeName: storeName,
            },
          });

          dispatchMetadata.push({
            deviceId: tok.device_id,
            userId: tok.user_id,
            pushToken: tok.push_token,
            eventType: "store_chat",
            eventRefId: msgId,
          });
        }
      }
    }

    // =========================================================================
    // DISPATCH BATCH TO EXPO PUSH API
    // =========================================================================
    if (messagesToSend.length === 0) {
      return new Response(
        JSON.stringify({ success: true, delivered: 0, reason: "No eligible active recipients found or already delivered." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[push-dispatcher] Dispatching ${messagesToSend.length} push notifications...`);

    const chunks = chunkArray(messagesToSend, 100);
    const metaChunks = chunkArray(dispatchMetadata, 100);
    let totalSent = 0;
    let totalFailed = 0;
    const deactivatedTokens: string[] = [];

    const headers: Record<string, string> = {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
    };
    if (expoAccessToken) {
      headers["Authorization"] = `Bearer ${expoAccessToken}`;
    }

    for (let i = 0; i < chunks.length; i++) {
      const batch = chunks[i];
      const metaBatch = metaChunks[i];

      try {
        const response = await fetch(EXPO_PUSH_URL, {
          method: "POST",
          headers,
          body: JSON.stringify(batch),
        });

        const result = await response.json();
        const tickets = result?.data || [];

        for (let j = 0; j < tickets.length; j++) {
          const ticket = tickets[j];
          const meta = metaBatch[j];

          if (ticket.status === "ok") {
            totalSent++;
            await supabase.from("push_delivery_logs").insert([
              {
                event_type: meta.eventType,
                event_reference_id: meta.eventRefId,
                device_id: meta.deviceId,
                user_id: meta.userId,
                push_token: meta.pushToken,
                distance_meters: meta.distanceMeters ?? null,
                status: "sent",
                provider: "expo",
                ticket_id: ticket.id,
              },
            ]);
          } else {
            totalFailed++;
            const errorCode = ticket.details?.error || ticket.message || "UnknownError";

            await supabase.from("push_delivery_logs").insert([
              {
                event_type: meta.eventType,
                event_reference_id: meta.eventRefId,
                device_id: meta.deviceId,
                user_id: meta.userId,
                push_token: meta.pushToken,
                distance_meters: meta.distanceMeters ?? null,
                status: "failed",
                provider: "expo",
                error_message: errorCode,
              },
            ]);

            // Deactivate unregistered/obsolete device tokens
            if (errorCode === "DeviceNotRegistered") {
              deactivatedTokens.push(meta.pushToken);
              await supabase
                .from("user_push_tokens")
                .update({ is_active: false, updated_at: new Date().toISOString() })
                .eq("push_token", meta.pushToken);
            }
          }
        }
      } catch (chunkErr: any) {
        console.warn("[push-dispatcher] Batch dispatch error:", chunkErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: totalSent,
        failed: totalFailed,
        deactivatedTokensCount: deactivatedTokens.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[push-dispatcher] Uncaught runtime exception:", err);
    return new Response(
      JSON.stringify({ error: err?.message || String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
