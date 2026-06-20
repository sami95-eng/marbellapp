// Supabase Edge Function — stripe-webhook
// Reçoit les événements Stripe, vérifie la signature, et confirme la
// réservation quand le paiement Checkout aboutit.
// Deploy  : npx supabase functions deploy stripe-webhook --no-verify-jwt
// Secrets : STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
//
// ⚠️ --no-verify-jwt est requis : Stripe appelle l'URL sans JWT Supabase ;
//    la sécurité vient de la vérification de signature Stripe ci-dessous.
//
// HYPOTHÈSE (à confirmer — ta consigne pour ce point était tronquée) :
//   checkout.session.completed → bookings.status = 'confirmed'.
//   Si tu préfères découpler paiement et confirmation partenaire, on ajoutera
//   plutôt une colonne dédiée (ex. payment_status / paid_at).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@16.12.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});
const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
// Provider crypto asynchrone requis pour la vérif de signature côté Deno.
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const admin = SUPABASE_URL && SERVICE_ROLE ? createClient(SUPABASE_URL, SERVICE_ROLE) : null;

serve(async (req: Request) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  if (!signature || !WEBHOOK_SECRET) {
    return new Response("Missing signature or webhook secret", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body, signature, WEBHOOK_SECRET, undefined, cryptoProvider,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[webhook] signature verification failed:", msg);
    return new Response(`Webhook signature verification failed: ${msg}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.bookingId;
        // Ne confirme que si le paiement est réellement réglé.
        if (bookingId && admin && session.payment_status === "paid") {
          const { error } = await admin
            .from("bookings")
            .update({ status: "confirmed" })
            .eq("id", bookingId);
          if (error) console.error("[webhook] booking update failed:", error.message);
          else console.warn(`[webhook] booking ${bookingId} confirmé (paiement OK)`);
        }
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.warn(`[webhook] session expirée pour booking ${session.metadata?.bookingId ?? "?"}`);
        break;
      }
      default:
        // Autres événements ignorés.
        break;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[webhook] handler error:", msg);
    // On renvoie 200 pour éviter les retries infinis si l'erreur n'est pas Stripe.
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
