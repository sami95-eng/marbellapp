import { supabase } from "@/lib/supabase";

export interface Rating {
  id: string;
  booking_id: string;
  user_id: string;
  venue_id: string;
  score: number;
  comment: string | null;
  created_at: string;
}

export interface RatingWithUser extends Rating {
  user_name: string;
}

/** Avis existant de l'utilisateur pour une réservation (ou null). */
export async function getUserRatingForBooking(bookingId: string): Promise<Rating | null> {
  if (!bookingId) return null;
  const { data, error } = await supabase
    .from("ratings").select("*").eq("booking_id", bookingId).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Rating) ?? null;
}

/**
 * Crée ou met à jour l'avis de l'utilisateur pour une réservation.
 * Vérifie que la réservation est CONFIRMÉE et lui appartient (la RLS
 * applique la même règle côté serveur). Upsert sur booking_id (1 avis/résa).
 */
export async function submitRating(bookingId: string, score: number, comment: string): Promise<Rating> {
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    throw new Error("La note doit être comprise entre 1 et 5.");
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Connecte-toi pour laisser un avis.");

  const { data: booking, error: bErr } = await supabase
    .from("bookings").select("id, user_id, venue_id, status")
    .eq("id", bookingId).maybeSingle();
  if (bErr) throw new Error(bErr.message);
  if (!booking) throw new Error("Réservation introuvable.");
  if (booking.user_id !== user.id) throw new Error("Cette réservation ne t'appartient pas.");
  if (booking.status !== "confirmed") throw new Error("Tu ne peux noter qu'une réservation confirmée.");
  if (!booking.venue_id) throw new Error("Réservation sans établissement associé.");

  const payload = {
    booking_id: bookingId,
    user_id:    user.id,
    venue_id:   booking.venue_id,
    score,
    comment:    comment.trim() || null,
  };
  const { data, error } = await supabase
    .from("ratings").upsert(payload, { onConflict: "booking_id" }).select("*").single();
  if (error) throw new Error(error.message);
  return data as Rating;
}

/** Avis publics d'une venue, enrichis du nom utilisateur (profiles.display_name). */
export async function getVenueRatings(venueId: string, limit = 20): Promise<RatingWithUser[]> {
  if (!venueId) return [];
  const { data, error } = await supabase
    .from("ratings").select("*").eq("venue_id", venueId)
    .order("created_at", { ascending: false }).limit(limit);
  if (error) throw new Error(error.message);
  const ratings = (data ?? []) as Rating[];
  if (ratings.length === 0) return [];

  // Noms via profiles (lecture publique) — pas d'embed pour éviter la RLS bookings.
  const userIds = [...new Set(ratings.map((r) => r.user_id))];
  const { data: profs } = await supabase
    .from("profiles").select("id, display_name").in("id", userIds);
  const nameById = new Map((profs ?? []).map((p: any) => [p.id, p.display_name as string | null]));

  return ratings.map((r) => ({
    ...r,
    user_name: (nameById.get(r.user_id) ?? null) || "Client",
  }));
}
