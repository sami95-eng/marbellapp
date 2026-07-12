-- =================================================================
-- Stripe Connect - colonnes de TEST isolees (phase de validation)
-- Executer dans Supabase SQL Editor -> New Query -> Run
--
-- Objectif : valider le happy path Connect en mode TEST (cle sk_test_) SANS
-- jamais toucher au flow de paiement client live. Ces colonnes *_test sont
-- ecrites/lues UNIQUEMENT par les Edge Functions create-connect-account et
-- check-connect-status pendant la phase de test (via STRIPE_SECRET_KEY_TEST).
--
-- create-checkout-session (paiements clients live) continue de lire les
-- colonnes live stripe_account_id / stripe_charges_enabled - jamais celles-ci.
--
-- Scaffolding JETABLE : voir le bloc REVERT en bas une fois la validation faite.
-- =================================================================

ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS stripe_account_id_test TEXT,
  ADD COLUMN IF NOT EXISTS stripe_charges_enabled_test BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_details_submitted_test BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS venues_stripe_account_id_test_idx
  ON public.venues (stripe_account_id_test);

-- Verification
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'venues'
  AND column_name IN ('stripe_account_id_test', 'stripe_charges_enabled_test', 'stripe_details_submitted_test')
ORDER BY column_name;

-- REVERT (a jouer une fois le happy path valide, retour propre en live)
-- DROP INDEX IF EXISTS public.venues_stripe_account_id_test_idx;
-- ALTER TABLE public.venues
--   DROP COLUMN IF EXISTS stripe_account_id_test,
--   DROP COLUMN IF EXISTS stripe_charges_enabled_test,
--   DROP COLUMN IF EXISTS stripe_details_submitted_test;
