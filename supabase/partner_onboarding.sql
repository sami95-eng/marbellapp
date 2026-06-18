-- =================================================================
-- Onboarding partenaire : propriété des venues (owner_id) + RLS scopées
-- + table des candidatures (partner_applications).
-- Exécuter dans Supabase SQL Editor → New Query → Run
-- =================================================================

-- ──────────────────────────────────────────────────────────────────
-- 1) Propriété d'une venue par un compte partenaire
-- ──────────────────────────────────────────────────────────────────
ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS venues_owner_id_idx ON public.venues(owner_id);

-- ──────────────────────────────────────────────────────────────────
-- 2) VENUES — RLS scopées sur owner_id
-- ──────────────────────────────────────────────────────────────────
-- Le partenaire ne met à jour QUE ses propres venues (remplace l'ancienne
-- policy "Partners update venues" basée sur le rôle, qui autorisait tout).
DROP POLICY IF EXISTS "Partners update venues" ON public.venues;
CREATE POLICY "Partners update venues"
  ON public.venues FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Le partenaire voit ses propres venues (même inactives), EN PLUS des venues
-- publiques actives (policy "Active venues are publicly readable" conservée).
DROP POLICY IF EXISTS "Owners can view their venues" ON public.venues;
CREATE POLICY "Owners can view their venues"
  ON public.venues FOR SELECT
  USING (owner_id = auth.uid());
-- (Les admins gardent l'accès complet via "Admins can manage venues".)

-- ──────────────────────────────────────────────────────────────────
-- 3) AVAILABILITY_SLOTS — gérables par le propriétaire de la venue
-- ──────────────────────────────────────────────────────────────────
-- Remplace "Partners manage slots" (basée sur le rôle → tout partner).
DROP POLICY IF EXISTS "Partners manage slots" ON public.availability_slots;
CREATE POLICY "Owners manage their slots"
  ON public.availability_slots FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.venues v
            WHERE v.id = availability_slots.venue_id AND v.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.venues v
            WHERE v.id = availability_slots.venue_id AND v.owner_id = auth.uid())
  );
-- Les admins conservent la gestion de tous les créneaux.
DROP POLICY IF EXISTS "Admins manage slots" ON public.availability_slots;
CREATE POLICY "Admins manage slots"
  ON public.availability_slots FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ──────────────────────────────────────────────────────────────────
-- 4) BOOKINGS — le partenaire ne voit/gère que celles de SA venue
-- ──────────────────────────────────────────────────────────────────
-- Remplace "Partners view/update all bookings" (rôle → toutes les résas).
DROP POLICY IF EXISTS "Partners view all bookings"  ON public.bookings;
DROP POLICY IF EXISTS "Partners update all bookings" ON public.bookings;

CREATE POLICY "Owners view their venue bookings"
  ON public.bookings FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.venues v
            WHERE v.id = bookings.venue_id AND v.owner_id = auth.uid())
  );
CREATE POLICY "Owners update their venue bookings"
  ON public.bookings FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.venues v
            WHERE v.id = bookings.venue_id AND v.owner_id = auth.uid())
  );

-- Les admins gardent la vue/gestion globale (dashboard admin).
DROP POLICY IF EXISTS "Admins view all bookings"   ON public.bookings;
DROP POLICY IF EXISTS "Admins update all bookings"  ON public.bookings;
CREATE POLICY "Admins view all bookings"
  ON public.bookings FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins update all bookings"
  ON public.bookings FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ──────────────────────────────────────────────────────────────────
-- 5) VIP_OFFERS — gérables par le propriétaire de la venue
-- ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Owners manage their offers" ON public.vip_offers;
CREATE POLICY "Owners manage their offers"
  ON public.vip_offers FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.venues v
            WHERE v.id = vip_offers.venue_id AND v.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.venues v
            WHERE v.id = vip_offers.venue_id AND v.owner_id = auth.uid())
  );

-- ──────────────────────────────────────────────────────────────────
-- 6) VENUE_TABLES — gérables par le propriétaire (requis pour l'onglet Tables)
-- ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Owners manage their venue tables" ON public.venue_tables;
CREATE POLICY "Owners manage their venue tables"
  ON public.venue_tables FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.venues v
            WHERE v.id = venue_tables.venue_id AND v.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.venues v
            WHERE v.id = venue_tables.venue_id AND v.owner_id = auth.uid())
  );

-- ──────────────────────────────────────────────────────────────────
-- 7) PARTNER_APPLICATIONS — candidatures du formulaire join-partner
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.partner_applications (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_name   TEXT        NOT NULL,
  venue_type   TEXT,
  instagram    TEXT,
  contact_name TEXT,
  email        TEXT        NOT NULL,
  phone        TEXT,
  offers       TEXT,
  status       TEXT        NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'contacted', 'approved', 'rejected')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

-- N'importe qui (y compris non connecté) peut soumettre une candidature.
DROP POLICY IF EXISTS "Anyone can submit an application" ON public.partner_applications;
CREATE POLICY "Anyone can submit an application"
  ON public.partner_applications FOR INSERT
  WITH CHECK (TRUE);

-- Seuls les admins lisent / gèrent les candidatures.
DROP POLICY IF EXISTS "Admins manage applications" ON public.partner_applications;
CREATE POLICY "Admins manage applications"
  ON public.partner_applications FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── Vérification ─────────────────────────────────────────────────
SELECT 'venues.owner_id' AS check, column_name
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'venues' AND column_name = 'owner_id';

SELECT 'partner_applications' AS check, count(*) AS rows FROM public.partner_applications;
