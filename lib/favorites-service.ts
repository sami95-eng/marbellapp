import { supabase } from "@/lib/supabase";

/** Favoris persistés dans Supabase (table `favorites`, RLS par user). */

export async function getFavorites(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("favorites")
    .select("venue_id")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.venue_id as string);
}

export async function addFavorite(userId: string, venueId: string): Promise<void> {
  const { error } = await supabase
    .from("favorites")
    .insert({ user_id: userId, venue_id: venueId });
  // Ignore les doublons (contrainte unique) — favori déjà présent
  if (error && !/duplicate|unique/i.test(error.message)) throw new Error(error.message);
}

export async function removeFavorite(userId: string, venueId: string): Promise<void> {
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("venue_id", venueId);
  if (error) throw new Error(error.message);
}
