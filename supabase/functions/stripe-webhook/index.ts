// Supabase Edge Function — stripe-webhook
// Reçoit les événements Stripe, vérifie la signature, et déclenche l'ÉTAPE 1 du
// flow de réservation quand le paiement Checkout aboutit.
// Deploy  : npx supabase functions deploy stripe-webhook --no-verify-jwt
// Secrets : STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
//
// ⚠️ --no-verify-jwt est requis : Stripe appelle l'URL sans JWT Supabase ;
//    la sécurité vient de la vérification de signature Stripe ci-dessous.
//
// FLOW EN 2 ÉTAPES :
//   checkout.session.completed (payé) → la réservation RESTE 'pending' ; on
//   notifie le client que le paiement est reçu et que sa demande est transmise
//   à la venue (étape 1). La confirmation (status='confirmed', étape 2) est
//   déclenchée manuellement par la venue depuis le dashboard partenaire.

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

        // ── VIP News (abonnement client) : discriminé par mode "subscription" +
        //    metadata VIP. N'interfère JAMAIS avec la réservation ci-dessous
        //    (mode "payment" + bookingId). Traité puis on sort.
        if (session.mode === "subscription" && session.metadata?.vip_upgrade_price_id && admin) {
          await handleVipCheckout(session);
          break;
        }

        const bookingId = session.metadata?.bookingId;
        // ÉTAPE 1 du flow : paiement reçu. La réservation RESTE 'pending' — elle
        // n'est confirmée qu'après validation manuelle de la venue (étape 2,
        // déclenchée côté dashboard partenaire). On notifie ici le client que sa
        // demande est transmise (+ alerte venue/admin).
        if (bookingId && admin && session.payment_status === "paid") {
          const { data: booking, error: bErr } = await admin
            .from("bookings")
            .select("user_id, user_email, user_name, venue_id, venue_name, date, time, guests, table_name, table_price, notes, phone_number, confirmation_number, payment_notified_at")
            .eq("id", bookingId)
            .maybeSingle();

          if (bErr || !booking) {
            console.error("[webhook] booking introuvable:", bErr?.message ?? bookingId);
            break;
          }

          // Idempotence : si l'email étape 1 a déjà été envoyé, on s'arrête.
          if (booking.payment_notified_at) {
            console.warn(`[webhook] booking ${bookingId} déjà notifié (${booking.payment_notified_at}) — skip`);
            break;
          }

          // Claim atomique : on ne notifie QUE si on parvient à passer la colonne
          // de NULL → now() (UPDATE ... WHERE payment_notified_at IS NULL). Si un
          // retry concurrent l'a déjà fait, 0 ligne renvoyée → on n'envoie pas.
          const { data: claimed } = await admin
            .from("bookings")
            .update({ payment_notified_at: new Date().toISOString() })
            .eq("id", bookingId)
            .is("payment_notified_at", null)
            .select("id")
            .maybeSingle();

          if (!claimed) {
            console.warn(`[webhook] booking ${bookingId} notifié en parallèle — skip`);
            break;
          }

          // Contacts de la venue (email + WhatsApp) pour l'alerte partenaire.
          let venueEmail: string | undefined;
          let venueWhatsapp: string | undefined;
          if (booking.venue_id) {
            const { data: venue } = await admin
              .from("venues").select("contact_email, whatsapp_number")
              .eq("id", booking.venue_id).maybeSingle();
            venueEmail = (venue as { contact_email?: string } | null)?.contact_email ?? undefined;
            venueWhatsapp = (venue as { whatsapp_number?: string } | null)?.whatsapp_number ?? undefined;
          }

          if (booking.user_email) {
            const { error: nErr } = await admin.functions.invoke("booking-notification", {
              body: {
                paid:               "true", // wording "Paiement reçu" (étape 1 carte)
                userId:             booking.user_id ?? undefined,
                userEmail:          booking.user_email,
                userName:           booking.user_name ?? booking.user_email.split("@")[0],
                venueName:          booking.venue_name ?? "",
                venueEmail,
                venueWhatsapp,
                date:               booking.date ?? "",
                time:               booking.time ?? "",
                guests:             String(booking.guests ?? ""),
                tableName:          booking.table_name ?? undefined,
                tablePrice:         booking.table_price != null ? String(booking.table_price) : undefined,
                notes:              booking.notes ?? undefined,
                userPhone:          booking.phone_number ?? undefined,
                confirmationNumber: booking.confirmation_number ?? undefined,
              },
            });
            if (nErr) console.error("[webhook] booking-notification failed:", nErr.message);
            else console.warn(`[webhook] paiement reçu booking ${bookingId} → étape 1 notifiée (status reste pending)`);
          }
        }
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.warn(`[webhook] session expirée pour booking ${session.metadata?.bookingId ?? "?"}`);
        break;
      }
      // ── Sync Connect (LIVE) : quand un compte partenaire change (fin de KYC,
      //    activation des paiements/payouts…), Stripe envoie account.updated. On
      //    répercute charges/details/payouts en base (colonnes LIVE) via
      //    stripe_account_id, sans appel manuel à check-connect-status.
      //    ⚠️ Requiert que l'endpoint écoute les events des comptes connectés
      //    (Connect). Colonne stripe_payouts_enabled : voir
      //    supabase/stripe_connect_payouts.sql.
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        if (!admin) break;
        const { data: synced, error: aErr } = await admin
          .from("venues")
          .update({
            stripe_charges_enabled:   !!account.charges_enabled,
            stripe_details_submitted: !!account.details_submitted,
            stripe_payouts_enabled:   !!account.payouts_enabled,
          })
          .eq("stripe_account_id", account.id)
          .select("id");
        if (aErr) {
          console.error(`[webhook] account.updated sync échouée pour ${account.id}:`, aErr.message);
        } else {
          console.warn(`[webhook] account.updated ${account.id} → ${synced?.length ?? 0} venue(s) synchronisée(s) (charges=${account.charges_enabled}, details=${account.details_submitted}, payouts=${account.payouts_enabled})`);
        }
        break;
      }
      // ── VIP News : bascule de phase (M6 : 19,90→49,90) + changements de statut ──
      case "customer.subscription.updated": {
        if (!admin) break;
        const sub = event.data.object as Stripe.Subscription;
        const priceId = sub.items.data[0]?.price?.id ?? null;
        const { data: rows, error: uErr } = await admin
          .from("vip_subscriptions")
          .update({ status: sub.status, current_price_id: priceId, updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", sub.id)
          .select("id");
        if (uErr) console.error(`[webhook] VIP subscription.updated ${sub.id}:`, uErr.message);
        else console.warn(`[webhook] VIP subscription.updated ${sub.id} → ${rows?.length ?? 0} ligne(s) (status=${sub.status}, price=${priceId})`);
        break;
      }
      case "customer.subscription.deleted": {
        if (!admin) break;
        const sub = event.data.object as Stripe.Subscription;
        const { error: dErr } = await admin
          .from("vip_subscriptions")
          .update({ status: "canceled", updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", sub.id);
        if (dErr) console.error(`[webhook] VIP subscription.deleted ${sub.id}:`, dErr.message);
        else console.warn(`[webhook] VIP subscription.deleted ${sub.id} → canceled`);
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

// ── VIP News — traite un checkout.session.completed (mode subscription) : crée le
//    Subscription Schedule (phase 1 = prix actuel jusqu'à trial_end + N mois, trial
//    préservé ; phase 2 = 49,90€ puis end_behavior "release" = indéfini) et
//    enregistre l'abonné dans vip_subscriptions. Idempotent (skip si déjà traité).
async function handleVipCheckout(session: Stripe.Checkout.Session): Promise<void> {
  if (!admin) return;
  const subscriptionId = typeof session.subscription === "string" ? session.subscription : null;
  const upgradePriceId = session.metadata?.vip_upgrade_price_id;
  const afterMonths = parseInt(session.metadata?.vip_upgrade_after_months ?? "6") || 6;
  if (!subscriptionId || !upgradePriceId) return;

  // Idempotence : déjà enregistré (retry webhook) → stop.
  const { data: existingRow } = await admin
    .from("vip_subscriptions").select("id").eq("stripe_subscription_id", subscriptionId).maybeSingle();
  if (existingRow) {
    console.warn(`[webhook] VIP ${subscriptionId} déjà traité — skip`);
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const currentPriceId = subscription.items.data[0]?.price?.id ?? null;

  // Crée le schedule seulement s'il n'est pas déjà attaché (double idempotence).
  let scheduleId = typeof subscription.schedule === "string" ? subscription.schedule : null;
  if (!scheduleId && currentPriceId) {
    const sched = await stripe.subscriptionSchedules.create({ from_subscription: subscriptionId });
    const startDate = sched.phases[0].start_date;
    const trialEnd = subscription.trial_end ?? undefined;
    const base = trialEnd ?? startDate;
    const d = new Date(base * 1000);
    d.setMonth(d.getMonth() + afterMonths);
    const phase1End = Math.floor(d.getTime() / 1000);
    const updated = await stripe.subscriptionSchedules.update(sched.id, {
      end_behavior: "release",
      phases: [
        {
          items: [{ price: currentPriceId, quantity: 1 }],
          start_date: startDate,
          ...(trialEnd ? { trial_end: trialEnd } : {}),
          end_date: phase1End,
        },
        { items: [{ price: upgradePriceId, quantity: 1 }] },
      ],
    });
    scheduleId = updated.id;
  }

  const email = session.customer_details?.email ?? session.customer_email ?? "";
  const { error: insErr } = await admin.from("vip_subscriptions").insert({
    name: session.metadata?.vip_name ?? null,
    email,
    stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : null,
    stripe_subscription_id: subscriptionId,
    stripe_schedule_id: scheduleId,
    status: subscription.status,
    current_price_id: currentPriceId,
  });
  if (insErr) console.error(`[webhook] VIP insert failed ${subscriptionId}:`, insErr.message);
  else console.warn(`[webhook] VIP ${subscriptionId} enregistré (status ${subscription.status}, schedule ${scheduleId})`);
}
