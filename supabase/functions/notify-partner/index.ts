// Supabase Edge Function — Notification email partenaire
// Deploy: supabase functions deploy notify-partner
// Secrets: supabase secrets set RESEND_API_KEY=re_xxxx ADMIN_EMAIL=team@marbellapp.com

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const ADMIN_EMAIL    = Deno.env.get("ADMIN_EMAIL") ?? "team@marbellapp.com";
// Use your verified Resend domain; for testing use "onboarding@resend.dev"
const FROM_EMAIL     = Deno.env.get("FROM_EMAIL") ?? "onboarding@resend.dev";

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: `Marbell'app <${FROM_EMAIL}>`, to: [to], subject, html }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }
  return res.json();
}

function adminEmailHTML(data: Record<string, string>) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="background:#0A0E13;color:#e8e8e8;font-family:sans-serif;padding:32px;max-width:600px;margin:0 auto">
  <div style="text-align:center;margin-bottom:28px">
    <h1 style="color:#D4AF37;font-size:28px;margin:0">✨ Marbell'app</h1>
    <p style="color:#888;margin-top:6px;font-size:13px">New Partner Application</p>
  </div>

  <div style="background:#111120;border:1px solid rgba(212,175,55,0.25);border-radius:16px;padding:24px;margin-bottom:20px">
    <h2 style="color:#D4AF37;font-size:18px;margin:0 0 20px 0">🏢 Establishment Details</h2>
    <table style="width:100%;border-collapse:collapse">
      ${Object.entries({
        "Venue Name": data.venueName,
        "Venue Type": data.venueType,
        "Instagram":  data.instagram,
      }).map(([k, v]) => `
      <tr>
        <td style="color:#888;font-size:12px;padding:8px 0;width:40%">${k}</td>
        <td style="color:#e8e8e8;font-size:14px;font-weight:600">${v ?? "—"}</td>
      </tr>`).join("")}
    </table>
  </div>

  <div style="background:#111120;border:1px solid rgba(212,175,55,0.25);border-radius:16px;padding:24px;margin-bottom:20px">
    <h2 style="color:#D4AF37;font-size:18px;margin:0 0 20px 0">👤 Contact</h2>
    <table style="width:100%;border-collapse:collapse">
      ${Object.entries({
        "Name":  data.contactName,
        "Email": data.contactEmail,
        "Phone": data.contactPhone || "Not provided",
      }).map(([k, v]) => `
      <tr>
        <td style="color:#888;font-size:12px;padding:8px 0;width:40%">${k}</td>
        <td style="color:#e8e8e8;font-size:14px;font-weight:600">${v ?? "—"}</td>
      </tr>`).join("")}
    </table>
  </div>

  <div style="background:#111120;border:1px solid rgba(212,175,55,0.25);border-radius:16px;padding:24px;margin-bottom:28px">
    <h2 style="color:#D4AF37;font-size:18px;margin:0 0 12px 0">🎯 Requested Offers</h2>
    <p style="color:#e8e8e8;font-size:14px;margin:0">${(data.offerTypes ?? "").split(",").join(" · ")}</p>
  </div>

  <p style="color:#555;font-size:12px;text-align:center">
    Received ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
    · Marbell'app Partner System
  </p>
</body>
</html>`;
}

function confirmationEmailHTML(data: Record<string, string>) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="background:#0A0E13;color:#e8e8e8;font-family:sans-serif;padding:32px;max-width:600px;margin:0 auto">
  <div style="text-align:center;margin-bottom:32px">
    <div style="font-size:48px">✨</div>
    <h1 style="color:#D4AF37;font-size:28px;margin:8px 0 4px 0">Marbell'app</h1>
    <p style="color:#888;margin:0;font-size:13px">Exclusive Marbella Experiences</p>
  </div>

  <div style="text-align:center;margin-bottom:28px">
    <div style="font-size:52px">🎉</div>
    <h2 style="color:#e8e8e8;font-size:22px;margin:12px 0 8px 0">Application Received!</h2>
    <p style="color:#888;font-size:14px;line-height:1.6">
      Thank you, <strong style="color:#D4AF37">${data.contactName}</strong>.<br/>
      We've received your application for <strong>${data.venueName}</strong>.
    </p>
  </div>

  <div style="background:#111120;border:1px solid rgba(212,175,55,0.25);border-radius:16px;padding:24px;margin-bottom:20px">
    <h3 style="color:#D4AF37;font-size:16px;margin:0 0 16px 0">What happens next?</h3>
    <div style="display:flex;flex-direction:column;gap:12px">
      ${[
        ["✅", "Your application is under review by our team"],
        ["📞", "An account manager will contact you within 48h"],
        ["🚀", "Your venue will go live within 5 business days"],
        ["💎", "Access the exclusive partner dashboard & VIP tools"],
      ].map(([icon, text]) => `
      <div style="display:flex;align-items:center;gap:12px">
        <span style="font-size:20px">${icon}</span>
        <span style="color:#e8e8e8;font-size:13px">${text}</span>
      </div>`).join("")}
    </div>
  </div>

  <div style="background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.3);border-radius:12px;padding:16px;margin-bottom:28px;text-align:center">
    <p style="color:#D4AF37;font-size:13px;font-weight:600;margin:0">
      Questions? Reply to this email or contact us at<br/>
      <a href="mailto:partners@marbellapp.com" style="color:#D4AF37">partners@marbellapp.com</a>
    </p>
  </div>

  <p style="color:#555;font-size:11px;text-align:center;line-height:1.6">
    © 2026 Marbell'app · Marbella, Spain<br/>
    You received this because you applied to become a Marbell'app partner.
  </p>
</body>
</html>`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const data = await req.json();
    const { venueName, venueType, instagram, contactName, contactEmail, contactPhone, offerTypes } = data;

    if (!contactEmail || !venueName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailData = { venueName, venueType, instagram, contactName, contactEmail, contactPhone, offerTypes };

    // 1. Notification to admin
    await sendEmail(ADMIN_EMAIL, `🏢 New Partner Request: ${venueName}`, adminEmailHTML(emailData));

    // 2. Confirmation to applicant
    await sendEmail(contactEmail, `✅ Marbell'app — Application received for ${venueName}`, confirmationEmailHTML(emailData));

    return new Response(
      JSON.stringify({ success: true, message: "Emails sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("notify-partner error:", err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
