-- =================================================================
-- Marbell'app — Idempotence du webhook Stripe (étape 1)
-- payment_notified_at : horodatage du moment où l'email "paiement reçu"
-- (étape 1) a été envoyé. Le webhook ne notifie que si la colonne est NULL,
-- puis la renseigne — évite les doublons en cas de retry Stripe.
-- Script idempotent : rejouable sans erreur.
-- Instructions : Supabase Dashboard → SQL Editor → New Query → RUN
-- =================================================================

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_notified_at TIMESTAMPTZ;

-- ── Vérification ─────────────────────────────────────────────────
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'bookings'
  AND column_name = 'payment_notified_at';
