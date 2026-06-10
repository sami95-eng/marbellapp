import { supabase } from "@/lib/supabase";

export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url:   string | null;
  instagram_handle: string | null;
  bio:          string | null;
  preferences:  string[] | null;
  role:         string;
  partner_post_count: number;
  created_at:   string;
}

export type ProfileUpdate = Partial<Pick<
  UserProfile,
  "display_name" | "avatar_url" | "instagram_handle" | "bio" | "preferences"
>>;

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function upsertProfile(userId: string, updates: ProfileUpdate): Promise<void> {
  // Use UPDATE (not upsert) — every auth user has a profile row via the
  // on_auth_user_created trigger. Upsert needs INSERT policy which is not
  // always present; UPDATE is guaranteed by the existing RLS policy.
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select("id");

  if (error) throw new Error(error.message);

  // If no row was updated the profile is missing — create it
  if (!data || data.length === 0) {
    const { error: insertError } = await supabase
      .from("profiles")
      .insert({ id: userId, ...updates });
    if (insertError) throw new Error(insertError.message);
  }
}
