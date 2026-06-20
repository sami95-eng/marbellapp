// Supabase Edge Function — get-checkout-status
// Récupère le statut de paiement d'une Stripe Checkout Session.
// Deploy  : npx supabase functions deploy get-checkout-status
// Secrets : STRIPE_SECRET_KEY
//
// Body  : { sessionId }
// Renvoie : { paymentStatus, status, bookingId, amountTotal, currency }
//   paymentStatus : 'paid' | 'unpaid' | 'no_payment_required'
//   status        : 'open' | 'complete' | 'expired'

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@16.12.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { sessionId } = await req.json();
    if (!sessionId) return json({ error: "Missing sessionId" }, 400);

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return json({
      paymentStatus: session.payment_status,
      status: session.status,
      bookingId: session.metadata?.bookingId ?? null,
      amountTotal: session.amount_total,
      currency: session.currency,
    }, 200);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[get-checkout-status] error:", msg);
    return json({ error: msg }, 500);
  }
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
