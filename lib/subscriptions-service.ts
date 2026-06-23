import { supabase } from "@/lib/supabase";

export type SubscriptionPlan = "starter" | "pro" | "premium";

export interface PartnerSubscription {
  id: string;
  partner_id: string;
  plan: SubscriptionPlan;
  price_eur: number;
  cash_fee_eur: number;
  status: "active" | "cancelled" | "expired";
  started_at: string;
  expires_at: string | null;
}

/** Total dû en espèces pour le mois en cours (vue partner_cash_fees_monthly). */
export interface PartnerCashFees {
  partner_id: string;
  plan: SubscriptionPlan;
  cash_fee_eur: number;
  nb_cash_bookings: number;
  amount_due_eur: number;
}

/** Libellés FR des formules (affichage dashboard). */
export const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  starter: "Starter",
  pro:     "Pro",
  premium: "Premium",
};

/**
 * Abonnement actif du partenaire connecté. La RLS (partner_id = auth.uid())
 * garantit qu'on ne lit que le sien. Renvoie null si aucun abonnement actif.
 */
export async function getMySubscription(
  partnerId: string
): Promise<PartnerSubscription | null> {
  const { data, error } = await supabase
    .from("partner_subscriptions")
    .select("*")
    .eq("partner_id", partnerId)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as PartnerSubscription | null) ?? null;
}

/**
 * Compteur de réservations espèces + montant dû du mois en cours pour le
 * partenaire connecté. La vue (security_invoker) applique la RLS de l'appelant.
 * Renvoie null si le partenaire n'a pas d'abonnement actif.
 */
export async function getMyCashFeesThisMonth(
  partnerId: string
): Promise<PartnerCashFees | null> {
  const { data, error } = await supabase
    .from("partner_cash_fees_monthly")
    .select("*")
    .eq("partner_id", partnerId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  const r = data as any;
  return {
    partner_id:       r.partner_id,
    plan:             r.plan,
    cash_fee_eur:     Number(r.cash_fee_eur) || 0,
    nb_cash_bookings: Number(r.nb_cash_bookings) || 0,
    amount_due_eur:   Number(r.amount_due_eur) || 0,
  };
}
