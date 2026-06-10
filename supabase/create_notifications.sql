-- =================================================================
-- Marbell'app — Table notifications
-- Exécuter dans Supabase SQL Editor → New Query → Run
-- =================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title       TEXT        NOT NULL,
  message     TEXT        NOT NULL,
  type        TEXT        NOT NULL
                CHECK (type IN ('reservation_confirmed', 'reservation_cancelled', 'vip_offer', 'reminder')),
  read        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx
  ON public.notifications (user_id, created_at DESC);

-- ── RLS ──────────────────────────────────────────────────────────
-- Le client lit/màj uniquement SES notifications.
-- Les INSERT sont faits par l'Edge Function via la clé service_role
-- (qui bypass la RLS) → pas de policy d'insert nécessaire côté client.
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own notifications"   ON public.notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;

CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- ── Vérification ─────────────────────────────────────────────────
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'notifications'
ORDER BY ordinal_position;
