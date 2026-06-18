import { supabase } from "@/lib/supabase";

export type OfferType = "table" | "bed" | "bottle" | "discount" | "experience";

export interface VipOffer {
  id: string;
  venue_id: string;
  title: string;
  type: OfferType;
  description: string | null;
  original_price: number | null;
  vip_price: number | null;
  capacity: number;
  spots_total: number;
  spots_remaining: number;
  available_date: string | null;
  available_time: string | null;
  instagram_required: boolean;
  instagram_handle: string | null;
  is_active: boolean;
  created_at: string;
}

export type NewVipOffer = {
  title: string;
  type: OfferType;
  description?: string | null;
  original_price?: number | null;
  vip_price?: number | null;
  capacity?: number;
  spots_total?: number;
};

/** Offres VIP d'une venue (toutes, y compris inactives — vue partenaire). */
export async function getVenueOffers(venueId: string): Promise<VipOffer[]> {
  if (!venueId) return [];
  const { data, error } = await supabase
    .from("vip_offers")
    .select("*")
    .eq("venue_id", venueId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as VipOffer[];
}

export async function createVenueOffer(venueId: string, offer: NewVipOffer): Promise<VipOffer> {
  const spots = offer.spots_total ?? 10;
  const { data, error } = await supabase
    .from("vip_offers")
    .insert({
      venue_id:       venueId,
      title:          offer.title,
      type:           offer.type,
      description:    offer.description ?? null,
      original_price: offer.original_price ?? null,
      vip_price:      offer.vip_price ?? null,
      capacity:       offer.capacity ?? 2,
      spots_total:    spots,
      spots_remaining: spots,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as VipOffer;
}

export async function toggleVenueOffer(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from("vip_offers")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteVenueOffer(id: string): Promise<void> {
  const { error } = await supabase.from("vip_offers").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
