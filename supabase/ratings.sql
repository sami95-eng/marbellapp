-- =================================================================
-- Ratings — un avis par réservation CONFIRMÉE (option 1)
-- + agrégats sur venues (rating_avg / rating_count) recalculés par trigger.
-- Exécuter dans Supabase SQL Editor → New Query → Run.
-- =================================================================

-- ── Table ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ratings (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID        NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_id   UUID        NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  score      SMALLINT    NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (booking_id)                       -- un seul avis par réservation
);

CREATE INDEX IF NOT EXISTS ratings_venue_id_idx ON public.ratings(venue_id);
CREATE INDEX IF NOT EXISTS ratings_user_id_idx  ON public.ratings(user_id);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- ── RLS ────────────────────────────────────────────────────────────
-- Lecture publique de tous les avis.
DROP POLICY IF EXISTS "Ratings are publicly readable" ON public.ratings;
CREATE POLICY "Ratings are publicly readable"
  ON public.ratings FOR SELECT USING (TRUE);

-- L'utilisateur insère SON avis, sur une réservation CONFIRMÉE qui lui
-- appartient (et venue_id cohérent avec la réservation).
DROP POLICY IF EXISTS "Users insert own rating (confirmed booking)" ON public.ratings;
CREATE POLICY "Users insert own rating (confirmed booking)"
  ON public.ratings FOR INSERT TO authenticated
  WITH CHECK (
    ratings.user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = ratings.booking_id
        AND b.user_id = auth.uid()
        AND b.status = 'confirmed'
        AND b.venue_id = ratings.venue_id
    )
  );

-- L'utilisateur met à jour SON avis (mêmes conditions).
DROP POLICY IF EXISTS "Users update own rating (confirmed booking)" ON public.ratings;
CREATE POLICY "Users update own rating (confirmed booking)"
  ON public.ratings FOR UPDATE TO authenticated
  USING (ratings.user_id = auth.uid())
  WITH CHECK (
    ratings.user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = ratings.booking_id
        AND b.user_id = auth.uid()
        AND b.status = 'confirmed'
        AND b.venue_id = ratings.venue_id
    )
  );

-- Admin : tout voir / gérer.
DROP POLICY IF EXISTS "Admins manage ratings" ON public.ratings;
CREATE POLICY "Admins manage ratings"
  ON public.ratings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── Agrégats sur venues ────────────────────────────────────────────
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS rating_avg   NUMERIC(3,2) DEFAULT 0;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS rating_count INTEGER      DEFAULT 0;

-- Recalcule moyenne + nombre d'avis pour la venue impactée.
CREATE OR REPLACE FUNCTION public.recalc_venue_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE vid UUID;
BEGIN
  vid := COALESCE(NEW.venue_id, OLD.venue_id);
  IF vid IS NOT NULL THEN
    UPDATE public.venues v SET
      rating_avg   = COALESCE((SELECT ROUND(AVG(r.score)::numeric, 2)
                               FROM public.ratings r WHERE r.venue_id = vid), 0),
      rating_count = (SELECT COUNT(*) FROM public.ratings r WHERE r.venue_id = vid)
    WHERE v.id = vid;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_recalc_venue_rating ON public.ratings;
CREATE TRIGGER trg_recalc_venue_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION public.recalc_venue_rating();

-- Backfill initial (au cas où des ratings existeraient déjà).
UPDATE public.venues v SET
  rating_avg   = COALESCE((SELECT ROUND(AVG(r.score)::numeric, 2)
                           FROM public.ratings r WHERE r.venue_id = v.id), 0),
  rating_count = (SELECT COUNT(*) FROM public.ratings r WHERE r.venue_id = v.id);

-- ── Vérification ───────────────────────────────────────────────────
SELECT id, name, rating_avg, rating_count
FROM public.venues ORDER BY rating_count DESC, name LIMIT 10;
