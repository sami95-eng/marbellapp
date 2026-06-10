-- =================================================================
-- VIP Tables — Marbell'app
-- Exécuter dans Supabase SQL Editor → New Query → Run
-- =================================================================

-- ── Suppression propre (idempotent) ──────────────────────────────
DROP TABLE IF EXISTS public.vip_member_perks    CASCADE;
DROP TABLE IF EXISTS public.vip_event_discounts CASCADE;
DROP TABLE IF EXISTS public.vip_offers          CASCADE;

-- ── 1. VIP OFFERS (tables, beds, bottles, private) ───────────────
CREATE TABLE public.vip_offers (
  id            TEXT        PRIMARY KEY,
  venue_name    TEXT        NOT NULL,
  venue_slug    TEXT        NOT NULL,
  instagram_handle TEXT,
  image_url     TEXT,
  event_date    TEXT        NOT NULL,
  event_time    TEXT        NOT NULL,
  offer_type    TEXT        NOT NULL CHECK (offer_type IN ('table', 'bed', 'bottle', 'private')),
  table_type    TEXT        NOT NULL,
  capacity      INTEGER     NOT NULL DEFAULT 4,
  original_price INTEGER    NOT NULL,
  vip_price     INTEGER     NOT NULL,
  perks         TEXT[]      NOT NULL DEFAULT '{}',
  spots_total   INTEGER     NOT NULL DEFAULT 10,
  spots_left    INTEGER     NOT NULL,
  tag           TEXT,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  sort_order    INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. EVENT DISCOUNTS ───────────────────────────────────────────
CREATE TABLE public.vip_event_discounts (
  id            TEXT        PRIMARY KEY,
  title         TEXT        NOT NULL,
  venue_name    TEXT        NOT NULL,
  venue_slug    TEXT        NOT NULL,
  image_url     TEXT,
  event_date    TEXT        NOT NULL,
  discount_pct  INTEGER     NOT NULL,
  original_price INTEGER    NOT NULL,
  description   TEXT        NOT NULL,
  code          TEXT        NOT NULL,
  valid_until   TEXT        NOT NULL,
  category      TEXT        NOT NULL,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  sort_order    INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. MEMBER PERKS (avantages par tier) ─────────────────────────
CREATE TABLE public.vip_member_perks (
  id            TEXT        PRIMARY KEY,
  title         TEXT        NOT NULL,
  venue_name    TEXT        NOT NULL,
  image_url     TEXT,
  description   TEXT        NOT NULL,
  benefit       TEXT        NOT NULL,
  min_tier      TEXT        NOT NULL CHECK (min_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  is_new        BOOLEAN     NOT NULL DEFAULT FALSE,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  sort_order    INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── RLS : lecture publique, écriture admin uniquement ────────────
ALTER TABLE public.vip_offers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_event_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_member_perks    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vip_offers_public_read"    ON public.vip_offers;
DROP POLICY IF EXISTS "vip_discounts_public_read" ON public.vip_event_discounts;
DROP POLICY IF EXISTS "vip_perks_public_read"     ON public.vip_member_perks;

CREATE POLICY "vip_offers_public_read"
  ON public.vip_offers FOR SELECT USING (TRUE);

CREATE POLICY "vip_discounts_public_read"
  ON public.vip_event_discounts FOR SELECT USING (TRUE);

CREATE POLICY "vip_perks_public_read"
  ON public.vip_member_perks FOR SELECT USING (TRUE);

-- =================================================================
-- SEED — VIP OFFERS (8 offres)
-- =================================================================
INSERT INTO public.vip_offers
  (id, venue_name, venue_slug, instagram_handle, image_url,
   event_date, event_time, offer_type, table_type,
   capacity, original_price, vip_price, perks, spots_total, spots_left, tag, sort_order)
VALUES
  ('t1', 'Ocean Club Marbella', 'ocean-club', '@oceanclubmarbella',
   'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80',
   'Sam. 7 Juin', '22:00 – 04:00', 'table', 'VIP Cabana',
   8, 2000, 1200,
   ARRAY['2 Bouteilles Premium', 'Serveur Dédié', 'Accès Piscine'],
   5, 2, 'HOT', 1),

  ('t2', 'Nikki Beach Marbella', 'nikki-beach', '@nikkibeachmarbella',
   'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=800&q=80',
   'Ven. 6 Juin', '14:00 – 22:00', 'table', 'Beachfront Table',
   6, 1500, 900,
   ARRAY['1 Magnum Champagne', 'Vue Coucher de Soleil', 'Siège Prioritaire'],
   8, 4, 'POPULAR', 2),

  ('t3', 'Olivia Valere', 'olivia-valere', '@oliviavalere_official',
   'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
   'Sam. 7 Juin', '23:30 – 06:00', 'table', 'VIP Booth',
   10, 3000, 1800,
   ARRAY['3 Bouteilles Premium', 'Entrée VIP', 'Meet & Greet DJ'],
   3, 1, 'LAST SPOT', 3),

  ('t4', 'Opium Beach Club', 'opium-beach', '@opiumbeachmarbella',
   'https://images.unsplash.com/photo-1748509865532-bae58b4bd0ce?auto=format&fit=crop&w=800&q=80',
   'Dim. 8 Juin', '13:00 – 20:00', 'bed', 'Daybed Premium',
   4, 800, 500,
   ARRAY['1 Bouteille Rosé', 'Service Serviettes', 'Accès Menu Food'],
   10, 6, 'BEST VALUE', 4),

  ('t5', 'Playa Padre', 'playa-padre', '@playapadremarbella',
   'https://images.unsplash.com/photo-1526922289011-a875fbd2fb0d?auto=format&fit=crop&w=800&q=80',
   'Ven. 6 Juin', '12:00 – 20:00', 'bed', 'Front Row Sunbed',
   2, 400, 250,
   ARRAY['Cocktails Bienvenue', 'Serviettes de Plage', 'Wifi Premium'],
   12, 8, 'NEW', 5),

  ('t6', 'Mirage Nightclub', 'mirage-nightclub', '@miragemarbella',
   'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
   'Sam. 7 Juin', '00:00 – 06:00', 'bottle', 'Bottle Service VIP',
   6, 1200, 700,
   ARRAY['2 Bouteilles Grey Goose', 'Entrée Sans Queue', 'Table Réservée'],
   6, 3, 'HOT', 6),

  ('t7', 'Six Senses Spa', 'six-senses-spa-puente-romano', '@sixsensesspa',
   'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
   'Tous les jours', '09:00 – 21:00', 'private', 'Suite Spa Privative',
   2, 500, 300,
   ARRAY['Massage 90 min', 'Accès Circuit Thermal', 'Champagne Inclus'],
   8, 5, 'EXCLUSIVE', 7),

  ('t8', 'Puente Romano Beach Club', 'puente-romano-beach-club', '@hotelpuenteromano',
   'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=800&q=80',
   'Dim. 8 Juin', '10:00 – 20:00', 'private', 'Pool Access Privatif',
   8, 2500, 1500,
   ARRAY['Piscine Privative 2h', 'Butler Service', 'Menu Nobu Inclus'],
   5, 2, 'PREMIUM', 8)

ON CONFLICT (id) DO UPDATE SET
  spots_left   = EXCLUDED.spots_left,
  is_active    = EXCLUDED.is_active,
  sort_order   = EXCLUDED.sort_order;

-- =================================================================
-- SEED — EVENT DISCOUNTS (7 événements)
-- =================================================================
INSERT INTO public.vip_event_discounts
  (id, title, venue_name, venue_slug, image_url,
   event_date, discount_pct, original_price, description, code, valid_until, category, sort_order)
VALUES
  ('d1', 'Starlite Festival — Opening Night',
   'Starlite Auditorium', 'starlite-festival',
   'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80',
   '15 Juin 2026', 30, 150,
   '30% de réduction sur les billets de la soirée d''ouverture. Performances live, gastronomie & cocktails premium sous les étoiles.',
   'MARBELLVIP30', '14 Juin 2026', 'Festival', 1),

  ('d2', 'Full Moon Party @ Nikki Beach',
   'Nikki Beach Marbella', 'nikki-beach',
   'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
   '11 Juin 2026', 25, 80,
   'Beach party sous la pleine lune avec DJs internationaux. Les membres VIP ont 25% de réduction + cocktail de bienvenue offert.',
   'MOONVIP25', '10 Juin 2026', 'Party', 2),

  ('d3', 'Dîner Dégustation @ Skina',
   'Skina (2 étoiles Michelin)', 'skina',
   'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?auto=format&fit=crop&w=800&q=80',
   '20 Juin 2026', 20, 250,
   'Menu dégustation 16 temps avec accord vins au seul 2 étoiles Michelin de Marbella. 20% de réduction pour les membres.',
   'SKINAVIP20', '19 Juin 2026', 'Gastronomie', 3),

  ('d4', 'Spa Day @ Six Senses',
   'Six Senses Spa at Puente Romano', 'six-senses-spa-puente-romano',
   'https://images.unsplash.com/photo-1540555700478-4be290a0d474?auto=format&fit=crop&w=800&q=80',
   'Tout Juin', 35, 300,
   'Journée spa complète : massage, soin visage & accès circuit thermal. 35% de réduction exclusive pour les membres VIP.',
   'SPAVIP35', '30 Juin 2026', 'Wellness', 4),

  ('d5', 'Croisière Coucher de Soleil en Yacht',
   'Puerto Banús Marina', 'puerto-banus',
   'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=800&q=80',
   'Chaque Samedi', 15, 500,
   'Croisière privée le long de la Golden Mile avec champagne, canapés & DJ. 15% de réduction pour les membres.',
   'YACHTVIP15', '31 Juil 2026', 'Expérience', 5),

  ('d6', 'Leña by Dani García — Table d''Été',
   'Leña by Dani García', 'lena-marbella',
   'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
   'Tout Juin', 15, 180,
   'Menu braise exclusif au restaurant 1 étoile Michelin de Dani García à Puente Romano. 15% de réduction membres.',
   'LENAVIP15', '30 Juin 2026', 'Gastronomie', 6),

  ('d7', 'Tennis Privé @ Puente Romano',
   'Puente Romano Tennis Club', 'puente-romano-tennis',
   'https://images.unsplash.com/photo-1554068865-4a89bbe24cfc?auto=format&fit=crop&w=800&q=80',
   'Sur réservation', 20, 120,
   'Court de tennis privé avec coach professionnel au club où s''entraînent les pros du circuit ATP. 20% membres.',
   'TENNISVIP20', '31 Juil 2026', 'Sport', 7)

ON CONFLICT (id) DO UPDATE SET
  discount_pct   = EXCLUDED.discount_pct,
  is_active      = EXCLUDED.is_active,
  sort_order     = EXCLUDED.sort_order;

-- =================================================================
-- SEED — MEMBER PERKS (8 avantages)
-- =================================================================
INSERT INTO public.vip_member_perks
  (id, title, venue_name, image_url, description, benefit, min_tier, is_new, sort_order)
VALUES
  ('m1', 'File Prioritaire — Tous les Venues',
   'Tous les partenaires',
   'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
   'Montre ton badge Marbell''app VIP à l''entrée pour un accès immédiat, sans attente.',
   'Sans Queue', 'silver', FALSE, 1),

  ('m2', 'Cocktail de Bienvenue Offert',
   'Beach Clubs Partenaires',
   'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
   'Un cocktail signature ou une coupe de champagne offerts à l''arrivée dans tout beach club partenaire.',
   'Drink Offert', 'silver', FALSE, 2),

  ('m3', 'Bouteille Offerte sur Table VIP',
   'Venues Gold Partenaires',
   'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80',
   'Pour toute réservation de table VIP via l''app, une bouteille premium est offerte automatiquement.',
   'Bouteille Offerte', 'gold', TRUE, 3),

  ('m4', 'Concierge Personnel 24h/24',
   'Marbell''app Exclusif',
   'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
   'Conciergerie personnelle pour organiser réservations, transport, et expériences sur-mesure à Marbella.',
   'Service 24/7', 'platinum', TRUE, 4),

  ('m5', 'Événement Exclusif Mensuel',
   'Venues Rotatifs',
   'https://images.unsplash.com/photo-1501281668745-b8ceab298bc1?auto=format&fit=crop&w=800&q=80',
   'Invitation à un événement privé membres chaque mois : dîners privés, soirées sur yacht, vernissages.',
   'Événements Privés', 'gold', FALSE, 5),

  ('m6', 'Accès Backstage Starlite',
   'Starlite Auditorium',
   'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80',
   'Accès aux coulisses des concerts Starlite. Rencontre avec les artistes, zone VIP exclusivement Platinum.',
   'Backstage Access', 'platinum', FALSE, 6),

  ('m7', 'Upgrade Automatique Table',
   'Tous les Venues Partenaires',
   'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
   'Upgrade automatique vers la meilleure table ou expérience disponible à chaque réservation.',
   'Auto Upgrade', 'gold', FALSE, 7),

  ('m8', 'Newsletter Offres Early Bird',
   'Marbell''app',
   'https://images.unsplash.com/photo-1591293771866-3e96a60916a5?auto=format&fit=crop&w=800&q=80',
   'Reçois les offres VIP 48h avant tout le monde. Les meilleures tables partent vite.',
   'Accès Anticipé', 'bronze', FALSE, 8)

ON CONFLICT (id) DO UPDATE SET
  is_new     = EXCLUDED.is_new,
  is_active  = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

-- =================================================================
-- VÉRIFICATION
-- =================================================================
SELECT 'vip_offers'          AS table_name, COUNT(*) AS rows FROM public.vip_offers
UNION ALL
SELECT 'vip_event_discounts' AS table_name, COUNT(*) AS rows FROM public.vip_event_discounts
UNION ALL
SELECT 'vip_member_perks'    AS table_name, COUNT(*) AS rows FROM public.vip_member_perks;
