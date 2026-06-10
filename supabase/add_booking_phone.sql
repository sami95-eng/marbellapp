-- =================================================================
-- Ajoute la colonne phone_number à la table bookings
-- (numéro de téléphone obligatoire saisi par le client à la réservation)
-- Exécuter dans Supabase SQL Editor → New Query → Run
--
-- Note : colonne nullable pour ne pas casser les réservations existantes.
-- L'app rend le champ OBLIGATOIRE côté client (booking.tsx) — toute nouvelle
-- réservation arrivera donc toujours avec un numéro renseigné.
-- =================================================================

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- ── Vérification ─────────────────────────────────────────────────
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bookings'
  AND column_name = 'phone_number';
