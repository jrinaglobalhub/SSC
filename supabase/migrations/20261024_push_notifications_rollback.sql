-- =========================================================================
-- SMARTSHOPPER MIGRATION ROLLBACK PLAN: Push Notifications
-- Date: 2026-10-24
-- Description:
--   Safely reverts push notifications schema changes, functions, and RLS policies
--   introduced in 20261023_push_notifications_schema_and_geo.sql.
-- =========================================================================

-- 1. DROP OPTIONAL TRIGGERS & PROCEDURES
DROP TRIGGER IF EXISTS trg_send_deal_push ON public.offers;
DROP FUNCTION IF EXISTS public.trigger_send_deal_push();

DROP FUNCTION IF EXISTS public.get_eligible_push_tokens_for_deal(TEXT, NUMERIC, NUMERIC, NUMERIC);

-- 2. DROP ROW LEVEL SECURITY POLICIES
DROP POLICY IF EXISTS "Service role full access on push_delivery_logs" ON public.push_delivery_logs;
DROP POLICY IF EXISTS "Anon users view own push token" ON public.user_push_tokens;
DROP POLICY IF EXISTS "Anon users update own push token" ON public.user_push_tokens;
DROP POLICY IF EXISTS "Anon users insert own push token" ON public.user_push_tokens;
DROP POLICY IF EXISTS "Authenticated users manage own push tokens" ON public.user_push_tokens;
DROP POLICY IF EXISTS "Service role full access on user_push_tokens" ON public.user_push_tokens;

-- 3. DROP TABLES (CASCADE TO DROP ASSOCIATED INDEXES & CONSTRAINTS)
DROP TABLE IF EXISTS public.push_delivery_logs CASCADE;
DROP TABLE IF EXISTS public.user_push_tokens CASCADE;
