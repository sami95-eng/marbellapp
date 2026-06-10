import { useState, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, Modal, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { Image } from "expo-image";
import Animated, { FadeInDown } from "react-native-reanimated";
import { getVenueImage } from "@/constants/venue-images";
import { useVenueSearch } from "@/hooks/use-venues";
import type { Venue } from "@/lib/venues-service";

const CATEGORY_FILTERS = ["All", "Beach Club", "Fine Dining", "Spa & Wellness", "Nightlife", "Events", "Shopping"];

interface GlobalSearchProps {
  visible: boolean;
  onClose: () => void;
}

export function GlobalSearch({ visible, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const colors = useColors();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const { data: allVenues, loading } = useVenueSearch(query);

  const filtered = allVenues.filter((v) =>
    selectedCategory === "All" || v.category === selectedCategory
  );

  const handleSelect = useCallback(
    (venue: Venue) => {
      onClose();
      setQuery("");
      setSelectedCategory("All");
      router.push({ pathname: "/venue-detail", params: { id: venue.slug } });
    },
    [router, onClose]
  );

  const handleClose = () => {
    onClose();
    setQuery("");
    setSelectedCategory("All");
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>

        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(0).duration(300)}
          style={{
            flexDirection: "row", alignItems: "center",
            paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
            gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border,
          }}
        >
          <View style={{
            flex: 1, flexDirection: "row", alignItems: "center",
            backgroundColor: colors.surface, borderRadius: 14,
            paddingHorizontal: 12, paddingVertical: 10,
            borderWidth: 1, borderColor: colors.border, gap: 8,
          }}>
            <Text style={{ fontSize: 15 }}>🔍</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search venues, categories..."
              placeholderTextColor={colors.muted}
              style={{ flex: 1, fontSize: 15, color: colors.foreground }}
              autoFocus
            />
            {loading && <ActivityIndicator color={colors.primary} size="small" />}
            {!loading && query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery("")}>
                <Text style={{ color: colors.muted, fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={handleClose}>
            <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "600" }}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Category chips */}
        <FlatList
          data={CATEGORY_FILTERS}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedCategory(item)}
              style={{
                paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                backgroundColor: selectedCategory === item ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: selectedCategory === item ? colors.primary : colors.border,
              }}
            >
              <Text style={{
                fontSize: 12, fontWeight: "600",
                color: selectedCategory === item ? "#0A0E13" : colors.muted,
              }}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* Results */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          ListEmptyComponent={
            loading ? null : (
              <View style={{ alignItems: "center", paddingTop: 60, gap: 12 }}>
                <Text style={{ fontSize: 40 }}>🔍</Text>
                <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                  {query.length > 0 ? "No results found" : "Start typing to search"}
                </Text>
                <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center" }}>
                  {query.length > 0
                    ? "Try a different search term or category"
                    : "Search by name, category or location"}
                </Text>
              </View>
            )
          }
          ListHeaderComponent={
            filtered.length > 0 ? (
              <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 10, marginTop: 4 }}>
                {filtered.length} venue{filtered.length !== 1 ? "s" : ""} found
              </Text>
            ) : null
          }
          renderItem={({ item, index }) => {
            const imageUrl = item.cover_image_url || getVenueImage(item.slug || item.id, item.category);
            return (
              <Animated.View entering={FadeInDown.delay(index * 40).duration(300)}>
                <TouchableOpacity
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row", alignItems: "center",
                    backgroundColor: colors.surface, borderRadius: 16,
                    marginBottom: 10, borderWidth: 1, borderColor: colors.border,
                    overflow: "hidden",
                  }}
                >
                  {/* Thumbnail */}
                  <Image
                    source={{ uri: imageUrl }}
                    style={{ width: 72, height: 72 }}
                    contentFit="cover"
                    transition={300}
                  />
                  {/* Info */}
                  <View style={{ flex: 1, padding: 12, gap: 2 }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.primary, fontWeight: "600" }}>
                      {item.category}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.muted }} numberOfLines={1}>
                      {item.description ?? ""}
                    </Text>
                  </View>
                  {/* Rating + price */}
                  <View style={{ paddingRight: 14, alignItems: "flex-end", gap: 3 }}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: "#F59E0B" }}>
                      ★ {item.rating}
                    </Text>
                    {item.price_range && (
                      <Text style={{ fontSize: 11, color: colors.muted }}>{item.price_range}</Text>
                    )}
                    {item.is_partner && (
                      <View style={{
                        backgroundColor: "rgba(212,175,55,0.2)", borderRadius: 8,
                        paddingHorizontal: 6, paddingVertical: 2,
                      }}>
                        <Text style={{ fontSize: 9, color: "#D4AF37", fontWeight: "700" }}>VIP</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          }}
        />
      </View>
    </Modal>
  );
}
