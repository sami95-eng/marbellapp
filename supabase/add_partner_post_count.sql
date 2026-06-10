-- =================================================================
-- VIP : compteur de posts Instagram chez les partenaires
-- Détermine le tier (Bronze 0-4 · Silver 5-14 · Gold 15-29 · Platinum 30+)
-- Exécuter dans Supabase SQL Editor → New Query → Run
-- =================================================================

-- 1) Colonne sur profiles (défaut 0)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS partner_post_count integer NOT NULL DEFAULT 0;

-- 2) (Optionnel) attribuer un nombre de posts à un compte pour tester
-- UPDATE public.profiles
-- SET partner_post_count = 18
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'samidumont95@gmail.com');

-- 3) Vérification
SELECT id, display_name, partner_post_count
FROM public.profiles
ORDER BY partner_post_count DESC
LIMIT 20;
