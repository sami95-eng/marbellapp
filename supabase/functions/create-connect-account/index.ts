// Supabase Edge Function — create-connect-account
// Crée (ou réutilise) un compte Stripe Connect Express pour le partenaire
// connecté, puis renvoie un lien d'onboarding Stripe (AccountLink).
// Deploy  : npx supabase functions deploy create-connect-account
// Secrets : STRIPE_SECRET_KEY, APP_URL (optionnel)
//           SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY (auto)
//
// Auth    : le JWT du partenaire est transmis dans l'en-tête Authorization
//           (supabase.functions.invoke l'ajoute automatiquement).
// Renvoie : { url } — lien d'onboarding Stripe vers lequel rediriger.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@16.12.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const APP_URL = (Deno.env.get("APP_URL") ?? "https://app.marbellapp.vip").replace(/\/$/, "");
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
    // ── Identifie le partenaire à partir de son JWT ────────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // ── Venues du partenaire (owner_id) ────────────────────────────
    const { data: venues, error: vErr } = await admin
      .from("venues")
      .select("id, stripe_account_id")
      .eq("owner_id", user.id);
    if (vErr) return json({ error: vErr.message }, 500);
    if (!venues || venues.length === 0) {
      return json({ error: "Aucun établissement associé à votre compte." }, 400);
    }

    // ── Compte Connect : réutilise l'existant ou en crée un Express ─
    let accountId = (venues.find((v) => v.stripe_account_id)?.stripe_account_id as string | undefined) ?? null;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email ?? undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { owner_id: user.id },
      });
      accountId = account.id;

      // Rattache le compte à TOUTES les venues du partenaire.
      const { error: upErr } = await admin
        .from("venues")
        .update({ stripe_account_id: accountId })
        .eq("owner_id", user.id);
      if (upErr) return json({ error: upErr.message }, 500);
    }

    // ── Lien d'onboarding Stripe (retour/refresh vers le dashboard) ─
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${APP_URL}/partner-dashboard?stripe=refresh`,
      return_url: `${APP_URL}/partner-dashboard?stripe=return`,
      type: "account_onboarding",
    });

    return json({ url: link.url }, 200);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[create-connect-account] error:", msg);
    return json({ error: msg }, 500);
  }
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
