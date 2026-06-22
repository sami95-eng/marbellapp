import { supabase } from "@/lib/supabase";

// ── Types ─────────────────────────────────────────────────────────

export interface Venue {
  id: string;            // UUID Supabase
  slug: string;
  name: string;
  group_name: string | null;
  category: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  opening_hours: string | null;
  lat: number | null;
  lng: number | null;
  instagram_handle: string | null;
  cover_image_url: string | null;
  images: string[] | null;
  rating: number;
  rating_avg: number | null;     // agrégat des avis (ratings.sql)
  rating_count: number | null;
  price_range: string | null;
  avg_price_eur: number | null;
  is_partner: boolean;
  is_active: boolean;
  contact_email: string | null;
  whatsapp_number: string | null;
}

// ── Mapping clé-app → nom DB ──────────────────────────────────────

export const CATEGORY_MAP: Record<string, string> = {
  "beach-clubs":  "Beach Club",
  "fine-dining":  "Fine Dining",
  "spas":         "Spa & Wellness",
  "nightlife":    "Nightlife",
  "events":       "Events",
  "shopping":     "Water Sports",
  "hotel":        "Hotel",
};

// Reverse map: DB category → app slug
export const CATEGORY_REVERSE_MAP: Record<string, string> = {
  "Beach Club":     "beach-clubs",
  "Fine Dining":    "fine-dining",
  "Spa & Wellness": "spas",
  "Nightlife":      "nightlife",
  "Events":         "events",
  "Water Sports":   "shopping",
  "Hotel":          "hotel",
};

// Offres par défaut si la DB n'a pas de champ offers
export const DEFAULT_OFFERS: Record<string, string[]> = {
  "Beach Club":     ["VIP Table Reservation", "Sunset Cocktails", "Beach Access", "Pool Party", "Fine Dining"],
  "Fine Dining":    ["Tasting Menu", "Wine Pairing", "Private Dining", "Chef's Table", "Seasonal Menu"],
  "Spa & Wellness": ["Signature Massage", "Facial Treatments", "Hydrotherapy", "Yoga Classes", "Couples Retreat"],
  "Nightlife":      ["VIP Packages", "Bottle Service", "Guest List", "Private Booth", "After Party"],
  "Events":         ["VIP Tickets", "Backstage Access", "Gourmet Dining", "Meet & Greet", "Private Box"],
  "Water Sports":   ["Jet Ski Rental", "Boat Charter", "Parasailing", "Flyboard", "Wakeboard & Ski"],
  "Hotel":          ["Spa Access", "Fine Dining", "Concierge", "Pool Access", "Room Service"],
};

// ── Fonctions de requête ──────────────────────────────────────────

/** Top venues pour la home (mélange de catégories, triés par rating) */
export async function getFeaturedVenues(limit = 6): Promise<Venue[]> {
  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .eq("is_active", true)
    .not("category", "in", '("Hotel")')
    .order("rating", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Venues par catégorie avec filtres optionnels */
export async function getVenuesByCategory(
  categoryKey: string,
  filters?: { priceRanges?: string[]; minRating?: number; sortBy?: string }
): Promise<Venue[]> {
  const dbCategory = CATEGORY_MAP[categoryKey];
  if (!dbCategory) return [];

  let query = supabase
    .from("venues")
    .select("*")
    .eq("is_active", true)
    .eq("category", dbCategory);

  if (filters?.minRating && filters.minRating > 0) {
    query = query.gte("rating", filters.minRating);
  }
  if (filters?.priceRanges && filters.priceRanges.length > 0) {
    query = query.in("price_range", filters.priceRanges);
  }

  switch (filters?.sortBy) {
    case "rating":
      query = query.order("rating", { ascending: false });
      break;
    case "price_low":
      query = query.order("avg_price_eur", { ascending: true, nullsFirst: false });
      break;
    case "price_high":
      query = query.order("avg_price_eur", { ascending: false, nullsFirst: false });
      break;
    default:
      // Popular: partenaires en premier, puis rating
      query = query
        .order("is_partner", { ascending: false })
        .order("rating", { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export interface VenueBasic {
  id: string;
  name: string;
  category: string;
  slot_start: string;        // "HH:MM"
  slot_end: string;          // "HH:MM"
  default_capacity: number;
}

/**
 * Map slug → cover_image_url pour toutes les venues.
 * Permet d'aligner automatiquement des visuels externes (offres VIP, etc.)
 * sur la photo de couverture des fiches établissements.
 */
export async function getVenueCovers(): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from("venues")
    .select("slug, cover_image_url");
  if (error) throw new Error(error.message);
  const map: Record<string, string> = {};
  for (const v of (data ?? []) as { slug: string | null; cover_image_url: string | null }[]) {
    if (v.slug && v.cover_image_url) map[v.slug] = v.cover_image_url;
  }
  return map;
}

/** Fenêtre d'ouverture (slot_start/slot_end) d'une venue, par UUID. */
export async function getVenueSlotWindow(
  venueId: string
): Promise<{ slot_start: string; slot_end: string } | null> {
  const { data, error } = await supabase
    .from("venues")
    .select("slot_start, slot_end")
    .eq("id", venueId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const d = data as { slot_start?: string | null; slot_end?: string | null };
  return { slot_start: d.slot_start ?? "10:00", slot_end: d.slot_end ?? "00:00" };
}

/** Liste simplifiée de toutes les venues + config créneaux (sélecteur admin) */
export async function getAllVenuesBasic(): Promise<VenueBasic[]> {
  const { data, error } = await supabase
    .from("venues")
    .select("id, name, category, slot_start, slot_end, default_capacity")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((v: any) => ({
    id: v.id, name: v.name, category: v.category,
    slot_start: v.slot_start ?? "10:00",
    slot_end: v.slot_end ?? "00:00",
    default_capacity: v.default_capacity ?? 10,
  }));
}

/**
 * Venues possédées par un partenaire (owner_id = utilisateur connecté).
 * Remplace getAllVenuesBasic pour scoper le dashboard partenaire.
 */
export async function getManagedVenues(userId: string): Promise<VenueBasic[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from("venues")
    .select("id, name, category, slot_start, slot_end, default_capacity")
    .eq("owner_id", userId)
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((v: any) => ({
    id: v.id, name: v.name, category: v.category,
    slot_start: v.slot_start ?? "10:00",
    slot_end: v.slot_end ?? "00:00",
    default_capacity: v.default_capacity ?? 10,
  }));
}

/** Première venue possédée par le partenaire (ou null). */
export async function getManagedVenue(userId: string): Promise<VenueBasic | null> {
  const venues = await getManagedVenues(userId);
  return venues[0] ?? null;
}

/** Met à jour la fenêtre horaire / capacité par défaut d'une venue. */
export async function updateVenueSlotConfig(
  venueId: string,
  config: { slot_start: string; slot_end: string; default_capacity: number }
): Promise<void> {
  const { error } = await supabase.from("venues").update(config).eq("id", venueId);
  if (error) throw new Error(error.message);
}

/** Venue par slug */
export async function getVenueBySlug(slug: string): Promise<Venue | null> {
  if (!slug) return null;

  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

/** Toutes les venues avec coords GPS (pour la carte) */
export async function getAllVenuesForMap(): Promise<Pick<Venue, "id" | "slug" | "name" | "category" | "lat" | "lng" | "rating" | "cover_image_url">[]> {
  const { data, error } = await supabase
    .from("venues")
    .select("id, slug, name, category, lat, lng, rating, cover_image_url")
    .eq("is_active", true)
    .not("lat", "is", null)
    .not("lng", "is", null);

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Recherche full-text */
export async function searchVenues(query: string): Promise<Venue[]> {
  if (!query || query.trim().length === 0) {
    const { data } = await supabase
      .from("venues")
      .select("*")
      .eq("is_active", true)
      .order("is_partner", { ascending: false })
      .order("rating", { ascending: false })
      .limit(30);
    return (data ?? []) as Venue[];
  }

  const term = query.trim();
  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .eq("is_active", true)
    .or(
      `name.ilike.%${term}%,` +
      `description.ilike.%${term}%,` +
      `category.ilike.%${term}%,` +
      `group_name.ilike.%${term}%,` +
      `address.ilike.%${term}%`
    )
    .order("rating", { ascending: false })
    .limit(25);

  if (error) throw new Error(error.message);
  return (data ?? []) as Venue[];
}
