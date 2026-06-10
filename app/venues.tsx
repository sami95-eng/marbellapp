import {
  FlatList, Text, View, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { FiltersModal, FilterOptions } from "@/components/filters-modal";
import { useFavorites } from "@/lib/favorites-context";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import { getVenueImage } from "@/constants/venue-images";
import { useVenuesByCategory } from "@/hooks/use-venues";
import { useColors } from "@/hooks/use-colors";
import type { Venue } from "@/lib/venues-service";

// Catégorie → label affichable
const CATEGORY_LABELS: Record<string, string> = {
  "beach-clubs": "Beach Clubs",
  "fine-dining":  "Fine Dining",
  "spas":         "Spas & Wellness",
  "nightlife":    "Nightlife",
  "events":       "Events",
  "shopping":     "Shopping",
  "hotel":        "Hotels",
};

export default function VenuesScreen() {
  const { t } = useTranslation();
  const { category } = useLocalSearchParams<{ category: string }>();
  const router = useRouter();
  const colors = useColors();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    priceRange: [], minRating: 0, sortBy: "popular", ambiance: [],
  });

  const { data: venues, loading, error, refetch } = useVenuesByCategory(
    category || "beach-clubs",
    {
      priceRanges: filters.priceRange.length > 0 ? filters.priceRange : undefined,
      minRating:   filters.minRating > 0 ? filters.minRating : undefined,
      sortBy:      filters.sortBy !== "popular" ? filters.sortBy : undefined,
    }
  );

  // Filtre ambiance côté client (pas de colonne en DB)
  const filtered = useMemo(() => {
    if (filters.ambiance.length === 0) return venues;
    return venues; // ambiance not available in DB, return all
  }, [venues, filters.ambiance]);

  const activeFiltersCount =
    filters.priceRange.length +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.sortBy !== "popular" ? 1 : 0) +
    filters.ambiance.length;

  const categoryLabel = CATEGORY_LABELS[category || "beach-clubs"] || (category || "");

  const renderVenueItem = ({ item }: { item: Venue }) => {
    const imageUrl = item.cover_image_url || getVenueImage(item.slug, item.category);
    return (
      <TouchableOpacity
        onPress={() => router.push({ pathname: "/venue-detail", params: { id: item.slug } })}
        activeOpacity={0.7}
      >
        <View style={{
          backgroundColor: colors.surface, borderRadius: 16, marginBottom: 14,
          borderWidth: 1, borderColor: colors.border, overflow: "hidden",
        }}>
          {/* Photo */}
          <View style={{ height: 120, position: "relative" }}>
            <Image
              source={{ uri: imageUrl }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={300}
            />
            <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 50, backgroundColor: "rgba(0,0,0,0.35)" }} />
            {item.is_partner && (
              <View style={{
                position: "absolute", top: 8, left: 10,
                backgroundColor: "rgba(212,175,55,0.92)", borderRadius: 20,
                paddingHorizontal: 10, paddingVertical: 3,
              }}>
                <Text style={{ fontSize: 10, fontWeight: "800", color: "#0a0a0f" }}>VIP Partner</Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() => toggleFavorite(item.slug)}
              activeOpacity={0.6}
              style={{
                position: "absolute", top: 8, right: 10,
                backgroundColor: "rgba(0,0,0,0.4)", borderRadius: 20, padding: 5,
              }}
            >
              <Text style={{ fontSize: 16 }}>{isFavorite(item.slug) ? "❤️" : "🤍"}</Text>
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View style={{ padding: 14 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
              {item.name}
            </Text>
            {item.address && (
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }} numberOfLines={1}>
                {item.address.split(",").slice(-2).join(",").trim()}
              </Text>
            )}
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>
                  ★ {item.rating}
                </Text>
                {item.group_name && (
                  <Text style={{ color: colors.muted, fontSize: 11, marginLeft: 10 }} numberOfLines={1}>
                    {item.group_name}
                  </Text>
                )}
              </View>
              {item.price_range && (
                <Text style={{ fontSize: 13, color: colors.primary, fontWeight: "600" }}>
                  {item.price_range}
                </Text>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <FiltersModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={setFilters}
        initialFilters={filters}
      />

      <ScreenContainer className="px-6">
        {/* Header */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
              <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 15 }}>{t("common.back")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowFilters(true)}
              style={{
                flexDirection: "row", alignItems: "center", backgroundColor: colors.surface,
                borderRadius: 50, paddingHorizontal: 14, paddingVertical: 8,
                borderWidth: 1, borderColor: colors.border,
              }}
              activeOpacity={0.7}
            >
              <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 13 }}>
                ⚙️ {t("venues.filters")}
              </Text>
              {activeFiltersCount > 0 && (
                <View style={{
                  backgroundColor: colors.primary, borderRadius: 10,
                  width: 18, height: 18, alignItems: "center", justifyContent: "center", marginLeft: 6,
                }}>
                  <Text style={{ fontSize: 10, fontWeight: "800", color: "#0A0E13" }}>
                    {activeFiltersCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <Text style={{ fontSize: 26, fontWeight: "800", color: colors.foreground, marginBottom: 4 }}>
            {categoryLabel}
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted }}>
            {loading ? t("common.loading") : `${filtered.length} ${t("venues.exclusiveVenues")}`}
          </Text>
        </View>

        {/* Loading */}
        {loading && (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 60 }}>
            <ActivityIndicator color="#D4AF37" size="large" />
          </View>
        )}

        {/* Error */}
        {!loading && error && (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 60, gap: 12 }}>
            <Text style={{ fontSize: 36 }}>⚠️</Text>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>{t("common.error")}</Text>
            <TouchableOpacity
              onPress={refetch}
              style={{ backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }}
            >
              <Text style={{ color: "#0A0E13", fontWeight: "700" }}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* List */}
        {!loading && !error && (
          <FlatList
            data={filtered}
            renderItem={renderVenueItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={true}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 }}>
                <Text style={{ fontSize: 40 }}>🔍</Text>
                <Text style={{ fontSize: 17, fontWeight: "700", color: colors.foreground }}>
                  {t("venues.noVenuesFound")}
                </Text>
                <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center" }}>
                  {t("venues.adjustFilters")}
                </Text>
              </View>
            }
          />
        )}
      </ScreenContainer>
    </>
  );
}
