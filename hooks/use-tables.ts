import { useState, useEffect, useCallback } from "react";
import {
  VenueTable, NewTable,
  getVenueTables, createVenueTable, updateVenueTable,
  toggleTableActive, deleteVenueTable,
} from "@/lib/tables-service";

interface UseTablesResult {
  data: VenueTable[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  create: (venueId: string, table: NewTable) => Promise<void>;
  toggle: (id: string, active: boolean) => Promise<void>;
  update: (id: string, updates: Partial<NewTable>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export function useVenueTables(venueSlug: string): UseTablesResult {
  const [data, setData] = useState<VenueTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!venueSlug) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      setData(await getVenueTables(venueSlug));
    } catch (e: any) {
      setError(e.message ?? "Failed to load tables");
    } finally {
      setLoading(false);
    }
  }, [venueSlug]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (venueId: string, table: NewTable) => {
    const created = await createVenueTable(venueId, table);
    setData((prev) => [...prev, created].sort((a, b) => a.sort_order - b.sort_order));
  };

  const toggle = async (id: string, active: boolean) => {
    await toggleTableActive(id, active);
    setData((prev) => prev.map((t) => t.id === id ? { ...t, is_active: active } : t));
  };

  const update = async (id: string, updates: Partial<NewTable>) => {
    await updateVenueTable(id, updates);
    setData((prev) => prev.map((t) => t.id === id ? { ...t, ...updates } : t));
  };

  const remove = async (id: string) => {
    await deleteVenueTable(id);
    setData((prev) => prev.filter((t) => t.id !== id));
  };

  return { data, loading, error, refetch: fetch, create, toggle, update, remove };
}
