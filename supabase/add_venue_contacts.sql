-- =================================================================
-- Marbell'app — Venue Contact Info (email + WhatsApp)
-- =================================================================
-- Instructions :
--   1. Supabase Dashboard → SQL Editor → New Query
--   2. Coller ce fichier → RUN
-- =================================================================

-- ─── Ajouter les colonnes de contact ─────────────────────────────
ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS contact_email    TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_number  TEXT;  -- format international sans +, ex: 34952810237

-- ─── Ocean Club Marbella ─────────────────────────────────────────
UPDATE public.venues SET
  contact_email   = 'reservations@oceanclubmarbella.com',
  whatsapp_number = '34952810237'
WHERE slug = 'ocean-club-marbella';

-- ─── Nikki Beach Marbella ────────────────────────────────────────
UPDATE public.venues SET
  contact_email   = 'marbella@nikkibeach.com',
  whatsapp_number = '34952812400'
WHERE slug = 'nikki-beach-marbella';

-- ─── La Sala by the Sea ──────────────────────────────────────────
UPDATE public.venues SET
  contact_email   = 'reservations@lasalagroup.com',
  whatsapp_number = '34952814145'
WHERE slug = 'la-sala-sea';

-- ─── Mosh Restaurant (Puerto Banús) ──────────────────────────────
UPDATE public.venues SET
  contact_email   = 'info@grupomosh.com',
  whatsapp_number = '34952814020'
WHERE slug = 'mosh-restaurant';

-- ─── Nobu Marbella ───────────────────────────────────────────────
UPDATE public.venues SET
  contact_email   = 'reservations.marbella@noburestaurants.com',
  whatsapp_number = '34952814168'
WHERE slug = 'nobu-marbella';

-- ─── Puente Romano Beach Resort ──────────────────────────────────
UPDATE public.venues SET
  contact_email   = 'reservations@puenteromano.com',
  whatsapp_number = '34952820900'
WHERE slug = 'puente-romano-beach-resort';

-- ─── Six Senses Spa Puente Romano ────────────────────────────────
UPDATE public.venues SET
  contact_email   = 'spa@puenteromano.com',
  whatsapp_number = '34952820900'
WHERE slug = 'six-senses-spa-puente-romano';

-- ─── Leña by Dani García ─────────────────────────────────────────
UPDATE public.venues SET
  contact_email   = 'lena@grupodanigarcia.com',
  whatsapp_number = '34952764252'
WHERE slug = 'lena-dani-garcia';

-- ─── Bibo Marbella (Dani García) ─────────────────────────────────
UPDATE public.venues SET
  contact_email   = 'bibo.marbella@grupodanigarcia.com',
  whatsapp_number = '34952865002'
WHERE slug = 'bibo-marbella';

-- ─── Amàre Beach Hotel Marbella ──────────────────────────────────
UPDATE public.venues SET
  contact_email   = 'reservas.marbella@amarehotels.com',
  whatsapp_number = '34952928800'
WHERE slug = 'amare-beach-hotel-marbella';

-- ─── Amàre Beach Club ────────────────────────────────────────────
UPDATE public.venues SET
  contact_email   = 'beachclub.marbella@amarehotels.com',
  whatsapp_number = '34952928801'
WHERE slug = 'amare-beach-club';

-- ─── Olivia Valere ───────────────────────────────────────────────
UPDATE public.venues SET
  contact_email   = 'reservations@oliviavalere.com',
  whatsapp_number = '34952828861'
WHERE slug = 'olivia-valere';

-- ─── Starlite Festival ───────────────────────────────────────────
UPDATE public.venues SET
  contact_email   = 'info@starlitemarbella.com',
  whatsapp_number = '34951934000'
WHERE slug = 'starlite-festival';

-- ─── Opium Marbella ──────────────────────────────────────────────
UPDATE public.venues SET
  contact_email   = 'info@opiummarbella.com',
  whatsapp_number = '34952774935'
WHERE slug = 'opium-marbella';

-- ─── Skina ───────────────────────────────────────────────────────
UPDATE public.venues SET
  contact_email   = 'info@restauranteskina.com',
  whatsapp_number = '34952765277'
WHERE slug = 'skina';

-- ─── El Lago ─────────────────────────────────────────────────────
UPDATE public.venues SET
  contact_email   = 'reservas@restauranteellago.com',
  whatsapp_number = '34952832371'
WHERE slug = 'el-lago';

-- ─── Trocadero Arena ─────────────────────────────────────────────
UPDATE public.venues SET
  contact_email   = 'info@trocaderoarena.com',
  whatsapp_number = '34952813030'
WHERE slug = 'trocadero-arena';

-- ─── Mirage Puerto Banús ─────────────────────────────────────────
UPDATE public.venues SET
  contact_email   = 'reservations@mirageclub.com',
  whatsapp_number = '34952810500'
WHERE slug = 'mirage-puerto-banus';

-- ─── Playa Padre ─────────────────────────────────────────────────
UPDATE public.venues SET
  contact_email   = 'info@playapadre.com',
  whatsapp_number = '34952836800'
WHERE slug = 'playa-padre';

-- ─── Cipriani Marbella ───────────────────────────────────────────
UPDATE public.venues SET
  contact_email   = 'marbella@cipriani.com',
  whatsapp_number = '34952818400'
WHERE slug = 'cipriani-marbella';

-- ─── Sisu Boutique Hotel ─────────────────────────────────────────
UPDATE public.venues SET
  contact_email   = 'info@sisuhotel.com',
  whatsapp_number = '34952761890'
WHERE slug = 'sisu-boutique-hotel';

-- ─── Vérification ────────────────────────────────────────────────
SELECT slug, name, contact_email, whatsapp_number
FROM public.venues
WHERE contact_email IS NOT NULL
ORDER BY name;
