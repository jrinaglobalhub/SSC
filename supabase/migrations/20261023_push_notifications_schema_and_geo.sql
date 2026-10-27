-- =========================================================================
-- SMARTSHOPPER MIGRATION: Push Notifications Schema, Idempotency & Geo-Filter
-- Target: Supabase / PostgreSQL Database
-- Date: 2026-10-23
-- Description:
--   1. Creates user_push_tokens table for device token registration and location.
--   2. Creates push_delivery_logs table for server-side deduplication & idempotency.
--   3. Enables RLS with least-privilege security policies.
--   4. Implements get_eligible_push_tokens_for_deal() enforcing strict 5,000m filter.
-- =========================================================================

-- 1. USER PUSH TOKENS TABLE
CREATE TABLE IF NOT EXISTS public.user_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT, -- Nullable for guest consumers, or references app_users(id)
  device_id TEXT NOT NULL,
  push_token TEXT NOT NULL,
  token_type TEXT NOT NULL DEFAULT 'expo', -- 'expo' or 'fcm'
  platform TEXT NOT NULL DEFAULT 'android', -- 'android' or 'ios'
  app_name TEXT NOT NULL DEFAULT 'ssc', -- 'ssc' or 'ssm'
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_lat NUMERIC(10, 6),
  last_lng NUMERIC(10, 6),
  location_source TEXT DEFAULT 'none', -- 'gps', 'saved_address', 'none'
  location_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_push_token UNIQUE (push_token),
  CONSTRAINT uq_device_app UNIQUE (device_id, app_name)
);

-- Indexes for fast query resolution and geo-filtering
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user ON public.user_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_active ON public.user_push_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_app ON public.user_push_tokens(app_name);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_location ON public.user_push_tokens(last_lat, last_lng) WHERE is_active = true;

-- 2. PUSH DELIVERY LOGS (IDEMPOTENCY & DEDUPLICATION)
CREATE TABLE IF NOT EXISTS public.push_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL DEFAULT 'deal_drop', -- 'deal_drop', 'chat_message', etc.
  event_reference_id TEXT NOT NULL, -- e.g. offer_id
  device_id TEXT NOT NULL,
  user_id TEXT,
  push_token TEXT NOT NULL,
  distance_meters NUMERIC(10, 2),
  status TEXT NOT NULL, -- 'sent', 'skipped', 'failed', 'duplicate'
  provider TEXT NOT NULL DEFAULT 'expo', -- 'expo' or 'fcm'
  ticket_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_push_event_device UNIQUE (event_type, event_reference_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_push_delivery_event_ref ON public.push_delivery_logs(event_reference_id);
CREATE INDEX IF NOT EXISTS idx_push_delivery_device ON public.push_delivery_logs(device_id);

-- 3. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_delivery_logs ENABLE ROW LEVEL SECURITY;

-- 3.1 user_push_tokens policies
-- Revoke broad public permissions
REVOKE ALL ON TABLE public.user_push_tokens FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.user_push_tokens TO anon, authenticated;
GRANT ALL ON TABLE public.user_push_tokens TO service_role;

DROP POLICY IF EXISTS "Service role full access on user_push_tokens" ON public.user_push_tokens;
CREATE POLICY "Service role full access on user_push_tokens"
  ON public.user_push_tokens
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users manage own push tokens" ON public.user_push_tokens;
CREATE POLICY "Authenticated users manage own push tokens"
  ON public.user_push_tokens
  FOR ALL
  TO authenticated
  USING (user_id = (auth.uid())::text OR user_id IS NULL)
  WITH CHECK (user_id = (auth.uid())::text OR user_id IS NULL);

DROP POLICY IF EXISTS "Anon users insert own push token" ON public.user_push_tokens;
CREATE POLICY "Anon users insert own push token"
  ON public.user_push_tokens
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

DROP POLICY IF EXISTS "Anon users update own push token" ON public.user_push_tokens;
CREATE POLICY "Anon users update own push token"
  ON public.user_push_tokens
  FOR UPDATE
  TO anon
  USING (user_id IS NULL)
  WITH CHECK (user_id IS NULL);

DROP POLICY IF EXISTS "Anon users view own push token" ON public.user_push_tokens;
CREATE POLICY "Anon users view own push token"
  ON public.user_push_tokens
  FOR SELECT
  TO anon
  USING (user_id IS NULL);

-- 3.2 push_delivery_logs policies (Server-side & Service Role Only)
REVOKE ALL ON TABLE public.push_delivery_logs FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.push_delivery_logs TO service_role;

DROP POLICY IF EXISTS "Service role full access on push_delivery_logs" ON public.push_delivery_logs;
CREATE POLICY "Service role full access on push_delivery_logs"
  ON public.push_delivery_logs
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. GEOGRAPHIC DISTANCE AND ELIGIBILITY RESOLUTION FUNCTION
-- Strictly enforces 5,000 metres (5 km) radius limit
CREATE OR REPLACE FUNCTION public.get_eligible_push_tokens_for_deal(
  p_offer_id TEXT,
  p_store_lat NUMERIC,
  p_store_lng NUMERIC,
  p_max_distance_meters NUMERIC DEFAULT 5000
)
RETURNS TABLE (
  device_id TEXT,
  user_id TEXT,
  push_token TEXT,
  token_type TEXT,
  platform TEXT,
  distance_meters NUMERIC,
  location_source TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH resolved_locations AS (
    SELECT
      upt.device_id,
      upt.user_id,
      upt.push_token,
      upt.token_type,
      upt.platform,
      -- Resolution Priority:
      -- 1. Verified GPS coordinates if valid and non-zero (rejecting fabricated Kakkanad default)
      -- 2. Saved delivery address coordinates from app_users if valid and non-zero
      -- 3. Fallback to saved_address coordinates in upt
      CASE
        WHEN upt.location_source = 'gps' 
             AND upt.last_lat IS NOT NULL 
             AND upt.last_lng IS NOT NULL 
             AND (upt.last_lat <> 0 OR upt.last_lng <> 0)
             AND NOT (ABS(upt.last_lat - 10.0159) < 0.0001 AND ABS(upt.last_lng - 76.3419) < 0.0001)
          THEN upt.last_lat
        WHEN au.address IS NOT NULL 
             AND (au.address->>'lat') IS NOT NULL 
             AND (au.address->>'lng') IS NOT NULL 
             AND ((au.address->>'lat')::numeric <> 0 OR (au.address->>'lng')::numeric <> 0)
             AND (
               NOT (ABS((au.address->>'lat')::numeric - 10.0159) < 0.0001 AND ABS((au.address->>'lng')::numeric - 76.3419) < 0.0001)
               OR LOWER(COALESCE(au.address->>'city', '') || ' ' || COALESCE(au.address->>'streetArea', '') || ' ' || COALESCE(au.address->>'houseDetails', '')) LIKE '%kakkanad%'
             )
          THEN (au.address->>'lat')::numeric
        WHEN upt.last_lat IS NOT NULL 
             AND upt.last_lng IS NOT NULL 
             AND (upt.last_lat <> 0 OR upt.last_lng <> 0)
             AND NOT (ABS(upt.last_lat - 10.0159) < 0.0001 AND ABS(upt.last_lng - 76.3419) < 0.0001)
          THEN upt.last_lat
        ELSE NULL
      END AS effective_lat,
      CASE
        WHEN upt.location_source = 'gps' 
             AND upt.last_lat IS NOT NULL 
             AND upt.last_lng IS NOT NULL 
             AND (upt.last_lat <> 0 OR upt.last_lng <> 0)
             AND NOT (ABS(upt.last_lat - 10.0159) < 0.0001 AND ABS(upt.last_lng - 76.3419) < 0.0001)
          THEN upt.last_lng
        WHEN au.address IS NOT NULL 
             AND (au.address->>'lat') IS NOT NULL 
             AND (au.address->>'lng') IS NOT NULL 
             AND ((au.address->>'lat')::numeric <> 0 OR (au.address->>'lng')::numeric <> 0)
             AND (
               NOT (ABS((au.address->>'lat')::numeric - 10.0159) < 0.0001 AND ABS((au.address->>'lng')::numeric - 76.3419) < 0.0001)
               OR LOWER(COALESCE(au.address->>'city', '') || ' ' || COALESCE(au.address->>'streetArea', '') || ' ' || COALESCE(au.address->>'houseDetails', '')) LIKE '%kakkanad%'
             )
          THEN (au.address->>'lng')::numeric
        WHEN upt.last_lat IS NOT NULL 
             AND upt.last_lng IS NOT NULL 
             AND (upt.last_lat <> 0 OR upt.last_lng <> 0)
             AND NOT (ABS(upt.last_lat - 10.0159) < 0.0001 AND ABS(upt.last_lng - 76.3419) < 0.0001)
          THEN upt.last_lng
        ELSE NULL
      END AS effective_lng,
      CASE
        WHEN upt.location_source = 'gps' 
             AND upt.last_lat IS NOT NULL 
             AND (upt.last_lat <> 0 OR upt.last_lng <> 0)
             AND NOT (ABS(upt.last_lat - 10.0159) < 0.0001 AND ABS(upt.last_lng - 76.3419) < 0.0001)
          THEN 'gps'
        WHEN au.address IS NOT NULL 
             AND (au.address->>'lat') IS NOT NULL
          THEN 'saved_address'
        WHEN upt.last_lat IS NOT NULL
             AND NOT (ABS(upt.last_lat - 10.0159) < 0.0001 AND ABS(upt.last_lng - 76.3419) < 0.0001)
          THEN upt.location_source
        ELSE 'none'
      END AS resolved_source
    FROM public.user_push_tokens upt
    LEFT JOIN public.app_users au ON upt.user_id = au.id
    WHERE upt.is_active = true
      AND upt.app_name = 'ssc'
      -- Exclude devices that already received a push for this offer (Idempotency)
      AND NOT EXISTS (
        SELECT 1 FROM public.push_delivery_logs pdl
        WHERE pdl.event_type = 'deal_drop'
          AND pdl.event_reference_id = p_offer_id
          AND pdl.device_id = upt.device_id
      )
  ),
  calculated_distances AS (
    SELECT
      rl.device_id,
      rl.user_id,
      rl.push_token,
      rl.token_type,
      rl.platform,
      rl.resolved_source,
      -- Haversine Distance in Metres
      ROUND(
        (6371000 * 2 * ASIN(
          SQRT(
            POWER(SIN(RADIANS(p_store_lat - rl.effective_lat) / 2), 2) +
            COS(RADIANS(rl.effective_lat)) * COS(RADIANS(p_store_lat)) *
            POWER(SIN(RADIANS(p_store_lng - rl.effective_lng) / 2), 2)
          )
        ))::numeric,
        2
      ) AS distance_meters
    FROM resolved_locations rl
    WHERE rl.effective_lat IS NOT NULL
      AND rl.effective_lng IS NOT NULL
      AND p_store_lat IS NOT NULL
      AND p_store_lng IS NOT NULL
  )
  SELECT
    cd.device_id,
    cd.user_id,
    cd.push_token,
    cd.token_type,
    cd.platform,
    cd.distance_meters,
    cd.resolved_source AS location_source
  FROM calculated_distances cd
  WHERE cd.distance_meters <= p_max_distance_meters; -- Enforces strict 5,000 metres limit
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_eligible_push_tokens_for_deal(TEXT, NUMERIC, NUMERIC, NUMERIC) TO service_role;

-- =========================================================================
-- 5. DATABASE WEBHOOK SETUP INSTRUCTIONS (FOR SUPABASE DASHBOARD)
-- =========================================================================
-- You can configure the webhook via the Supabase Dashboard:
-- 1. Navigate to: Database -> Webhooks -> "Create a new webhook"
-- 2. Name: ssc-deal-push
-- 3. Table: offers
-- 4. Events: Toggle "Insert" and "Update"
-- 5. Type of Webhook: Supabase Edge Functions
-- 6. Edge Function: send-deal-push
-- 7. Method: POST
-- 8. HTTP Headers:
--      x-webhook-secret: <YOUR_WEBHOOK_SECRET>
--
-- =========================================================================
-- 6. ALTERNATIVE: SQL-BASED TRIGGER USING PG_NET (OPTIONAL)
-- If preferred over Dashboard Webhooks, enable the pg_net extension and create
-- the trigger below (uncomment and replace project ref + webhook secret):
-- =========================================================================
-- CREATE EXTENSION IF NOT EXISTS pg_net;
--
-- CREATE OR REPLACE FUNCTION public.trigger_send_deal_push()
-- RETURNS TRIGGER
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- AS $$
-- DECLARE
--   v_payload JSONB;
--   v_function_url TEXT := 'https://tpcrwtxtqvvdghtfckea.supabase.co/functions/v1/send-deal-push';
--   v_secret TEXT := 'YOUR_WEBHOOK_SECRET'; -- Set matching WEBHOOK_SECRET in Edge Function Secrets
-- BEGIN
--   -- Only notify on INSERT or when transitioning from deleted/draft to published
--   IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND (OLD.is_deleted = TRUE AND NEW.is_deleted = FALSE)) THEN
--     IF NEW.is_deleted = FALSE AND (NEW.end_at IS NULL OR NEW.end_at > NOW()) THEN
--       v_payload := jsonb_build_object(
--         'type', TG_OP,
--         'table', TG_TABLE_NAME,
--         'schema', TG_TABLE_SCHEMA,
--         'record', to_jsonb(NEW),
--         'old_record', CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END
--       );
--       PERFORM net.http_post(
--         url := v_function_url,
--         headers := jsonb_build_object(
--           'Content-Type', 'application/json',
--           'x-webhook-secret', v_secret
--         ),
--         body := v_payload
--       );
--     END IF;
--   END IF;
--   RETURN NEW;
-- END;
-- $$;
--
-- DROP TRIGGER IF EXISTS trg_send_deal_push ON public.offers;
-- CREATE TRIGGER trg_send_deal_push
--   AFTER INSERT OR UPDATE ON public.offers
--   FOR EACH ROW
--   EXECUTE FUNCTION public.trigger_send_deal_push();

