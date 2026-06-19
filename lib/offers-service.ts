import { supabase } from "@/lib/supabase";

// Union exposée au dashboard (inchangée pour l'OffersTab). ⚠️ La table réelle
// (vip_offers « version B ») contraint offer_type à ('table','bed','bottle',
// 'private') : le service n'écrit donc que des valeurs valides et refuse
// 'discount'/'experience' (voir assertDbOfferType).
export type OfferType = "table" | "bed" | "bottle" | "discount" | "experience";

// Valeurs réellement acceptées par vip_offers.offer_type (CHECK en base).
const DB_OFFER_TYPES = ["table", "bed", "bottle", "private"] as const;
function assertDbOfferType(t: OfferType): string {
  if ((DB_OFFER_TYPES as readonly string[]).includes(t)) return t;
  throw new Error(`offer_type invalide: "${t}" (attendu: table | bed | bottle | private)`);
}

// Modèle applicatif (stable, consommé par l'OffersTab). Les noms diffèrent des
// colonnes DB : le service fait l'adaptation (offer_type↔type, spots_left↔spots_remaining…).
export interface VipOffer {
  id: string;
  venue_id: string;               // UUID résolu (la table B stocke venue_slug)
  title: string;                  // ← table_type
  type: OfferType;                // ← offer_type
  description: string | null;
  original_price: number | null;
  vip_price: number | null;
  capacity: number;
  spots_total: number;
  spots_remaining: number;        // ← spots_left
  available_date: string | null;  // ← event_date
  available_time: string | null;  // ← event_time
  instagram_required: boolean;
  instagram_handle: string | null;
  is_active: boolean;
  created_at: string;
}

export type NewVipOffer = {
  title: string;
  type: OfferType;
  description?: string | null;
  original_price?: number | null;
  vip_price?: number | null;
  capacity?: number;
  spots_total?: number;
};

// Ligne brute de la table B.
interface VipOfferRow {
  id: string;
  venue_name: string;
  venue_slug: string;
  instagram_handle: string | null;
  image_url: string | null;
  event_date: string;
  event_time: string;
  offer_type: string;  // DB : 'table'|'bed'|'bottle'|'private'
  table_type: string;
  capacity: number;
  original_price: number;
  vip_price: number;
  perks: string[];
  spots_total: number;
  spots_left: number;
  tag: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

function rowToOffer(r: VipOfferRow, venueId: string): VipOffer {
  return {
    id: r.id,
    venue_id: venueId,
    title: r.table_type,
    type: r.offer_type as OfferType,
    description: null,
    original_price: r.original_price,
    vip_price: r.vip_price,
    capacity: r.capacity,
    spots_total: r.spots_total,
    spots_remaining: r.spots_left,
    available_date: r.event_date,
    available_time: r.event_time,
    instagram_required: true,
    instagram_handle: r.instagram_handle,
    is_active: r.is_active,
    created_at: r.created_at,
  };
}

/** Résout l'UUID d'une venue vers son slug + nom (requis pour la table B). */
async function resolveVenue(venueId: string): Promise<{ slug: string; name: string } | null> {
  if (!venueId) return null;
  const { data } = await supabase
    .from("venues").select("slug, name").eq("id", venueId).maybeSingle();
  if (!data) return null;
  return { slug: (data as any).slug, name: (data as any).name };
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Génère un id TEXT (la table B n'a pas de défaut sur la PK).
function genOfferId(): string {
  return `off-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Offres VIP d'une venue (table B : filtrées par venue_slug). */
export async function getVenueOffers(venueId: string): Promise<VipOffer[]> {
  const venue = await resolveVenue(venueId);
  if (!venue) return [];
  const { data, error } = await supabase
    .from("vip_offers")
    .select("*")
    .eq("venue_slug", venue.slug)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return ((data ?? []) as VipOfferRow[]).map((r) => rowToOffer(r, venueId));
}

/**
 * Crée une offre. Cible la table B : id TEXT fourni, venue_slug (pas venue_id),
 * offer_type contraint, spots_left initialisé à spots_total.
 */
export async function createVenueOffer(venueId: string, offer: NewVipOffer): Promise<VipOffer> {
  const venue = await resolveVenue(venueId);
  if (!venue) throw new Error("Venue introuvable pour cette offre.");
  const offerType = assertDbOfferType(offer.type);
  const spots = offer.spots_total ?? 10;
  const row = {
    id:             genOfferId(),
    venue_name:     venue.name,
    venue_slug:     venue.slug,
    offer_type:     offerType,
    table_type:     offer.title,
    capacity:       offer.capacity ?? 4,
    original_price: offer.original_price ?? 0,
    vip_price:      offer.vip_price ?? 0,
    event_date:     todayISO(),
    event_time:     "20:00",
    spots_total:    spots,
    spots_left:     spots,
    is_active:      true,
  };
  const { data, error } = await supabase
    .from("vip_offers").insert(row).select("*").single();
  if (error) throw new Error(error.message);
  return rowToOffer(data as VipOfferRow, venueId);
}

/** Met à jour une offre (mappe les champs app → colonnes table B). */
export async function updateVenueOffer(
  id: string,
  updates: Partial<{
    title: string; type: OfferType;
    original_price: number; vip_price: number;
    spots_total: number; spots_left: number; is_active: boolean;
  }>,
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (updates.title !== undefined)          row.table_type     = updates.title;
  if (updates.type !== undefined)           row.offer_type     = assertDbOfferType(updates.type);
  if (updates.original_price !== undefined) row.original_price = updates.original_price;
  if (updates.vip_price !== undefined)      row.vip_price      = updates.vip_price;
  if (updates.spots_total !== undefined)    row.spots_total    = updates.spots_total;
  if (updates.spots_left !== undefined)     row.spots_left     = updates.spots_left;
  if (updates.is_active !== undefined)      row.is_active      = updates.is_active;
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase.from("vip_offers").update(row).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function toggleVenueOffer(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from("vip_offers").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteVenueOffer(id: string): Promise<void> {
  const { error } = await supabase.from("vip_offers").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
