-- =================================================================
-- Marbellapp VIP News — abonnement client (produit Stripe séparé)
-- Exécuter dans Supabase SQL Editor -> New Query -> Run
--
-- Table de suivi des abonnés "Marbellapp VIP" (essai 7j -> 19,90€/mois x6 ->
-- 49,90€/mois). Écrite UNIQUEMENT par le webhook stripe-webhook (service_role),
-- lue par l'onglet admin du dashboard. Aucun lien avec bookings / venues /
-- partner_subscriptions.
-- Script idempotent : rejouable sans erreur.
-- =================================================================

CREATE TABLE IF NOT EXISTS public.vip_subscriptions (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                   TEXT,
  email                  TEXT        NOT NULL,
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT        UNIQUE,
  stripe_schedule_id     TEXT,
  -- Statut miroir de la subscription Stripe. Liste large volontairement (tous
  -- les statuts Stripe possibles) pour que le webhook ne rejette jamais un update.
  status                 TEXT        NOT NULL DEFAULT 'trialing'
                           CHECK (status IN ('trialing', 'active', 'past_due',
                                             'canceled', 'unpaid', 'incomplete',
                                             'incomplete_expired', 'paused')),
  current_price_id       TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS vip_subscriptions_email_idx ON public.vip_subscriptions (email);

-- ── RLS : lecture réservée aux admins, écriture uniquement service_role ────────
ALTER TABLE public.vip_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vip_subscriptions admin read" ON public.vip_subscriptions;
CREATE POLICY "vip_subscriptions admin read" ON public.vip_subscriptions
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Pas de policy INSERT/UPDATE/DELETE : seul le service_role (webhook) écrit,
-- et il contourne la RLS. Aucun accès client.

-- ── Vérification ─────────────────────────────────────────────────
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'vip_subscriptions'
ORDER BY ordinal_position;
