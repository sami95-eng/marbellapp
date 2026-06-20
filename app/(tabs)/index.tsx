import {
  ScrollView, Text, View, TouchableOpacity, FlatList, ActivityIndicator, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useState } from "react";
import { GlobalSearch } from "@/components/global-search";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInRight, FadeInUp } from "react-native-reanimated";
import { getVenueImage } from "@/constants/venue-images";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/language-selector";
import { useFeaturedVenues } from "@/hooks/use-venues";
import type { Venue } from "@/lib/venues-service";

type IoniconName = keyof typeof Ionicons.glyphMap;

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const [searchVisible, setSearchVisible] = useState(false);

  const { data: featuredVenues, loading: venuesLoading } = useFeaturedVenues(6);
  const isWeb = Platform.OS === "web";

  const CATEGORIES: { id: string; icon: IoniconName; name: string; description: string }[] = [
    { id: "beach-clubs", icon: "umbrella-outline",   name: t("cat.beachClubs"), description: t("cat.beachClubsDesc") },
    { id: "fine-dining", icon: "restaurant-outline", name: t("cat.fineDining"), description: t("cat.fineDiningDesc") },
    { id: "spas",        icon: "leaf-outline",       name: t("cat.spas"),       description: t("cat.spasDesc") },
    { id: "nightlife",   icon: "wine-outline",       name: t("cat.nightlife"),  description: t("cat.nightlifeDesc") },
    { id: "events",      icon: "sparkles-outline",   name: t("cat.events"),     description: t("cat.eventsDesc") },
    { id: "shopping",    icon: "bag-handle-outline", name: t("cat.shopping"),   description: t("cat.shoppingDesc") },
  ];

  const renderCategoryItem = ({ item, index }: { item: typeof CATEGORIES[0]; index: number }) => (
    <Animated.View
      entering={isWeb ? undefined : FadeInUp.delay(180 + index * 70).springify().damping(14)}
      style={{ flex: 1, marginHorizontal: 5, marginBottom: 10 }}
    >
      <TouchableOpacity
        onPress={() => router.push({ pathname: "/venues", params: { category: item.id } })}
        activeOpacity={0.75}
      >
        <View style={{
          backgroundColor: colors.surface, borderRadius: 18, padding: 16,
          alignItems: "center", borderWidth: 1, borderColor: colors.border,
        }}>
          <Ionicons name={item.icon} size={28} color={colors.foreground} style={{ marginBottom: 10 }} />
          <Text style={{ fontSize: 12, fontWeight: "700", color: colors.foreground, textAlign: "center" }}>
            {item.name}
          </Text>
          <Text style={{ fontSize: 10, color: colors.muted, textAlign: "center", marginTop: 3 }}>
            {item.description}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderFeaturedVenue = ({ item, index }: { item: Venue; index: number }) => {
    const imageUrl = item.cover_image_url || getVenueImage(item.slug, item.category);
    return (
      <Animated.View
        entering={isWeb ? undefined : FadeInRight.delay(100 + index * 90).springify().damping(16)}
        style={{ marginRight: 14 }}
      >
        <TouchableOpacity
          onPress={() => router.push({ pathname: "/venue-detail", params: { id: item.slug } })}
          activeOpacity={0.88}
        >
          <View style={{
            backgroundColor: colors.surface, borderRadius: 20, overflow: "hidden",
            borderWidth: 1, borderColor: colors.border, width: 260,
          }}>
            <View style={{ height: 148, position: "relative" }}>
              <Image
                source={{ uri: imageUrl }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                transition={350}
              />
              <View style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                height: 60, backgroundColor: "rgba(0,0,0,0.38)",
              }} />
              {item.is_partner && (
                <View style={{
                  position: "absolute", top: 10, right: 10,
                  backgroundColor: "rgba(10,14,19,0.55)",
                  borderWidth: 1, borderColor: colors.primary,
                  borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
                }}>
                  <Text style={{ fontSize: 10, fontWeight: "800", color: colors.primary, letterSpacing: 0.5 }}>VIP</Text>
                </View>
              )}
            </View>
            <View style={{ padding: 14, gap: 4 }}>
              <Text style={{ fontSize: 15, fontWeight: "800", color: colors.foreground }} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={{ fontSize: 11, color: colors.muted, fontWeight: "600" }}>
                {item.category}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 17 }} numberOfLines={2}>
                {item.description ?? ""}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                <Text style={{ color: "#F59E0B", fontSize: 13, fontWeight: "800" }}>
                  {"★".repeat(Math.round(item.rating))}
                </Text>
                <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "700", marginLeft: 6 }}>
                  {item.rating}
                </Text>
                {item.price_range && (
                  <Text style={{ color: colors.muted, fontSize: 11, marginLeft: 6 }}>
                    · {item.price_range}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <>
      <GlobalSearch visible={searchVisible} onClose={() => setSearchVisible(false)} />

      <ScreenContainer className="px-0">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <Animated.View
            entering={isWeb ? undefined : FadeInDown.delay(0).duration(500)}
            style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 6 }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 30, fontWeight: "900", color: colors.primary, letterSpacing: -0.5 }}>
                  Marbell'app
                </Text>
                <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
                  {t("home.tagline")}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <LanguageSelector />
                <TouchableOpacity
                  onPress={() => router.push("/map")}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: colors.surface, borderRadius: 14,
                    padding: 11, borderWidth: 1, borderColor: colors.border,
                  }}
                >
                  <Text style={{ fontSize: 22 }}>🗺️</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          {/* Search bar */}
          <Animated.View
            entering={isWeb ? undefined : FadeInDown.delay(80).duration(500)}
            style={{ paddingHorizontal: 20, paddingBottom: 20 }}
          >
            <TouchableOpacity
              onPress={() => setSearchVisible(true)}
              activeOpacity={0.8}
              style={{
                flexDirection: "row", alignItems: "center", backgroundColor: colors.surface,
                borderRadius: 16, paddingHorizontal: 16, paddingVertical: 13,
                borderWidth: 1, borderColor: colors.border, gap: 10, marginTop: 12,
              }}
            >
              <Text style={{ fontSize: 16 }}>🔍</Text>
              <Text style={{ fontSize: 14, color: colors.muted, flex: 1 }}>
                {t("home.searchPlaceholder")}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Categories */}
          <View style={{ paddingHorizontal: 15, marginBottom: 28 }}>
            <Animated.Text
              entering={isWeb ? undefined : FadeInDown.delay(120).duration(500)}
              style={{ fontSize: 17, fontWeight: "800", color: colors.foreground, marginBottom: 14, paddingHorizontal: 5 }}
            >
              {t("home.exploreTitle")}
            </Animated.Text>
            <FlatList
              data={CATEGORIES}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={{ justifyContent: "space-between" }}
            />
          </View>

          {/* Trending venues */}
          <View style={{ marginBottom: 28 }}>
            <Animated.View
              entering={isWeb ? undefined : FadeInDown.delay(260).duration(500)}
              style={{
                paddingHorizontal: 20, marginBottom: 14,
                flexDirection: "row", alignItems: "center", justifyContent: "space-between",
              }}
            >
              <Text style={{ fontSize: 17, fontWeight: "800", color: colors.foreground }}>
                {t("home.trendingTitle")}
              </Text>
              <TouchableOpacity onPress={() => router.push("/venues")} activeOpacity={0.7}>
                <Text style={{ fontSize: 13, color: colors.muted, fontWeight: "600" }}>
                  {t("common.seeAll")}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {venuesLoading ? (
              <View style={{ height: 220, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator color={colors.muted} size="large" />
              </View>
            ) : (
              <FlatList
                data={featuredVenues}
                renderItem={renderFeaturedVenue}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20 }}
              />
            )}
          </View>

          {/* CTA */}
          <Animated.View
            entering={isWeb ? undefined : FadeInUp.delay(380).springify().damping(16)}
            style={{ paddingHorizontal: 20, marginBottom: 32 }}
          >
            <View style={{
              borderRadius: 24, overflow: "hidden",
              borderWidth: 1, borderColor: colors.border,
            }}>
              <Image
                source={{ uri: "https://images.unsplash.com/photo-1566073771259-b4ad8b8f0517?auto=format&fit=crop&w=800&q=80" }}
                style={{ position: "absolute", width: "100%", height: "100%" }}
                contentFit="cover"
              />
              <View style={{ backgroundColor: "rgba(10,10,15,0.78)", padding: 24 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: "rgba(248,244,236,0.55)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
                  {t("home.forEstablishments")}
                </Text>
                <Text style={{ fontSize: 22, fontWeight: "900", color: "#fff", marginBottom: 8 }}>
                  {t("home.joinCircle")}
                </Text>
                <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 20, lineHeight: 19 }}>
                  {t("home.joinDesc")}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => router.push("/join-partner")}
                  style={{
                    backgroundColor: colors.primary, borderRadius: 50, paddingVertical: 13,
                    alignItems: "center", alignSelf: "flex-start", paddingHorizontal: 28,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "800", color: colors.background }}>
                    {t("home.becomePartner")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

        </ScrollView>
      </ScreenContainer>
    </>
  );
}
