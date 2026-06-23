-- =================================================================
-- Abonnement partenaire + paiement à l'établissement (cash)
-- Exécuter dans Supabase SQL Editor → New Query → Run
--
-- Prérequis : partner_onboarding.sql (venues.owner_id) doit être appliqué,
-- car le rattachement partenaire ⇄ réservations passe par venues.owner_id.
-- =================================================================

-- ──────────────────────────────────────────────────────────────────
-- 0) BOOKINGS — mode de paiement (carte Stripe par défaut, ou espèces)
-- ──────────────────────────────────────────────────────────────────
-- Colonne nullable-safe avec défaut 'card' : les réservations existantes
-- restent 'card', et toute réservation "Payer à l'établissement" est 'cash'.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'card'
    CHECK (payment_method IN ('card', 'cash'));

CREATE INDEX IF NOT EXISTS bookings_payment_method_idx ON public.bookings (payment_method);

-- ──────────────────────────────────────────────────────────────────
-- 1) PARTNER_SUBSCRIPTIONS — formule d'abonnement d'un partenaire
-- ──────────────────────────────────────────────────────────────────
-- Modèle économique : l'abonnement mensuel (price_eur) donne droit à un
-- tarif réduit par réservation réglée en espèces (cash_fee_eur), facturé
-- en fin de mois (voir la vue partner_cash_fees_monthly plus bas).
CREATE TABLE IF NOT EXISTS public.partner_subscriptions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan         TEXT        NOT NULL CHECK (plan IN ('starter', 'pro', 'premium')),
  price_eur    INTEGER     NOT NULL,                       -- 99 / 199 / 299
  cash_fee_eur INTEGER     NOT NULL,                       -- 15 / 8 / 5 selon plan
  status       TEXT        NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active', 'cancelled', 'expired')),
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ,
  -- Garantit la cohérence formule ⇄ tarifs (évite les combinaisons invalides).
  CONSTRAINT partner_subscriptions_pricing_chk CHECK (
    (plan = 'starter' AND price_eur = 99  AND cash_fee_eur = 15) OR
    (plan = 'pro'     AND price_eur = 199 AND cash_fee_eur = 8)  OR
    (plan = 'premium' AND price_eur = 299 AND cash_fee_eur = 5)
  )
);

-- Un seul abonnement ACTIF par partenaire (les abonnements passés restent en base).
CREATE UNIQUE INDEX IF NOT EXISTS partner_subscriptions_one_active_idx
  ON public.partner_subscriptions (partner_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS partner_subscriptions_partner_idx
  ON public.partner_subscriptions (partner_id);

-- ── RLS ───────────────────────────────────────────────────────────
ALTER TABLE public.partner_subscriptions ENABLE ROW LEVEL SECURITY;

-- Le partenaire voit (lecture seule) son propre abonnement.
DROP POLICY IF EXISTS "Partners view their subscription" ON public.partner_subscriptions;
CREATE POLICY "Partners view their subscription"
  ON public.partner_subscriptions FOR SELECT
  USING (partner_id = auth.uid());

-- Les admins voient et gèrent tout (création/MAJ des formules se fait côté admin).
DROP POLICY IF EXISTS "Admins manage subscriptions" ON public.partner_subscriptions;
CREATE POLICY "Admins manage subscriptions"
  ON public.partner_subscriptions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ──────────────────────────────────────────────────────────────────
-- 2) VUE — total dû en espèces pour le mois en cours, par partenaire
-- ──────────────────────────────────────────────────────────────────
-- security_invoker = on : la vue applique la RLS de l'appelant. Un partenaire
-- ne voit donc que SA ligne (RLS partner_subscriptions + RLS bookings de ses
-- venues), un admin voit tout. Pas de fuite de données entre partenaires.
DROP VIEW IF EXISTS public.partner_cash_fees_monthly;
CREATE VIEW public.partner_cash_fees_monthly
  WITH (security_invoker = on) AS
SELECT
  ps.partner_id,
  ps.plan,
  ps.cash_fee_eur,
  COUNT(b.id)                      AS nb_cash_bookings,
  COUNT(b.id) * ps.cash_fee_eur    AS amount_due_eur
FROM public.partner_subscriptions ps
LEFT JOIN public.venues v
  ON v.owner_id = ps.partner_id
LEFT JOIN public.bookings b
  ON b.venue_id = v.id
  AND b.payment_method = 'cash'
  AND b.status <> 'cancelled'
  AND b.created_at >= date_trunc('month', NOW())
WHERE ps.status = 'active'
GROUP BY ps.partner_id, ps.plan, ps.cash_fee_eur;

GRANT SELECT ON public.partner_cash_fees_monthly TO authenticated;

-- ── Vérification ─────────────────────────────────────────────────
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'partner_subscriptions'
ORDER BY ordinal_position;

SELECT 'bookings.payment_method' AS check, column_name, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'payment_method';
