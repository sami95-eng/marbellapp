import { supabase } from "@/lib/supabase";

export interface Booking {
  id: string;
  user_id: string;
  venue_id: string | null;
  venue_name: string;
  venue_slug: string | null;
  venue_category: string | null;
  date: string;
  time: string;
  guests: number;
  table_id: string | null;
  table_name: string | null;
  table_price: number | null;
  notes: string | null;
  phone_number: string | null;
  user_email: string | null;
  user_name: string | null;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  confirmation_number: string | null;
  slot_id: string | null;
  created_at: string;
}

export type NewBooking = Omit<Booking, "id" | "created_at">;

export async function getUserBookings(userId: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Booking[];
}

export async function createBooking(booking: NewBooking): Promise<Booking> {
  console.log("[bookings-service] createBooking payload:", JSON.stringify(booking));

  const { data, error } = await supabase
    .from("bookings")
    .insert(booking)
    .select("*")
    .single();

  console.log("[bookings-service] insert result — data:", data, "error:", error);

  if (error) throw new Error(`Supabase error ${error.code}: ${error.message}`);
  // Supabase v2 returns { data: null, error: null } when RLS silently blocks INSERT
  if (!data) throw new Error("Insert returned no data — RLS policy may be blocking the insert. Verify auth.uid() = user_id.");
  return data as Booking;
}

/**
 * Réservations gérées côté partenaire/admin.
 * La RLS (rôle partner/admin) restreint l'accès — voir
 * supabase/booking_status_partner.sql.
 */
export async function getManagedBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);
  return (data ?? []) as Booking[];
}

/** Met à jour le statut d'une réservation (confirm/refuse côté partenaire). */
export async function updateBookingStatus(
  id: string,
  status: Booking["status"]
): Promise<void> {
  const { data, error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  console.warn(`[updateBookingStatus] id=${id} status=${status} → data=`, data, "error=", error?.message ?? null);

  if (error) throw new Error(error.message);
  // RLS bloque silencieusement (0 ligne) si le compte n'a pas le rôle partner/admin
  // pour CETTE réservation (typiquement : booking d'un autre user + policy
  // "Partners update all bookings" absente ou rôle non reconnu).
  if (!data) throw new Error(`Mise à jour refusée par la RLS pour la réservation ${id} — la policy UPDATE "Partners update all bookings" est probablement absente, ou le rôle (partner/admin) n'est pas appliqué. Voir supabase/booking_status_partner.sql.`);
}

/** Modifie la date/heure d'une réservation (reprogrammation côté partenaire). */
export async function updateBookingSchedule(
  id: string,
  date: string,
  time: string
): Promise<void> {
  const { data, error } = await supabase
    .from("bookings")
    .update({ date, time })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  console.warn(`[updateBookingSchedule] id=${id} → ${date} ${time} → data=`, data, "error=", error?.message ?? null);

  if (error) throw new Error(error.message);
  if (!data) throw new Error(`Modification refusée par la RLS pour la réservation ${id} — vérifiez le rôle (partner/admin) et la policy UPDATE "Partners update all bookings".`);
}

export async function cancelBooking(id: string): Promise<void> {
  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function markBookingCompleted(id: string): Promise<void> {
  const { error } = await supabase
    .from("bookings")
    .update({ status: "completed" })
    .eq("id", id);

  if (error) throw new Error(error.message);
}
