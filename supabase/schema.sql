-- =================================================================
-- Marbell'app — Supabase Schema
-- Exécuter dans : Supabase Dashboard → SQL Editor → New Query
-- =================================================================

-- ──────────────────────────────────────────────────────────────────
-- PROFILES (extends auth.users 1:1)
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID        REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name    TEXT,
  avatar_url      TEXT,
  login_method    VARCHAR(64) DEFAULT 'email',
  instagram_handle VARCHAR(128),
  role            VARCHAR(32) DEFAULT 'user' NOT NULL
                    CHECK (role IN ('user', 'partner', 'admin')),
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Auto-create profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, login_method)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(NEW.raw_user_meta_data->>'login_method', 'email')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ──────────────────────────────────────────────────────────────────
-- VENUES
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.venues (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name             TEXT        NOT NULL,
  category         VARCHAR(64) NOT NULL,
  description      TEXT,
  address          TEXT,
  lat              DOUBLE PRECISION,
  lng              DOUBLE PRECISION,
  instagram_handle VARCHAR(128),
  cover_image_url  TEXT,
  rating           NUMERIC(3,1) DEFAULT 0,
  is_partner       BOOLEAN     DEFAULT FALSE,
  is_active        BOOLEAN     DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ──────────────────────────────────────────────────────────────────
-- VIP OFFERS
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vip_offers (
  id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id            UUID        REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  title               TEXT        NOT NULL,
  type                VARCHAR(32) NOT NULL
                        CHECK (type IN ('table', 'bed', 'bottle', 'discount', 'experience')),
  description         TEXT,
  original_price      NUMERIC(10,2),
  vip_price           NUMERIC(10,2),
  capacity            INTEGER     DEFAULT 2,
  spots_total         INTEGER     DEFAULT 10,
  spots_remaining     INTEGER     DEFAULT 10,
  available_date      DATE,
  available_time      VARCHAR(10),
  instagram_required  BOOLEAN     DEFAULT TRUE,
  instagram_handle    VARCHAR(128),
  is_active           BOOLEAN     DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ──────────────────────────────────────────────────────────────────
-- BOOKINGS
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bookings (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  venue_id          UUID        REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  offer_id          UUID        REFERENCES public.vip_offers(id) ON DELETE SET NULL,
  date              DATE        NOT NULL,
  guests            INTEGER     DEFAULT 2,
  status            VARCHAR(32) DEFAULT 'pending'
                      CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  total_price       NUMERIC(10,2),
  instagram_posted  BOOLEAN     DEFAULT FALSE,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ──────────────────────────────────────────────────────────────────
-- REVIEWS
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id         UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID    REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  venue_id   UUID    REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, venue_id)
);

-- ──────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ──────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_offers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews     ENABLE ROW LEVEL SECURITY;

-- profiles
DROP POLICY IF EXISTS "Profiles are readable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Profiles are readable by everyone"
  ON public.profiles FOR SELECT USING (TRUE);
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- venues
DROP POLICY IF EXISTS "Active venues are publicly readable" ON public.venues;
DROP POLICY IF EXISTS "Admins can manage venues" ON public.venues;
CREATE POLICY "Active venues are publicly readable"
  ON public.venues FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins can manage venues"
  ON public.venues FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- vip_offers
DROP POLICY IF EXISTS "Active VIP offers are publicly readable" ON public.vip_offers;
DROP POLICY IF EXISTS "Admins can manage VIP offers" ON public.vip_offers;
CREATE POLICY "Active VIP offers are publicly readable"
  ON public.vip_offers FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins can manage VIP offers"
  ON public.vip_offers FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- bookings
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
CREATE POLICY "Users can view their own bookings"
  ON public.bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create bookings"
  ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own bookings"
  ON public.bookings FOR UPDATE USING (auth.uid() = user_id);

-- reviews
DROP POLICY IF EXISTS "Reviews are publicly readable" ON public.reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Reviews are publicly readable"
  ON public.reviews FOR SELECT USING (TRUE);
CREATE POLICY "Users can create reviews"
  ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews"
  ON public.reviews FOR UPDATE USING (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────────
-- STORAGE BUCKET pour les photos de venues
-- ──────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('venue-photos', 'venue-photos', TRUE)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Venue photos are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
CREATE POLICY "Venue photos are publicly readable"
  ON storage.objects FOR SELECT USING (bucket_id = 'venue-photos');
CREATE POLICY "Authenticated users can upload photos"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'venue-photos' AND auth.uid() IS NOT NULL
  );
