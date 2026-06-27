// Supabase Edge Function — partner-welcome
// Envoie un email de bienvenue (Resend) quand un compte devient partenaire
// (profiles.role = 'partner'). Appelée automatiquement par le trigger Postgres
// trg_partner_welcome (voir supabase/partner_welcome_trigger.sql), qui poste
// soit { userId }, soit le payload standard d'un Database Webhook
// ({ type, record, old_record }).
//
// Deploy  : npx supabase functions deploy partner-welcome --no-verify-jwt
// Secrets : RESEND_API_KEY, FROM_EMAIL, ADMIN_EMAIL (optionnels : APP_URL,
//           PARTNER_WELCOME_SECRET pour durcir l'accès via header x-webhook-secret)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL     = Deno.env.get("FROM_EMAIL")     ?? "onboarding@resend.dev";
const ADMIN_EMAIL    = Deno.env.get("ADMIN_EMAIL")    ?? "contact@marbellapp.vip";
const APP_URL        = (Deno.env.get("APP_URL") ?? "https://app.marbellapp.vip").replace(/\/$/, "");
const WEBHOOK_SECRET = Deno.env.get("PARTNER_WELCOME_SECRET") ?? "";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const admin = SUPABASE_URL && SERVICE_ROLE ? createClient(SUPABASE_URL, SERVICE_ROLE) : null;

const SEND_TIMEOUT_MS = 8000;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function welcomeHtml(name: string) {
  const loginUrl = `${APP_URL}/login`;
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="background:#0A0E13;color:#e8e8e8;font-family:sans-serif;padding:32px;max-width:600px;margin:0 auto">
  <div style="text-align:center;margin-bottom:28px">
    <div style="font-size:52px">✨</div>
    <h1 style="color:#D4AF37;font-size:28px;margin:8px 0 4px">Marbell'app</h1>
    <p style="color:#888;margin:0;font-size:13px">Partner Program</p>
  </div>

  <div style="text-align:center;margin-bottom:28px">
    <div style="font-size:52px">🎉</div>
    <h2 style="color:#4ADE80;font-size:22px;margin:12px 0 8px">Bienvenue parmi les partenaires&nbsp;!</h2>
    <p style="color:#888;font-size:14px;line-height:1.7">
      Bonjour <strong style="color:#D4AF37">${name}</strong>,<br/>
      Votre compte partenaire Marbell'app est désormais actif. Vous pouvez gérer
      vos réservations, vos tables, vos offres VIP et vos statistiques depuis votre
      tableau de bord.
    </p>
  </div>

  <div style="background:#111120;border:1px solid rgba(212,175,55,0.25);border-radius:16px;padding:24px;margin-bottom:20px">
    <h3 style="color:#D4AF37;font-size:15px;margin:0 0 14px">Accès à votre dashboard</h3>
    <p style="color:#888;font-size:13px;line-height:1.7;margin:0 0 18px">
      Connectez-vous avec votre email, puis ouvrez l'onglet
      <strong style="color:#e8e8e8">Établissement</strong> pour accéder au
      tableau de bord partenaire.
    </p>
    <div style="text-align:center">
      <a href="${loginUrl}"
         style="display:inline-block;background:#D4AF37;color:#0A0E13;text-decoration:none;
                padding:14px 32px;border-radius:50px;font-weight:800;font-size:15px">
        Accéder au dashboard
      </a>
    </div>
  </div>

  <div style="background:#111120;border:1px solid rgba(212,175,55,0.25);border-radius:16px;padding:20px;margin-bottom:28px;text-align:center">
    <p style="color:#888;font-size:13px;margin:0">
      Une question ? Notre équipe vous accompagne :
      <a href="mailto:${ADMIN_EMAIL}" style="color:#D4AF37">${ADMIN_EMAIL}</a>
    </p>
  </div>

  <div style="text-align:center;margin:8px 0 24px">
    <p style="color:#888;font-size:13px;margin:0">Avec toute notre attention,</p>
    <p style="color:#D4AF37;font-size:15px;font-weight:700;margin:4px 0 0">L'équipe Marbell'app</p>
  </div>

  <p style="color:#555;font-size:11px;text-align:center;line-height:1.6">
    © 2026 Marbell'app · Marbella, Spain
  </p>
</body></html>`;
}

async function sendEmail(to: string, subject: string, html: string) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: `Marbell'app <${FROM_EMAIL}>`, to: [to], subject, html }),
    signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  // Durcissement optionnel : si un secret est configuré, on l'exige.
  if (WEBHOOK_SECRET && req.headers.get("x-webhook-secret") !== WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401, headers: cors });
  }

  try {
    const body = await req.json().catch(() => ({}));

    // Supporte { userId } OU le payload d'un Database Webhook { record, old_record }.
    const record    = body.record    as { id?: string; role?: string; display_name?: string } | undefined;
    const oldRecord = body.old_record as { role?: string } | undefined;
    const userId    = body.userId ?? record?.id;

    // Si payload webhook : ne traiter que la transition → 'partner'.
    if (record && !(record.role === "partner" && oldRecord?.role !== "partner")) {
      return new Response(JSON.stringify({ skipped: "not a partner transition" }),
        { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
    }

    if (!userId || !admin) {
      return new Response(JSON.stringify({ error: "Missing userId or admin client" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    // Email + nom : email via auth.users, nom via profiles.display_name.
    const { data: userRes, error: uErr } = await admin.auth.admin.getUserById(userId);
    if (uErr || !userRes?.user?.email) {
      return new Response(JSON.stringify({ error: uErr?.message ?? "User email not found" }),
        { status: 404, headers: { ...cors, "Content-Type": "application/json" } });
    }
    const email = userRes.user.email;
    const { data: prof } = await admin.from("profiles").select("display_name").eq("id", userId).maybeSingle();
    const name = (prof as { display_name?: string } | null)?.display_name
      || record?.display_name
      || email.split("@")[0];

    await sendEmail(email, "Bienvenue parmi les partenaires Marbell'app 🎉", welcomeHtml(name));

    return new Response(JSON.stringify({ success: true }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("[partner-welcome] error:", err?.message ?? err);
    return new Response(JSON.stringify({ error: err?.message ?? String(err) }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
