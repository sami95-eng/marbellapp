-- =================================================================
-- Nouveaux établissements (Groupe Casanis, Groupe Trocadero, Divot)
-- + suppression de la discothèque Olivia Valère (fermée)
-- + LOV et Nao conservés en tant que restaurants
-- Exécuter dans Supabase SQL Editor → New Query → Run
-- =================================================================

-- 1) Soft delete de la discothèque Olivia Valère (fermée) : is_active = false.
--    On NE supprime PAS la ligne (préserve les FK : bookings, reviews, etc.).
--    LOV et Nao (restaurants) ne sont PAS concernés.
UPDATE public.venues
SET is_active = false
WHERE slug = 'olivia-valere'
   OR (category = 'Nightlife' AND name ILIKE '%olivia val%re%');

-- 2) Nouveaux établissements
INSERT INTO public.venues
  (slug, name, group_name, category, description, address, website, instagram_handle,
   cover_image_url, rating, price_range, avg_price_eur, is_partner, is_active)
VALUES
  -- ── Groupe Casanis ───────────────────────────────────────────────
  ('casanis-bistrot', 'Casanis Bistrot', 'Groupe Casanis', 'Fine Dining',
   'Bistrot français emblématique du centre historique de Marbella : cuisine méditerranéenne raffinée dans une ambiance chaleureuse.',
   'Calle Ancha 8, Casco Antiguo, Marbella', 'https://casanis.es', '@casanisbistrot',
   'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
   4.7, '€€€', 70, true, true),

  ('la-plage-casanis', 'La Plage Casanis', 'Groupe Casanis', 'Beach Club',
   'Restaurant de plage chic signé Casanis : pieds dans le sable, cuisine méditerranéenne et cocktails au coucher du soleil.',
   'Playa, Marbella', 'https://casanis.es', '@laplagecasanis',
   'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80',
   4.6, '€€€€', 90, true, true),

  ('mamzel-finca-besaya', 'Mamzel at Finca Besaya', 'Groupe Casanis', 'Nightlife',
   'Restaurant-spectacle glamour à Finca Besaya : dîner, musique live et show jusque tard dans la nuit.',
   'Finca Besaya, Río Verde, Marbella', 'https://casanis.es', '@mamzelmarbella',
   'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?auto=format&fit=crop&w=800&q=80',
   4.5, '€€€€', 120, true, true),

  ('nota-blu-brasserie', 'Nota Blu New Brasserie', 'Groupe Casanis', 'Fine Dining',
   'Brasserie contemporaine : produits de la mer, viandes maturées et carte des vins pointue.',
   'Marbella', 'https://casanis.es', '@notablumarbella',
   'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80',
   4.6, '€€€', 75, true, true),

  ('le-jade-marbella', 'Le Jade Marbella', 'Groupe Casanis', 'Fine Dining',
   'Cuisine asiatique haut de gamme : sushi, plats signature et ambiance feutrée.',
   'Marbella', 'https://casanis.es', '@lejademarbella',
   'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
   4.6, '€€€€', 95, true, true),

  -- ── Groupe Trocadero ─────────────────────────────────────────────
  ('trocadero-arena', 'Trocadero Arena', 'Grupo Trocadero', 'Beach Club',
   'Beach club iconique sur la plage de Marbella : gastronomie méditerranéenne, transats et coucher de soleil.',
   'Playa de la Bajadilla, Marbella', 'https://www.grupotrocadero.com', '@trocaderoarena',
   'https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?auto=format&fit=crop&w=800&q=80',
   4.7, '€€€€', 100, true, true),

  ('trocadero-playa', 'Trocadero Playa', 'Grupo Trocadero', 'Beach Club',
   'L''élégance en bord de mer : cuisine raffinée et service impeccable face à la Méditerranée.',
   'Urb. Río Verde Playa, Marbella', 'https://www.grupotrocadero.com', '@trocaderoplaya',
   'https://images.unsplash.com/photo-1530870110042-98b2cb110834?auto=format&fit=crop&w=800&q=80',
   4.7, '€€€€', 110, true, true),

  ('trocadero-petit-playa', 'Trocadero Petit Playa', 'Grupo Trocadero', 'Beach Club',
   'Le petit frère intimiste de Trocadero : ambiance détendue, poissons frais et cocktails.',
   'Marbella', 'https://www.grupotrocadero.com', '@trocaderopetit',
   'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=800&q=80',
   4.6, '€€€', 80, true, true),

  -- ── Divot ────────────────────────────────────────────────────────
  ('divot-gastro-grill', 'Divot Gastro Grill', NULL, 'Fine Dining',
   'Gastro grill au Banús Executive Golf : viandes à la braise, brunchs et vue sur le green.',
   'Banús Executive Golf, Nueva Andalucía, Marbella', 'https://example.com', '@divotmarbella',
   'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80',
   4.5, '€€€', 55, false, true)
ON CONFLICT (slug) DO NOTHING;

-- 3) LOV et Nao : conservés / créés en tant que RESTAURANTS (Fine Dining)
INSERT INTO public.venues
  (slug, name, category, description, address, website, instagram_handle,
   cover_image_url, rating, price_range, avg_price_eur, is_partner, is_active)
VALUES
  ('lov-marbella', 'LOV Marbella', 'Fine Dining',
   'Restaurant chic et végétal (ex-restaurant Olivia Valère) : cuisine healthy et créative dans un cadre raffiné.',
   'Ctra. de Istán, Marbella', 'https://example.com', '@lovmarbella',
   'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=800&q=80',
   4.5, '€€€', 65, false, true),

  ('nao-marbella', 'Nao', 'Fine Dining',
   'Restaurant méditerranéen et lounge : cuisine de partage et ambiance élégante.',
   'Marbella', 'https://example.com', '@naomarbella',
   'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?auto=format&fit=crop&w=800&q=80',
   4.5, '€€€', 60, false, true)
ON CONFLICT (slug) DO UPDATE
  SET category = 'Fine Dining', is_active = true;

-- =================================================================
-- 4) VRAIES PHOTOS — à remplir avec les URLs officielles
-- -----------------------------------------------------------------
-- Les cover_image_url ci-dessus sont des photos Unsplash génériques
-- (fonctionnelles). Pour les VRAIES photos :
--   Méthode recommandée — Supabase Storage (bucket "venues", déjà créé) :
--     1. Dashboard → Storage → bucket venues → upload la photo de chaque venue
--        (bucket public, ou génère une URL signée longue durée).
--     2. Copie l'URL publique et colle-la ci-dessous, puis décommente.
--   Alternative : colle directement une URL d'image hotlinkable du site
--   officiel (souvent .../wp-content/uploads/...jpg).
--   ⚠️ NE PAS utiliser d'URL Instagram (scontent…) : référer-lockée + expire.
--
-- UPDATE public.venues SET cover_image_url = 'https://…' WHERE slug = 'casanis-bistrot';
-- UPDATE public.venues SET cover_image_url = 'https://…' WHERE slug = 'la-plage-casanis';
-- UPDATE public.venues SET cover_image_url = 'https://…' WHERE slug = 'mamzel-finca-besaya';
-- UPDATE public.venues SET cover_image_url = 'https://…' WHERE slug = 'nota-blu-brasserie';
-- UPDATE public.venues SET cover_image_url = 'https://…' WHERE slug = 'le-jade-marbella';
-- UPDATE public.venues SET cover_image_url = 'https://…' WHERE slug = 'trocadero-arena';
-- UPDATE public.venues SET cover_image_url = 'https://…' WHERE slug = 'trocadero-playa';
-- UPDATE public.venues SET cover_image_url = 'https://…' WHERE slug = 'trocadero-petit-playa';
-- UPDATE public.venues SET cover_image_url = 'https://…' WHERE slug = 'divot-gastro-grill';
-- UPDATE public.venues SET cover_image_url = 'https://…' WHERE slug = 'lov-marbella';
-- UPDATE public.venues SET cover_image_url = 'https://…' WHERE slug = 'nao-marbella';

-- 5) Vérification
SELECT slug, name, group_name, category, is_active, cover_image_url FROM public.venues
WHERE group_name IN ('Groupe Casanis', 'Grupo Trocadero')
   OR slug IN ('divot-gastro-grill', 'lov-marbella', 'nao-marbella')
ORDER BY group_name NULLS LAST, name;
