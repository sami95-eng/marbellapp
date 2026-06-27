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
  payment_method: "card" | "cash";
  confirmation_number: string | null;
  slot_id: string | null;
  // Paiement par acompte : deposit_only = true si seul l'acompte (30%) a été
  // réglé en ligne ; deposit_amount = montant de l'acompte (en euros).
  deposit_only: boolean;
  deposit_amount: number | null;
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

/**
 * Récupère une réservation par son id. La RLS (propriétaire) autorise la
 * lecture de sa propre réservation — utilisé au retour de Stripe Checkout.
 */
export async function getBookingById(id: string): Promise<Booking | null> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as Booking | null) ?? null;
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

// ─────────────────────────────────────────────────────────────────────────────
// Statistiques partenaire (dashboard) — données réelles agrégées.
// La RLS "Partners view all bookings" ne scope PAS par venue ; on filtre donc
// ici sur les venues du partenaire (owner_id). Admin → toutes les venues.
// ─────────────────────────────────────────────────────────────────────────────
export interface PartnerStats {
  totalBookings: number;
  bookingsThisMonth: number;
  bookingsLastMonth: number;
  confirmedRevenue: number;
  avgRating: number | null;
  monthly: { months: string[]; values: number[] };
  topVenues: { name: string; bookings: number; revenue: number }[];
  recent: { venueName: string; status: Booking["status"]; date: string }[];
  // Revenus confirmés du mois courant / précédent + commission plateforme (10%).
  revenueThisMonth: number;
  revenueLastMonth: number;
  commissionThisMonth: number;
  // Taux de remplissage des créneaux : current_bookings / max_capacity (0..1, ou null).
  fillRate: number | null;
  // Tables les plus réservées.
  topTables: { name: string; bookings: number }[];
  // Réservations par jour sur les 30 derniers jours.
  daily: { days: string[]; values: number[] };
}

export async function getPartnerStats(opts: { userId?: string; isAdmin: boolean }): Promise<PartnerStats> {
  const empty: PartnerStats = {
    totalBookings: 0, bookingsThisMonth: 0, bookingsLastMonth: 0,
    confirmedRevenue: 0, avgRating: null,
    monthly: { months: [], values: [] }, topVenues: [], recent: [],
    revenueThisMonth: 0, revenueLastMonth: 0, commissionThisMonth: 0,
    fillRate: null, topTables: [], daily: { days: [], values: [] },
  };

  // 1) Venues dans le périmètre (partenaire = les siennes via owner_id, admin = toutes)
  let vq = supabase.from("venues").select("id, name, rating_avg, rating");
  if (!opts.isAdmin) vq = vq.eq("owner_id", opts.userId ?? "");
  const { data: venues, error: vErr } = await vq;
  if (vErr) throw new Error(vErr.message);
  const venueRows = (venues ?? []) as { id: string; name: string; rating_avg: number | null; rating: number | null }[];
  const ids = venueRows.map((v) => v.id);
  if (ids.length === 0) return empty;

  // 2) Réservations de ces venues
  const { data: rows, error: bErr } = await supabase
    .from("bookings")
    .select("venue_name, status, table_price, table_name, date, created_at")
    .in("venue_id", ids);
  if (bErr) throw new Error(bErr.message);
  const bookings = (rows ?? []) as Pick<Booking, "venue_name" | "status" | "table_price" | "table_name" | "date" | "created_at">[];

  // Capacité des créneaux (pour le taux de remplissage). RLS : le partenaire lit
  // les créneaux de ses venues ; en cas d'erreur on laisse fillRate à null.
  let fillRate: number | null = null;
  try {
    const { data: slotRows } = await supabase
      .from("availability_slots")
      .select("max_capacity, current_bookings")
      .in("venue_id", ids);
    let capSum = 0, bookedSum = 0;
    for (const s of (slotRows ?? []) as { max_capacity: number | null; current_bookings: number | null }[]) {
      capSum += Number(s.max_capacity) || 0;
      bookedSum += Number(s.current_bookings) || 0;
    }
    fillRate = capSum > 0 ? bookedSum / capSum : null;
  } catch { /* fillRate stays null */ }

  // 3) Agrégats mensuels (clé "YYYY-MM" basée sur la date de réservation)
  const now = new Date();
  const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const monthKey = (s: string | null) => (s ?? "").slice(0, 7);
  const curKey = ym(now);
  const lastKey = ym(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  let bookingsThisMonth = 0, bookingsLastMonth = 0, confirmedRevenue = 0;
  let revenueThisMonth = 0, revenueLastMonth = 0;
  for (const b of bookings) {
    const mk = monthKey(b.date);
    if (mk === curKey) bookingsThisMonth++;
    if (mk === lastKey) bookingsLastMonth++;
    if (b.status === "confirmed") {
      const price = Number(b.table_price) || 0;
      confirmedRevenue += price;
      if (mk === curKey) revenueThisMonth += price;
      if (mk === lastKey) revenueLastMonth += price;
    }
  }
  const COMMISSION_RATE = 0.10; // commission plateforme sur paiements carte
  const commissionThisMonth = Math.round(revenueThisMonth * COMMISSION_RATE);

  // Top tables (toutes réservations confondues, par nombre de réservations).
  const byTable = new Map<string, number>();
  for (const b of bookings) {
    const name = b.table_name?.trim();
    if (!name) continue;
    byTable.set(name, (byTable.get(name) ?? 0) + 1);
  }
  const topTables = [...byTable.entries()]
    .map(([name, count]) => ({ name, bookings: count }))
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 5);

  // Série des 30 derniers jours (nombre de réservations par jour).
  const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const dailyCount = new Map<string, number>();
  for (const b of bookings) {
    const k = (b.date ?? "").slice(0, 10);
    if (k) dailyCount.set(k, (dailyCount.get(k) ?? 0) + 1);
  }
  const daily = { days: [] as string[], values: [] as number[] };
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const k = dayKey(d);
    daily.days.push(String(d.getDate()));
    daily.values.push(dailyCount.get(k) ?? 0);
  }

  // 4) Série des 6 derniers mois (nombre de réservations)
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthly = { months: [] as string[], values: [] as number[] };
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = ym(d);
    monthly.months.push(MONTHS[d.getMonth()]);
    monthly.values.push(bookings.filter((b) => monthKey(b.date) === key).length);
  }

  // 5) Top venues (par nombre de réservations ; revenu = réservations confirmées)
  const byVenue = new Map<string, { name: string; bookings: number; revenue: number }>();
  for (const b of bookings) {
    const name = b.venue_name ?? "—";
    const cur = byVenue.get(name) ?? { name, bookings: 0, revenue: 0 };
    cur.bookings++;
    if (b.status === "confirmed") cur.revenue += Number(b.table_price) || 0;
    byVenue.set(name, cur);
  }
  const topVenues = [...byVenue.values()].sort((a, b) => b.bookings - a.bookings).slice(0, 5);

  // 6) Activité récente (4 dernières réservations créées)
  const recent = [...bookings]
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
    .slice(0, 4)
    .map((b) => ({ venueName: b.venue_name ?? "—", status: b.status, date: b.date }));

  // 7) Note moyenne des venues du périmètre
  const ratings = venueRows
    .map((v) => (typeof v.rating_avg === "number" && v.rating_avg > 0 ? v.rating_avg : v.rating))
    .filter((r): r is number => typeof r === "number" && r > 0);
  const avgRating = ratings.length ? ratings.reduce((s, r) => s + r, 0) / ratings.length : null;

  return {
    totalBookings: bookings.length,
    bookingsThisMonth, bookingsLastMonth,
    confirmedRevenue, avgRating, monthly, topVenues, recent,
    revenueThisMonth, revenueLastMonth, commissionThisMonth,
    fillRate, topTables, daily,
  };
}
