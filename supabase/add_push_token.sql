-- =================================================================
-- Push notifications : token Expo par utilisateur.
-- Ajoute profiles.push_token + policy UPDATE (l'utilisateur gère le sien).
-- Exécuter dans Supabase SQL Editor → New Query → Run
-- =================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS push_token TEXT;

-- L'utilisateur peut mettre à jour sa propre ligne (donc son push_token).
-- Recréée à l'identique de schema.sql, en ajoutant WITH CHECK pour empêcher
-- de réassigner la ligne à un autre id.
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── Vérification ─────────────────────────────────────────────────
SELECT column_name, data_type
FROM   information_schema.columns
WHERE  table_schema = 'public' AND table_name = 'profiles' AND column_name = 'push_token';
