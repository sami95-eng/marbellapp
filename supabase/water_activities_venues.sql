-- =================================================================
-- Catégorie "Shopping" → "Activités Aquatiques" (Water Sports)
-- + nouvelles venues (jet ski, bateaux, sports nautiques)
-- Exécuter dans Supabase SQL Editor → New Query → Run
-- =================================================================

-- 1) Désactive les anciennes venues Shopping (centres commerciaux — hors sujet).
--    (DELETE possible à la place si tu préfères les supprimer définitivement.)
UPDATE public.venues SET is_active = false WHERE category = 'Shopping';

-- 2) Nouvelles venues "Water Sports"
INSERT INTO public.venues
  (slug, name, category, description, address, website, instagram_handle,
   cover_image_url, rating, price_range, avg_price_eur, is_partner, is_active)
VALUES
  ('jet-ski-marbella', 'Jet Ski Marbella', 'Water Sports',
   'Location de jet skis dernière génération sur la plage de Marbella. Sortie libre ou accompagnée le long de la Costa del Sol.',
   'Playa de Venus, Marbella', 'https://example.com', '@jetskimarbella',
   'https://images.unsplash.com/photo-1626447857058-2ba6a8868cb5?auto=format&fit=crop&w=800&q=80',
   4.7, '€€', 120, true, true),

  ('marbella-boat-charter', 'Marbella Boat Charter', 'Water Sports',
   'Location de bateaux et yachts avec ou sans skipper. Journées en mer, couchers de soleil et fêtes privées au large de Puerto Banús.',
   'Puerto Banús, Marbella', 'https://example.com', '@marbellaboatcharter',
   'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
   4.9, '€€€€', 900, true, true),

  ('puerto-banus-watersports', 'Puerto Banús Watersports', 'Water Sports',
   'Centre de sports nautiques : bouées tractées, ski nautique, wakeboard, paddle et plongée découverte.',
   'Muelle de Honor, Puerto Banús', 'https://example.com', '@pbwatersports',
   'https://images.unsplash.com/photo-1530870110042-98b2cb110834?auto=format&fit=crop&w=800&q=80',
   4.6, '€€', 80, false, true),

  ('parasailing-marbella', 'Parasailing Marbella', 'Water Sports',
   'Vol en parachute ascensionnel au-dessus de la baie de Marbella — vue panoramique sur la côte et la Sierra Blanca.',
   'Puerto Deportivo de Marbella', 'https://example.com', '@parasailingmarbella',
   'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=800&q=80',
   4.8, '€€', 70, false, true),

  ('flyboard-marbella', 'Flyboard Marbella', 'Water Sports',
   'Initiation et sessions de flyboard et hoverboard nautique encadrées par des moniteurs diplômés.',
   'Playa de Nagüeles, Marbella', 'https://example.com', '@flyboardmarbella',
   'https://images.unsplash.com/photo-1502933691298-84fc14542831?auto=format&fit=crop&w=800&q=80',
   4.7, '€€€', 150, false, true)
ON CONFLICT (slug) DO NOTHING;

-- 3) Vérification
SELECT slug, name, category, is_active FROM public.venues
WHERE category = 'Water Sports' ORDER BY name;
