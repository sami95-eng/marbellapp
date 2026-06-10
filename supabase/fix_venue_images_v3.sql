-- =================================================================
-- Fix venue images v3 — correction photos incorrectes
-- (Puente Romano affichait un graphique ; venues avec photos génériques)
--
-- Sources OFFICIELLES vérifiées (HTTP 200, y compris avec referer
-- étranger → hotlink OK dans le navigateur) :
--   • puenteromano.com  (aérienne drone officielle)
--   • oceanclub.es      (vrai site officiel ; oceanclubmarbella.com = domaine mort/NXDOMAIN)
--   • nikkibeach.com    (hero officiel Marbella)
--   • Unsplash          (Olivia Valere : site officiel bloque le hotlink 403,
--                         photo lounge élégante vérifiée + unique à la place)
--
-- Exécuter dans Supabase SQL Editor → New Query → Run
-- =================================================================

-- ── PUENTE ROMANO (hôtel) ─────────────────────────────────────────
-- Note : l'URL officielle puenteromano.com servait une page anti-bot/WAF
-- aux navigateurs tiers (→ image cassée « graphique »). Remplacée par une
-- photo Unsplash vérifiée (hôtel de luxe en bord de mer, piscine au crépuscule).
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80']
WHERE slug = 'hotel-puente-romano';

-- ── OCEAN CLUB ────────────────────────────────────────────────────
-- Photo officielle oceanclub.es : piscine, daybeds ronds, parasols, mer
-- + correction du site officiel (oceanclubmarbella.com = domaine mort)
UPDATE public.venues SET
  cover_image_url = 'https://oceanclub.es/app/uploads/2025/06/home-3.png',
  images = ARRAY['https://oceanclub.es/app/uploads/2025/06/home-3.png'],
  website = 'https://oceanclub.es'
WHERE slug = 'ocean-club';

-- ── NIKKI BEACH ───────────────────────────────────────────────────
-- Hero officiel nikkibeach.com (via CDN Photon i0.wp.com)
UPDATE public.venues SET
  cover_image_url = 'https://i0.wp.com/nikkibeach.com/marbella/wp-content/uploads/sites/6/2024/10/Hero_Marbella.jpg?ssl=1&w=2500&quality=85',
  images = ARRAY['https://i0.wp.com/nikkibeach.com/marbella/wp-content/uploads/sites/6/2024/10/Hero_Marbella.jpg?ssl=1&w=2500&quality=85']
WHERE slug = 'nikki-beach';

-- ── OLIVIA VALERE ─────────────────────────────────────────────────
-- Site officiel = hotlink 403 (referer étranger) → photo Unsplash
-- lounge nightclub élégant (bar courbe doré), vérifiée + unique
UPDATE public.venues SET
  cover_image_url = 'https://images.unsplash.com/photo-1567760200592-13504b6d495a?auto=format&fit=crop&w=800&q=80',
  images = ARRAY['https://images.unsplash.com/photo-1567760200592-13504b6d495a?auto=format&fit=crop&w=800&q=80']
WHERE slug = 'olivia-valere';

-- =================================================================
-- VÉRIFICATION — voir les 4 lignes mises à jour
-- =================================================================
SELECT slug, name, cover_image_url
FROM public.venues
WHERE slug IN ('hotel-puente-romano', 'ocean-club', 'nikki-beach', 'olivia-valere')
ORDER BY slug;

-- Contrôle anti-doublon — doit retourner 0 ligne
SELECT cover_image_url, COUNT(*) AS n, STRING_AGG(name, ', ') AS venues
FROM public.venues
WHERE is_active = TRUE
GROUP BY cover_image_url
HAVING COUNT(*) > 1
ORDER BY n DESC;
