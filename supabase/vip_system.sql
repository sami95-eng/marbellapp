-- =================================================================
-- Systeme VIP Instagram (#marbellappvip)
-- vip_posts (soumissions) + vip_tiers (config des paliers)
-- + trigger qui recalcule profiles.partner_post_count (posts approuves).
-- A executer dans Supabase SQL Editor -> New Query -> Run.
-- Script idempotent : rejouable sans erreur.
-- =================================================================

-- -----------------------------------------------------------------
-- 0) Compteur de posts approuves sur profiles (idempotent)
-- -----------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS partner_post_count INTEGER NOT NULL DEFAULT 0;

-- -----------------------------------------------------------------
-- 1) Table vip_posts (soumissions Instagram)
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vip_posts (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_url         TEXT        NOT NULL,
  instagram_handle TEXT,
  hashtag          TEXT        DEFAULT '#marbellappvip',
  status           TEXT        NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at      TIMESTAMPTZ,
  reviewed_by      UUID        REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS vip_posts_user_idx   ON public.vip_posts (user_id);
CREATE INDEX IF NOT EXISTS vip_posts_status_idx ON public.vip_posts (status);

ALTER TABLE public.vip_posts ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------
-- 2) RLS vip_posts
-- -----------------------------------------------------------------
-- L'utilisateur cree SES propres posts.
DROP POLICY IF EXISTS "Users insert own vip post" ON public.vip_posts;
CREATE POLICY "Users insert own vip post"
  ON public.vip_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- L'utilisateur lit SES propres posts.
DROP POLICY IF EXISTS "Users read own vip posts" ON public.vip_posts;
CREATE POLICY "Users read own vip posts"
  ON public.vip_posts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- L'admin voit et gere tout (validation des soumissions).
DROP POLICY IF EXISTS "Admins manage vip posts" ON public.vip_posts;
CREATE POLICY "Admins manage vip posts"
  ON public.vip_posts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- -----------------------------------------------------------------
-- 3) Trigger : recalcule partner_post_count (posts approuves)
-- -----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recalc_vip_post_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID;
BEGIN
  uid := COALESCE(NEW.user_id, OLD.user_id);
  IF uid IS NOT NULL THEN
    UPDATE public.profiles p
    SET partner_post_count = (
      SELECT COUNT(*)
      FROM public.vip_posts vp
      WHERE vp.user_id = uid AND vp.status = 'approved'
    )
    WHERE p.id = uid;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_recalc_vip_post_count ON public.vip_posts;
CREATE TRIGGER trg_recalc_vip_post_count
  AFTER INSERT OR UPDATE OR DELETE ON public.vip_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.recalc_vip_post_count();

-- -----------------------------------------------------------------
-- 4) Table vip_tiers (config des paliers)
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vip_tiers (
  tier         TEXT    PRIMARY KEY,
  min_posts    INTEGER NOT NULL,
  discount_pct INTEGER NOT NULL,
  label        TEXT    NOT NULL,
  color        TEXT    NOT NULL
);

ALTER TABLE public.vip_tiers ENABLE ROW LEVEL SECURITY;

-- Lecture publique des paliers.
DROP POLICY IF EXISTS "VIP tiers public read" ON public.vip_tiers;
CREATE POLICY "VIP tiers public read"
  ON public.vip_tiers
  FOR SELECT
  USING (TRUE);

-- Gestion reservee aux admins.
DROP POLICY IF EXISTS "Admins manage vip tiers" ON public.vip_tiers;
CREATE POLICY "Admins manage vip tiers"
  ON public.vip_tiers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- -----------------------------------------------------------------
-- 5) Seed des 4 paliers (upsert)
-- -----------------------------------------------------------------
INSERT INTO public.vip_tiers (tier, min_posts, discount_pct, label, color) VALUES
  ('bronze',   0,  0,  'Bronze',   '#CD7F32'),
  ('silver',   3,  10, 'Silver',   '#C0C0C0'),
  ('gold',     10, 20, 'Gold',     '#FFD700'),
  ('platinum', 20, 30, 'Platinum', '#E5E4E2')
ON CONFLICT (tier) DO UPDATE
  SET min_posts    = EXCLUDED.min_posts,
      discount_pct = EXCLUDED.discount_pct,
      label        = EXCLUDED.label,
      color        = EXCLUDED.color;

-- -----------------------------------------------------------------
-- 6) Verification
-- -----------------------------------------------------------------
SELECT tier, min_posts, discount_pct, label, color
FROM public.vip_tiers
ORDER BY min_posts;
