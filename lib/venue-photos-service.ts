import { supabase } from "@/lib/supabase";

const BUCKET = "venues";

export interface OwnerVenue {
  id: string;
  slug: string;
  name: string;
  cover_image_url: string | null;
  images: string[];
}

/** Venues possédées par le partenaire, avec cover + galerie (onglet Photos). */
export async function getOwnerVenues(userId: string): Promise<OwnerVenue[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from("venues")
    .select("id, slug, name, cover_image_url, images")
    .eq("owner_id", userId)
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((v: any) => ({
    id: v.id,
    slug: v.slug,
    name: v.name,
    cover_image_url: v.cover_image_url ?? null,
    images: Array.isArray(v.images) ? v.images : [],
  }));
}

function publicUrl(path: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/**
 * Upload/remplace la cover → venues/{slug}/cover.jpg (upsert).
 * La cover garde le même chemin → on ajoute ?v=<ts> pour casser le cache.
 * Renvoie la nouvelle URL (écrite dans venues.cover_image_url).
 */
export async function uploadCover(slug: string, bytes: ArrayBuffer, contentType = "image/jpeg"): Promise<string> {
  const path = `${slug}/cover.jpg`;
  const { error: upErr } = await supabase.storage.from(BUCKET)
    .upload(path, bytes, { upsert: true, contentType });
  if (upErr) throw new Error(upErr.message);

  const url = `${publicUrl(path)}?v=${Date.now()}`;
  const { error: dbErr } = await supabase.from("venues")
    .update({ cover_image_url: url }).eq("slug", slug);
  if (dbErr) throw new Error(dbErr.message);
  return url;
}

/** Supprime la cover (storage + cover_image_url = NULL). */
export async function removeCover(slug: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([`${slug}/cover.jpg`]);
  const { error } = await supabase.from("venues")
    .update({ cover_image_url: null }).eq("slug", slug);
  if (error) throw new Error(error.message);
}

/**
 * Ajoute une photo galerie → venues/{slug}/gallery/{ts}.jpg, puis append à
 * images[]. Renvoie le nouveau tableau images. (Limite 10 contrôlée côté UI.)
 */
export async function uploadGalleryPhoto(slug: string, bytes: ArrayBuffer, contentType = "image/jpeg"): Promise<string[]> {
  const path = `${slug}/gallery/${Date.now()}.jpg`;
  const { error: upErr } = await supabase.storage.from(BUCKET)
    .upload(path, bytes, { upsert: false, contentType });
  if (upErr) throw new Error(upErr.message);

  const url = publicUrl(path);
  const { data, error: selErr } = await supabase.from("venues")
    .select("images").eq("slug", slug).maybeSingle();
  if (selErr) throw new Error(selErr.message);
  const images = Array.isArray((data as any)?.images) ? (data as any).images : [];
  const next = [...images, url];
  const { error: dbErr } = await supabase.from("venues")
    .update({ images: next }).eq("slug", slug);
  if (dbErr) throw new Error(dbErr.message);
  return next;
}

/** Supprime une photo galerie (objet storage + retrait de images[]). */
export async function removeGalleryPhoto(slug: string, url: string): Promise<string[]> {
  const marker = `/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx >= 0) {
    const objectPath = url.slice(idx + marker.length).split("?")[0];
    await supabase.storage.from(BUCKET).remove([objectPath]);
  }
  const { data, error: selErr } = await supabase.from("venues")
    .select("images").eq("slug", slug).maybeSingle();
  if (selErr) throw new Error(selErr.message);
  const images = Array.isArray((data as any)?.images) ? (data as any).images : [];
  const next = images.filter((u: string) => u !== url);
  const { error: dbErr } = await supabase.from("venues")
    .update({ images: next }).eq("slug", slug);
  if (dbErr) throw new Error(dbErr.message);
  return next;
}
