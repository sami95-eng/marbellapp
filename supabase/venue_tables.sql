-- =================================================================
-- venue_tables — Coller dans Supabase SQL Editor → RUN
-- =================================================================

-- ── Créer la table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.venue_tables (
  id            UUID            DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id      UUID            REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  name          TEXT            NOT NULL,
  description   TEXT,
  capacity_min  INTEGER         DEFAULT 1  NOT NULL,
  capacity_max  INTEGER         NOT NULL,
  price_min     NUMERIC(10,2)   NOT NULL,
  price_max     NUMERIC(10,2),
  photo_url     TEXT,
  is_active     BOOLEAN         DEFAULT TRUE  NOT NULL,
  is_vip        BOOLEAN         DEFAULT FALSE NOT NULL,
  sort_order    INTEGER         DEFAULT 0     NOT NULL,
  created_at    TIMESTAMPTZ     DEFAULT NOW() NOT NULL
);

-- ── RLS ───────────────────────────────────────────────────────────
ALTER TABLE public.venue_tables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Venue tables publicly readable" ON public.venue_tables;
DROP POLICY IF EXISTS "Admins manage venue tables"     ON public.venue_tables;
DROP POLICY IF EXISTS "All tables readable"            ON public.venue_tables;

-- Toutes les tables lisibles (y compris inactives pour le dashboard partenaire)
CREATE POLICY "Venue tables publicly readable"
  ON public.venue_tables FOR SELECT USING (TRUE);

CREATE POLICY "Admins manage venue tables"
  ON public.venue_tables FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Données demo — Ocean Club ─────────────────────────────────────
INSERT INTO public.venue_tables
  (venue_id, name, description, capacity_min, capacity_max, price_min, price_max, is_active, is_vip, sort_order, photo_url)
SELECT v.id, t.name, t.description, t.cap_min, t.cap_max, t.p_min, t.p_max, t.active, t.vip, t.ord, t.photo
FROM   public.venues v
CROSS  JOIN (VALUES
  ('VIP Cabana',
   'Premium beachside cabana with dedicated service, private pool access and 2 premium bottles included.',
   4, 10, 1200.00, 2500.00, TRUE, TRUE, 1,
   'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80'),

  ('Beachfront Table',
   'First-row table directly on the sand with panoramic Mediterranean views and priority waiter service.',
   2,  6,  500.00, 1200.00, TRUE, TRUE, 2,
   'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'),

  ('Pool Daybed',
   'Exclusive premium daybed alongside the main pool. Ideal for relaxation with full bottle service.',
   2,  4,  300.00,  600.00, TRUE, FALSE, 3,
   'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=800&q=80'),

  ('Rooftop Lounge',
   'Elevated terrace with 360° views of the Mediterranean. Perfect for sunset cocktails and evening dining.',
   2,  8,  400.00,  900.00, TRUE, TRUE, 4,
   'https://images.unsplash.com/photo-1566073771259-b4ad8b8f0517?auto=format&fit=crop&w=800&q=80'),

  ('Standard Beach Table',
   'Classic beach table with full waiter service. Best value option for groups up to 6.',
   2,  6,  150.00,  400.00, TRUE, FALSE, 5,
   'https://images.unsplash.com/photo-1573843981267-be1480dcd4fc?auto=format&fit=crop&w=800&q=80')
) AS t(name, description, cap_min, cap_max, p_min, p_max, active, vip, ord, photo)
WHERE  v.slug = 'ocean-club'
ON CONFLICT DO NOTHING;

-- ── Nikki Beach ───────────────────────────────────────────────────
INSERT INTO public.venue_tables
  (venue_id, name, description, capacity_min, capacity_max, price_min, price_max, is_active, is_vip, sort_order, photo_url)
SELECT v.id, t.name, t.description, t.cap_min, t.cap_max, t.p_min, t.p_max, t.active, t.vip, t.ord, t.photo
FROM   public.venues v
CROSS  JOIN (VALUES
  ('White Cabana VIP',
   'Iconic all-white Nikki Beach cabana with direct beach access, champagne welcome and premium service.',
   4,  8, 1500.00, 3000.00, TRUE, TRUE, 1,
   'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80'),

  ('Beachbed Premium',
   'Signature Nikki Beach daybed setup with champagne welcome and full concierge service.',
   2,  4,  600.00, 1200.00, TRUE, TRUE, 2,
   'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=800&q=80'),

  ('DJ Area Table',
   'Prime position next to the DJ booth — the most coveted spot during daytime parties.',
   6, 12, 2000.00, 4000.00, TRUE, TRUE, 3,
   'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80'),

  ('Garden Table',
   'Relaxed garden setting away from the main action. Ideal for dining and intimate conversation.',
   2,  6,  200.00,  500.00, TRUE, FALSE, 4,
   'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80')
) AS t(name, description, cap_min, cap_max, p_min, p_max, active, vip, ord, photo)
WHERE  v.slug = 'nikki-beach'
ON CONFLICT DO NOTHING;

-- ── Olivia Valere ─────────────────────────────────────────────────
INSERT INTO public.venue_tables
  (venue_id, name, description, capacity_min, capacity_max, price_min, price_max, is_active, is_vip, sort_order, photo_url)
SELECT v.id, t.name, t.description, t.cap_min, t.cap_max, t.p_min, t.p_max, t.active, t.vip, t.ord, t.photo
FROM   public.venues v
CROSS  JOIN (VALUES
  ('VIP Booth',
   'Legendary private booth in the heart of Olivia Valere. The most exclusive spot in Marbella nightlife.',
   6, 15, 3000.00, 6000.00, TRUE, TRUE, 1,
   'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80'),

  ('Terrace Table',
   'Open terrace overlooking the dance floor. Includes 2 premium bottles and priority entry.',
   4,  8, 1800.00, 3500.00, TRUE, TRUE, 2,
   'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80'),

  ('Mezzanine',
   'Elevated mezzanine with full dance floor view. Perfect for groups wanting the complete experience.',
   3, 10, 1200.00, 2500.00, TRUE, FALSE, 3,
   'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=800&q=80')
) AS t(name, description, cap_min, cap_max, p_min, p_max, active, vip, ord, photo)
WHERE  v.slug = 'olivia-valere'
ON CONFLICT DO NOTHING;

-- ── Mirage Nightclub ──────────────────────────────────────────────
INSERT INTO public.venue_tables
  (venue_id, name, description, capacity_min, capacity_max, price_min, price_max, is_active, is_vip, sort_order, photo_url)
SELECT v.id, t.name, t.description, t.cap_min, t.cap_max, t.p_min, t.p_max, t.active, t.vip, t.ord, t.photo
FROM   public.venues v
CROSS  JOIN (VALUES
  ('LED Booth Premium',
   'The ultimate Mirage experience surrounded by LED walls with personalised light show and dedicated DJ.',
    6, 15, 5000.00,10000.00, TRUE, TRUE, 1,
   'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80'),

  ('VIP Section A',
   'Main floor VIP section with unobstructed DJ view and dedicated security escort.',
   4, 10, 2500.00, 5000.00, TRUE, TRUE, 2,
   'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=800&q=80'),

  ('VIP Section B',
   'Secondary VIP section with great views and exclusive service at a more accessible price.',
   3,  8, 1500.00, 3000.00, TRUE, TRUE, 3,
   'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=800&q=80'),

  ('Standard Table',
   'Standard table with bottle service. Full club experience at a competitive entry price.',
   2,  6,  800.00, 1500.00, TRUE, FALSE, 4,
   'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80')
) AS t(name, description, cap_min, cap_max, p_min, p_max, active, vip, ord, photo)
WHERE  v.slug = 'mirage-nightclub'
ON CONFLICT DO NOTHING;

-- ── Playa Padre ───────────────────────────────────────────────────
INSERT INTO public.venue_tables
  (venue_id, name, description, capacity_min, capacity_max, price_min, price_max, is_active, is_vip, sort_order, photo_url)
SELECT v.id, t.name, t.description, t.cap_min, t.cap_max, t.p_min, t.p_max, t.active, t.vip, t.ord, t.photo
FROM   public.venues v
CROSS  JOIN (VALUES
  ('Front Row Sunbed',
   'Premium front row sunbed with direct sea views. Welcome cocktails and beach towels included.',
   2,  2,  250.00,  400.00, TRUE, TRUE, 1,
   'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80'),

  ('Boho Cabana',
   'Unique Balinese-style cabana with hammock, cushions and your own private space on the beach.',
   2,  6,  400.00,  800.00, TRUE, TRUE, 2,
   'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'),

  ('Beach Table',
   'Classic beach table for groups. Great sunset spot with DJ sets and cocktail menu.',
   2,  8,  100.00,  300.00, TRUE, FALSE, 3,
   'https://images.unsplash.com/photo-1573843981267-be1480dcd4fc?auto=format&fit=crop&w=800&q=80')
) AS t(name, description, cap_min, cap_max, p_min, p_max, active, vip, ord, photo)
WHERE  v.slug = 'playa-padre'
ON CONFLICT DO NOTHING;

-- ── Vérification finale ───────────────────────────────────────────
SELECT
  v.name   AS venue,
  vt.name  AS table_name,
  vt.capacity_min || '–' || vt.capacity_max AS capacity,
  '€' || vt.price_min AS price_from,
  CASE WHEN vt.is_vip THEN 'VIP' ELSE '' END AS vip
FROM   public.venue_tables vt
JOIN   public.venues v ON vt.venue_id = v.id
ORDER  BY v.name, vt.sort_order;
