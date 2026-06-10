-- =================================================================
-- Mise à jour table profiles — Coller dans Supabase SQL Editor → RUN
-- =================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio          TEXT,
  ADD COLUMN IF NOT EXISTS preferences  TEXT[]   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS login_method VARCHAR(64) DEFAULT 'email';

-- Permettre à l'utilisateur de mettre à jour son propre profil (INSERT aussi pour upsert)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can upsert their own profile" ON public.profiles;

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Vérification
SELECT column_name, data_type
FROM   information_schema.columns
WHERE  table_schema = 'public' AND table_name = 'profiles'
ORDER  BY ordinal_position;
