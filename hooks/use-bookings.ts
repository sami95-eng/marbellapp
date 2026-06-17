import { useState, useEffect, useCallback, useRef } from "react";
import {
  Booking,
  NewBooking,
  getUserBookings,
  createBooking,
  cancelBooking,
} from "@/lib/bookings-service";
import { releaseSlot } from "@/lib/availability-service";

interface UseBookingsResult {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  create: (booking: NewBooking) => Promise<Booking>;
  cancel: (id: string) => Promise<void>;
}

export function useBookings(userId: string | undefined): UseBookingsResult {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetch = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await getUserBookings(userId);
      if (mountedRef.current) setBookings(data);
    } catch (e: any) {
      if (mountedRef.current) setError(e.message ?? "Failed to load bookings");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (booking: NewBooking): Promise<Booking> => {
    const created = await createBooking(booking);
    setBookings((prev) => [created, ...prev]);
    return created;
  };

  const cancel = async (id: string): Promise<void> => {
    const target = bookings.find((b) => b.id === id);
    await cancelBooking(id);
    // Libère la place sur le créneau de disponibilité (non bloquant).
    // Centralisé ici pour couvrir tous les écrans d'annulation client.
    if (target?.slot_id) {
      releaseSlot(target.slot_id).catch((e) =>
        console.warn("[useBookings] releaseSlot failed:", e?.message)
      );
    }
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "cancelled" as const } : b))
    );
  };

  return { bookings, loading, error, refetch: fetch, create, cancel };
}
