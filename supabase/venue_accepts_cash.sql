-- =================================================================
-- Marbell'app — "Payer à l'établissement" accepté par défaut
-- Le paiement en espèces sur place est proposé pour TOUTE venue existante,
-- indépendamment de tout abonnement partenaire. La fonction reste
-- SECURITY DEFINER (aucune donnée d'abonnement n'est exposée) et STABLE.
--
-- Historique : cette RPC vérifiait auparavant qu'un abonnement partenaire
-- 'active' existait (JOIN partner_subscriptions). Le cash a été DÉCOUPLÉ de
-- l'abonnement — on ne conserve qu'un contrôle d'existence de la venue
-- (→ false pour un UUID inconnu, true sinon).
--
-- Script idempotent : rejouable sans erreur.
-- Instructions : Supabase Dashboard → SQL Editor → New Query → RUN
-- =================================================================

CREATE OR REPLACE FUNCTION public.venue_accepts_cash(p_venue_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  -- Cash découplé de l'abonnement partenaire : toute venue EXISTANTE accepte
  -- le paiement sur place par défaut. Plus aucune dépendance à
  -- partner_subscriptions ; on garde seulement le contrôle d'existence.
  SELECT EXISTS (
    SELECT 1
    FROM public.venues v
    WHERE v.id = p_venue_id
  );
$$;

GRANT EXECUTE ON FUNCTION public.venue_accepts_cash(UUID) TO authenticated, anon;

-- ── Vérification ─────────────────────────────────────────────────
-- SELECT public.venue_accepts_cash('505c1b6b-3490-4d42-aed5-0548a98372b3'); -- true  (venue existante)
-- SELECT public.venue_accepts_cash('00000000-0000-0000-0000-000000000000'); -- false (venue inconnue)
