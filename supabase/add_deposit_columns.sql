-- =================================================================
-- Marbell'app — Paiement par acompte sur les réservations
-- Ajoute deposit_only (type de paiement) et deposit_amount (montant de
-- l'acompte, en euros) à la table bookings.
-- Script idempotent : rejouable sans erreur.
-- Instructions : Supabase Dashboard → SQL Editor → New Query → RUN
-- =================================================================

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS deposit_only   BOOLEAN       NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(10,2);

-- ── Vérification ─────────────────────────────────────────────────
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'bookings'
  AND column_name IN ('deposit_only', 'deposit_amount')
ORDER BY column_name;
