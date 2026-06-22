-- =================================================================
-- Mise à jour : « Olivia Valère » (ancien espace) → « Bonbonniere Marbella »
-- Le club international (Mykonos / Tulum) rouvre l'ancien espace Olivia Valère.
-- À exécuter dans Supabase SQL Editor → New Query → Run.
--
-- ⚠️ Exécuter CE fichier UNIQUEMENT (pas rename_olivia_to_bombonniere.sql,
--    désormais obsolète : il renommait vers 'la-bombonniere').
-- =================================================================

UPDATE public.venues
SET name             = 'Bonbonniere Marbella',
    slug             = 'bonbonniere-marbella',
    description      = 'Luxury nightclub on the Golden Mile. The international nightlife phenomenon from Mykonos and Tulum lands in Marbella in the legendary former Olivia Valere space. Brutalist-Oriental design, world-class DJs.',
    instagram_handle = 'bonbonniere.marbella',   -- à vérifier
    is_active        = TRUE,                      -- le club est ouvert
    category         = 'Nightlife'                -- capitalisé : convention de la colonne venues.category (un 'nightlife' minuscule casse les icônes/filtres)
WHERE slug = 'olivia-valere';

-- Garde les réservations existantes rattachées au nouveau slug
UPDATE public.bookings
SET venue_slug = 'bonbonniere-marbella'
WHERE venue_slug = 'olivia-valere';

-- Vérification
SELECT slug, name, category, is_active, instagram_handle
FROM public.venues
WHERE slug IN ('bonbonniere-marbella', 'olivia-valere');
