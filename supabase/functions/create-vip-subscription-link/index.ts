// Supabase Edge Function — create-vip-subscription-link
// Génère un lien Stripe Checkout (mode subscription) pour l'abonnement
// "Marbellapp VIP" : essai 7 j, puis 19,90€/mois. La montée à 49,90€ au 7e mois
// est pilotée par le webhook (Subscription Schedule) — pas ici.
// Deploy  : npx supabase functions deploy create-vip-subscription-link
// Secrets : STRIPE_SECRET_KEY (live) / STRIPE_SECRET_KEY_TEST (phase de test),
//           STRIPE_VIP_PRICE_1990, STRIPE_VIP_PRICE_4990,
//           SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY (auto)
//
// Auth    : réservé aux admins (JWT + profiles.role = 'admin').
// Body    : { name, email }
// Renvoie : { url } — lien Checkout à transmettre au client.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@16.12.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

// STRIPE_SECRET_KEY_TEST prioritaire pendant la phase de validation ; sinon live.
const stripe = new Stripe(
  Deno.env.get("STRIPE_SECRET_KEY_TEST") ?? Deno.env.get("STRIPE_SECRET_KEY") ?? "",
  { apiVersion: "2024-06-20", httpClient: Stripe.createFetchHttpClient() },
);

const PRICE_1990 = Deno.env.get("STRIPE_VIP_PRICE_1990") ?? "";
const PRICE_4990 = Deno.env.get("STRIPE_VIP_PRICE_4990") ?? "";
// App Expo (routing SPA) → /vip-merci résout via le rewrite ; la landing statique
// marbellapp.vip n'a pas cette route (404). Surchargable par le secret VIP_APP_URL.
const VIP_APP_URL = (Deno.env.get("VIP_APP_URL") ?? "https://app.marbellapp.vip").replace(/\/$/, "");

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    if (!PRICE_1990 || !PRICE_4990) {
      return json({ error: "Prix VIP non configurés (STRIPE_VIP_PRICE_1990 / _4990)." }, 500);
    }

    // ── Auth : admin uniquement ────────────────────────────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Unauthorized" }, 401);
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: profile } = await admin
      .from("profiles").select("role").eq("id", user.id).maybeSingle();
    if ((profile as { role?: string } | null)?.role !== "admin") {
      return json({ error: "Réservé aux administrateurs." }, 403);
    }

    // ── Input ──────────────────────────────────────────────────────
    const { name, email } = await req.json();
    const cleanEmail = String(email ?? "").trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return json({ error: "Email invalide." }, 400);
    }
    const cleanName = String(name ?? "").trim();

    // ── Customer : réutilise par email, sinon crée ─────────────────
    const existing = await stripe.customers.list({ email: cleanEmail, limit: 1 });
    const customer = existing.data[0] ?? await stripe.customers.create({
      email: cleanEmail,
      name: cleanName || undefined,
    });

    // ── Checkout Session (subscription) ────────────────────────────
    // metadata posée AUSSI au niveau session (pour le filtre webhook au niveau
    // checkout.session.completed) ET sur la subscription (events ultérieurs).
    const vipMeta = { vip_upgrade_price_id: PRICE_4990, vip_upgrade_after_months: "6", vip_name: cleanName };
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customer.id,
      // Carte + prélèvement SEPA (IBAN). SEPA doit être activé sur le compte
      // Stripe (Settings → Payment methods). Le mandat est confirmé au checkout ;
      // le 1er prélèvement n'intervient qu'à la fin de l'essai (7 j).
      payment_method_types: ["card", "sepa_debit"],
      line_items: [{ price: PRICE_1990, quantity: 1 }],
      subscription_data: { trial_period_days: 7, metadata: vipMeta },
      metadata: vipMeta,
      success_url: `${VIP_APP_URL}/vip-merci`,
      cancel_url: `${VIP_APP_URL}`,
    });

    return json({ url: session.url }, 200);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[create-vip-subscription-link] error:", msg);
    return json({ error: msg }, 500);
  }
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
