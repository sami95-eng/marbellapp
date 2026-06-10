-- =================================================================
-- Marbell'app — Table bookings
-- Instructions : Supabase Dashboard → SQL Editor → New Query → RUN
-- =================================================================

CREATE TABLE IF NOT EXISTS public.bookings (
  id                  UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID          REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  venue_id            UUID          REFERENCES public.venues(id) ON DELETE SET NULL,
  venue_name          TEXT          NOT NULL,
  venue_slug          TEXT,
  venue_category      TEXT,
  date                DATE          NOT NULL,
  time                TEXT          NOT NULL,
  guests              INTEGER       NOT NULL DEFAULT 1,
  table_id            UUID          REFERENCES public.venue_tables(id) ON DELETE SET NULL,
  table_name          TEXT,
  table_price         NUMERIC(10,2),
  notes               TEXT,
  status              TEXT          NOT NULL DEFAULT 'confirmed'
                        CHECK (status IN ('confirmed', 'pending', 'cancelled', 'completed')),
  confirmation_number TEXT,
  created_at          TIMESTAMPTZ   DEFAULT NOW() NOT NULL
);

-- ── Index ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS bookings_user_id_idx    ON public.bookings (user_id);
CREATE INDEX IF NOT EXISTS bookings_date_idx       ON public.bookings (date);
CREATE INDEX IF NOT EXISTS bookings_status_idx     ON public.bookings (status);

-- ── RLS ─────────────────────────────────────────────────────────
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own bookings"   ON public.bookings;
DROP POLICY IF EXISTS "Users can insert their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;

CREATE POLICY "Users can view their own bookings"
  ON public.bookings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookings"
  ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
  ON public.bookings FOR UPDATE USING (auth.uid() = user_id);

-- ── Vérification ─────────────────────────────────────────────────
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'bookings'
ORDER BY ordinal_position;
