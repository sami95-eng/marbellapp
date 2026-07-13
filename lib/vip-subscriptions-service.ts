import { supabase } from "@/lib/supabase";

// Abonnement client "Marbellapp VIP" (produit Stripe séparé, admin-only).
export interface VipSubscriber {
  id: string;
  name: string | null;
  email: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_schedule_id: string | null;
  status: string;
  current_price_id: string | null;
  created_at: string;
  updated_at: string;
}

/** Génère un lien Checkout VIP pour un client (Edge Function admin-only). */
export async function createVipSubscriptionLink(name: string, email: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke("create-vip-subscription-link", {
    body: { name, email },
  });
  if (error) throw new Error(error.message);
  const url = (data as { url?: string; error?: string } | null)?.url;
  if (!url) throw new Error((data as { error?: string } | null)?.error ?? "Lien VIP indisponible");
  return url;
}

/** Liste des abonnés VIP (RLS : admin uniquement). */
export async function getVipSubscribers(): Promise<VipSubscriber[]> {
  const { data, error } = await supabase
    .from("vip_subscriptions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as VipSubscriber[];
}

// Mapping price_id → libellé, via les env publiques (test ou live selon le build).
const P1990 = process.env.EXPO_PUBLIC_STRIPE_VIP_PRICE_1990 ?? "";
const P4990 = process.env.EXPO_PUBLIC_STRIPE_VIP_PRICE_4990 ?? "";

export function vipPriceLabel(priceId: string | null): string {
  if (priceId && priceId === P4990) return "49,90€";
  if (priceId && priceId === P1990) return "19,90€";
  return "—";
}

export function vipStatusLabel(status: string): string {
  const map: Record<string, string> = {
    trialing: "Essai gratuit",
    active: "Actif",
    past_due: "Impayé",
    canceled: "Annulé",
    unpaid: "Impayé",
    incomplete: "Incomplet",
    incomplete_expired: "Expiré",
    paused: "En pause",
  };
  return map[status] ?? status;
}
