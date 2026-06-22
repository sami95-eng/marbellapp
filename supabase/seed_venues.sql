-- =================================================================
-- Marbell'app — Venues Seed Data
-- Tous les établissements majeurs de Marbella & Puerto Banús
-- =================================================================
-- Instructions :
--   1. Ouvrir Supabase Dashboard → SQL Editor → New Query
--   2. Coller ce fichier en entier
--   3. Cliquer sur RUN
-- =================================================================

-- ──────────────────────────────────────────────────────────────────
-- ÉTAPE 1 : Ajouter les colonnes manquantes
-- ──────────────────────────────────────────────────────────────────
ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS slug            VARCHAR(128) UNIQUE,
  ADD COLUMN IF NOT EXISTS group_name      TEXT,
  ADD COLUMN IF NOT EXISTS phone           TEXT,
  ADD COLUMN IF NOT EXISTS website         TEXT,
  ADD COLUMN IF NOT EXISTS opening_hours   TEXT,
  ADD COLUMN IF NOT EXISTS price_range     VARCHAR(10),
  ADD COLUMN IF NOT EXISTS avg_price_eur   INTEGER,
  ADD COLUMN IF NOT EXISTS images          TEXT[] DEFAULT '{}';

-- ──────────────────────────────────────────────────────────────────
-- ÉTAPE 2 : Supprimer les anciennes données de test (optionnel)
-- ──────────────────────────────────────────────────────────────────
-- TRUNCATE public.venues CASCADE;  -- décommenter si vous voulez repartir à zéro

-- ──────────────────────────────────────────────────────────────────
-- ÉTAPE 3 : Insertion — organisée par groupe
-- ──────────────────────────────────────────────────────────────────

-- =================================================================
-- GRUPO MOSH  (La Sala, Mosh Restaurant, etc.)
-- =================================================================
INSERT INTO public.venues (slug, name, group_name, category, description, address, phone, website, opening_hours, lat, lng, instagram_handle, cover_image_url, images, rating, price_range, avg_price_eur, is_partner, is_active)
VALUES

('la-sala-sea', 'La Sala by the Sea', 'Grupo Mosh',
 'Beach Club',
 'El beach club número 1 de Marbella. Cocina thai-inspired, pool parties épicas y un ambiente tropical que combina playa, piscina y restaurante de alto nivel.',
 'Playa de la Fontanilla s/n, Puerto Banús, Marbella', '+34 952 81 41 45',
 'https://www.lasalagroup.com', '12:00 – 02:00 (abr–oct)',
 36.4882, -4.9570,
 '@lasalabytheseamarbella',
 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=800&q=80',
 ARRAY[
   'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=800&q=80',
   'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'
 ],
 4.7, '€€€', 60, TRUE, TRUE),

('la-sala-marbella', 'La Sala Marbella', 'Grupo Mosh',
 'Fine Dining',
 'Referencia gastronómica en Marbella desde 1993. Cocina mediterránea de autor, ambiente sofisticado y noches de música en vivo en el corazón de la ciudad.',
 'Bulevar Príncipe Alfonso von Hohenlohe s/n, Marbella', '+34 952 90 61 61',
 'https://www.lasalagroup.com', '13:00 – 01:00',
 36.5098, -4.8795,
 '@lasalamarbella',
 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
 ARRAY[
   'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
   'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80'
 ],
 4.6, '€€€', 65, TRUE, TRUE),

('mosh-restaurant', 'Mosh Restaurant', 'Grupo Mosh',
 'Fine Dining',
 'El flagship del Grupo Mosh. Gastronomía de vanguardia con producto local premium, sala de diseño y una bodega con más de 400 referencias. Vista al mar desde la Golden Mile.',
 'Urb. Hacienda Las Chapas, CN340 km 196, Marbella', '+34 952 83 83 32',
 'https://www.moshrestaurant.es', '13:30 – 16:00, 20:30 – 23:30',
 36.5078, -4.8450,
 '@moshrestaurant',
 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
 ARRAY[
   'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
   'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80'
 ],
 4.7, '€€€€', 95, TRUE, TRUE),

('mosh-kids', 'Mosh Kids Club', 'Grupo Mosh',
 'Events',
 'El primer club de actividades premium para niños de Marbella. Talleres creativos, shows de animación y experiencias educativas de lujo para los más pequeños.',
 'Avda. Las Brisas s/n, Nueva Andalucía, Marbella', '+34 952 81 78 00',
 'https://www.lasalagroup.com/moshkids', '10:00 – 20:00',
 36.4990, -4.9415,
 '@moshkidsmarbella',
 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80'],
 4.5, '€€', 45, FALSE, TRUE)

ON CONFLICT (slug) DO UPDATE SET
  name         = EXCLUDED.name,
  description  = EXCLUDED.description,
  phone        = EXCLUDED.phone,
  rating       = EXCLUDED.rating;

-- =================================================================
-- GRUPO PUENTE ROMANO (Nobu, Sea Grill, Six Senses, etc.)
-- =================================================================
INSERT INTO public.venues (slug, name, group_name, category, description, address, phone, website, opening_hours, lat, lng, instagram_handle, cover_image_url, images, rating, price_range, avg_price_eur, is_partner, is_active)
VALUES

('nobu-marbella', 'Nobu Restaurant Marbella', 'Grupo Puente Romano / Nobu Hospitality',
 'Fine Dining',
 'El icónico restaurante japonés-peruano de Nobu Matsuhisa en el corazón de Puente Romano. Fusión única de sabores, sushi de autor y una experiencia culinaria inolvidable bajo las estrellas.',
 'Hotel Puente Romano, Bulevar Príncipe Alfonso von Hohenlohe 4, Marbella', '+34 952 77 91 52',
 'https://www.puenteromano.com/es/restaurantes/nobu', '13:00 – 15:30, 19:30 – 23:30',
 36.5115, -4.9012,
 '@noburestaurantmarbella',
 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
 ARRAY[
   'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
   'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80'
 ],
 4.8, '€€€€', 120, TRUE, TRUE),

('sea-grill-nobu', 'Sea Grill by Nobu', 'Grupo Puente Romano / Nobu Hospitality',
 'Fine Dining',
 'El restaurante de playa de Nobu en Puente Romano. Pescados y mariscos a la brasa, cocktails tropicales y pies en la arena con vistas al Mediterráneo.',
 'Hotel Puente Romano Beach, Bulevar Príncipe Alfonso von Hohenlohe 4, Marbella', '+34 952 82 09 00',
 'https://www.puenteromano.com/es/restaurantes/sea-grill', '13:00 – 17:00, 19:30 – 23:00',
 36.5112, -4.9015,
 '@seagrillnobu',
 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
 ARRAY[
   'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
   'https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=800&q=80'
 ],
 4.7, '€€€€', 100, TRUE, TRUE),

('el-puente-restaurante', 'El Puente Restaurant', 'Grupo Puente Romano',
 'Fine Dining',
 'Restaurante mediterráneo clásico en el complejo Puente Romano. Cocina española de temporada, terraza junto al río y el ambiente elegante que caracteriza al resort más icónico de Marbella.',
 'Hotel Puente Romano, Bulevar Príncipe Alfonso von Hohenlohe 4, Marbella', '+34 952 82 09 00',
 'https://www.puenteromano.com/es/restaurantes/el-puente', '13:00 – 23:30',
 36.5113, -4.9010,
 '@hotelpuenteromano',
 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80'],
 4.6, '€€€€', 90, TRUE, TRUE),

('la-plaza-puente-romano', 'La Plaza Puente Romano', 'Grupo Puente Romano',
 'Fine Dining',
 'El corazón gastronómico del resort. Varios conceptos culinarios bajo las estrellas: tapas, sushi, pizzas artesanas y una terraza animada que es el punto de encuentro de la jet set marbellí.',
 'Hotel Puente Romano, Bulevar Príncipe Alfonso von Hohenlohe 4, Marbella', '+34 952 82 09 00',
 'https://www.puenteromano.com', '12:00 – 02:00',
 36.5114, -4.9011,
 '@hotelpuenteromano',
 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'],
 4.6, '€€€', 75, TRUE, TRUE),

('puente-romano-tennis', 'Puente Romano Tennis Club', 'Grupo Puente Romano',
 'Events',
 'Club de tenis referente mundial. 10 pistas de alta calidad, academia profesional y sede del histórico Abierto de Marbella. Ha acogido a leyendas como McEnroe, Becker y Courier.',
 'Hotel Puente Romano, Bulevar Príncipe Alfonso von Hohenlohe 4, Marbella', '+34 952 82 09 00',
 'https://www.puenteromano.com/es/tenis', '08:00 – 22:00',
 36.5116, -4.9009,
 '@puenteromanotennisclub',
 'https://images.unsplash.com/photo-1554068865-4a89bbe24cfc?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1554068865-4a89bbe24cfc?auto=format&fit=crop&w=800&q=80'],
 4.8, '€€€', 60, FALSE, TRUE),

('puente-romano-beach-club', 'Puente Romano Beach Club', 'Grupo Puente Romano',
 'Beach Club',
 'El beach club privado del resort más exclusivo de la Golden Mile. Acceso a tres piscinas, servicio de playa de lujo y hammam. Reservado a huéspedes y miembros.',
 'Hotel Puente Romano, Bulevar Príncipe Alfonso von Hohenlohe 4, Marbella', '+34 952 82 09 00',
 'https://www.puenteromano.com', '10:00 – 20:00',
 36.5111, -4.9013,
 '@hotelpuenteromano',
 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
 4.9, '€€€€', 150, TRUE, TRUE),

('six-senses-spa-puente-romano', 'Six Senses Spa at Puente Romano', 'Six Senses / Grupo Puente Romano',
 'Spa & Wellness',
 'Considerado uno de los mejores spas de Europa. 3.000 m² de bienestar holístico con terapias ayurvédicas, baños de flotación, circuito termal, yoga y tratamientos personalizados.',
 'Hotel Puente Romano, Bulevar Príncipe Alfonso von Hohenlohe 4, Marbella', '+34 952 82 09 00',
 'https://www.sixsenses.com/en/spas/puente-romano', '09:00 – 21:00',
 36.5113, -4.9014,
 '@sixsensesspa',
 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
 ARRAY[
   'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
   'https://images.unsplash.com/photo-1540555700478-4be290a0d474?auto=format&fit=crop&w=800&q=80'
 ],
 4.9, '€€€€', 200, TRUE, TRUE),

('nobu-hotel-marbella', 'Nobu Hotel Marbella', 'Nobu Hospitality / Grupo Puente Romano',
 'Hotel',
 'El primer Nobu Hotel de España, integrado en el complejo Puente Romano. 118 habitaciones de diseño japonés, acceso directo a Nobu Restaurant y todos los servicios del resort 5 estrellas.',
 'Hotel Puente Romano, Bulevar Príncipe Alfonso von Hohenlohe 4, Marbella', '+34 952 77 91 52',
 'https://www.nobuhotels.com/hotel/marbella/', '24h',
 36.5115, -4.9012,
 '@nobuhotelmarbella',
 'https://images.unsplash.com/photo-1551882547-ff40c599fb00?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1551882547-ff40c599fb00?auto=format&fit=crop&w=800&q=80'],
 4.9, '€€€€', 400, TRUE, TRUE)

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rating = EXCLUDED.rating;

-- =================================================================
-- GRUPO DANI GARCÍA
-- =================================================================
INSERT INTO public.venues (slug, name, group_name, category, description, address, phone, website, opening_hours, lat, lng, instagram_handle, cover_image_url, images, rating, price_range, avg_price_eur, is_partner, is_active)
VALUES

('lena-marbella', 'Leña by Dani García', 'Grupo Dani García',
 'Fine Dining',
 'El restaurante de fuego y brasa de Dani García en Puente Romano. 1 estrella Michelin y 1 estrella verde. Cocina de producto excepcional con técnicas de cocción a la leña y carbón. Una experiencia carnívora y vegetal de alto nivel.',
 'Hotel Puente Romano, Bulevar Príncipe Alfonso von Hohenlohe 4, Marbella', '+34 952 77 50 00',
 'https://grupodanigarcia.com/lena/', '13:30 – 16:00, 20:00 – 23:30',
 36.5115, -4.9012,
 '@lenadanigarcia',
 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
 ARRAY[
   'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
   'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80'
 ],
 4.8, '€€€€', 110, TRUE, TRUE),

('bibo-marbella', 'Bibo Marbella', 'Grupo Dani García',
 'Fine Dining',
 'El concepto más desenfadado de Dani García. Tapas de autor, cócteles creativos y una atmósfera vibrante en pleno Paseo Marítimo. Cocina española con guiños internacionales en un entorno espectacular.',
 'Paseo Marítimo de Marbella 25, Marbella', '+34 951 28 28 86',
 'https://grupodanigarcia.com/bibo/marbella/', '13:00 – 01:00',
 36.5095, -4.8770,
 '@bibomarbella',
 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80',
 ARRAY[
   'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80',
   'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'
 ],
 4.7, '€€€', 65, TRUE, TRUE),

('lobito-de-mar', 'Lobito de Mar', 'Grupo Dani García',
 'Fine Dining',
 'Marisquería y arrocería de alta cocina en Puerto Banús. El mar en estado puro: arroces cremosos, mariscos de la lonja y una terraza privilegiada frente a los yates de lujo.',
 'Muelle Benabola s/n, Puerto Banús, Marbella', '+34 952 90 79 94',
 'https://grupodanigarcia.com/lobito-de-mar/marbella/', '13:00 – 17:00, 20:00 – 23:30',
 36.4879, -4.9562,
 '@lobitodemar',
 'https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=800&q=80',
 ARRAY[
   'https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=800&q=80',
   'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80'
 ],
 4.7, '€€€€', 95, TRUE, TRUE),

('tragabuches-marbella', 'Tragabuches Marbella', 'Grupo Dani García',
 'Fine Dining',
 'Taberna andaluza de autor. El concepto más castizo de Dani García recupera lo mejor de la gastronomía tradicional malagueña con una mirada contemporánea. Rabo de toro, gazpacho y fritura perfecta.',
 'Calle San Lázaro 8, Marbella', '+34 952 86 04 62',
 'https://grupodanigarcia.com/tragabuches/', '13:00 – 16:30, 20:00 – 23:30',
 36.5106, -4.8838,
 '@tragabuches',
 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80'],
 4.6, '€€€', 55, FALSE, TRUE),

('bibo-beach-house', 'BiBo Beach House', 'Grupo Dani García',
 'Beach Club',
 'La versión playera de BiBo en Tarifa. Beach club de autor con menú de arroces, pescados al espeto y ambiente surf. La escapada preferida de los asiduos de Marbella cuando quieren algo diferente.',
 'N-340, km 78, Tarifa, Cádiz', '+34 956 68 49 00',
 'https://grupodanigarcia.com/bibo/', '12:00 – 22:00 (abr-sep)',
 36.0025, -5.6013,
 '@bibobeachhouse',
 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80'],
 4.5, '€€€', 60, FALSE, TRUE)

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rating = EXCLUDED.rating;

-- =================================================================
-- GRUPO AMÀRE
-- =================================================================
INSERT INTO public.venues (slug, name, group_name, category, description, address, phone, website, opening_hours, lat, lng, instagram_handle, cover_image_url, images, rating, price_range, avg_price_eur, is_partner, is_active)
VALUES

('amare-beach-club', 'Amàre Beach Club Marbella', 'Grupo Amàre',
 'Beach Club',
 'Beach club adults-only en el Paseo Marítimo de Marbella. Tres piscinas, gastronomía de autor a pie de playa y música chill. El refugio sofisticado para los que buscan tranquilidad y elegancia.',
 'Paseo Marítimo 32, Marbella', '+34 952 76 87 00',
 'https://www.amarehotels.com/es/amare-marbella/', '10:00 – 20:00',
 36.5088, -4.8755,
 '@amarebeachmarbella',
 'https://images.unsplash.com/photo-1573843981267-be1480dcd4fc?auto=format&fit=crop&w=800&q=80',
 ARRAY[
   'https://images.unsplash.com/photo-1573843981267-be1480dcd4fc?auto=format&fit=crop&w=800&q=80',
   'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'
 ],
 4.6, '€€€', 70, TRUE, TRUE),

('amare-spa-marbella', 'Amàre Spa Marbella', 'Grupo Amàre',
 'Spa & Wellness',
 'Spa urbano contemporáneo en el corazón de Marbella. Circuito hidrotermal, tratamientos de belleza con cosmética de autor, envoltura de algas y masajes signature con aceites esenciales del Mediterráneo.',
 'Paseo Marítimo 32, Marbella', '+34 952 76 87 00',
 'https://www.amarehotels.com/es/spa/', '09:00 – 20:00',
 36.5088, -4.8754,
 '@amarebeachmarbella',
 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80'],
 4.7, '€€€', 120, TRUE, TRUE),

('amare-hotel-marbella', 'Hotel Amàre Marbella', 'Grupo Amàre',
 'Hotel',
 'Hotel boutique adults-only 4 estrellas superior en primera línea de playa. 162 habitaciones con terraza, dos piscinas infinitas, cinco espacios gastronómicos y spa. La base perfecta para descubrir Marbella.',
 'Paseo Marítimo 32, Marbella', '+34 952 76 87 00',
 'https://www.amarehotels.com/es/amare-marbella/', '24h',
 36.5087, -4.8755,
 '@amarebeachmarbella',
 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'],
 4.6, '€€€€', 280, FALSE, TRUE)

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rating = EXCLUDED.rating;

-- =================================================================
-- NIKKI BEACH GROUP
-- =================================================================
INSERT INTO public.venues (slug, name, group_name, category, description, address, phone, website, opening_hours, lat, lng, instagram_handle, cover_image_url, images, rating, price_range, avg_price_eur, is_partner, is_active)
VALUES

('nikki-beach', 'Nikki Beach Marbella', 'Nikki Beach Group',
 'Beach Club',
 'El beach club más famoso del mundo en su versión marbellí. Ambiente glamuroso a orillas del Mediterráneo: música, moda, gastronomía y entorno exclusivo. Paraíso de influencers y celebrities cada verano.',
 'Urb. Hacienda Las Chapas s/n, CN340 km 192.8, Marbella', '+34 952 83 66 45',
 'https://www.nikkibeach.com/marbella/', '11:00 – 02:00 (may–sep)',
 36.5105, -4.8821,
 '@nikkibeachmarbella',
 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
 ARRAY[
   'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
   'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=800&q=80',
   'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'
 ],
 4.8, '€€€€', 130, TRUE, TRUE)

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rating = EXCLUDED.rating;

-- =================================================================
-- OCEAN CLUB
-- =================================================================
INSERT INTO public.venues (slug, name, group_name, category, description, address, phone, website, opening_hours, lat, lng, instagram_handle, cover_image_url, images, rating, price_range, avg_price_eur, is_partner, is_active)
VALUES

('ocean-club', 'Ocean Club Marbella', 'Ocean Club Group',
 'Beach Club',
 'El beach club original de Marbella y referencia mundial del lujo en la playa. Icónica piscina con camas flotantes, ambiente cosmopolita y los mejores DJs internacionales. El símbolo del estilo de vida marbellí.',
 'Playa de la Fontanilla s/n, Puerto Banús, Marbella', '+34 952 81 82 82',
 'https://oceanclub.es', '10:00 – 02:00 (abr–oct)',
 36.5097, -4.9004,
 '@oceanclubmarbella',
 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
 ARRAY[
   'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
   'https://images.unsplash.com/photo-1566073771259-b4ad8b8f0517?auto=format&fit=crop&w=800&q=80',
   'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=800&q=80'
 ],
 4.9, '€€€€', 150, TRUE, TRUE)

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rating = EXCLUDED.rating;

-- =================================================================
-- BONBONNIERE MARBELLA (ex-Olivia Valère)
-- =================================================================
INSERT INTO public.venues (slug, name, group_name, category, description, address, phone, website, opening_hours, lat, lng, instagram_handle, cover_image_url, images, rating, price_range, avg_price_eur, is_partner, is_active)
VALUES

('bonbonniere-marbella', 'Bonbonniere Marbella', 'Bonbonniere Marbella',
 'Nightlife',
 'Luxury nightclub on the Golden Mile. The international nightlife phenomenon from Mykonos and Tulum lands in Marbella in the legendary former Olivia Valere space. Brutalist-Oriental design, world-class DJs.',
 'Carretera de Istán km 0.8, Marbella', '+34 952 82 88 61',
 'https://www.oliviavalere.com', '00:00 – 06:00 (jue–sáb, jul–ago)',
 36.5122, -4.8955,
 'bonbonniere.marbella',
 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
 ARRAY[
   'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
   'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80'
 ],
 4.6, '€€€€', 80, TRUE, TRUE)

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rating = EXCLUDED.rating;

-- =================================================================
-- STARLITE GROUP
-- =================================================================
INSERT INTO public.venues (slug, name, group_name, category, description, address, phone, website, opening_hours, lat, lng, instagram_handle, cover_image_url, images, rating, price_range, avg_price_eur, is_partner, is_active)
VALUES

('starlite-festival', 'Starlite Auditorium', 'Starlite Group',
 'Events',
 'El festival boutique más exclusivo del mundo según Forbes. Anfiteatro natural en una cantera de mármol con capacidad para 3.000 personas. Artistas de talla mundial, gastronomía de lujo y la gala benéfica más glamurosa del verano.',
 'Cantera de Nagelsmühle s/n, Marbella', '+34 952 77 88 99',
 'https://www.starlitemarbella.com', '19:00 – 02:00 (jul–ago)',
 36.5180, -4.9078,
 '@starlitemarbella',
 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80',
 ARRAY[
   'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80',
   'https://images.unsplash.com/photo-1501281668745-b8ceab298bc1?auto=format&fit=crop&w=800&q=80'
 ],
 4.9, '€€€€', 200, TRUE, TRUE),

('starlite-beach', 'Starlite Beach Club', 'Starlite Group',
 'Beach Club',
 'El beach club premium del grupo Starlite. Diseño exclusivo, servicio cinco estrellas, gastronomía de alta cocina y programación de eventos culturales. La extensión de verano del espíritu Starlite.',
 'Playa de las Chapas, CN340 km 192, Marbella', '+34 952 77 88 99',
 'https://www.starlitemarbella.com', '11:00 – 20:00 (may–sep)',
 36.5095, -4.8801,
 '@starlitemarbella',
 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80'],
 4.7, '€€€€', 100, TRUE, TRUE)

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rating = EXCLUDED.rating;

-- =================================================================
-- OPIUM GROUP
-- =================================================================
INSERT INTO public.venues (slug, name, group_name, category, description, address, phone, website, opening_hours, lat, lng, instagram_handle, cover_image_url, images, rating, price_range, avg_price_eur, is_partner, is_active)
VALUES

('opium-beach', 'Opium Beach Club', 'Opium Group',
 'Beach Club',
 'Ultra beach club de lujo en la Golden Mile. De día es un paraíso de piscinas, DJs y gastronomía premium; de noche se transforma en el club más exclusivo de Marbella con headliners internacionales.',
 'Avda. del Mar, Los Monteros, Marbella', '+34 952 77 66 55',
 'https://www.opiummarbella.com', '12:00 – 03:00',
 36.5089, -4.8902,
 '@opiumbeachmarbella',
 'https://images.unsplash.com/photo-1566073771259-b4ad8b8f0517?auto=format&fit=crop&w=800&q=80',
 ARRAY[
   'https://images.unsplash.com/photo-1566073771259-b4ad8b8f0517?auto=format&fit=crop&w=800&q=80',
   'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80'
 ],
 4.8, '€€€€', 120, TRUE, TRUE),

('opium-mar', 'Opium Mar', 'Opium Group',
 'Nightlife',
 'La rama nocturna del grupo Opium en el centro de Marbella. Diseño de interiores art-deco, terraza rooftop y una programación de DJs que mezcla house, tech-house y comercial de calidad.',
 'Calle Ramón y Cajal 5, Marbella', '+34 952 77 00 77',
 'https://www.opiummarbella.com', '23:30 – 06:00 (jue–sáb)',
 36.5100, -4.8830,
 '@opiummar',
 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=800&q=80'],
 4.5, '€€€', 50, FALSE, TRUE)

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rating = EXCLUDED.rating;

-- =================================================================
-- RESTAURANTES INDEPENDIENTES — ALTA COCINA
-- =================================================================
INSERT INTO public.venues (slug, name, group_name, category, description, address, phone, website, opening_hours, lat, lng, instagram_handle, cover_image_url, images, rating, price_range, avg_price_eur, is_partner, is_active)
VALUES

('skina', 'Skina', 'Independiente',
 'Fine Dining',
 '2 estrellas Michelin en el Casco Antiguo de Marbella. El chef Marcos Granda ofrece solo 20 cubiertos por noche en un menú degustación de 16 pasos. Producto local y de temporada, técnica depurada y una experiencia gastronómica transformadora.',
 'Calle Aduar 12, Casco Antiguo, Marbella', '+34 952 76 52 77',
 'https://www.restauranteskina.com', 'Martes–Sábado 19:30 – 23:00',
 36.5106, -4.8838,
 '@restauranteskina',
 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80',
 ARRAY[
   'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80',
   'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'
 ],
 4.9, '€€€€', 175, FALSE, TRUE),

('messina', 'Messina', 'Independiente',
 'Fine Dining',
 '1 estrella Michelin. El chef argentino Mauricio Giovanini fusiona la cocina mediterránea con técnicas de vanguardia. Menú degustación con armonía de vinos y un comedor de diseño moderno. Una de las experiencias gastronómicas más relevantes de la Costa del Sol.',
 'Avenida Severo Ochoa 12, Marbella', '+34 952 86 48 95',
 'https://www.restaurantemessina.com', 'Martes–Sábado 13:00–16:00, 20:00–23:30',
 36.5098, -4.8795,
 '@restaurantemessina',
 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80',
 ARRAY[
   'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80',
   'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80'
 ],
 4.8, '€€€€', 140, FALSE, TRUE),

('ta-kumi', 'Ta-Kumi', 'Independiente',
 'Fine Dining',
 '1 estrella Michelin. Fusión japonesa-mediterránea del chef Álvaro Arbeloa. Menú omakase con ingredientes andaluces y técnicas niponas. Barra de sushi, sala privada y bodega con sake artesanal seleccionado.',
 'Calle Gregorio Marañón 4, Marbella', '+34 952 77 08 39',
 'https://www.restaurante-takumi.com', 'Martes–Sábado 13:00–16:00, 19:30–23:00',
 36.5100, -4.8802,
 '@takumimarbella',
 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
 ARRAY[
   'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
   'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80'
 ],
 4.7, '€€€€', 130, FALSE, TRUE),

('el-lago', 'El Lago', 'Independiente',
 'Fine Dining',
 '1 estrella Michelin en el Club de Golf Los Naranjos. Vista privilegiada sobre el lago, cocina española de temporada y carta de vinos sobresaliente. Refugio gourmet rodeado de naturaleza en plena Nueva Andalucía.',
 'Urb. Elviria Hills, Los Naranjos Golf, Nueva Andalucía', '+34 952 83 23 71',
 'https://www.restauranteellago.com', 'Martes–Sábado 13:00–16:00, 20:00–23:00',
 36.4940, -4.9440,
 '@restauranteellago',
 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'],
 4.7, '€€€€', 120, FALSE, TRUE),

('trocadero-arena', 'Trocadero Arena', 'Independiente',
 'Beach Club',
 'Clásico chiringuito gourmet elevado a la máxima expresión. Primera línea de playa con paella valenciana auténtica, espetos de sardinas y arroces melosos. El más veterano de los beach restaurants de calidad de Marbella.',
 'Playa del Pinillo s/n, CN340 km 182, Marbella', '+34 952 77 61 83',
 'https://www.grupochiringuitosmarbella.com', '12:00 – 22:00',
 36.5120, -4.8690,
 '@trocaderoarena',
 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80'],
 4.5, '€€€', 55, FALSE, TRUE),

('salduna-beach', 'Salduna Beach', 'Independiente',
 'Beach Club',
 'Beach club sofisticado con gastronomía japonesa y mediterránea a primera línea de playa. Ambiente lounge, hamacas premium y carta de sushis y tiraditos con producto local.',
 'Playa de Nagüeles s/n, Marbella', '+34 952 82 04 50',
 'https://www.saldunabeach.com', '10:00 – 22:00 (may–oct)',
 36.5118, -4.8990,
 '@saldunabeach',
 'https://images.unsplash.com/photo-1573843981267-be1480dcd4fc?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1573843981267-be1480dcd4fc?auto=format&fit=crop&w=800&q=80'],
 4.6, '€€€€', 85, TRUE, TRUE)

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rating = EXCLUDED.rating;

-- =================================================================
-- BEACH CLUBS INDEPENDIENTES
-- =================================================================
INSERT INTO public.venues (slug, name, group_name, category, description, address, phone, website, opening_hours, lat, lng, instagram_handle, cover_image_url, images, rating, price_range, avg_price_eur, is_partner, is_active)
VALUES

('playa-padre', 'Playa Padre', 'Independiente',
 'Beach Club',
 'Beach club boho-chic con decoración balinesa y vistas al Mediterráneo. Música chill de tarde, sesiones de DJ al atardecer y cócteles tropicales. El favorito de los content creators y amantes del lifestyle mediterráneo desenfadado.',
 'Playa de Nueva Andalucía s/n, Marbella', '+34 952 81 31 20',
 'https://www.playapadre.com', '10:00 – 02:00',
 36.5078, -4.8650,
 '@playapadremarbella',
 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80',
 ARRAY[
   'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80',
   'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=800&q=80'
 ],
 4.7, '€€€', 70, TRUE, TRUE),

('don-carlos-beach', 'Don Carlos Beach Club', 'Hotel Don Carlos',
 'Beach Club',
 'El beach club privado del Hotel Don Carlos, el establecimiento hotelero más antiguo de Marbella. Playa privada de arena fina, restaurante de mariscos y ambiente exclusivo. Los Rolling Stones se alojaron aquí en los 70.',
 'Urb. Hacienda Las Chapas, CN340 km 192, Marbella', '+34 952 83 11 40',
 'https://www.hoteldoncarlos.com', '10:00 – 20:00',
 36.5103, -4.8820,
 '@hoteldoncarlos',
 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80'],
 4.6, '€€€€', 90, FALSE, TRUE),

('marbella-club-beach', 'Marbella Club Beach', 'Marbella Club Hotel',
 'Beach Club',
 'La playa privada del hotel más legendario de Marbella, fundado por el Príncipe Alfonso von Hohenlohe en 1954. Discreción, elegancia atemporal y servicio impecable. El beach club preferido de la aristocracia europea.',
 'Bulevar Príncipe Alfonso von Hohenlohe 1, Marbella', '+34 952 82 22 11',
 'https://www.marbellaclub.com', '10:00 – 20:00',
 36.5121, -4.8988,
 '@marbellaclubhotel',
 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
 4.9, '€€€€', 160, FALSE, TRUE)

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rating = EXCLUDED.rating;

-- =================================================================
-- NIGHTLIFE INDEPENDIENTE
-- =================================================================
INSERT INTO public.venues (slug, name, group_name, category, description, address, phone, website, opening_hours, lat, lng, instagram_handle, cover_image_url, images, rating, price_range, avg_price_eur, is_partner, is_active)
VALUES

('mirage-nightclub', 'Mirage Nightclub', 'Independiente',
 'Nightlife',
 'El club número 1 de Marbella según las principales guías nocturnas. Sistema de sonido de última generación, paredes LED inmersivas y un line-up de DJs que incluye a los nombres más cotizados del circuito internacional. Vestimenta formal obligatoria.',
 'Puerto Banús, Marbella', '+34 952 81 99 00',
 'https://www.miragemarbella.com', '23:00 – 06:00 (jue–dom)',
 36.4875, -4.9558,
 '@miragemarbella',
 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
 ARRAY[
   'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
   'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80'
 ],
 5.0, '€€€€', 80, TRUE, TRUE),

('pangea-club', 'Pangea Club', 'Independiente',
 'Nightlife',
 'Club nocturno en Puerto Banús con una de las mejores terrazas de la costa. Tres espacios diferenciados, programación de DJs de house y tech-house y ambiente cosmopolita. El lugar de después del Mirage para los más resistentes.',
 'Muelle de Ribera, Puerto Banús, Marbella', '+34 952 81 24 41',
 NULL, '23:30 – 05:30 (jue–dom)',
 36.4876, -4.9560,
 '@pangeamarbella',
 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=800&q=80'],
 4.5, '€€€', 50, FALSE, TRUE),

('aqwa-mist', 'Aqwa Mist', 'Independiente',
 'Nightlife',
 'Club de ambiente gay-friendly en Puerto Banús con la clientela más diversa y tolerante de la Costa del Sol. Espectáculos de drag, sesiones de electrónica y un ambiente sin prejuicios donde la noche dura hasta el amanecer.',
 'CC Puerto Banús, Local 57, Marbella', '+34 952 81 91 82',
 NULL, '22:00 – 05:00',
 36.4876, -4.9551,
 '@aqwamist',
 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=800&q=80'],
 4.4, '€€€', 40, FALSE, TRUE),

('suite-marbella', 'Suite Marbella', 'Independiente',
 'Nightlife',
 'Lounge club premium en el Golden Mile con terraza privada y vista al mar. Ideal para comenzar la noche: coctelería de autor, gastronomía de finger food y música ambient que evoluciona hacia house conforme avanza la velada.',
 'Avda. Manolete 4, Marbella', '+34 952 82 44 22',
 NULL, '21:00 – 04:00',
 36.5094, -4.8890,
 '@suitemarbella',
 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=800&q=80'],
 4.5, '€€€€', 70, TRUE, TRUE)

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rating = EXCLUDED.rating;

-- =================================================================
-- SPAS INDEPENDIENTES
-- =================================================================
INSERT INTO public.venues (slug, name, group_name, category, description, address, phone, website, opening_hours, lat, lng, instagram_handle, cover_image_url, images, rating, price_range, avg_price_eur, is_partner, is_active)
VALUES

('finca-cortesin-spa', 'Finca Cortesín Spa', 'Finca Cortesín Resort',
 'Spa & Wellness',
 'Un santuario de bienestar de 2.200 m² en el resort más exclusivo de la Costa del Sol. Jardín japonés, terma infinity, piscina interior con luz natural, masajes signature con aceite de argán y tratamientos ayurvédicos de 3 horas.',
 'Carretera de Casares s/n, Casares, Málaga', '+34 952 93 78 00',
 'https://www.fincacortesin.com/spa/', '08:00 – 21:00',
 36.4342, -5.1845,
 '@fincacortesin',
 'https://images.unsplash.com/photo-1540555700478-4be290a0d474?auto=format&fit=crop&w=800&q=80',
 ARRAY[
   'https://images.unsplash.com/photo-1540555700478-4be290a0d474?auto=format&fit=crop&w=800&q=80',
   'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80'
 ],
 4.9, '€€€€', 220, TRUE, TRUE),

('spa-marbella-club', 'Marbella Club Spa', 'Marbella Club Hotel',
 'Spa & Wellness',
 'Spa del hotel más emblemático de Marbella. Tratamientos faciales con cosmética de lujo, masajes terapéuticos, hammam y piscina climatizada. Una inmersión en el bienestar en el mismo lugar donde se inventó el jet set marbellí.',
 'Bulevar Príncipe Alfonso von Hohenlohe 1, Marbella', '+34 952 82 22 11',
 'https://www.marbellaclub.com/spa/', '09:00 – 21:00',
 36.5121, -4.8988,
 '@marbellaclubhotel',
 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80'],
 4.8, '€€€€', 180, FALSE, TRUE)

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rating = EXCLUDED.rating;

-- =================================================================
-- SHOPPING & MARINA
-- =================================================================
INSERT INTO public.venues (slug, name, group_name, category, description, address, phone, website, opening_hours, lat, lng, instagram_handle, cover_image_url, images, rating, price_range, avg_price_eur, is_partner, is_active)
VALUES

('puerto-banus', 'Puerto Banús Marina', 'Puerto Banús SA',
 'Shopping',
 'El puerto deportivo más glamuroso de Europa. Boutiques de Gucci, Louis Vuitton, Dior y Ferrari Marbella junto a superyates de 50 metros. El paseo del puerto es el escaparate al aire libre más exclusivo de la Costa del Sol.',
 'Muelle de Honor s/n, Puerto Banús, Marbella', '+34 952 90 95 95',
 'https://www.puertobanusoficial.com', '10:00 – 22:00',
 36.4884, -4.9579,
 '@puertobanus',
 'https://images.unsplash.com/photo-1569949381669-ecf0e3ae2b41?auto=format&fit=crop&w=800&q=80',
 ARRAY[
   'https://images.unsplash.com/photo-1569949381669-ecf0e3ae2b41?auto=format&fit=crop&w=800&q=80',
   'https://images.unsplash.com/photo-1555529902-5261145633bf?auto=format&fit=crop&w=800&q=80'
 ],
 4.7, '€€€€', 0, FALSE, TRUE),

('la-canada', 'La Cañada Shopping Centre', 'Bogaris Retail',
 'Shopping',
 'El centro comercial de referencia en el interior de Marbella con más de 170 tiendas, Zara, El Corte Inglés, cines y restaurantes. El punto de encuentro de los residentes para el comercio cotidiano de calidad.',
 'Carretera de Ojén s/n, Marbella', '+34 952 90 90 90',
 'https://www.cclacanada.es', '10:00 – 22:00',
 36.5105, -4.8888,
 '@cclacanada',
 'https://images.unsplash.com/photo-1555529902-5261145633bf?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1555529902-5261145633bf?auto=format&fit=crop&w=800&q=80'],
 4.3, '€€', 0, FALSE, TRUE),

('marbella-old-town', 'Casco Antiguo Boutiques', 'Independiente',
 'Shopping',
 'El corazón histórico de Marbella con sus calles adoquinadas llenas de boutiques independientes, galerías de arte, joyerías y tiendas de moda artesanal. La Plaza de los Naranjos es el punto neurálgico de este barrio lleno de encanto.',
 'Plaza de los Naranjos, Casco Antiguo, Marbella', NULL,
 NULL, '10:00 – 22:00',
 36.5106, -4.8838,
 '@cascoantiguomarbella',
 'https://images.unsplash.com/photo-1555529902-5261145633bf?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1555529902-5261145633bf?auto=format&fit=crop&w=800&q=80'],
 4.6, '€€€', 0, FALSE, TRUE)

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rating = EXCLUDED.rating;

-- =================================================================
-- HOTELES DE LUJO
-- =================================================================
INSERT INTO public.venues (slug, name, group_name, category, description, address, phone, website, opening_hours, lat, lng, instagram_handle, cover_image_url, images, rating, price_range, avg_price_eur, is_partner, is_active)
VALUES

('hotel-puente-romano', 'Hotel Puente Romano Beach Resort', 'Puente Romano Group',
 'Hotel',
 'El resort más icónico de Marbella, construido alrededor de un puente romano del siglo II. 5 estrellas GL, 215 habitaciones y suites, six restaurantes, tres piscinas, spa y el mejor club de tenis del sur de Europa.',
 'Bulevar Príncipe Alfonso von Hohenlohe 4, Marbella', '+34 952 82 09 00',
 'https://www.puenteromano.com', '24h',
 36.5115, -4.9012,
 '@hotelpuenteromano',
 'https://images.unsplash.com/photo-1551882547-ff40c599fb00?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1551882547-ff40c599fb00?auto=format&fit=crop&w=800&q=80'],
 4.9, '€€€€', 600, FALSE, TRUE),

('marbella-club-hotel', 'Marbella Club Hotel', 'Hohenlohe Group',
 'Hotel',
 'El hotel más histórico de Marbella y del jet set europeo. Fundado en 1954 por el Príncipe Alfonso von Hohenlohe, inventó el concepto de resort de lujo en la Costa del Sol. Desde Grace Kelly a Sean Connery, todos pasaron por aquí.',
 'Bulevar Príncipe Alfonso von Hohenlohe 1, Marbella', '+34 952 82 22 11',
 'https://www.marbellaclub.com', '24h',
 36.5121, -4.8988,
 '@marbellaclubhotel',
 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'],
 4.9, '€€€€', 700, FALSE, TRUE),

('villa-padierna', 'Villa Padierna Palace Hotel', 'Villa Padierna Group',
 'Hotel',
 'Palacio neoclásico de 5 estrellas GL rodeado de 160 hectáreas de jardines y tres campos de golf. Sede de varias reuniones del G8, spa romano de 3.000 m² y el restaurante La Veranda con cocina italiana de lujo.',
 'CN340 km 166, Benahavís, Marbella', '+34 952 88 91 50',
 'https://www.villapadierna.com', '24h',
 36.4720, -5.0045,
 '@villapadiernapalace',
 'https://images.unsplash.com/photo-1551882547-ff40c599fb00?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1551882547-ff40c599fb00?auto=format&fit=crop&w=800&q=80'],
 4.8, '€€€€', 550, FALSE, TRUE),

('gran-melia-don-pepe', 'Gran Meliá Don Pepe', 'Meliá Hotels International',
 'Hotel',
 'Hotel insignia de Meliá en Marbella, a primera línea de playa. Diseño contemporáneo, amplias suites con terraza al mar, spa de 2.000 m² y el restaurante Blue por el chef Ramón Freixa con 1 estrella Michelin.',
 'Calle José Meliá s/n, Marbella', '+34 952 77 03 00',
 'https://www.melia.com/es/hoteles/espana/marbella/gran-melia-don-pepe/', '24h',
 36.5090, -4.8862,
 '@granmeliadonpepe',
 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'],
 4.7, '€€€€', 350, FALSE, TRUE),

('hotel-don-carlos', 'Barceló Marbella (Don Carlos)', 'Barceló Hotels',
 'Hotel',
 'El hotel más antiguo de Marbella (1961) completamente renovado. Ubicado entre una reserva natural y la playa, con 234 habitaciones, spa, varios restaurantes y la pista de baile más legendaria de Marbella.',
 'Urb. Hacienda Las Chapas, CN340 km 192.8, Marbella', '+34 952 83 11 40',
 'https://www.hoteldoncarlos.com', '24h',
 36.5103, -4.8820,
 '@hoteldoncarlosmarbella',
 'https://images.unsplash.com/photo-1551882547-ff40c599fb00?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1551882547-ff40c599fb00?auto=format&fit=crop&w=800&q=80'],
 4.5, '€€€€', 280, FALSE, TRUE)

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rating = EXCLUDED.rating;

-- =================================================================
-- EVENTOS & CULTURA
-- =================================================================
INSERT INTO public.venues (slug, name, group_name, category, description, address, phone, website, opening_hours, lat, lng, instagram_handle, cover_image_url, images, rating, price_range, avg_price_eur, is_partner, is_active)
VALUES

('marbella-yacht-club', 'Marbella Yacht Club', 'Independiente',
 'Events',
 'El club náutico más exclusivo de la Costa del Sol. Fondeo para superyates, regatas internacionales, cursos de vela y el ambiente marinero más sofisticado. La sede del Trofeo Conde de Godo y otras competiciones de alto nivel.',
 'Puerto Banús, Marbella', '+34 952 90 95 95',
 'https://www.rcmyachtclub.com', '09:00 – 22:00',
 36.4884, -4.9579,
 '@marbellayachtclub',
 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=800&q=80'],
 4.8, '€€€€', 0, FALSE, TRUE),

('casino-marbella', 'Casino Marbella', 'Codere',
 'Events',
 'El único casino de la Costa del Sol en el hotel Andalucía Plaza. Ruleta americana y europea, blackjack, póker, máquinas de slots y shows en vivo. Código de vestimenta smart casual exigido.',
 'Hotel Andalucía Plaza, Urb. Nueva Andalucía, Marbella', '+34 952 81 40 00',
 'https://www.casinomarbella.com', '20:00 – 04:00',
 36.4955, -4.9450,
 '@casinomarbella',
 'https://images.unsplash.com/photo-1501281668745-b8ceab298bc1?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1501281668745-b8ceab298bc1?auto=format&fit=crop&w=800&q=80'],
 4.2, '€€€', 0, FALSE, TRUE)

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rating = EXCLUDED.rating;

-- =================================================================
-- VERIFICACIÓN FINALE
-- =================================================================
SELECT
  COUNT(*) AS total_venues,
  COUNT(CASE WHEN category = 'Beach Club'     THEN 1 END) AS beach_clubs,
  COUNT(CASE WHEN category = 'Fine Dining'    THEN 1 END) AS fine_dining,
  COUNT(CASE WHEN category = 'Nightlife'      THEN 1 END) AS nightlife,
  COUNT(CASE WHEN category = 'Spa & Wellness' THEN 1 END) AS spas,
  COUNT(CASE WHEN category = 'Hotel'          THEN 1 END) AS hotels,
  COUNT(CASE WHEN category = 'Events'         THEN 1 END) AS events,
  COUNT(CASE WHEN category = 'Shopping'       THEN 1 END) AS shopping,
  COUNT(CASE WHEN is_partner = TRUE           THEN 1 END) AS partners
FROM public.venues;
