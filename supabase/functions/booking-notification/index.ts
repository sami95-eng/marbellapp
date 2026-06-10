// Supabase Edge Function — booking-notification
// Deploy : supabase functions deploy booking-notification
// Secrets : RESEND_API_KEY, ADMIN_EMAIL, FROM_EMAIL
//
// Payload reçu :
//   type? = "request" (défaut) | "confirmed" | "cancelled" | "revoked" | "rescheduled"
//   userId?    (requis pour insérer la notification client en base)
//   userEmail, userName, userPhone?, venueName, venueEmail?, venueWhatsapp?,
//   date, time, guests, tableName?, tablePrice?, notes?,
//   confirmationNumber
//
// type "request"     → email "demande reçue" au client + récap admin (+ venue)
// type "confirmed"   → email "réservation confirmée ✅" au client uniquement
// type "cancelled"   → email "réservation non confirmée" (refus d'une demande)
// type "revoked"     → email d'annulation + excuses (résa déjà confirmée)
// type "rescheduled" → email "réservation modifiée 📅" (nouvelle date/heure)
// Dans tous les cas l'expéditeur est "Marbell'app" et la signature "L'équipe Marbell'app".

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

const RESEND_API_KEY  = Deno.env.get("RESEND_API_KEY")  ?? "";
const ADMIN_EMAIL     = Deno.env.get("ADMIN_EMAIL")      ?? "team@marbellapp.com";
const FROM_EMAIL      = Deno.env.get("FROM_EMAIL")       ?? "onboarding@resend.dev";

// Borne la latence d'un appel Resend bloqué (évite qu'une requête lente
// retienne la fonction). Resend répond normalement en < 1 s.
const SEND_TIMEOUT_MS = 8000;

// Client admin (service_role) — variables injectées automatiquement par
// Supabase dans les Edge Functions. Sert à insérer une notification pour
// le client (bypass RLS, écriture sur la ligne d'un autre utilisateur).
const SUPABASE_URL  = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const admin = SUPABASE_URL && SERVICE_ROLE ? createClient(SUPABASE_URL, SERVICE_ROLE) : null;

async function insertNotification(
  userId: string,
  type: "reservation_confirmed" | "reservation_cancelled" | "vip_offer" | "reminder",
  title: string,
  message: string
) {
  if (!admin || !userId) return;
  const { error } = await admin.from("notifications").insert({ user_id: userId, type, title, message });
  if (error) throw new Error(error.message);
}

const cors = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function send(to: string, subject: string, html: string) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: `Marbell'app <${FROM_EMAIL}>`, to: [to], subject, html }),
    signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
}

// Signature commune à TOUS les emails clients. L'expéditeur reste Marbell'app
// (champ "from" ci-dessus) et la signature est toujours "L'équipe Marbell'app" —
// jamais le nom de l'établissement.
const SIGNATURE = `
  <div style="text-align:center;margin:8px 0 24px">
    <p style="color:#888;font-size:13px;margin:0">Avec toute notre attention,</p>
    <p style="color:#D4AF37;font-size:15px;font-weight:700;margin:4px 0 0">L'équipe Marbell'app</p>
  </div>`;

// Génère le lien WhatsApp pré-rempli vers le venue, signé Marbell'app
function buildWhatsAppLink(whatsappNumber: string, d: Record<string, string>): string {
  const tableInfo = d.tableName
    ? `\n🪑 Table: ${d.tableName}${d.tablePrice ? ` (from €${parseInt(d.tablePrice).toLocaleString()})` : ""}`
    : "";
  const notesInfo = d.notes ? `\n📝 Notes: ${d.notes}` : "";

  const message = [
    `📋 *Nouvelle réservation Marbell'app*`,
    ``,
    `*${d.venueName}*`,
    `📅 Date: ${d.date}`,
    `🕐 Heure: ${d.time}`,
    `👥 Convives: ${d.guests}`,
    tableInfo,
    notesInfo,
    ``,
    `👤 Client: ${d.userName} (${d.userEmail})`,
    `🔖 Réf: ${d.confirmationNumber}`,
    ``,
    `_Réservation effectuée via Marbell'app — Marbella's luxury experience platform_`,
  ].filter((line) => line !== null && line !== undefined).join("\n");

  const encoded = encodeURIComponent(message);
  return `https://wa.me/${whatsappNumber}?text=${encoded}`;
}

// ── Template confirmation utilisateur ─────────────────────────────
function userConfirmHtml(d: Record<string, string>) {
  const rows = [
    ["Venue",   d.venueName],
    ["Date",    d.date],
    ["Time",    d.time],
    ["Guests",  d.guests + (parseInt(d.guests) === 1 ? " person" : " people")],
    ...(d.tableName ? [["Table", d.tableName + (d.tablePrice ? ` — From €${parseInt(d.tablePrice).toLocaleString()}` : "")]] : []),
    ...(d.notes ? [["Notes", d.notes]] : []),
  ];
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="background:#0A0E13;color:#e8e8e8;font-family:sans-serif;padding:32px;max-width:600px;margin:0 auto">
  <div style="text-align:center;margin-bottom:32px">
    <div style="font-size:52px">✨</div>
    <h1 style="color:#D4AF37;font-size:28px;margin:8px 0 4px">Marbell'app</h1>
    <p style="color:#888;margin:0;font-size:13px">Exclusive Marbella Experiences</p>
  </div>

  <div style="text-align:center;margin-bottom:28px">
    <div style="font-size:52px">📩</div>
    <h2 style="color:#e8e8e8;font-size:22px;margin:12px 0 8px">Demande de réservation reçue</h2>
    <p style="color:#888;font-size:14px;line-height:1.7">
      Bonjour <strong style="color:#D4AF37">${d.userName}</strong>,<br/>
      Votre demande de réservation a bien été reçue. Nous vous confirmons votre
      réservation dans un délai maximum de <strong style="color:#D4AF37">2 heures</strong>.<br/>
      En cas de question, contactez-nous directement.
    </p>
  </div>

  <div style="background:#111120;border:1px solid rgba(212,175,55,0.25);border-radius:16px;padding:24px;margin-bottom:20px">
    <h3 style="color:#D4AF37;font-size:16px;margin:0 0 18px">📋 Reservation Details</h3>
    <table style="width:100%;border-collapse:collapse">
      ${rows.map(([k, v]) => `
      <tr style="border-bottom:1px solid rgba(255,255,255,0.05)">
        <td style="color:#888;font-size:12px;padding:8px 0;width:40%;text-transform:uppercase;letter-spacing:0.5px">${k}</td>
        <td style="color:#e8e8e8;font-size:14px;font-weight:600;padding:8px 0">${v}</td>
      </tr>`).join("")}
    </table>
  </div>

  <div style="background:#111120;border:1px solid rgba(212,175,55,0.25);border-radius:16px;padding:20px;margin-bottom:20px;text-align:center">
    <p style="color:#888;font-size:11px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px">Confirmation Number</p>
    <p style="color:#D4AF37;font-size:22px;font-weight:800;letter-spacing:3px;margin:0">${d.confirmationNumber}</p>
    <p style="color:#555;font-size:11px;margin:8px 0 0">Save this for your records</p>
  </div>

  <div style="background:#111120;border:1px solid rgba(212,175,55,0.25);border-radius:16px;padding:20px;margin-bottom:28px">
    <h3 style="color:#D4AF37;font-size:15px;margin:0 0 14px">What to expect</h3>
    ${[
      ["📸", "Share your experience", "Take photos and tag the venue to enjoy member benefits"],
      ["👑", "VIP treatment", "Show your confirmation at the door for priority access"],
      ["⭐", "Leave a review", "Help other members discover this venue after your visit"],
    ].map(([icon, title, desc]) => `
    <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px">
      <span style="font-size:18px;margin-top:2px">${icon}</span>
      <div><strong style="color:#e8e8e8;font-size:13px">${title}</strong><br/>
      <span style="color:#666;font-size:12px">${desc}</span></div>
    </div>`).join("")}
  </div>

  ${SIGNATURE}

  <p style="color:#555;font-size:11px;text-align:center;line-height:1.6">
    © 2026 Marbell'app · Marbella, Spain<br/>
    Questions? <a href="mailto:${ADMIN_EMAIL}" style="color:#D4AF37">Contact us</a>
  </p>
</body></html>`;
}

// ── Template notification venue/partenaire ────────────────────────
function venueNotifHtml(d: Record<string, string>, whatsappLink: string | null) {
  const rows = [
    ["Guest",   `${d.userName} (${d.userEmail})`],
    ["Date",    d.date],
    ["Time",    d.time],
    ["Guests",  d.guests + (parseInt(d.guests) === 1 ? " person" : " people")],
    ...(d.tableName ? [["Table", d.tableName + (d.tablePrice ? ` — From €${parseInt(d.tablePrice).toLocaleString()}` : "")]] : []),
    ...(d.notes ? [["Notes", d.notes]] : []),
    ["Ref #",   d.confirmationNumber],
  ];

  const whatsappBlock = whatsappLink ? `
  <div style="text-align:center;margin-bottom:24px">
    <p style="color:#888;font-size:12px;margin:0 0 12px">Confirmez ou contactez le client via WhatsApp :</p>
    <a href="${whatsappLink}"
       style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;
              padding:14px 32px;border-radius:50px;font-weight:700;font-size:15px;
              letter-spacing:0.3px">
      📱 Ouvrir WhatsApp
    </a>
    <p style="color:#555;font-size:10px;margin:10px 0 0">
      Message pré-rempli avec les détails de la réservation, signé Marbell'app
    </p>
  </div>` : "";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="background:#0A0E13;color:#e8e8e8;font-family:sans-serif;padding:32px;max-width:600px;margin:0 auto">
  <div style="text-align:center;margin-bottom:28px">
    <h1 style="color:#D4AF37;font-size:24px;margin:0">✨ Marbell'app</h1>
    <p style="color:#888;font-size:12px;margin:4px 0 0">Partner Notification</p>
  </div>

  <div style="background:#111120;border:1px solid rgba(74,222,128,0.3);border-radius:16px;padding:20px;margin-bottom:20px;text-align:center">
    <div style="font-size:36px">📋</div>
    <h2 style="color:#4ADE80;font-size:20px;margin:8px 0 4px">New Booking — ${d.venueName}</h2>
    <p style="color:#888;font-size:13px;margin:0">A new reservation has been confirmed through Marbell'app</p>
  </div>

  <div style="background:#111120;border:1px solid rgba(212,175,55,0.25);border-radius:16px;padding:24px;margin-bottom:20px">
    <h3 style="color:#D4AF37;font-size:15px;margin:0 0 18px">Booking Details</h3>
    <table style="width:100%;border-collapse:collapse">
      ${rows.map(([k, v]) => `
      <tr style="border-bottom:1px solid rgba(255,255,255,0.05)">
        <td style="color:#888;font-size:12px;padding:8px 0;width:35%;text-transform:uppercase;letter-spacing:0.5px">${k}</td>
        <td style="color:#e8e8e8;font-size:14px;font-weight:600;padding:8px 0">${v}</td>
      </tr>`).join("")}
    </table>
  </div>

  ${whatsappBlock}

  <p style="color:#555;font-size:11px;text-align:center;line-height:1.6">
    © 2026 Marbell'app Partner System · <a href="mailto:${ADMIN_EMAIL}" style="color:#D4AF37">Support</a>
  </p>
</body></html>`;
}

// ── Template récapitulatif admin ──────────────────────────────────
// Envoyé à ADMIN_EMAIL pour CHAQUE réservation confirmée.
function adminRecapHtml(d: Record<string, string>) {
  const rows = [
    ["Client",        d.userName],
    ["Email",         d.userEmail],
    ["Phone",         d.userPhone || "—"],
    ["Venue",         d.venueName],
    ["Date",          d.date],
    ["Time",          d.time],
    ["Guests",        d.guests + (parseInt(d.guests) === 1 ? " person" : " people")],
    ["Table",         d.tableName || "—"],
    ["Price",         d.tablePrice ? `From €${parseInt(d.tablePrice).toLocaleString()}` : "—"],
    ["Confirmation #", d.confirmationNumber],
    ...(d.notes ? [["Notes", d.notes]] : []),
  ];

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="background:#0A0E13;color:#e8e8e8;font-family:sans-serif;padding:32px;max-width:600px;margin:0 auto">
  <div style="text-align:center;margin-bottom:28px">
    <h1 style="color:#D4AF37;font-size:24px;margin:0">✨ Marbell'app</h1>
    <p style="color:#888;font-size:12px;margin:4px 0 0">Admin — Booking Recap</p>
  </div>

  <div style="background:#111120;border:1px solid rgba(212,175,55,0.3);border-radius:16px;padding:20px;margin-bottom:20px;text-align:center">
    <div style="font-size:36px">🆕</div>
    <h2 style="color:#D4AF37;font-size:20px;margin:8px 0 4px">Nouvelle réservation reçue — ${d.venueName}</h2>
    <p style="color:#888;font-size:13px;margin:0">Une nouvelle demande de réservation vient d'arriver via Marbell'app</p>
  </div>

  <div style="background:#111120;border:1px solid rgba(212,175,55,0.25);border-radius:16px;padding:24px;margin-bottom:20px">
    <table style="width:100%;border-collapse:collapse">
      ${rows.map(([k, v]) => `
      <tr style="border-bottom:1px solid rgba(255,255,255,0.05)">
        <td style="color:#888;font-size:12px;padding:8px 0;width:38%;text-transform:uppercase;letter-spacing:0.5px">${k}</td>
        <td style="color:#e8e8e8;font-size:14px;font-weight:600;padding:8px 0">${v}</td>
      </tr>`).join("")}
    </table>
  </div>

  <p style="color:#555;font-size:11px;text-align:center;line-height:1.6">
    © 2026 Marbell'app Admin · Marbella, Spain
  </p>
</body></html>`;
}

// ── Template admin pour les changements de statut ─────────────────
// Envoyé à ADMIN_EMAIL pour CHAQUE décision (confirmée / refusée / annulée /
// modifiée), en plus de l'email au client.
function adminStatusHtml(d: Record<string, string>, title: string, accent: string) {
  const rows = [
    ["Client",         d.userName || "—"],
    ["Email",          d.userEmail || "—"],
    ["Phone",          d.userPhone || "—"],
    ["Venue",          d.venueName],
    ["Date",           d.date || "—"],
    ["Time",           d.time || "—"],
    ["Guests",         d.guests ? d.guests + (parseInt(d.guests) === 1 ? " person" : " people") : "—"],
    ["Table",          d.tableName || "—"],
    ["Price",          d.tablePrice ? `From €${parseInt(d.tablePrice).toLocaleString()}` : "—"],
    ["Confirmation #", d.confirmationNumber || "—"],
  ];

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="background:#0A0E13;color:#e8e8e8;font-family:sans-serif;padding:32px;max-width:600px;margin:0 auto">
  <div style="text-align:center;margin-bottom:28px">
    <h1 style="color:#D4AF37;font-size:24px;margin:0">✨ Marbell'app</h1>
    <p style="color:#888;font-size:12px;margin:4px 0 0">Admin — Status Update</p>
  </div>

  <div style="background:#111120;border:1px solid ${accent}50;border-radius:16px;padding:20px;margin-bottom:20px;text-align:center">
    <h2 style="color:${accent};font-size:20px;margin:8px 0 4px">${title} — ${d.venueName}</h2>
  </div>

  <div style="background:#111120;border:1px solid rgba(212,175,55,0.25);border-radius:16px;padding:24px;margin-bottom:20px">
    <table style="width:100%;border-collapse:collapse">
      ${rows.map(([k, v]) => `
      <tr style="border-bottom:1px solid rgba(255,255,255,0.05)">
        <td style="color:#888;font-size:12px;padding:8px 0;width:38%;text-transform:uppercase;letter-spacing:0.5px">${k}</td>
        <td style="color:#e8e8e8;font-size:14px;font-weight:600;padding:8px 0">${v}</td>
      </tr>`).join("")}
    </table>
  </div>

  <p style="color:#555;font-size:11px;text-align:center;line-height:1.6">
    © 2026 Marbell'app Admin · Marbella, Spain
  </p>
</body></html>`;
}

// ── Template confirmation / refus / annulation (décision du partenaire) ────
// kind = "confirmed" → "Votre réservation est confirmée ✅"
// kind = "cancelled" → "Votre réservation n'a pas pu être confirmée" (refus d'une demande)
// kind = "revoked"   → "Votre réservation a été annulée" (annulation d'une résa déjà confirmée, avec excuses)
function statusEmailHtml(d: Record<string, string>, kind: "confirmed" | "cancelled" | "revoked") {
  const confirmed = kind === "confirmed";
  const accent = confirmed ? "#4ADE80" : "#EF4444";
  const emoji  = confirmed ? "✅" : kind === "revoked" ? "🙏" : "⚠️";
  const title  = confirmed
    ? "Votre réservation est confirmée ✅"
    : kind === "revoked"
      ? "Votre réservation a été annulée"
      : "Votre demande n'a pas pu être confirmée";
  const message = confirmed
    ? `Bonjour <strong style="color:#D4AF37">${d.userName ?? ""}</strong>,<br/>
       Bonne nouvelle ! Votre réservation chez <strong>${d.venueName}</strong> est
       confirmée. Nous avons hâte de vous accueillir.`
    : kind === "revoked"
      ? `Bonjour <strong style="color:#D4AF37">${d.userName ?? ""}</strong>,<br/>
         Nous sommes au regret de vous informer que votre réservation chez
         <strong>${d.venueName}</strong>, pourtant confirmée, a dû être annulée.
         Nous vous prions de nous excuser sincèrement pour ce contretemps.
         N'hésitez pas à nous contacter pour reprogrammer votre venue — nous ferons
         le maximum pour vous accueillir dans les meilleures conditions.`
      : `Bonjour <strong style="color:#D4AF37">${d.userName ?? ""}</strong>,<br/>
         Nous sommes désolés : votre réservation chez <strong>${d.venueName}</strong>
         n'a pas pu être confirmée. Pour toute question ou pour proposer une autre date,
         contactez-nous directement.`;

  const rows = [
    ["Venue", d.venueName],
    ...(d.date ? [["Date", d.date]] : []),
    ...(d.time ? [["Time", d.time]] : []),
    ...(d.tableName ? [["Table", d.tableName + (d.tablePrice ? ` — From €${parseInt(d.tablePrice).toLocaleString()}` : "")]] : []),
  ];

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="background:#0A0E13;color:#e8e8e8;font-family:sans-serif;padding:32px;max-width:600px;margin:0 auto">
  <div style="text-align:center;margin-bottom:32px">
    <div style="font-size:52px">✨</div>
    <h1 style="color:#D4AF37;font-size:28px;margin:8px 0 4px">Marbell'app</h1>
    <p style="color:#888;margin:0;font-size:13px">Exclusive Marbella Experiences</p>
  </div>

  <div style="text-align:center;margin-bottom:28px">
    <div style="font-size:52px">${emoji}</div>
    <h2 style="color:${accent};font-size:22px;margin:12px 0 8px">${title}</h2>
    <p style="color:#888;font-size:14px;line-height:1.7">${message}</p>
  </div>

  <div style="background:#111120;border:1px solid rgba(212,175,55,0.25);border-radius:16px;padding:24px;margin-bottom:20px">
    <h3 style="color:#D4AF37;font-size:16px;margin:0 0 18px">📋 Reservation Details</h3>
    <table style="width:100%;border-collapse:collapse">
      ${rows.map(([k, v]) => `
      <tr style="border-bottom:1px solid rgba(255,255,255,0.05)">
        <td style="color:#888;font-size:12px;padding:8px 0;width:40%;text-transform:uppercase;letter-spacing:0.5px">${k}</td>
        <td style="color:#e8e8e8;font-size:14px;font-weight:600;padding:8px 0">${v}</td>
      </tr>`).join("")}
    </table>
  </div>

  ${confirmed && d.confirmationNumber ? `
  <div style="background:#111120;border:1px solid rgba(212,175,55,0.25);border-radius:16px;padding:20px;margin-bottom:20px;text-align:center">
    <p style="color:#888;font-size:11px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px">Confirmation Number</p>
    <p style="color:#D4AF37;font-size:22px;font-weight:800;letter-spacing:3px;margin:0">${d.confirmationNumber}</p>
  </div>` : ""}

  ${SIGNATURE}

  <p style="color:#555;font-size:11px;text-align:center;line-height:1.6">
    © 2026 Marbell'app · Marbella, Spain<br/>
    Questions? <a href="mailto:${ADMIN_EMAIL}" style="color:#D4AF37">Contact us</a>
  </p>
</body></html>`;
}

// ── Template reprogrammation (changement de date/heure par le partenaire) ──
function rescheduleEmailHtml(d: Record<string, string>) {
  const rows = [
    ["Venue", d.venueName],
    ...(d.date ? [["Nouvelle date", d.date]] : []),
    ...(d.time ? [["Nouvelle heure", d.time]] : []),
    ...(d.tableName ? [["Table", d.tableName + (d.tablePrice ? ` — From €${parseInt(d.tablePrice).toLocaleString()}` : "")]] : []),
  ];

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="background:#0A0E13;color:#e8e8e8;font-family:sans-serif;padding:32px;max-width:600px;margin:0 auto">
  <div style="text-align:center;margin-bottom:32px">
    <div style="font-size:52px">✨</div>
    <h1 style="color:#D4AF37;font-size:28px;margin:8px 0 4px">Marbell'app</h1>
    <p style="color:#888;margin:0;font-size:13px">Exclusive Marbella Experiences</p>
  </div>

  <div style="text-align:center;margin-bottom:28px">
    <div style="font-size:52px">📅</div>
    <h2 style="color:#D4AF37;font-size:22px;margin:12px 0 8px">Votre réservation a été modifiée</h2>
    <p style="color:#888;font-size:14px;line-height:1.7">
      Bonjour <strong style="color:#D4AF37">${d.userName ?? ""}</strong>,<br/>
      Votre réservation chez <strong>${d.venueName}</strong> a été reprogrammée.
      Voici les nouveaux détails ci-dessous. Si cette date ne vous convient pas,
      contactez-nous et nous trouverons une solution.
    </p>
  </div>

  <div style="background:#111120;border:1px solid rgba(212,175,55,0.25);border-radius:16px;padding:24px;margin-bottom:20px">
    <h3 style="color:#D4AF37;font-size:16px;margin:0 0 18px">📋 Nouveaux détails</h3>
    <table style="width:100%;border-collapse:collapse">
      ${rows.map(([k, v]) => `
      <tr style="border-bottom:1px solid rgba(255,255,255,0.05)">
        <td style="color:#888;font-size:12px;padding:8px 0;width:40%;text-transform:uppercase;letter-spacing:0.5px">${k}</td>
        <td style="color:#e8e8e8;font-size:14px;font-weight:600;padding:8px 0">${v}</td>
      </tr>`).join("")}
    </table>
  </div>

  ${d.confirmationNumber ? `
  <div style="background:#111120;border:1px solid rgba(212,175,55,0.25);border-radius:16px;padding:20px;margin-bottom:20px;text-align:center">
    <p style="color:#888;font-size:11px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px">Confirmation Number</p>
    <p style="color:#D4AF37;font-size:22px;font-weight:800;letter-spacing:3px;margin:0">${d.confirmationNumber}</p>
  </div>` : ""}

  ${SIGNATURE}

  <p style="color:#555;font-size:11px;text-align:center;line-height:1.6">
    © 2026 Marbell'app · Marbella, Spain<br/>
    Questions? <a href="mailto:${ADMIN_EMAIL}" style="color:#D4AF37">Contact us</a>
  </p>
</body></html>`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const d = await req.json() as Record<string, string>;

    // ── Décision partenaire : confirmation / refus / annulation → email unique au client ──
    const type = d.type ?? "request";
    if (type === "confirmed" || type === "cancelled" || type === "revoked" || type === "rescheduled") {
      if (!d.userEmail || !d.venueName) {
        return new Response(
          JSON.stringify({ error: "Missing fields: userEmail, venueName" }),
          { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
        );
      }
      const subject = type === "confirmed"
        ? `✅ Votre réservation est confirmée — ${d.venueName} · ${d.date ?? ""}`
        : type === "revoked"
          ? `Annulation de votre réservation — ${d.venueName}${d.date ? ` · ${d.date}` : ""}`
          : type === "rescheduled"
            ? `📅 Votre réservation a été modifiée — ${d.venueName}${d.date ? ` · ${d.date}` : ""}`
            : `Votre réservation n'a pas pu être confirmée — ${d.venueName}`;

      const datePart = d.date ? ` le ${d.date}` : "";
      const timePart = d.time ? ` à ${d.time}` : "";
      const notif = type === "confirmed"
        ? { kind: "reservation_confirmed" as const, title: "Réservation confirmée ✅",
            message: `Votre réservation chez ${d.venueName}${datePart} est confirmée. Nous avons hâte de vous accueillir.` }
        : type === "revoked"
          ? { kind: "reservation_cancelled" as const, title: "Réservation annulée",
              message: `Votre réservation chez ${d.venueName}${datePart} a été annulée. Toutes nos excuses — contactez-nous pour la reprogrammer.` }
          : type === "rescheduled"
            ? { kind: "reminder" as const, title: "Réservation modifiée 📅",
                message: `Votre réservation chez ${d.venueName} a été déplacée au ${d.date ?? ""}${timePart}.` }
            : { kind: "reservation_cancelled" as const, title: "Réservation non confirmée",
                message: `Votre réservation chez ${d.venueName}${datePart} n'a pas pu être confirmée. Contactez-nous pour proposer une autre date.` };

      const html = type === "rescheduled"
        ? rescheduleEmailHtml(d)
        : statusEmailHtml(d, type);

      // ── Email admin (toujours, en plus du client) ──────────────────
      const adminMeta = type === "confirmed"
        ? { title: "Réservation confirmée",  accent: "#4ADE80", emoji: "✅" }
        : type === "revoked"
          ? { title: "Réservation annulée",   accent: "#EF4444", emoji: "🚫" }
          : type === "rescheduled"
            ? { title: "Réservation modifiée", accent: "#D4AF37", emoji: "📅" }
            : { title: "Réservation refusée",  accent: "#EF4444", emoji: "⚠️" };
      const adminSubject = `${adminMeta.emoji} ${adminMeta.title} — ${d.venueName}${d.date ? ` · ${d.date}` : ""}`;

      // Email au client + email admin + notification en base, en parallèle
      const tasks: { label: string; promise: Promise<void> }[] = [
        { label: "user_email",   promise: send(d.userEmail, subject, html) },
        { label: "admin_email",  promise: send(ADMIN_EMAIL, adminSubject, adminStatusHtml(d, adminMeta.title, adminMeta.accent)) },
        { label: "notification", promise: insertNotification(d.userId, notif.kind, notif.title, notif.message) },
      ];

      const settled = await Promise.allSettled(tasks.map((tk) => tk.promise));
      const errors: string[] = [];
      settled.forEach((res, i) => {
        if (res.status === "rejected") {
          const msg = res.reason?.message ?? String(res.reason);
          console.error(`${tasks[i].label} failed:`, msg);
          errors.push(`${tasks[i].label}: ${msg}`);
        }
      });

      return new Response(
        JSON.stringify({ success: errors.length === 0, errors: errors.length ? errors : undefined }),
        { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const required = ["userEmail", "userName", "venueName", "date", "time", "guests"];
    const missing  = required.filter((k) => !d[k]);
    if (missing.length) {
      return new Response(
        JSON.stringify({ error: `Missing fields: ${missing.join(", ")}` }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    if (!d.confirmationNumber) {
      d.confirmationNumber = `MSS-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    }

    // Build WhatsApp link if venue has a WhatsApp number
    const whatsappLink = d.venueWhatsapp
      ? buildWhatsAppLink(d.venueWhatsapp, d)
      : null;

    // Tous les emails partent EN PARALLÈLE pour réduire la latence
    // (avant : 2–3 allers-retours Resend séquentiels → maintenant ~1 seul).
    // allSettled (et non Promise.all) pour conserver le traçage d'erreur
    // par email : un échec n'annule pas les autres envois ni leur reporting.
    const tasks: { label: string; promise: Promise<void> }[] = [];

    // 1 — Confirmation au client (toujours)
    tasks.push({
      label: "user_email",
      promise: send(
        d.userEmail,
        `📩 Demande de réservation reçue — ${d.venueName} · ${d.date}`,
        userConfirmHtml(d)
      ),
    });

    // 2 — Notification au venue (uniquement s'il a son propre email, distinct de l'admin)
    if (d.venueEmail && d.venueEmail !== ADMIN_EMAIL) {
      tasks.push({
        label: "venue_email",
        promise: send(
          d.venueEmail,
          `📋 New Booking — ${d.venueName} · ${d.date} · ${d.guests} guests`,
          venueNotifHtml(d, whatsappLink)
        ),
      });
    }

    // 3 — Récapitulatif admin (toujours)
    tasks.push({
      label: "admin_email",
      promise: send(
        ADMIN_EMAIL,
        `🆕 Nouvelle réservation reçue — ${d.venueName} · ${d.date} · ${d.guests} guests`,
        adminRecapHtml(d)
      ),
    });

    const settled = await Promise.allSettled(tasks.map((t) => t.promise));
    const errors: string[] = [];
    settled.forEach((res, i) => {
      if (res.status === "rejected") {
        const msg = res.reason?.message ?? String(res.reason);
        console.error(`${tasks[i].label} failed:`, msg);
        errors.push(`${tasks[i].label}: ${msg}`);
      }
    });

    return new Response(
      JSON.stringify({
        success: errors.length === 0,
        confirmationNumber: d.confirmationNumber,
        whatsappLink: whatsappLink ?? undefined,
        errors: errors.length ? errors : undefined,
      }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
