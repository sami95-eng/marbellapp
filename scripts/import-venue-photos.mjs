// =====================================================================
// Import des vraies photos de venues → Supabase Storage + cover_image_url
//
// Pour chaque venue :
//   1) récupère une photo depuis le site officiel (og:image, sinon
//      /wp-content/uploads/…, sinon 1er <img> absolu)
//   2) la télécharge localement (scripts/.venue-photos/)
//   3) l'uploade dans le bucket Storage "venues" (créé public si absent)
//   4) met à jour venues.cover_image_url avec l'URL publique Storage
//
// Prérequis :
//   - Node 18+ (fetch natif).  npm i  (le projet a déjà @supabase/supabase-js)
//   - Variables d'env : SUPABASE_URL (ou EXPO_PUBLIC_SUPABASE_URL)
//     et SUPABASE_SERVICE_ROLE_KEY (clé service_role — NE PAS committer).
//     Mets SUPABASE_SERVICE_ROLE_KEY dans .env, ou exporte-la avant de lancer.
//
// Lancer :  node scripts/import-venue-photos.mjs
// =====================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ── Chargement .env (simple) ─────────────────────────────────────────
function loadEnv() {
  try {
    const txt = fs.readFileSync(path.join(ROOT, ".env"), "utf8");
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch { /* pas de .env, on lit l'environnement */ }
}
loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "venues";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ Variables manquantes. Renseigne SUPABASE_URL (ou EXPO_PUBLIC_SUPABASE_URL) et SUPABASE_SERVICE_ROLE_KEY.");
  console.error("   Ajoute SUPABASE_SERVICE_ROLE_KEY dans .env (Dashboard → Project Settings → API → service_role) puis relance.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// ── Venues à traiter ─────────────────────────────────────────────────
const VENUES = [
  { slug: "casanis-bistrot",       site: "https://casanisbistrot.com" },
  { slug: "la-plage-casanis",      site: "https://laplagecasanis.com" },
  { slug: "mamzel-finca-besaya",   site: "https://mamzelmarbella.com" },
  { slug: "nota-blu-brasserie",    site: "https://notablu.com" },
  { slug: "le-jade-marbella",      site: "https://lejademarbella.com" },
  { slug: "trocadero-arena",       site: "https://www.grupotrocadero.com/en/trocadero-arena-marbella/" },
  { slug: "trocadero-playa",       site: "https://www.grupotrocadero.com" },
  { slug: "trocadero-petit-playa", site: "https://www.grupotrocadero.com/en/trocadero-petit-playa/" },
  { slug: "divot-gastro-grill",    site: "https://divot.es" },
  { slug: "lov-marbella",          site: "https://oliviavalere.com" },
  // nao-marbella : site inconnu → on laisse l'image temporaire (non listé ici)
];

// ── Extraction de l'URL d'image depuis le HTML ───────────────────────
function extractImageUrl(html, baseUrl) {
  // 1) og:image (les deux ordres d'attributs)
  let m =
    html.match(/<meta[^>]+(?:property|name)=["']og:image(?::url|:secure_url)?["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']og:image(?::url|:secure_url)?["']/i);
  if (m && m[1]) return new URL(m[1], baseUrl).toString();

  // 2) première image /wp-content/uploads/
  m = html.match(/https?:\/\/[^"')\s]+\/wp-content\/uploads\/[^"')\s]+\.(?:jpe?g|png|webp)/i);
  if (m) return new URL(m[0], baseUrl).toString();

  // 3) repli : premier <img src> absolu en jpg/png/webp
  m = html.match(/<img[^>]+src=["'](https?:\/\/[^"']+\.(?:jpe?g|png|webp)[^"']*)["']/i);
  if (m && m[1]) return new URL(m[1], baseUrl).toString();

  return null;
}

function extFor(url, contentType) {
  const u = url.split("?")[0].toLowerCase();
  if (u.endsWith(".png")  || contentType.includes("png"))  return { ext: ".png",  mime: "image/png" };
  if (u.endsWith(".webp") || contentType.includes("webp")) return { ext: ".webp", mime: "image/webp" };
  return { ext: ".jpg", mime: "image/jpeg" };
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Accept": "text/html,application/xhtml+xml" },
    redirect: "follow",
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function fetchImage(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow", signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`image HTTP ${res.status}`);
  const ct = res.headers.get("content-type") || "";
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1000) throw new Error("image trop petite / vide");
  return { buf, ct };
}

// ── Bucket public ────────────────────────────────────────────────────
async function ensureBucket() {
  const { data: list } = await supabase.storage.listBuckets();
  if (list?.some((b) => b.name === BUCKET)) {
    console.log(`• Bucket "${BUCKET}" déjà présent.`);
    return;
  }
  const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
  if (error && !/already exists/i.test(error.message)) throw error;
  console.log(`• Bucket "${BUCKET}" créé (public).`);
}

// ── Pipeline ─────────────────────────────────────────────────────────
async function main() {
  const outDir = path.join(__dirname, ".venue-photos");
  fs.mkdirSync(outDir, { recursive: true });

  await ensureBucket();

  const results = [];
  for (const { slug, site } of VENUES) {
    try {
      process.stdout.write(`→ ${slug} … `);
      const html = await fetchText(site);
      const imgUrl = extractImageUrl(html, site);
      if (!imgUrl) throw new Error("aucune image trouvée sur la page");

      const { buf, ct } = await fetchImage(imgUrl);
      const { ext, mime } = extFor(imgUrl, ct);

      // 2) sauvegarde locale
      const localPath = path.join(outDir, `${slug}${ext}`);
      fs.writeFileSync(localPath, buf);

      // 3) upload Storage
      const storagePath = `${slug}${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, buf, { upsert: true, contentType: ct || mime });
      if (upErr) throw new Error(`upload: ${upErr.message}`);

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
      const publicUrl = pub.publicUrl;

      // 4) update DB
      const { data: upd, error: dbErr } = await supabase
        .from("venues")
        .update({ cover_image_url: publicUrl })
        .eq("slug", slug)
        .select("slug");
      if (dbErr) throw new Error(`db: ${dbErr.message}`);
      if (!upd || upd.length === 0) throw new Error("slug introuvable en base (venue absente ?)");

      console.log("✅");
      results.push({ slug, ok: true, source: imgUrl, publicUrl });
    } catch (e) {
      console.log("❌");
      results.push({ slug, ok: false, error: e.message });
    }
  }

  // ── Récap ──────────────────────────────────────────────────────────
  console.log("\n══════════════ RÉCAP ══════════════");
  const ok = results.filter((r) => r.ok);
  const ko = results.filter((r) => !r.ok);
  for (const r of ok) console.log(`✅ ${r.slug}\n     source : ${r.source}\n     storage: ${r.publicUrl}`);
  for (const r of ko) console.log(`❌ ${r.slug} — ${r.error} (image temporaire conservée)`);
  console.log(`\n${ok.length} réussi(s) · ${ko.length} échec(s) · nao-marbella ignoré (site inconnu → image temporaire).`);
}

main().catch((e) => { console.error("Erreur fatale:", e); process.exit(1); });
