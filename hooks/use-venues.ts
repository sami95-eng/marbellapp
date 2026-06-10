import { useState, useEffect, useCallback, useRef } from "react";
import {
  Venue,
  getFeaturedVenues,
  getVenuesByCategory,
  getVenueBySlug,
  getAllVenuesForMap,
  searchVenues,
} from "@/lib/venues-service";

interface Result<T> {
  data: T;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useFeaturedVenues(limit = 6): Result<Venue[]> {
  const [data, setData] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getFeaturedVenues(limit));
    } catch (e: any) {
      setError(e.message ?? "Failed to load venues");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}

export function useVenuesByCategory(
  categoryKey: string,
  filters?: { priceRanges?: string[]; minRating?: number; sortBy?: string }
): Result<Venue[]> {
  const [data, setData] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filtersKey = JSON.stringify(filters);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getVenuesByCategory(categoryKey, filters));
    } catch (e: any) {
      setError(e.message ?? "Failed to load venues");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryKey, filtersKey]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}

export function useVenueBySlug(slug: string): Result<Venue | null> {
  const [data, setData] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!slug) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      setData(await getVenueBySlug(slug));
    } catch (e: any) {
      setError(e.message ?? "Failed to load venue");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}

export function useAllVenuesForMap(): Result<Venue[]> {
  const [data, setData] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getAllVenuesForMap() as Venue[]);
    } catch (e: any) {
      setError(e.message ?? "Failed to load map data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}

export function useVenueSearch(query: string): Result<Venue[]> {
  const [data, setData] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetch = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      setData(await searchVenues(q));
    } catch (e: any) {
      setError(e.message ?? "Search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetch(query), 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, fetch]);

  return { data, loading, error, refetch: () => fetch(query) };
}
