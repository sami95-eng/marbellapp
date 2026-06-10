import { useState, useEffect, useCallback, useRef } from "react";
import { UserProfile, ProfileUpdate, getProfile, upsertProfile } from "@/lib/profile-service";

interface UseProfileResult {
  profile:  UserProfile | null;
  loading:  boolean;
  saving:   boolean;
  error:    string | null;
  refetch:  () => void;
  save:     (updates: ProfileUpdate) => Promise<void>;
}

export function useProfile(userId: string | undefined): UseProfileResult {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
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
      const data = await getProfile(userId);
      if (mountedRef.current) setProfile(data);
    } catch (e: any) {
      if (mountedRef.current) setError(e.message ?? "Failed to load profile");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  const save = async (updates: ProfileUpdate) => {
    if (!userId) throw new Error("Not authenticated");
    setSaving(true);
    setError(null);
    try {
      await upsertProfile(userId, updates);
      if (mountedRef.current) {
        setProfile((prev) =>
          prev
            ? { ...prev, ...updates }
            : { id: userId, role: "user", created_at: new Date().toISOString(), ...updates } as UserProfile
        );
      }
    } catch (e: any) {
      if (mountedRef.current) setError(e.message ?? "Failed to save profile");
      throw e;
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  };

  return { profile, loading, saving, error, refetch: fetch, save };
}
