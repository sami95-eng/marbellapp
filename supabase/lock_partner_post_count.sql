-- =================================================================
-- Verrouille profiles.partner_post_count (et role) côté base :
-- un utilisateur peut modifier SON profil, mais PAS son compteur VIP
-- ni son rôle. Seul service_role (Edge Functions / admin) le peut.
--
-- Principe : les privilèges au niveau COLONNE. On retire l'UPDATE global
-- à `authenticated`, puis on ne ré-accorde l'UPDATE que sur les colonnes
-- réellement éditables par l'utilisateur. La RLS continue de restreindre
-- QUELLES lignes (auth.uid() = id) ; les GRANT restreignent QUELLES colonnes.
--
-- Exécuter dans Supabase SQL Editor → New Query → Run
-- =================================================================

-- 1) Retire l'UPDATE "toutes colonnes" hérité du GRANT par défaut
REVOKE UPDATE ON public.profiles FROM authenticated;

-- 2) Ré-accorde l'UPDATE UNIQUEMENT sur les colonnes éditables par l'user
--    (ni partner_post_count, ni role → non modifiables par l'utilisateur)
GRANT UPDATE (display_name, avatar_url, instagram_handle, bio, preferences)
  ON public.profiles TO authenticated;

-- 3) (Optionnel mais recommandé) même logique pour l'INSERT, au cas où
--    l'utilisateur créerait sa propre ligne de profil.
REVOKE INSERT ON public.profiles FROM authenticated;
GRANT INSERT (id, display_name, avatar_url, instagram_handle, bio, preferences)
  ON public.profiles TO authenticated;

-- service_role conserve GRANT ALL (les Edge Functions peuvent toujours
-- écrire partner_post_count) — aucune action nécessaire pour lui.

-- ── Vérification : privilèges colonne accordés à authenticated ──────
SELECT column_name, privilege_type
FROM information_schema.column_privileges
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND grantee = 'authenticated'
ORDER BY privilege_type, column_name;
