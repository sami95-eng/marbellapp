import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useFavorites } from "@/lib/favorites-context";
import { useAllVenuesForMap } from "@/hooks/use-venues";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { getVenueImage } from "@/constants/venue-images";

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { favorites, toggleFavorite } = useFavorites();
  const { data: allVenues, loading } = useAllVenuesForMap();

  const favoriteVenues = allVenues.filter((v) => favorites.includes(v.slug));

  return (
    <ScreenContainer className="px-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>

        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text className="text-2xl text-primary">←</Text>
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-foreground ml-4">
            {t("favorites.title")}
          </Text>
          <Text className="text-sm text-muted ml-2">({favoriteVenues.length})</Text>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator color="#D4AF37" size="large" />
          </View>
        ) : favoriteVenues.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-6xl mb-4">💛</Text>
            <Text className="text-xl font-bold text-foreground mb-2">
              {t("favorites.empty")}
            </Text>
            <Text className="text-sm text-muted text-center px-8">
              {t("favorites.emptyDesc")}
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/")}
              className="mt-6 bg-primary rounded-full px-6 py-3"
              activeOpacity={0.8}
            >
              <Text className="text-foreground font-bold">{t("favorites.explore")}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="gap-4">
            {favoriteVenues.map((venue) => (
              <TouchableOpacity
                key={venue.slug}
                onPress={() => router.push(`/venue-detail?id=${venue.slug}`)}
                activeOpacity={0.7}
              >
                <View className="bg-surface rounded-2xl border border-border overflow-hidden">
                  <View style={{ height: 110, position: "relative" }}>
                    <Image
                      source={{ uri: venue.cover_image_url ?? getVenueImage(venue.slug, venue.category) }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                      transition={300}
                    />
                    <TouchableOpacity
                      onPress={() => toggleFavorite(venue.slug)}
                      activeOpacity={0.6}
                      style={{
                        position: "absolute", top: 8, right: 8,
                        backgroundColor: "rgba(0,0,0,0.4)",
                        borderRadius: 20, padding: 6,
                      }}
                    >
                      <Text style={{ fontSize: 18 }}>❤️</Text>
                    </TouchableOpacity>
                  </View>
                  <View className="p-4">
                    <Text className="text-lg font-bold text-foreground">{venue.name}</Text>
                    <Text className="text-xs text-primary mb-1">{venue.category}</Text>
                    {venue.description ? (
                      <Text className="text-sm text-muted mb-2" numberOfLines={2}>
                        {venue.description}
                      </Text>
                    ) : null}
                    <View className="flex-row items-center gap-2">
                      {venue.address ? (
                        <Text className="text-xs text-muted flex-1" numberOfLines={1}>
                          📍 {venue.address}
                        </Text>
                      ) : null}
                      <Text className="text-xs text-primary font-bold">⭐ {venue.rating}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
