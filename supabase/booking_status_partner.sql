-- =================================================================
-- Réservations : workflow de statut + gestion partenaire
-- Exécuter dans Supabase SQL Editor → New Query → Run
-- =================================================================

-- 1) Statut par défaut = 'pending' (en attente) au lieu de 'confirmed'
ALTER TABLE public.bookings
  ALTER COLUMN status SET DEFAULT 'pending';

-- 2) Colonnes nécessaires pour emailer le client depuis le dashboard
--    partenaire (la table ne stockait que user_id, pas l'email/nom).
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS user_name  TEXT;

-- 3) RLS — un compte avec le rôle 'partner' ou 'admin' peut VOIR et
--    METTRE À JOUR les réservations (boutons Confirmer / Refuser).
--    ⚠️ Limite connue : le schéma n'a PAS de mapping partenaire→venue,
--    donc cette policy autorise tout partner/admin à gérer TOUTES les
--    réservations (console mono-venue). Pour du multi-venue, ajouter un
--    owner_id sur venues et restreindre via une jointure venue_id.
DROP POLICY IF EXISTS "Partners view all bookings"   ON public.bookings;
DROP POLICY IF EXISTS "Partners update all bookings"  ON public.bookings;

CREATE POLICY "Partners view all bookings"
  ON public.bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('partner', 'admin')
    )
  );

CREATE POLICY "Partners update all bookings"
  ON public.bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('partner', 'admin')
    )
  );

-- ── Vérification ─────────────────────────────────────────────────
SELECT column_name, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'bookings'
  AND column_name IN ('status', 'user_email', 'user_name')
ORDER BY column_name;
