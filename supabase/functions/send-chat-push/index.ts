// =========================================================================
// SUPABASE EDGE FUNCTION: send-chat-push
// Handles new chat messages on INSERT to public.chat_messages
// Delivers visible push notifications bidirectional between:
// 1. Customer -> Merchant's SSM device (channel: merchant_orders_and_chats)
// 2. Merchant -> Customer's SSC device (channel: deals_and_messages)
// =========================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

function truncateText(text: string, maxLength = 80): string {
  if (!text) return "New message";
  const clean = text.replace(/[\r\n]+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  return clean.substring(0, maxLength - 3) + "...";
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

    // Ignore tables other than chat_messages
    if (payload.table && payload.table !== "chat_messages") {
      return new Response(
        JSON.stringify({ skipped: true, reason: `Ignored table '${payload.table}'. Expected 'chat_messages'.` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const eventType: string = (payload.type || "INSERT").toUpperCase();
    if (eventType !== "INSERT") {
      return new Response(
        JSON.stringify({ skipped: true, reason: `Ignored event '${eventType}'. Chat push is INSERT-only.` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const message: any = payload.record || payload.message || payload;
    if (!message || !message.id) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Missing message record or message ID." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const messageId = String(message.id);
    const sender = String(message.sender || "customer").toLowerCase();
    const senderId = String(message.sender_id || "");

    // Skip system broadcast messages from sending individual device notifications
    if (sender === "system") {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Ignored system-generated message.", messageId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let recipientUserId: string | null = null;
    let targetApp: "ssc" | "ssm" = "ssm";
    let channelId = "merchant_orders_and_chats";
    let notificationTitle = "💬 New Message";
    let notificationBody = truncateText(message.text || "You have a new message.");
    let customData: Record<string, any> = {};

    // 3. Bidirectional Recipient & Routing Resolution
    if (sender === "customer" || sender === "user") {
      // Customer sent a message -> Route to Merchant owner of store_id (SSM App)
      targetApp = "ssm";
      channelId = "merchant_orders_and_chats";

      const storeId = message.store_id;
      if (!storeId) {
        return new Response(
          JSON.stringify({ skipped: true, reason: "Missing store_id on message.", messageId }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Query store owner
      const { data: storeRow, error: storeErr } = await supabase
        .from("stores")
        .select("id, owner_id, name")
        .eq("id", storeId)
        .maybeSingle();

      if (storeErr || !storeRow || !storeRow.owner_id) {
        return new Response(
          JSON.stringify({
            skipped: true,
            reason: "Could not resolve store owner for merchant notification.",
            storeId,
            messageId,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      recipientUserId = storeRow.owner_id;
      notificationTitle = `💬 Message from ${message.customer_name || "Customer"}`;
      customData = {
        type: "chat_message",
        threadId: message.thread_id,
        storeId: message.store_id,
        customerId: message.customer_id,
        senderId: message.sender_id,
        senderRole: "customer",
        messageId,
      };
    } else if (sender === "merchant" || sender === "store") {
      // Merchant sent a reply -> Route to Customer (SSC App)
      targetApp = "ssc";
      channelId = "deals_and_messages";

      if (!message.customer_id) {
        return new Response(
          JSON.stringify({ skipped: true, reason: "Missing customer_id for merchant reply.", messageId }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      recipientUserId = message.customer_id;
      const storeName = message.store_name || "Store";
      notificationTitle = `💬 ${storeName} replied`;
      customData = {
        type: "chat_message",
        threadId: message.thread_id,
        storeId: message.store_id,
        storeName,
        customerId: message.customer_id,
        senderId: message.sender_id,
        senderRole: "merchant",
        messageId,
      };
    } else {
      return new Response(
        JSON.stringify({ skipped: true, reason: `Unrecognized sender role '${sender}'.`, messageId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!recipientUserId) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Recipient user ID could not be identified.", messageId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Fetch Active Device Push Tokens for Recipient
    const { data: tokens, error: tokenErr } = await supabase
      .from("user_push_tokens")
      .select("device_id, user_id, push_token, token_type, platform")
      .eq("user_id", recipientUserId)
      .eq("app_name", targetApp)
      .eq("is_active", true);

    if (tokenErr || !tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({
          skipped: true,
          reason: "no_active_tokens_for_recipient",
          recipientUserId,
          targetApp,
          messageId,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Exclude Already Notified Devices (Idempotency)
    const { data: logs } = await supabase
      .from("push_delivery_logs")
      .select("device_id")
      .eq("event_type", "chat_message")
      .eq("event_reference_id", messageId);

    const alreadyNotified = new Set((logs || []).map((l: any) => l.device_id));

    // Filter tokens: Never notify sender of their own message & exclude already dispatched devices
    const eligibleTokens = tokens.filter((t: any) => {
      if (t.user_id === senderId) return false; // Rule: Never notify sender
      if (alreadyNotified.has(t.device_id)) return false; // Rule: Idempotent
      return true;
    });

    if (eligibleTokens.length === 0) {
      return new Response(
        JSON.stringify({
          skipped: true,
          reason: "All recipient devices already notified or filtered (sender suppression).",
          messageId,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Build Expo Push Messages
    const pushMessages = eligibleTokens.map((t: any) => ({
      to: t.push_token,
      title: notificationTitle,
      body: notificationBody,
      sound: "default",
      priority: "high",
      channelId,
      data: {
        ...customData,
        deviceId: t.device_id,
      },
    }));

    // 7. Dispatch via Expo Push API
    const chunks = chunkArray(pushMessages, 100);
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

    eligibleTokens.forEach((t: any, idx: number) => {
      const ticket = tickets[idx];
      const isError = ticket?.status === "error";
      const errorCode = ticket?.details?.error;
      const errorMessage = ticket?.message || errorCode || null;

      if (errorCode === "DeviceNotRegistered") {
        invalidTokensToDeactivate.push(t.push_token);
      }

      logInserts.push({
        event_type: "chat_message",
        event_reference_id: messageId,
        device_id: t.device_id,
        user_id: t.user_id,
        push_token: t.push_token,
        status: isError ? "failed" : "sent",
        provider: "expo",
        ticket_id: ticket?.id || null,
        error_message: errorMessage,
      });
    });

    if (invalidTokensToDeactivate.length > 0) {
      await supabase
        .from("user_push_tokens")
        .update({ is_active: false })
        .in("push_token", invalidTokensToDeactivate);
    }

    if (logInserts.length > 0) {
      await supabase
        .from("push_delivery_logs")
        .upsert(logInserts, { onConflict: "event_type,event_reference_id,device_id" });
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId,
        recipientUserId,
        targetApp,
        sentCount: pushMessages.length,
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
