-- =================================================================
-- Stripe Connect - colonne payouts (LIVE)
-- Executer dans Supabase SQL Editor -> New Query -> Run
--
-- Ajoute stripe_payouts_enabled a venues. Cette colonne LIVE est mise a jour
-- automatiquement par le webhook stripe-webhook sur l'evenement account.updated
-- (en plus de stripe_charges_enabled / stripe_details_submitted deja existantes).
-- payout-ready n'est pas equivalent a charges-enabled : un compte peut encaisser
-- sans pouvoir encore recevoir de virements, d'ou le suivi separe.
-- =================================================================

ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN NOT NULL DEFAULT FALSE;

-- Verification
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'venues'
  AND column_name = 'stripe_payouts_enabled';
