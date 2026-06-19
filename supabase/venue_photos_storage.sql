-- =================================================================
-- Storage RLS — bucket "venues" : upload/édition réservés au propriétaire
-- Un partenaire ne peut écrire que sous le dossier de SA venue : le 1er
-- segment du chemin (storage.foldername(name))[1] doit être le slug d'une
-- venue dont owner_id = auth.uid().
--   cover   → venues/{slug}/cover.jpg
--   galerie → venues/{slug}/gallery/{ts}.jpg
-- Le bucket "venues" est public en lecture.
-- Exécuter dans Supabase SQL Editor → New Query → Run.
-- ⚠️ Nécessite que partner_onboarding.sql (venues.owner_id) soit déjà appliqué.
-- =================================================================

-- Crée le bucket s'il n'existe pas (idempotent), public en lecture.
INSERT INTO storage.buckets (id, name, public)
VALUES ('venues', 'venues', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ── INSERT (upload de nouvelles photos) ───────────────────────────
DROP POLICY IF EXISTS "Owners upload venue photos" ON storage.objects;
CREATE POLICY "Owners upload venue photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'venues'
    AND EXISTS (
      SELECT 1 FROM public.venues v
      WHERE v.slug = (storage.foldername(name))[1] AND v.owner_id = auth.uid()
    )
  );

-- ── UPDATE (upsert de la cover sur le même chemin) ────────────────
DROP POLICY IF EXISTS "Owners update venue photos" ON storage.objects;
CREATE POLICY "Owners update venue photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'venues'
    AND EXISTS (
      SELECT 1 FROM public.venues v
      WHERE v.slug = (storage.foldername(name))[1] AND v.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'venues'
    AND EXISTS (
      SELECT 1 FROM public.venues v
      WHERE v.slug = (storage.foldername(name))[1] AND v.owner_id = auth.uid()
    )
  );

-- ── DELETE (suppression cover / galerie) ──────────────────────────
DROP POLICY IF EXISTS "Owners delete venue photos" ON storage.objects;
CREATE POLICY "Owners delete venue photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'venues'
    AND EXISTS (
      SELECT 1 FROM public.venues v
      WHERE v.slug = (storage.foldername(name))[1] AND v.owner_id = auth.uid()
    )
  );

-- ── SELECT public (lecture des photos) — idempotent ───────────────
DROP POLICY IF EXISTS "Public read venue photos" ON storage.objects;
CREATE POLICY "Public read venue photos"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'venues');

-- ── Vérification : policies présentes sur le bucket ───────────────
SELECT policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
  AND policyname ILIKE '%venue photos%'
ORDER BY policyname;
