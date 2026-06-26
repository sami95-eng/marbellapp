// Supabase Edge Function — create-checkout-session
// Crée une session Stripe Checkout pour payer une réservation.
// Deploy  : npx supabase functions deploy create-checkout-session
// Secrets : STRIPE_SECRET_KEY, APP_URL (optionnel, défaut ci-dessous)
//
// Body reçu : { bookingId, venueId, amount, currency? }
//   amount = montant en PLUS PETITE UNITÉ (centimes EUR), ex. 5000 = 50,00 €.
// Renvoie  : { url } — URL de la page Checkout vers laquelle rediriger.
//
// ⚠️ Commission (application_fee_amount = 10%) : nécessite Stripe Connect.
//    Elle n'est appliquée que si la venue a un compte connecté ET vérifié
//    (venues.stripe_account_id + stripe_charges_enabled). Sinon : paiement
//    simple, sans commission (la plateforme encaisse tout) + warning.
//    L'onboarding se fait via create-connect-account / check-connect-status.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@16.12.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const APP_URL = (Deno.env.get("APP_URL") ?? "https://app.marbellapp.vip").replace(/\/$/, "");
const COMMISSION_RATE = 0.10; // 10% pour Marbell'app

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const admin = SUPABASE_URL && SERVICE_ROLE ? createClient(SUPABASE_URL, SERVICE_ROLE) : null;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { bookingId, venueId, amount, currency = "eur" } = await req.json();

    if (!bookingId || !venueId || amount == null) {
      return json({ error: "Missing fields: bookingId, venueId, amount" }, 400);
    }
    const amt = Math.round(Number(amount));
    if (!Number.isFinite(amt) || amt <= 0) {
      return json({ error: "Invalid amount (expected positive integer, in cents)" }, 400);
    }

    // Nom de la venue + compte Stripe connecté (pour la commission).
    let venueName = "Réservation";
    let connectedAccount: string | null = null;
    let chargesEnabled = false;
    if (admin) {
      const { data } = await admin
        .from("venues").select("name, stripe_account_id, stripe_charges_enabled").eq("id", venueId).maybeSingle();
      if (data?.name) venueName = data.name as string;
      const v = data as { stripe_account_id?: string; stripe_charges_enabled?: boolean } | null;
      connectedAccount = v?.stripe_account_id ?? null;
      chargesEnabled = !!v?.stripe_charges_enabled;
    }

    const fee = Math.round(amt * COMMISSION_RATE);

    // Données du PaymentIntent : metadata toujours ; commission + reversement
    // seulement si la venue a un compte connecté VÉRIFIÉ (charges_enabled).
    // Sinon Stripe rejette application_fee_amount/transfer_data → paiement
    // simple, la plateforme encaisse tout (comportement par défaut).
    const paymentIntentData: Record<string, unknown> = {
      metadata: { bookingId, venueId },
    };
    if (connectedAccount && chargesEnabled) {
      paymentIntentData.application_fee_amount = fee;
      paymentIntentData.transfer_data = { destination: connectedAccount };
    } else {
      console.warn(`[checkout] venue ${venueId} sans compte Stripe connecté vérifié → commission non prélevée`);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: amt,
            product_data: {
              name: `Réservation — ${venueName}`,
              description: `Réservation Marbell'app · réf ${bookingId}`,
            },
          },
        },
      ],
      payment_intent_data: paymentIntentData,
      success_url: `${APP_URL}/booking-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/booking`,
      metadata: { bookingId, venueId },
    });

    return json({ url: session.url }, 200);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[checkout] error:", msg);
    return json({ error: msg }, 500);
  }
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
