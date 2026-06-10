-- =================================================================
-- DIAGNOSTIC + FIX : pourquoi on ne peut confirmer qu'UNE réservation
-- Exécuter dans Supabase SQL Editor → New Query → Run
-- =================================================================

-- 1) Quelles policies existent sur bookings ? (cherche une policy "cmd = UPDATE"
--    qui autorise partner/admin ; si elle manque → c'est la cause)
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'bookings'
ORDER BY cmd, policyname;

-- 2) Quel est TON rôle ? (doit être 'partner' ou 'admin')
SELECT p.id, u.email, p.role
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'samidumont95@gmail.com';

-- 3) Répartition des statuts (pour vérifier que les autres lignes sont bien 'pending')
SELECT status, count(*) AS total FROM public.bookings GROUP BY status ORDER BY total DESC;

-- =================================================================
-- FIX — (ré)applique le rôle + les policies SELECT/UPDATE partenaire
-- =================================================================

-- 3a) Force ton compte en admin
UPDATE public.profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'samidumont95@gmail.com');

-- 3b) (Re)crée les deux policies. L'UPDATE a besoin de USING *et* WITH CHECK :
--     USING = quelles lignes existantes peuvent être ciblées,
--     WITH CHECK = ce que la ligne doit respecter APRÈS update.
DROP POLICY IF EXISTS "Partners view all bookings"  ON public.bookings;
DROP POLICY IF EXISTS "Partners update all bookings" ON public.bookings;

CREATE POLICY "Partners view all bookings"
  ON public.bookings FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('partner', 'admin'))
  );

CREATE POLICY "Partners update all bookings"
  ON public.bookings FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('partner', 'admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('partner', 'admin'))
  );

-- 4) Re-vérifie : la policy UPDATE doit maintenant apparaître
SELECT policyname, cmd FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'bookings' AND cmd = 'UPDATE';
