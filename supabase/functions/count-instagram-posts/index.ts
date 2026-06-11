// Supabase Edge Function — count-instagram-posts
// Deploy : supabase functions deploy count-instagram-posts
// Secrets : IG_APP_ID, IG_APP_SECRET  (+ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY auto-injectés)
//
// Rôle :
//  1) Récupère les posts Instagram de l'utilisateur (Instagram Graph API)
//  2) Compte ceux dont la légende tague un établissement partenaire (@handle)
//  3) Écrit profiles.partner_post_count (+ instagram_handle) via service_role
//
// Body accepté :
//  { code, redirectUri }  → échange OAuth code → access_token (recommandé)
//  { igAccessToken }      → token déjà obtenu côté client
// L'utilisateur ciblé est déduit du JWT (header Authorization), pas du body.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

const IG_APP_ID     = Deno.env.get("IG_APP_ID") ?? "";
const IG_APP_SECRET = Deno.env.get("IG_APP_SECRET") ?? "";
const SUPABASE_URL  = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

const cors = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

// Normalise un handle Instagram : minuscule, sans @ ni espaces
const norm = (h: string) => h.trim().toLowerCase().replace(/^@/, "");

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    // ── Authentification : on déduit l'utilisateur du JWT (anti-spoof) ──
    const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: { user }, error: uErr } = await admin.auth.getUser(jwt);
    if (uErr || !user) return json({ error: "Unauthorized" }, 401);
    const userId = user.id;

    const body = await req.json().catch(() => ({})) as {
      code?: string; redirectUri?: string; igAccessToken?: string;
    };

    // ── 1) Obtenir un access_token Instagram ──────────────────────────
    let token = body.igAccessToken;
    if (!token && body.code) {
      const form = new URLSearchParams({
        client_id:     IG_APP_ID,
        client_secret: IG_APP_SECRET,
        grant_type:    "authorization_code",
        redirect_uri:  body.redirectUri ?? "",
        code:          body.code,
      });
      const r = await fetch("https://api.instagram.com/oauth/access_token", { method: "POST", body: form });
      const j = await r.json();
      if (!r.ok || !j.access_token) {
        return json({ error: "Échange du code Instagram échoué", detail: j }, 400);
      }
      token = j.access_token as string;
    }
    if (!token) return json({ error: "Missing `code` or `igAccessToken`" }, 400);

    // ── 2) Username Instagram (pour marquer le compte comme connecté) ──
    let username: string | null = null;
    try {
      const ur = await fetch(`https://graph.instagram.com/me?fields=username&access_token=${token}`);
      const uj = await ur.json();
      username = uj?.username ?? null;
    } catch { /* non bloquant */ }

    // ── 3) Handles des établissements partenaires ─────────────────────
    const { data: venues, error: vErr } = await admin
      .from("venues")
      .select("instagram_handle")
      .not("instagram_handle", "is", null);
    if (vErr) return json({ error: `venues: ${vErr.message}` }, 500);
    const handles = (venues ?? [])
      .map((v) => norm(v.instagram_handle as string))
      .filter((h) => h.length > 0);

    // ── 4) Récupérer les posts (légendes), paginé ─────────────────────
    const captions: string[] = [];
    let url: string | null =
      `https://graph.instagram.com/me/media?fields=caption&limit=100&access_token=${token}`;
    for (let page = 0; page < 10 && url; page++) {
      const mr = await fetch(url);
      const mj = await mr.json();
      if (mj?.error) return json({ error: "Instagram media fetch failed", detail: mj.error }, 400);
      for (const m of (mj?.data ?? [])) captions.push(String(m?.caption ?? "").toLowerCase());
      url = mj?.paging?.next ?? null;
    }

    // ── 5) Compter les posts taguant un partenaire (@handle) ──────────
    const count = captions.filter((cap) =>
      handles.some((h) => cap.includes("@" + h))
    ).length;

    // ── 6) Écrire le compteur (service_role, bypass RLS) ──────────────
    const update: Record<string, unknown> = { partner_post_count: count };
    if (username) update.instagram_handle = username;
    const { error: updErr } = await admin.from("profiles").update(update).eq("id", userId);
    if (updErr) return json({ error: `profiles update: ${updErr.message}` }, 500);

    return json({ success: true, partnerPostCount: count, username, scanned: captions.length });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
