-- =================================================================
-- Ratings : un avis par reservation CONFIRMEE (option 1)
-- + agregats sur venues (rating_avg / rating_count) recalcules par trigger.
-- A executer dans Supabase SQL Editor -> New Query -> Run.
-- =================================================================

-- -----------------------------------------------------------------
-- 1) Table ratings
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ratings (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID        NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id)      ON DELETE CASCADE,
  venue_id   UUID        NOT NULL REFERENCES public.venues(id)   ON DELETE CASCADE,
  score      SMALLINT    NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ratings_booking_unique UNIQUE (booking_id)
);

CREATE INDEX IF NOT EXISTS ratings_venue_id_idx ON public.ratings (venue_id);
CREATE INDEX IF NOT EXISTS ratings_user_id_idx  ON public.ratings (user_id);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------
-- 2) RLS
-- -----------------------------------------------------------------
-- Lecture publique de tous les avis.
DROP POLICY IF EXISTS "Ratings are publicly readable" ON public.ratings;
CREATE POLICY "Ratings are publicly readable"
  ON public.ratings
  FOR SELECT
  USING (true);

-- INSERT : l'utilisateur cree SON avis, uniquement sur une reservation
-- confirmee qui lui appartient (et venue_id coherent avec la reservation).
DROP POLICY IF EXISTS "Users insert own rating" ON public.ratings;
CREATE POLICY "Users insert own rating"
  ON public.ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    ratings.user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.id       = ratings.booking_id
        AND b.user_id  = auth.uid()
        AND b.status   = 'confirmed'
        AND b.venue_id = ratings.venue_id
    )
  );

-- UPDATE : l'utilisateur modifie SON avis (memes conditions).
DROP POLICY IF EXISTS "Users update own rating" ON public.ratings;
CREATE POLICY "Users update own rating"
  ON public.ratings
  FOR UPDATE
  TO authenticated
  USING (ratings.user_id = auth.uid())
  WITH CHECK (
    ratings.user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.id       = ratings.booking_id
        AND b.user_id  = auth.uid()
        AND b.status   = 'confirmed'
        AND b.venue_id = ratings.venue_id
    )
  );

-- Admin : tout voir / gerer.
DROP POLICY IF EXISTS "Admins manage ratings" ON public.ratings;
CREATE POLICY "Admins manage ratings"
  ON public.ratings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- -----------------------------------------------------------------
-- 3) Agregats sur venues
-- -----------------------------------------------------------------
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS rating_avg   NUMERIC(3,2) DEFAULT 0;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS rating_count INTEGER      DEFAULT 0;

-- Recalcule moyenne + nombre d'avis pour la venue impactee.
CREATE OR REPLACE FUNCTION public.recalc_venue_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  vid UUID;
BEGIN
  vid := COALESCE(NEW.venue_id, OLD.venue_id);
  IF vid IS NOT NULL THEN
    UPDATE public.venues v
    SET rating_avg = COALESCE(
          (SELECT ROUND(AVG(r.score)::numeric, 2) FROM public.ratings r WHERE r.venue_id = vid),
          0
        ),
        rating_count = (
          SELECT COUNT(*) FROM public.ratings r WHERE r.venue_id = vid
        )
    WHERE v.id = vid;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_recalc_venue_rating ON public.ratings;
CREATE TRIGGER trg_recalc_venue_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.recalc_venue_rating();

-- -----------------------------------------------------------------
-- 4) Backfill initial (si des ratings existent deja)
-- -----------------------------------------------------------------
UPDATE public.venues v
SET rating_avg = COALESCE(
      (SELECT ROUND(AVG(r.score)::numeric, 2) FROM public.ratings r WHERE r.venue_id = v.id),
      0
    ),
    rating_count = (
      SELECT COUNT(*) FROM public.ratings r WHERE r.venue_id = v.id
    );

-- -----------------------------------------------------------------
-- 5) Verification
-- -----------------------------------------------------------------
SELECT id, name, rating_avg, rating_count
FROM public.venues
ORDER BY rating_count DESC, name
LIMIT 10;
