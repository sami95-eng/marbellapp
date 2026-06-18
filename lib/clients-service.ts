import { supabase } from "@/lib/supabase";

export interface AdminClient {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  last_booking_at: string | null;
  total_bookings: number;
  favorite_venue: string | null;
  active: boolean;
}

export interface ClientBooking {
  id: string;
  venue_name: string;
  date: string;
  time: string;
  status: string;
  created_at: string;
}

/** Liste des clients (RPC admin sécurisée get_admin_clients). */
export async function getAdminClients(): Promise<AdminClient[]> {
  const { data, error } = await supabase.rpc("get_admin_clients");
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    created_at: r.created_at,
    last_booking_at: r.last_booking_at,
    total_bookings: Number(r.total_bookings) || 0,
    favorite_venue: r.favorite_venue,
    active: !!r.active,
  }));
}

/** Nombre de réservations créées depuis le début du mois courant. */
export async function getBookingsThisMonthCount(): Promise<number> {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const { count, error } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .gte("created_at", start.toISOString());
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/** Historique complet des réservations d'un client (admin). */
export async function getClientBookings(userId: string): Promise<ClientBooking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("id, venue_name, date, time, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ClientBooking[];
}
