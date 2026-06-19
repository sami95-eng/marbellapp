import {
  ScrollView, Text, View, TouchableOpacity, Share, Platform,
  ActivityIndicator, Linking,
} from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { ScreenContainer } from "@/components/screen-container";
import { ImageCarousel } from "@/components/image-carousel";
import { useVenueBySlug } from "@/hooks/use-venues";
import { getVenueImage } from "@/constants/venue-images";
import { DEFAULT_OFFERS } from "@/lib/venues-service";
import { getVenueRatings, type RatingWithUser } from "@/lib/ratings-service";
import { useColors } from "@/hooks/use-colors";

const CATEGORY_ICONS: Record<string, string> = {
  "Beach Club":     "🌊",
  "Fine Dining":    "🍽️",
  "Spa & Wellness": "🧖",
  "Nightlife":      "🎉",
  "Events":         "🌟",
  "Shopping":       "🛍️",
  "Hotel":          "🏨",
};

const PRICE_LABELS: Record<string, string> = {
  "€":    "Abordable",
  "€€":   "Modéré",
  "€€€":  "Haut de gamme",
  "€€€€": "Ultra luxe",
};

const ATMOSPHERE: Record<string, string> = {
  "Beach Club":     "Ambiance glamour et méditerranéenne, musique world-class et service impeccable. L'essence du style de vie marbellí.",
  "Fine Dining":    "Élégant, intime et sophistiqué. Un voyage culinaire pour tous les sens dans un cadre d'exception.",
  "Spa & Wellness": "Sérénité, luxe et bien-être total. Un sanctuaire de calme au cœur de Marbella.",
  "Nightlife":      "Énergie intense, exclusivité absolue et électricité dans l'air. Les meilleurs DJs et une clientèle internationale.",
  "Events":         "Magique, culturel et unique. Des rassemblements exclusifs sous le ciel de Marbella.",
  "Shopping":       "Glamour, exclusivité et raffinement. Grandes marques de luxe et service personnalisé.",
  "Hotel":          "Élégance intemporelle, confort 5 étoiles et hospitalité d'exception.",
};

function InfoRow({ icon, label, value, onPress }: {
  icon: string; label: string; value: string; onPress?: () => void;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
      style={{ marginBottom: 14 }}
    >
      <Text style={{ fontSize: 11, color: colors.muted, fontWeight: "700", marginBottom: 4, letterSpacing: 0.5 }}>
        {icon}  {label.toUpperCase()}
      </Text>
      <Text style={{
        fontSize: 14, color: onPress ? colors.primary : colors.foreground,
        textDecorationLine: onPress ? "underline" : "none",
        lineHeight: 20,
      }}>
        {value}
      </Text>
    </TouchableOpacity>
  );
}

export default function VenueDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: venue, loading, error } = useVenueBySlug(id || "");

  // Avis publics (max 5 affichés) — chargés dès que la venue est connue.
  const [reviews, setReviews] = useState<RatingWithUser[]>([]);
  useEffect(() => {
    const vid = venue?.id;
    if (!vid) { setReviews([]); return; }
    let cancelled = false;
    getVenueRatings(vid, 5)
      .then((r) => { if (!cancelled) setReviews(r); })
      .catch(() => { if (!cancelled) setReviews([]); });
    return () => { cancelled = true; };
  }, [venue?.id]);

  if (loading) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color="#D4AF37" size="large" />
          <Text style={{ color: colors.muted, marginTop: 12, fontSize: 13 }}>Chargement…</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!venue) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🏖️</Text>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
            Venue introuvable
          </Text>
          {error && (
            <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 16, textAlign: "center" }}>
              {error}
            </Text>
          )}
          <TouchableOpacity
            onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}
            style={{ backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 50 }}
            activeOpacity={0.7}
          >
            <Text style={{ color: "#0A0E13", fontWeight: "700" }}>Retour</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const icon = CATEGORY_ICONS[venue.category] ?? "✨";

  // Carousel images — deduplicated
  const seen = new Set<string>();
  const carouselImages: { uri: string; caption?: string }[] = [];
  const addImage = (url: string, caption: string) => {
    if (url && !seen.has(url)) { seen.add(url); carouselImages.push({ uri: url, caption }); }
  };
  if (venue.cover_image_url) addImage(venue.cover_image_url, venue.name);
  (venue.images ?? []).forEach((url, i) => addImage(url, `${venue.name} — photo ${i + 1}`));
  if (carouselImages.length === 0) {
    carouselImages.push({ uri: getVenueImage(venue.slug, venue.category), caption: venue.name });
  }

  const offers = DEFAULT_OFFERS[venue.category] ?? ["VIP Access", "Exclusive Experience"];

  const handleBooking = () => {
    router.push({
      pathname: "/booking",
      params: {
        venueId:       venue.slug,
        venueUuid:     venue.id,
        venueName:     venue.name,
        venueCategory: venue.category,
        venueEmail:    venue.contact_email   ?? "",
        venueWhatsapp: venue.whatsapp_number ?? "",
      },
    });
  };

  const handleShare = async () => {
    try {
      const msg =
        `${icon} ${venue.name}\n\n` +
        (venue.address        ? `📍 ${venue.address}\n`        : "") +
        (venue.opening_hours  ? `🕐 ${venue.opening_hours}\n`  : "") +
        (venue.instagram_handle ? `📸 ${venue.instagram_handle}\n` : "") +
        `\n⭐ ${venue.rating} · VIP Access\n\n${venue.description ?? ""}`;

      if (Platform.OS === "web") {
        if (navigator.share) {
          await navigator.share({ title: `${venue.name} — Marbell'app`, text: msg });
        } else {
          await navigator.clipboard.writeText(msg);
          alert("Copié dans le presse-papiers !");
        }
      } else {
        await Share.share({ message: msg, title: `${venue.name} — Marbell'app` });
      }
    } catch { /* ignore */ }
  };

  const openWeb   = () => venue.website && Linking.openURL(venue.website.startsWith("http") ? venue.website : `https://${venue.website}`);
  const openInsta = () => venue.instagram_handle && Linking.openURL(
    `https://instagram.com/${venue.instagram_handle.replace("@", "")}`
  );
  const openMap   = () => venue.address && Linking.openURL(
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.address)}`
  );

  return (
    <ScreenContainer style={{ paddingHorizontal: 0 }} edges={["left", "right"]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>

        {/* Nav overlay */}
        <View style={{
          position: "absolute", top: 48, left: 16, right: 16, zIndex: 10,
          flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        }}>
          <TouchableOpacity
            onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}
            activeOpacity={0.6}
            style={{ backgroundColor: "rgba(0,0,0,0.45)", width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 18 }}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleShare}
            activeOpacity={0.6}
            style={{ backgroundColor: "rgba(0,0,0,0.45)", width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 18 }}>↗</Text>
          </TouchableOpacity>
        </View>

        {/* Carousel */}
        <ImageCarousel images={carouselImages} height={320} />

        <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>

          {/* Title + rating + price */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
              <Text style={{ fontSize: 26, fontWeight: "800", color: colors.foreground, flex: 1, lineHeight: 32 }}>
                {venue.name}
              </Text>
              <View style={{ alignItems: "flex-end", marginLeft: 8, marginTop: 4 }}>
                <View style={{ backgroundColor: colors.primary, borderRadius: 50, paddingHorizontal: 12, paddingVertical: 5 }}>
                  <Text style={{ color: "#0A0E13", fontWeight: "800", fontSize: 14 }}>
                    ★ {Number((venue.rating_count ?? 0) > 0 ? (venue.rating_avg ?? 0) : venue.rating).toFixed(1)}
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>
                  {(venue.rating_count ?? 0) > 0 ? `${venue.rating_count} avis` : "Nouveau"}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{
                backgroundColor: "rgba(212,175,55,0.15)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
              }}>
                <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "600" }}>
                  {icon} {venue.category}
                </Text>
              </View>
              {venue.price_range && (
                <View style={{
                  backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 4,
                  borderRadius: 8, borderWidth: 1, borderColor: colors.border,
                }}>
                  <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "600" }}>
                    {venue.price_range} · {PRICE_LABELS[venue.price_range] ?? ""}
                  </Text>
                </View>
              )}
            </View>

            {venue.group_name && (
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 6 }}>{venue.group_name}</Text>
            )}
          </View>

          {/* About */}
          {venue.description && (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
                À propos
              </Text>
              <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 22 }}>{venue.description}</Text>
            </View>
          )}

          {/* Atmosphere */}
          <View style={{
            backgroundColor: "rgba(212,175,55,0.07)", borderRadius: 14, padding: 16,
            borderWidth: 1, borderColor: "rgba(212,175,55,0.2)", marginBottom: 20,
          }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primary, marginBottom: 6 }}>
              ✨ Ambiance
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 20 }}>
              {ATMOSPHERE[venue.category] ?? "Exclusif, sophistiqué et authentiquement Marbella."}
            </Text>
          </View>

          {/* Infos pratiques */}
          <View style={{
            backgroundColor: colors.surface, borderRadius: 16, padding: 18,
            borderWidth: 1, borderColor: colors.border, marginBottom: 20,
          }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 14 }}>
              Infos pratiques
            </Text>

            {venue.address && (
              <InfoRow icon="📍" label="Adresse" value={venue.address} onPress={openMap} />
            )}
            {venue.opening_hours && (
              <InfoRow icon="🕐" label="Horaires" value={venue.opening_hours} />
            )}
            {venue.website && (
              <InfoRow
                icon="🌐" label="Site web"
                value={venue.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                onPress={openWeb}
              />
            )}
            {venue.instagram_handle && (
              <InfoRow icon="📸" label="Instagram" value={venue.instagram_handle} onPress={openInsta} />
            )}
            {venue.avg_price_eur && venue.avg_price_eur > 0 && (
              <InfoRow icon="💳" label="Prix moyen" value={`€${venue.avg_price_eur} / personne`} />
            )}
          </View>

          {/* Galerie — vraies miniatures (cover + images[]) en grille */}
          {carouselImages.length > 1 && (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 10 }}>
                Galerie ({carouselImages.length} photos)
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {carouselImages.map((img, i) => (
                  <View key={`${img.uri}-${i}`} style={{
                    width: "31.5%", aspectRatio: 4 / 3, borderRadius: 10, overflow: "hidden",
                    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
                  }}>
                    <Image
                      source={{ uri: img.uri }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                      transition={200}
                    />
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Offres disponibles */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 10 }}>
              Offres disponibles
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {offers.map((offer, i) => (
                <View key={i} style={{
                  backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary,
                  borderRadius: 50, paddingHorizontal: 14, paddingVertical: 7,
                }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.primary }}>{offer}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Avis clients (max 5) */}
          {reviews.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 10 }}>
                Avis clients ({venue.rating_count ?? reviews.length})
              </Text>
              {reviews.map((rev) => (
                <View key={rev.id} style={{
                  backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 10,
                  borderWidth: 1, borderColor: colors.border,
                }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }} numberOfLines={1}>
                      {rev.user_name}
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#F59E0B" }}>
                      {"★".repeat(rev.score)}
                      <Text style={{ color: colors.border }}>{"★".repeat(5 - rev.score)}</Text>
                    </Text>
                  </View>
                  {rev.comment ? (
                    <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 19, marginTop: 6 }}>
                      {rev.comment}
                    </Text>
                  ) : null}
                  <Text style={{ fontSize: 10, color: colors.muted, marginTop: 6 }}>
                    {new Date(rev.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* CTAs */}
          <View style={{ gap: 12, marginBottom: 40 }}>
            <TouchableOpacity
              onPress={handleBooking}
              style={{ backgroundColor: colors.primary, borderRadius: 50, paddingVertical: 16, alignItems: "center" }}
              activeOpacity={0.8}
            >
              <Text style={{ color: "#0A0E13", fontWeight: "800", fontSize: 16 }}>Réserver une expérience VIP</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleShare}
              style={{
                borderWidth: 1.5, borderColor: colors.primary, borderRadius: 50,
                paddingVertical: 14, alignItems: "center",
              }}
              activeOpacity={0.7}
            >
              <Text style={{ color: colors.primary, fontWeight: "600" }}>↗ Partager</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
