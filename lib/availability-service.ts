import { supabase } from "@/lib/supabase";

export interface AvailabilitySlot {
  id: string;
  venue_id: string;
  day_of_week: number;   // 0 = dimanche … 6 = samedi
  time: string;          // "HH:MM"
  max_capacity: number;
  current_bookings: number;
  is_active: boolean;
  created_at: string;
}

export type NewSlot = {
  venue_id: string;
  day_of_week: number;
  time: string;
  max_capacity: number;
};

/** Tous les créneaux d'une venue (gestion partenaire). */
export async function getVenueSlots(venueId: string): Promise<AvailabilitySlot[]> {
  const { data, error } = await supabase
    .from("availability_slots")
    .select("*")
    .eq("venue_id", venueId)
    .order("day_of_week", { ascending: true })
    .order("time", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as AvailabilitySlot[];
}

/**
 * Créneaux DISPONIBLES d'une venue pour un jour donné (côté client) :
 * actifs + place restante (current_bookings < max_capacity).
 */
export async function getAvailableSlots(venueId: string, dayOfWeek: number): Promise<AvailabilitySlot[]> {
  const { data, error } = await supabase
    .from("availability_slots")
    .select("*")
    .eq("venue_id", venueId)
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true)
    .order("time", { ascending: true });
  if (error) throw new Error(error.message);
  // Filtre "complet" côté client (place restante)
  return ((data ?? []) as AvailabilitySlot[]).filter((s) => s.current_bookings < s.max_capacity);
}

export async function createSlot(slot: NewSlot): Promise<AvailabilitySlot> {
  const { data, error } = await supabase
    .from("availability_slots")
    .insert(slot)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as AvailabilitySlot;
}

export async function toggleSlot(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from("availability_slots")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteSlot(id: string): Promise<void> {
  const { error } = await supabase.from("availability_slots").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Réserve une place sur un créneau (incrément atomique via RPC book_slot). */
export async function bookSlot(slotId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("book_slot", { slot_id: slotId });
  if (error) throw new Error(error.message);
  return data === true;
}
