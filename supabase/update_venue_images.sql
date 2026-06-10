-- =================================================================
-- Fix venue images — une URL unique par venue, zéro doublon
-- Exécuter dans Supabase SQL Editor → New Query → Run
-- =================================================================

-- ── BEACH CLUBS ──────────────────────────────────────────────────
-- Ocean Club : piscine avec cabanas blanches
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'ocean-club';

-- Nikki Beach : beach club pool resort
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'nikki-beach';

-- Playa Padre : transats parasols jaunes sur plage, Cascais (photo vérifiée)
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1526922289011-a875fbd2fb0d?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1526922289011-a875fbd2fb0d?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'playa-padre';

-- Opium Beach : sunbeds drapés blancs beach club premium (photo vérifiée)
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1748509865532-bae58b4bd0ce?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1748509865532-bae58b4bd0ce?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'opium-beach';

-- Amàre Beach Club : terrace beach view
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'amare-beach-club';

-- La Sala by the Sea : terrasse restaurant vue mer Portofino (photo vérifiée)
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1756680967373-c3205a8a8b31?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1756680967373-c3205a8a8b31?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'la-sala-sea';

-- Puente Romano Beach Club : luxury pool terrace
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'puente-romano-beach-club';

-- Don Carlos Beach Club : beach lounge daybed
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1548250531-94d59f8d5e71?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1548250531-94d59f8d5e71?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'don-carlos-beach';

-- Marbella Club Beach : exclusive beach resort
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'marbella-club-beach';

-- Starlite Beach Club : pool beach sunset
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'starlite-beach';

-- Salduna Beach : villa luxe moderne avec piscine, Espagne (photo vérifiée)
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'salduna-beach';

-- Trocadero Arena : beach restaurant chiringuito
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'trocadero-arena';

-- BiBo Beach House : boho beach club
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1610641818989-c2051b5e2cfd?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1610641818989-c2051b5e2cfd?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'bibo-beach-house';

-- ── FINE DINING ───────────────────────────────────────────────────
-- Leña by Dani García : élégant restaurant intérieur
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'lena-marbella';

-- BiBo Marbella : tapas bar brasserie
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'bibo-marbella';

-- La Sala Marbella : restaurant gastronomique
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'la-sala-marbella';

-- Mosh Restaurant : fine dining cuisine
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'mosh-restaurant';

-- Nobu Marbella : sushi japanese cuisine
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'nobu-marbella';

-- Sea Grill by Nobu : seafood grill restaurant
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'sea-grill-nobu';

-- El Puente Restaurant : mediterranean fine dining
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'el-puente-restaurante';

-- La Plaza Puente Romano : bateaux blancs marina de Marbella (photo vérifiée)
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1589642073293-d0d511afb66e?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1589642073293-d0d511afb66e?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'la-plaza-puente-romano';

-- Lobito de Mar : seafood cocktail bar
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'lobito-de-mar';

-- Tragabuches : tapas andalou grill
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'tragabuches-marbella';

-- Skina : michelin 2 étoiles salle intime
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'skina';

-- Messina : michelin creative cuisine
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'messina';

-- Ta-Kumi : japanese mediterranean omakase
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'ta-kumi';

-- El Lago : golf club restaurant lake view
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'el-lago';

-- ── SPA & WELLNESS ────────────────────────────────────────────────
-- Six Senses Spa : salle de soin traitement
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'six-senses-spa-puente-romano';

-- Finca Cortesín Spa : spa bain luxe
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1540555700478-4be290a0d474?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1540555700478-4be290a0d474?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'finca-cortesin-spa';

-- Amàre Spa : spa pool indoor wellness
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'amare-spa-marbella';

-- Marbella Club Spa : spa massage room candles
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'spa-marbella-club';

-- ── NIGHTLIFE ─────────────────────────────────────────────────────
-- Olivia Valere : nightclub interior VIP
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'olivia-valere';

-- Mirage Nightclub : nightclub dance floor lights
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'mirage-nightclub';

-- Pangea Club : club lounge exclusive
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'pangea-club';

-- Aqwa Mist : rooftop bar night
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'aqwa-mist';

-- Suite Marbella : lounge cocktail bar
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'suite-marbella';

-- Opium Mar : rooftop nightclub party
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'opium-mar';

-- ── HOTELS ───────────────────────────────────────────────────────
-- Nobu Hotel Marbella : luxury hotel pool
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1551882547-ff40c599fb00?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1551882547-ff40c599fb00?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'nobu-hotel-marbella';

-- Hotel Puente Romano : côte méditerranéenne Málaga Andalousie (photo vérifiée)
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1653385324919-e413ff41070e?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1653385324919-e413ff41070e?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'hotel-puente-romano';

-- Marbella Club Hotel : luxury hotel terrace sea view
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'marbella-club-hotel';

-- Villa Padierna Palace : palace hotel luxury garden
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1571003123771-bd6a1e0f9e64?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1571003123771-bd6a1e0f9e64?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'villa-padierna';

-- Gran Meliá Don Pepe : hotel suite bedroom luxury
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1519672199912-a02b585df56a?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1519672199912-a02b585df56a?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'gran-melia-don-pepe';

-- Hotel Amàre : boutique hotel pool
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1563911302283-d2bc129e7570?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1563911302283-d2bc129e7570?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'amare-hotel-marbella';

-- Barceló Marbella (Don Carlos) : hotel lobby elegant
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'hotel-don-carlos';

-- ── EVENTS ────────────────────────────────────────────────────────
-- Starlite Festival : outdoor concert amphitheater
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'starlite-festival';

-- Puente Romano Tennis : tennis court pro
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1554068865-4a89bbe24cfc?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1554068865-4a89bbe24cfc?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'puente-romano-tennis';

-- Marbella Yacht Club : marina luxury yacht
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'marbella-yacht-club';

-- Mosh Kids Club : kids activities premium
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'mosh-kids';

-- Casino Marbella : gala event luxury
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1501281668745-b8ceab298bc1?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1501281668745-b8ceab298bc1?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'casino-marbella';

-- ── SHOPPING ──────────────────────────────────────────────────────
-- Puerto Banús Marina : luxury marina yachts boutiques
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1569949381669-ecf0e3ae2b41?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1569949381669-ecf0e3ae2b41?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'puerto-banus';

-- La Cañada : shopping mall interior luxury
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1555529902-5261145633bf?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1555529902-5261145633bf?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'la-canada';

-- Casco Antiguo Boutiques : old town boutique street
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'marbella-old-town';

-- =================================================================
-- VÉRIFICATION — doit retourner 0 doublons
-- =================================================================
SELECT cover_image_url, COUNT(*) as n
FROM public.venues
WHERE is_active = TRUE
GROUP BY cover_image_url
HAVING COUNT(*) > 1
ORDER BY n DESC;
