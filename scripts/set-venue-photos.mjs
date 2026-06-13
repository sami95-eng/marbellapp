// Met à jour cover_image_url pour des venues avec des URLs explicites.
// download → upload Storage (upsert) → UPDATE venues.cover_image_url
// Lancer : node scripts/set-venue-photos.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
(function loadEnv() {
  try {
    for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
})();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "venues";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants (.env).");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const TARGETS = [
  // Sites Trocadero bloquent le scraping (Elementor lazy-load, pas d'og:image)
  // et pas de clé Google Places API dispo → fallback Wikimedia Commons (Marbella).
  { slug: "trocadero-arena",       url: "https://upload.wikimedia.org/wikipedia/commons/5/54/Marbella_Beach%2C_Costa_Del_Sol%2C_Spain_-_Sept_2008.jpg" },
  { slug: "trocadero-petit-playa", url: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Cabopino_beach%2C_Costa_del_Sol%2C_Spain_2005.jpg" },
];

function extFor(url, ct) {
  const u = url.split("?")[0].toLowerCase();
  if (u.endsWith(".png")  || ct.includes("png"))  return { ext: ".png",  mime: "image/png" };
  if (u.endsWith(".webp") || ct.includes("webp")) return { ext: ".webp", mime: "image/webp" };
  return { ext: ".jpg", mime: "image/jpeg" };
}

async function run() {
  const outDir = path.join(__dirname, ".venue-photos");
  fs.mkdirSync(outDir, { recursive: true });
  const results = [];

  for (const { slug, url } of TARGETS) {
    try {
      process.stdout.write(`→ ${slug} … `);
      const res = await fetch(url, { headers: { "User-Agent": UA, "Referer": new URL(url).origin }, redirect: "follow", signal: AbortSignal.timeout(30000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const ct = res.headers.get("content-type") || "";
      if (ct && !ct.startsWith("image/")) throw new Error(`pas une image (${ct})`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 8000) throw new Error("image trop petite / vide");

      const { ext, mime } = extFor(url, ct);
      fs.writeFileSync(path.join(outDir, `${slug}${ext}`), buf);

      const storagePath = `${slug}${ext}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(storagePath, buf, { upsert: true, contentType: ct || mime });
      if (upErr) throw new Error(`upload: ${upErr.message}`);

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
      const publicUrl = pub.publicUrl;

      const { data: upd, error: dbErr } = await supabase.from("venues")
        .update({ cover_image_url: publicUrl }).eq("slug", slug).select("slug");
      if (dbErr) throw new Error(`db: ${dbErr.message}`);
      if (!upd || upd.length === 0) throw new Error("slug introuvable en base");

      console.log("✅");
      results.push({ slug, ok: true, source: url, publicUrl });
    } catch (e) {
      console.log("❌");
      results.push({ slug, ok: false, error: e.message });
    }
  }

  console.log("\n══════════════ RÉCAP ══════════════");
  for (const r of results) {
    if (r.ok) console.log(`✅ ${r.slug}\n     source : ${r.source}\n     storage: ${r.publicUrl}`);
    else console.log(`❌ ${r.slug} — ${r.error} (image actuelle conservée)`);
  }
  const ok = results.filter((r) => r.ok).length;
  console.log(`\n${ok} réussi(s) · ${results.length - ok} échec(s).`);
}

run().catch((e) => { console.error("Erreur fatale:", e); process.exit(1); });
