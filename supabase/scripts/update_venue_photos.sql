-- =================================================================
-- update_venue_photos.sql — remplace les covers Unsplash par de vraies photos
-- =================================================================
-- ⚠️ TEMPLATE — NE PAS exécuter tel quel : tous les UPDATE sont COMMENTÉS.
--
-- Méthode recommandée (fiable) :
--   1) NE PAS hotlinker une image d'un site officiel : beaucoup bloquent le
--      hotlink (header Referer) → l'image ne charge pas dans l'app.
--   2) Préférer : télécharger l'image puis l'uploader dans le bucket Storage
--      `venues` (voir scripts/set-venue-photos.mjs) ; coller ensuite ici l'URL
--      publique Supabase ( https://<ref>.supabase.co/storage/v1/object/public/venues/<slug>.jpg ).
--   3) À défaut, une URL CDN stable et autorisée au hotlink convient aussi.
--
--  ❌ images.google.com / photos.google.com ne donnent PAS d'URL d'image
--     directe hébergeable (pages de recherche / liens liés à un compte).
--
-- Pour activer une ligne : décommente le bloc UPDATE et remplace
-- 'PASTE_DIRECT_IMAGE_URL' par l'URL réelle.
-- =================================================================

-- ─────────────────────────── TOP 20 ───────────────────────────────

-- Nobu Restaurant Marbella  ·  https://www.noburestaurants.com/marbella/
-- UPDATE public.venues SET cover_image_url = 'PASTE_DIRECT_IMAGE_URL' WHERE slug = 'nobu-marbella';

-- Leña by Dani García  ·  https://grupodanigarcia.com/  (Leña Marbella)
-- UPDATE public.venues SET cover_image_url = 'PASTE_DIRECT_IMAGE_URL' WHERE slug = 'lena-marbella';

-- Marbella Club Hotel  ·  https://www.marbellaclub.com/
-- UPDATE public.venues SET cover_image_url = 'PASTE_DIRECT_IMAGE_URL' WHERE slug = 'marbella-club-hotel';

-- Hotel Puente Romano Beach Resort  ·  https://www.puenteromano.com/
-- UPDATE public.venues SET cover_image_url = 'PASTE_DIRECT_IMAGE_URL' WHERE slug = 'hotel-puente-romano';

-- Six Senses Spa at Puente Romano  ·  https://www.puenteromano.com/  (spa)
-- UPDATE public.venues SET cover_image_url = 'PASTE_DIRECT_IMAGE_URL' WHERE slug = 'six-senses-spa-puente-romano';

-- Starlite Auditorium  ·  https://www.starlitemarbella.com/
-- UPDATE public.venues SET cover_image_url = 'PASTE_DIRECT_IMAGE_URL' WHERE slug = 'starlite-festival';

-- Opium Beach Club  ·  https://www.opiummarbella.com/
-- UPDATE public.venues SET cover_image_url = 'PASTE_DIRECT_IMAGE_URL' WHERE slug = 'opium-beach';

-- Pangea Club  ·  (site officiel Pangea Marbella — à confirmer)
-- UPDATE public.venues SET cover_image_url = 'PASTE_DIRECT_IMAGE_URL' WHERE slug = 'pangea-club';

-- Playa Padre  ·  https://www.playapadre.com/
-- UPDATE public.venues SET cover_image_url = 'PASTE_DIRECT_IMAGE_URL' WHERE slug = 'playa-padre';

-- Salduna Beach  ·  https://www.saldunabeach.com/
-- UPDATE public.venues SET cover_image_url = 'PASTE_DIRECT_IMAGE_URL' WHERE slug = 'salduna-beach';

-- Villa Padierna Palace Hotel  ·  https://www.hotelvillapadierna.com/  (Anantara)
-- UPDATE public.venues SET cover_image_url = 'PASTE_DIRECT_IMAGE_URL' WHERE slug = 'villa-padierna';

-- Gran Meliá Don Pepe  ·  https://www.melia.com/  (Gran Meliá Don Pepe)
-- UPDATE public.venues SET cover_image_url = 'PASTE_DIRECT_IMAGE_URL' WHERE slug = 'gran-melia-don-pepe';

-- Marbella Yacht Club  ·  (site officiel — à confirmer)
-- UPDATE public.venues SET cover_image_url = 'PASTE_DIRECT_IMAGE_URL' WHERE slug = 'marbella-yacht-club';

-- El Lago  ·  https://www.restauranteellago.com/
-- UPDATE public.venues SET cover_image_url = 'PASTE_DIRECT_IMAGE_URL' WHERE slug = 'el-lago';

-- Skina  ·  https://www.restauranteskina.com/
-- UPDATE public.venues SET cover_image_url = 'PASTE_DIRECT_IMAGE_URL' WHERE slug = 'skina';

-- Ta-Kumi  ·  https://www.ta-kumi.com/  (Ta-Kumi Marbella)
-- UPDATE public.venues SET cover_image_url = 'PASTE_DIRECT_IMAGE_URL' WHERE slug = 'ta-kumi';

-- La Sala Marbella  ·  https://www.lasalagroup.com/
-- UPDATE public.venues SET cover_image_url = 'PASTE_DIRECT_IMAGE_URL' WHERE slug = 'la-sala-marbella';

-- Lobito de Mar  ·  https://grupodanigarcia.com/  (Lobito de Mar Marbella)
-- UPDATE public.venues SET cover_image_url = 'PASTE_DIRECT_IMAGE_URL' WHERE slug = 'lobito-de-mar';

-- Mirage Nightclub  ·  https://www.mirageclub.com/  (à confirmer)
-- UPDATE public.venues SET cover_image_url = 'PASTE_DIRECT_IMAGE_URL' WHERE slug = 'mirage-nightclub';

-- Casino Marbella  ·  https://www.casinomarbella.com/
-- UPDATE public.venues SET cover_image_url = 'PASTE_DIRECT_IMAGE_URL' WHERE slug = 'casino-marbella';

-- ─────────────────── 34 venues Unsplash restantes ─────────────────
-- amare-beach-club, amare-spa-marbella, aqwa-mist, hotel-don-carlos,
-- bibo-beach-house, bibo-marbella, marbella-old-town (inactive), don-carlos-beach,
-- el-puente-restaurante, finca-cortesin-spa, flyboard-marbella, amare-hotel-marbella,
-- jet-ski-marbella, la-canada (inactive), la-plaza-puente-romano, la-sala-sea,
-- marbella-boat-charter, marbella-club-beach, spa-marbella-club, messina,
-- mosh-kids, mosh-restaurant, nobu-hotel-marbella, olivia-valere (inactive),
-- opium-mar, parasailing-marbella, puente-romano-beach-club, puente-romano-tennis,
-- puerto-banus (inactive), puerto-banus-watersports, sea-grill-nobu,
-- starlite-beach, suite-marbella, tragabuches-marbella
--
-- (Même format : un UPDATE par slug, à remplir.)

-- ── Vérification (combien restent sur Unsplash) ───────────────────
-- SELECT slug, name FROM public.venues
-- WHERE cover_image_url LIKE '%images.unsplash.com%' ORDER BY name;
