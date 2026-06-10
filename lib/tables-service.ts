import { supabase } from "@/lib/supabase";

export interface VenueTable {
  id: string;
  venue_id: string;
  name: string;
  description: string | null;
  capacity_min: number;
  capacity_max: number;
  price_min: number;
  price_max: number | null;
  photo_url: string | null;
  is_active: boolean;
  is_vip: boolean;
  sort_order: number;
  created_at: string;
}

export type NewTable = Omit<VenueTable, "id" | "venue_id" | "created_at">;

/** Fetch all tables for a venue (by slug). Returns [] if slug not found. */
export async function getVenueTables(venueSlug: string): Promise<VenueTable[]> {
  if (!venueSlug) return [];

  const { data: venue, error: vErr } = await supabase
    .from("venues")
    .select("id")
    .eq("slug", venueSlug)
    .maybeSingle();

  if (vErr || !venue) return [];

  const { data, error } = await supabase
    .from("venue_tables")
    .select("*")
    .eq("venue_id", venue.id)
    .order("sort_order");

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Fetch all tables for a venue by UUID (for partner dashboard). */
export async function getVenueTablesByUUID(venueId: string): Promise<VenueTable[]> {
  if (!venueId) return [];
  const { data, error } = await supabase
    .from("venue_tables")
    .select("*")
    .eq("venue_id", venueId)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createVenueTable(venueId: string, table: NewTable): Promise<VenueTable> {
  const { data, error } = await supabase
    .from("venue_tables")
    .insert({ ...table, venue_id: venueId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateVenueTable(id: string, updates: Partial<NewTable>): Promise<void> {
  const { error } = await supabase
    .from("venue_tables")
    .update(updates)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function toggleTableActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from("venue_tables")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteVenueTable(id: string): Promise<void> {
  const { error } = await supabase
    .from("venue_tables")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}
