import { supabase } from "@/lib/supabase";

export type VipPostStatus = "pending" | "approved" | "rejected";

export interface VipPost {
  id: string;
  user_id: string;
  post_url: string;
  instagram_handle: string | null;
  hashtag: string | null;
  status: VipPostStatus;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface VipTier {
  tier: string;
  min_posts: number;
  discount_pct: number;
  label: string;
  color: string;
}

export interface VipStatus {
  tier: VipTier;
  nextTier: VipTier | null;
  discount_pct: number;
  post_count: number;
  posts: VipPost[];
}

export interface PendingPost extends VipPost {
  user_name: string | null;
}

// Fallback si vip_tiers n'est pas encore peuplé (avant exécution du SQL).
const FALLBACK_TIERS: VipTier[] = [
  { tier: "bronze",   min_posts: 0,  discount_pct: 0,  label: "Bronze",   color: "#CD7F32" },
  { tier: "silver",   min_posts: 3,  discount_pct: 10, label: "Silver",   color: "#C0C0C0" },
  { tier: "gold",     min_posts: 10, discount_pct: 20, label: "Gold",     color: "#FFD700" },
  { tier: "platinum", min_posts: 20, discount_pct: 30, label: "Platinum", color: "#E5E4E2" },
];

export async function getVipTiers(): Promise<VipTier[]> {
  const { data, error } = await supabase
    .from("vip_tiers").select("*").order("min_posts", { ascending: true });
  if (error || !data || data.length === 0) return FALLBACK_TIERS;
  return data as VipTier[];
}

/** Soumet un post Instagram (statut 'pending'). */
export async function submitPost(postUrl: string, instagramHandle: string): Promise<VipPost> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Connecte-toi pour soumettre un post.");
  const url = postUrl.trim();
  if (!url) throw new Error("L'URL du post est requise.");
  const handle = instagramHandle.trim().replace(/^@/, "") || null;

  const { data, error } = await supabase
    .from("vip_posts")
    .insert({ user_id: user.id, post_url: url, instagram_handle: handle })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as VipPost;
}

export async function getUserPosts(userId: string): Promise<VipPost[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from("vip_posts").select("*").eq("user_id", userId)
    .order("submitted_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as VipPost[];
}

function computeTier(tiers: VipTier[], count: number): { tier: VipTier; nextTier: VipTier | null } {
  const sorted = [...tiers].sort((a, b) => a.min_posts - b.min_posts);
  let current = sorted[0];
  for (const tr of sorted) if (count >= tr.min_posts) current = tr;
  const nextTier = sorted.find((tr) => tr.min_posts > current.min_posts) ?? null;
  return { tier: current, nextTier };
}

/** Statut VIP complet d'un utilisateur (palier, réduction, posts). */
export async function getUserVipStatus(userId: string): Promise<VipStatus> {
  const [tiers, posts] = await Promise.all([getVipTiers(), getUserPosts(userId)]);
  const post_count = posts.filter((p) => p.status === "approved").length;
  const { tier, nextTier } = computeTier(tiers, post_count);
  return { tier, nextTier, discount_pct: tier.discount_pct, post_count, posts };
}

// ── Admin ──────────────────────────────────────────────────────────

/** Posts en attente de validation (admin), enrichis du nom utilisateur. */
export async function getPendingPosts(): Promise<PendingPost[]> {
  const { data, error } = await supabase
    .from("vip_posts").select("*").eq("status", "pending")
    .order("submitted_at", { ascending: true });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as VipPost[];
  if (rows.length === 0) return [];
  const ids = [...new Set(rows.map((r) => r.user_id))];
  const { data: profs } = await supabase.from("profiles").select("id, display_name").in("id", ids);
  const nameById = new Map((profs ?? []).map((p: any) => [p.id, p.display_name as string | null]));
  return rows.map((r) => ({ ...r, user_name: nameById.get(r.user_id) ?? null }));
}

async function review(postId: string, status: "approved" | "rejected"): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("vip_posts")
    .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: user?.id ?? null })
    .eq("id", postId);
  if (error) throw new Error(error.message);
}

export const approvePost = (postId: string) => review(postId, "approved");
export const rejectPost  = (postId: string) => review(postId, "rejected");
