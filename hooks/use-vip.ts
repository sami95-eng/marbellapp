import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface VipOffer {
  id: string;
  venue_name: string;
  venue_slug: string;
  instagram_handle: string | null;
  image_url: string | null;
  event_date: string;
  event_time: string;
  offer_type: "table" | "bed" | "bottle" | "private";
  table_type: string;
  capacity: number;
  original_price: number;
  vip_price: number;
  perks: string[];
  spots_total: number;
  spots_left: number;
  tag: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface VipEventDiscount {
  id: string;
  title: string;
  venue_name: string;
  venue_slug: string;
  image_url: string | null;
  event_date: string;
  discount_pct: number;
  original_price: number;
  description: string;
  code: string;
  valid_until: string;
  category: string;
  is_active: boolean;
  sort_order: number;
}

export interface VipMemberPerk {
  id: string;
  title: string;
  venue_name: string;
  image_url: string | null;
  description: string;
  benefit: string;
  min_tier: "bronze" | "silver" | "gold" | "platinum";
  is_new: boolean;
  is_active: boolean;
  sort_order: number;
}

interface VipData {
  offers: VipOffer[];
  discounts: VipEventDiscount[];
  perks: VipMemberPerk[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useVipData(): VipData {
  const [offers, setOffers] = useState<VipOffer[]>([]);
  const [discounts, setDiscounts] = useState<VipEventDiscount[]>([]);
  const [perks, setPerks] = useState<VipMemberPerk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [offersRes, discountsRes, perksRes] = await Promise.all([
        supabase
          .from("vip_offers")
          .select("*")
          .eq("is_active", true)
          .order("sort_order"),
        supabase
          .from("vip_event_discounts")
          .select("*")
          .eq("is_active", true)
          .order("sort_order"),
        supabase
          .from("vip_member_perks")
          .select("*")
          .eq("is_active", true)
          .order("sort_order"),
      ]);

      if (offersRes.error) throw offersRes.error;
      if (discountsRes.error) throw discountsRes.error;
      if (perksRes.error) throw perksRes.error;

      setOffers(offersRes.data ?? []);
      setDiscounts(discountsRes.data ?? []);
      setPerks(perksRes.data ?? []);
    } catch (e: any) {
      setError(e.message ?? "Failed to load VIP data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { offers, discounts, perks, loading, error, refetch: fetch };
}
