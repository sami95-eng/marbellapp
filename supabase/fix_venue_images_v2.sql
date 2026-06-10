-- =================================================================
-- Fix venue images v2 — photos officielles vérifiées visuellement
-- Sources : puenteromano.com · nikkibeach.com · marbellaclub.com
--           Unsplash (photo-id vérifiées avec WebFetch + lecture JPEG)
-- Exécuter dans Supabase SQL Editor → New Query → Run
-- =================================================================

-- ═══════════════════════════════════════════════════════════════════
-- GRUPO PUENTE ROMANO — Photos officielles puenteromano.com
-- (toutes vérifiées visuellement, fichiers JPEG lus)
-- ═══════════════════════════════════════════════════════════════════

-- Vue aérienne drone Marbella 2026 : La Concha + Golden Mile + Méditerranée
UPDATE public.venues SET
  cover_image_url = 'https://www.puenteromano.com/media/vommsxve/puente-romano-marbella-aerial-2026.jpg',
  images = ARRAY['https://www.puenteromano.com/media/vommsxve/puente-romano-marbella-aerial-2026.jpg']
WHERE slug = 'hotel-puente-romano';

-- Villa andalouse avec piscine privée, jardin et architecture blanche
UPDATE public.venues SET
  cover_image_url = 'https://www.puenteromano.com/media/g2ane1aa/pr_villa_pereza_i.jpg',
  images = ARRAY['https://www.puenteromano.com/media/g2ane1aa/pr_villa_pereza_i.jpg']
WHERE slug = 'nobu-hotel-marbella';

-- Salle Nobu avec érable japonais rouge suspendu, ambiance dorée
UPDATE public.venues SET
  cover_image_url = 'https://www.puenteromano.com/media/guplapjr/hero2puenteromano_nobu_restaurant_1.jpg',
  images = ARRAY['https://www.puenteromano.com/media/guplapjr/hero2puenteromano_nobu_restaurant_1.jpg']
WHERE slug = 'nobu-marbella';

-- Comptoir de mariscos frais (langoustines, huîtres, poissons) + chef en blanc
UPDATE public.venues SET
  cover_image_url = 'https://www.puenteromano.com/media/zapl1nyj/listing-sea-grill.jpg',
  images = ARRAY['https://www.puenteromano.com/media/zapl1nyj/listing-sea-grill.jpg']
WHERE slug = 'sea-grill-nobu';

-- La Plaza de nuit : vue aérienne du resort bondé, lumières chaudes, grand arbre
UPDATE public.venues SET
  cover_image_url = 'https://www.puenteromano.com/media/rgsjz2ej/laplaza.jpg',
  images = ARRAY['https://www.puenteromano.com/media/rgsjz2ej/laplaza.jpg']
WHERE slug = 'la-plaza-puente-romano';

-- Court en terre battue : femme + petite fille au filet, environnement verdoyant
UPDATE public.venues SET
  cover_image_url = 'https://www.puenteromano.com/media/aykdurpq/resized_0d5a4328-wheeler.jpg',
  images = ARRAY['https://www.puenteromano.com/media/aykdurpq/resized_0d5a4328-wheeler.jpg']
WHERE slug = 'puente-romano-tennis';

-- Leña : salle design (plafond bois ondulé, banquettes caramel, murs lit de braises)
UPDATE public.venues SET
  cover_image_url = 'https://www.puenteromano.com/media/msrbu1jy/len-a_-lolo-mestanza_11-3840.jpg',
  images = ARRAY['https://www.puenteromano.com/media/msrbu1jy/len-a_-lolo-mestanza_11-3840.jpg']
WHERE slug = 'lena-marbella';

-- Beach Club : vue aérienne piscine côtière avec océan — Espagne, drone DJI jan 2026
-- Unsplash photo-1768854700546-acedff5393ac — vérifiée : aerial coastal resort pool + ocean
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1768854700546-acedff5393ac?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1768854700546-acedff5393ac?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'puente-romano-beach-club';

-- ═══════════════════════════════════════════════════════════════════
-- NIKKI BEACH — Photo officielle nikkibeach.com (vérifiée ✓)
-- Vue aérienne piscine avec transats blancs + plage Marbella en fond
-- ═══════════════════════════════════════════════════════════════════

UPDATE public.venues SET
  cover_image_url = 'https://i0.wp.com/nikkibeach.com/marbella/wp-content/uploads/sites/6/2024/10/Hero_Marbella.jpg',
  images = ARRAY['https://i0.wp.com/nikkibeach.com/marbella/wp-content/uploads/sites/6/2024/10/Hero_Marbella.jpg']
WHERE slug = 'nikki-beach';

-- ═══════════════════════════════════════════════════════════════════
-- MARBELLA CLUB — Photos officielles image-tc.galaxy.tf (vérifiées ✓)
-- ═══════════════════════════════════════════════════════════════════

-- Plage avec palmiers tropicaux + ponton en bois sur la Méditerranée
UPDATE public.venues SET
  cover_image_url = 'https://image-tc.galaxy.tf/wijpeg-ahnie6m7a1dm2w86yx0isc17c/beach-club-21.jpg',
  images = ARRAY['https://image-tc.galaxy.tf/wijpeg-ahnie6m7a1dm2w86yx0isc17c/beach-club-21.jpg']
WHERE slug = 'marbella-club-beach';

-- Suite junior avec terrasse, style andalou élégant
UPDATE public.venues SET
  cover_image_url = 'https://image-tc.galaxy.tf/wijpeg-5q0ahhy3wh7zhxw00e4rtbzyn/mch-marzo-20-9446-a2-opt.jpg',
  images = ARRAY['https://image-tc.galaxy.tf/wijpeg-5q0ahhy3wh7zhxw00e4rtbzyn/mch-marzo-20-9446-a2-opt.jpg']
WHERE slug = 'marbella-club-hotel';

-- Studio yoga & méditation du Marbella Club Spa (officiel)
UPDATE public.venues SET
  cover_image_url = 'https://image-tc.galaxy.tf/wijpeg-11jvjslbmk4evd8nclklh7z5t/mch-oct-19-2959-a2-low-well.jpg',
  images = ARRAY['https://image-tc.galaxy.tf/wijpeg-11jvjslbmk4evd8nclklh7z5t/mch-oct-19-2959-a2-low-well.jpg']
WHERE slug = 'spa-marbella-club';

-- ═══════════════════════════════════════════════════════════════════
-- VILLA PADIERNA — Unsplash vérifiée (photo-1757439402101-55d1da381e70)
-- Piscine de resort avec montagnes en arrière-plan, style méditerranéen
-- Dominik @pajorstudio, Canon EOS 90D, sept 2025
-- ═══════════════════════════════════════════════════════════════════

UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1757439402101-55d1da381e70?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1757439402101-55d1da381e70?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'villa-padierna';

-- =================================================================
-- VÉRIFICATION — doit retourner 0 lignes (zéro doublons)
-- =================================================================
SELECT cover_image_url, COUNT(*) AS n, STRING_AGG(name, ', ') AS venues
FROM public.venues
WHERE is_active = TRUE
GROUP BY cover_image_url
HAVING COUNT(*) > 1
ORDER BY n DESC;
