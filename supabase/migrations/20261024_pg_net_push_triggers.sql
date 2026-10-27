-- =========================================================================
-- SMARTSHOPPER MIGRATION: Automated Database Triggers for Background Push
-- Dispatches directly to Expo Push API via pg_net
-- Target: Supabase / PostgreSQL Database
-- =========================================================================

-- 1. Ensure pg_net extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Trigger Function: New Offer Push Dispatch
CREATE OR REPLACE FUNCTION public.trigger_push_on_new_offer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token RECORD;
  v_payload JSONB;
  v_messages JSONB := '[]'::jsonb;
  v_store_lat NUMERIC;
  v_store_lng NUMERIC;
  v_store_name TEXT;
  v_discount_tag TEXT;
  v_description TEXT;
BEGIN
  IF NEW.is_deleted = true THEN
    RETURN NEW;
  END IF;

  v_store_lat := NEW.lat;
  v_store_lng := NEW.lng;
  v_store_name := COALESCE(NEW.store_name, 'SmartShopper Partner');
  v_discount_tag := COALESCE(NEW.discount_tag, 'Special Offer');
  v_description := COALESCE(NEW.description, 'New Proximity Deal Available');

  IF v_store_lat IS NULL OR v_store_lng IS NULL OR (v_store_lat = 0 AND v_store_lng = 0) THEN
    SELECT lat, lng, name INTO v_store_lat, v_store_lng, v_store_name
    FROM public.stores
    WHERE id = NEW.store_id OR id = ('store_' || NEW.store_id)
    LIMIT 1;
  END IF;

  IF v_store_lat IS NULL OR v_store_lng IS NULL OR (v_store_lat = 0 AND v_store_lng = 0) THEN
    RETURN NEW;
  END IF;

  FOR v_token IN
    SELECT * FROM public.get_eligible_push_tokens_for_deal(
      NEW.id::text,
      v_store_lat,
      v_store_lng,
      5000
    )
  LOOP
    INSERT INTO public.push_delivery_logs (
      event_type,
      event_reference_id,
      device_id,
      user_id,
      push_token,
      distance_meters,
      status,
      provider
    ) VALUES (
      'deal_drop',
      NEW.id::text,
      v_token.device_id,
      v_token.user_id,
      v_token.push_token,
      v_token.distance_meters,
      'dispatched',
      'expo'
    )
    ON CONFLICT (event_type, event_reference_id, device_id) DO NOTHING;

    IF FOUND THEN
      v_payload := jsonb_build_object(
        'to', v_token.push_token,
        'title', '🔥 New Deal Drop at ' || v_store_name || '!',
        'body', v_discount_tag || ': ' || v_description || ' (' || ROUND(v_token.distance_meters / 1000.0, 1) || ' km away)',
        'sound', 'default',
        'priority', 'high',
        'channelId', 'deals_and_messages',
        'data', jsonb_build_object(
          'type', 'deal_drop',
          'offerId', NEW.id::text,
          'storeId', NEW.store_id,
          'storeName', v_store_name,
          'distanceMeters', v_token.distance_meters,
          'deviceId', v_token.device_id
        )
      );
      v_messages := v_messages || jsonb_build_array(v_payload);
    END IF;
  END LOOP;

  IF jsonb_array_length(v_messages) > 0 THEN
    PERFORM net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      body := v_messages,
      headers := '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Trigger Function: New Chat Message Push Dispatch
CREATE OR REPLACE FUNCTION public.trigger_push_on_new_chat_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token RECORD;
  v_payload JSONB;
  v_messages JSONB := '[]'::jsonb;
  v_sender TEXT;
  v_title TEXT;
  v_channel_id TEXT;
  v_store_name TEXT;
  v_customer_name TEXT;
  v_clean_text TEXT;
BEGIN
  v_sender := LOWER(COALESCE(NEW.sender, 'customer'));
  v_clean_text := TRIM(COALESCE(NEW.text, ''));
  v_store_name := COALESCE(NEW.store_name, 'Partner Store');
  v_customer_name := COALESCE(NEW.customer_name, 'Customer');

  IF v_clean_text = '' THEN
    RETURN NEW;
  END IF;

  IF v_sender IN ('customer', 'user') THEN
    v_title := '💬 New Message from ' || v_customer_name;
    v_channel_id := 'merchant_orders_and_chats';
  ELSE
    v_title := '💬 ' || v_store_name || ' replied';
    v_channel_id := 'deals_and_messages';
  END IF;

  FOR v_token IN
    SELECT * FROM public.get_recipient_push_tokens_for_chat(
      v_sender,
      NEW.store_id,
      NEW.customer_id
    )
  LOOP
    INSERT INTO public.push_delivery_logs (
      event_type,
      event_reference_id,
      device_id,
      user_id,
      push_token,
      status,
      provider
    ) VALUES (
      'chat_message',
      NEW.id::text,
      v_token.device_id,
      v_token.user_id,
      v_token.push_token,
      'dispatched',
      'expo'
    )
    ON CONFLICT (event_type, event_reference_id, device_id) DO NOTHING;

    IF FOUND THEN
      v_payload := jsonb_build_object(
        'to', v_token.push_token,
        'title', v_title,
        'body', v_clean_text,
        'sound', 'default',
        'priority', 'high',
        'channelId', v_channel_id,
        'data', jsonb_build_object(
          'type', CASE WHEN v_sender IN ('customer', 'user') THEN 'chat_message' ELSE 'merchant_message' END,
          'messageId', NEW.id::text,
          'threadId', NEW.thread_id,
          'storeId', NEW.store_id,
          'storeName', v_store_name,
          'customerId', NEW.customer_id,
          'sender', v_sender,
          'deviceId', v_token.device_id
        )
      );
      v_messages := v_messages || jsonb_build_array(v_payload);
    END IF;
  END LOOP;

  IF jsonb_array_length(v_messages) > 0 THEN
    PERFORM net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      body := v_messages,
      headers := '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Create Triggers
DROP TRIGGER IF EXISTS trg_push_on_new_offer ON public.offers;
CREATE TRIGGER trg_push_on_new_offer
  AFTER INSERT ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_push_on_new_offer();

DROP TRIGGER IF EXISTS trg_push_on_new_chat_message ON public.chat_messages;
CREATE TRIGGER trg_push_on_new_chat_message
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_push_on_new_chat_message();
