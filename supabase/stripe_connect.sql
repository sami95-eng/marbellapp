-- =================================================================
-- Stripe Connect — colonnes de compte connecté sur les venues
-- Exécuter dans Supabase SQL Editor → New Query → Run
--
-- Prérequis : partner_onboarding.sql (venues.owner_id).
-- Ces colonnes sont écrites par les Edge Functions create-connect-account
-- et check-connect-status (via la clé service_role), et lues par
-- create-checkout-session pour décider du reversement + commission.
-- =================================================================

ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS stripe_account_id        TEXT,
  ADD COLUMN IF NOT EXISTS stripe_charges_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_details_submitted BOOLEAN NOT NULL DEFAULT FALSE;

-- Un compte connecté est partagé par toutes les venues d'un même partenaire ;
-- l'index aide les lookups par compte (webhooks Connect futurs).
CREATE INDEX IF NOT EXISTS venues_stripe_account_id_idx
  ON public.venues (stripe_account_id);

-- ── Vérification ─────────────────────────────────────────────────
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'venues'
  AND column_name IN ('stripe_account_id', 'stripe_charges_enabled', 'stripe_details_submitted')
ORDER BY column_name;
