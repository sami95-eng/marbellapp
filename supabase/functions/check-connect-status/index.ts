// Supabase Edge Function — check-connect-status
// Vérifie l'état du compte Stripe Connect du partenaire connecté et
// synchronise les drapeaux (charges_enabled / details_submitted) en base.
// Deploy  : npx supabase functions deploy check-connect-status
// Secrets : STRIPE_SECRET_KEY
//           SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY (auto)
//
// Renvoie : { connected, charges_enabled, details_submitted }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@16.12.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

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
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: venues, error: vErr } = await admin
      .from("venues")
      .select("id, stripe_account_id")
      .eq("owner_id", user.id);
    if (vErr) return json({ error: vErr.message }, 500);

    const accountId = (venues ?? []).find((v) => v.stripe_account_id)?.stripe_account_id as string | undefined;
    if (!accountId) {
      return json({ connected: false, charges_enabled: false, details_submitted: false }, 200);
    }

    // État réel côté Stripe.
    const account = await stripe.accounts.retrieve(accountId);
    const charges_enabled = !!account.charges_enabled;
    const details_submitted = !!account.details_submitted;

    // Synchronise les drapeaux en base (utilisés par create-checkout-session).
    await admin
      .from("venues")
      .update({
        stripe_charges_enabled: charges_enabled,
        stripe_details_submitted: details_submitted,
      })
      .eq("owner_id", user.id);

    return json({ connected: true, charges_enabled, details_submitted }, 200);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[check-connect-status] error:", msg);
    return json({ error: msg }, 500);
  }
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
