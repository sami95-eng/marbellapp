// Supabase Edge Function — notify-signup
// Alerte l'équipe à CHAQUE nouvelle inscription classique. Appelée par le trigger
// Postgres trg_notify_signup (AFTER INSERT ON public.profiles) via pg_net, qui
// poste { userId, name }. L'email du nouvel inscrit est résolu côté serveur (comme
// partner-welcome : profiles n'a pas de colonne email).
//
// Deploy  : npx supabase functions deploy notify-signup --no-verify-jwt
// Secrets : RESEND_API_KEY, FROM_EMAIL (optionnels : SIGNUP_NOTIFY_EMAIL,
//           NOTIFY_SIGNUP_SECRET pour durcir via header x-webhook-secret)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL     = Deno.env.get("FROM_EMAIL")     ?? "onboarding@resend.dev";
// Destinataire de l'alerte (var dédiée → garantit contact@marbellapp.vip même si
// le secret partagé ADMIN_EMAIL vaut autre chose).
const NOTIFY_TO      = Deno.env.get("SIGNUP_NOTIFY_EMAIL") ?? "contact@marbellapp.vip";
const WEBHOOK_SECRET = Deno.env.get("NOTIFY_SIGNUP_SECRET") ?? "";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const admin = SUPABASE_URL && SERVICE_ROLE ? createClient(SUPABASE_URL, SERVICE_ROLE) : null;

const SEND_TIMEOUT_MS = 8000;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function signupHtml(email: string, name: string, dateStr: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="background:#0A0E13;color:#e8e8e8;font-family:sans-serif;padding:32px;max-width:600px;margin:0 auto">
  <div style="text-align:center;margin-bottom:24px">
    <div style="font-size:44px">🆕</div>
    <h1 style="color:#D4AF37;font-size:24px;margin:8px 0 2px">Nouvel inscrit Marbellapp</h1>
  </div>
  <div style="background:#111120;border:1px solid rgba(212,175,55,0.25);border-radius:16px;padding:24px">
    <p style="color:#888;font-size:14px;line-height:1.9;margin:0">
      <strong style="color:#e8e8e8">Nom&nbsp;:</strong> ${esc(name)}<br/>
      <strong style="color:#e8e8e8">Email&nbsp;:</strong> ${esc(email)}<br/>
      <strong style="color:#e8e8e8">Date&nbsp;:</strong> ${esc(dateStr)}
    </p>
  </div>
  <p style="color:#555;font-size:11px;text-align:center;margin-top:24px">Marbell'app · notification automatique</p>
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
    const userId = body.userId as string | undefined;
    let email = body.email as string | undefined;
    let name = body.name as string | undefined;

    // Résout l'email (et le nom si absent) via userId, comme partner-welcome.
    if ((!email || !name) && userId && admin) {
      const { data: userRes } = await admin.auth.admin.getUserById(userId);
      email = email ?? userRes?.user?.email ?? undefined;
      if (!name) {
        const { data: prof } = await admin
          .from("profiles").select("display_name").eq("id", userId).maybeSingle();
        name = (prof as { display_name?: string } | null)?.display_name ?? undefined;
      }
    }

    if (!email) {
      return new Response(JSON.stringify({ error: "Email introuvable pour l'inscrit." }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }
    name = name || email.split("@")[0];
    const dateStr = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Madrid" });

    await sendEmail(NOTIFY_TO, "Nouvel inscrit Marbellapp", signupHtml(email, name, dateStr));

    return new Response(JSON.stringify({ success: true }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("[notify-signup] error:", err?.message ?? err);
    return new Response(JSON.stringify({ error: err?.message ?? String(err) }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
