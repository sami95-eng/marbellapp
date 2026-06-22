-- =================================================================
-- Renommage : « Olivia Valère » → « La Bombonnière »
-- venues.slug 'olivia-valere' → 'la-bombonniere' (+ name, group_name).
-- À exécuter dans Supabase SQL Editor → New Query → Run.
--
-- NOTE : description / adresse / instagram_handle de l'ancien lieu sont
-- CONSERVÉS. Si « La Bombonnière » est un lieu réellement distinct, mets
-- à jour ces champs avec ses vraies données.
-- =================================================================

-- 1) Renomme le lieu (le slug est l'identifiant — voir étape 2 pour les FKs)
UPDATE public.venues
SET slug       = 'la-bombonniere',
    name       = 'La Bombonnière',
    group_name = 'La Bombonnière'
WHERE slug = 'olivia-valere';

-- 2) Garde les réservations existantes rattachées au nouveau slug
UPDATE public.bookings
SET venue_slug = 'la-bombonniere'
WHERE venue_slug = 'olivia-valere';

-- 3) (Optionnel) le lieu était soft-deleted (is_active = false).
--    Décommenter pour le rendre visible sous son nouveau nom :
-- UPDATE public.venues SET is_active = TRUE WHERE slug = 'la-bombonniere';

-- 4) Vérification
SELECT slug, name, group_name, is_active
FROM public.venues
WHERE slug IN ('la-bombonniere', 'olivia-valere');
