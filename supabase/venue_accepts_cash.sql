-- =================================================================
-- Marbell'app — "Payer à l'établissement" conditionné à l'abonnement
-- La table partner_subscriptions est protégée par RLS (partner_id = auth.uid()) :
-- un CLIENT ne peut donc pas lire l'abonnement de la venue. Cette fonction
-- SECURITY DEFINER expose uniquement un booléen "la venue accepte le cash"
-- (= son propriétaire a un abonnement partenaire actif), sans divulguer la
-- moindre donnée d'abonnement.
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
  SELECT EXISTS (
    SELECT 1
    FROM public.venues v
    JOIN public.partner_subscriptions ps ON ps.partner_id = v.owner_id
    WHERE v.id = p_venue_id
      AND ps.status = 'active'
  );
$$;

GRANT EXECUTE ON FUNCTION public.venue_accepts_cash(UUID) TO authenticated, anon;

-- ── Vérification ─────────────────────────────────────────────────
-- SELECT public.venue_accepts_cash('00000000-0000-0000-0000-000000000000');
