import { useState } from "react";
import { View, Text, TouchableOpacity, Platform, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useTranslation } from "react-i18next";
import { useAllVenuesForMap } from "@/hooks/use-venues";

// Icônes par catégorie pour les marqueurs
const CATEGORY_ICONS: Record<string, string> = {
  "Beach Club":     "🌊",
  "Fine Dining":    "🍽️",
  "Spa & Wellness": "🧖",
  "Nightlife":      "🎉",
  "Events":         "🌟",
  "Shopping":       "🛍️",
  "Hotel":          "🏨",
};

const CATEGORY_FILTERS = ["All", "Beach Club", "Fine Dining", "Spa & Wellness", "Nightlife", "Events", "Shopping", "Hotel"];

function buildMapHTML(
  venues: { slug: string; name: string; category: string; lat: number; lng: number; rating: number }[],
  selectedCategory: string
): string {
  const filtered = selectedCategory === "All" ? venues : venues.filter(v => v.category === selectedCategory);

  const markers = filtered.map(v => {
    const icon = CATEGORY_ICONS[v.category] ?? "📍";
    const safeName = v.name.replace(/'/g, "\\'").replace(/"/g, '\\"');
    const safeCategory = v.category.replace(/'/g, "\\'");
    return `
    L.marker([${v.lat}, ${v.lng}], {
      icon: L.divIcon({
        html: '<div style="font-size:22px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">${icon}</div>',
        className: '',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      })
    })
    .addTo(map)
    .bindPopup('<div style="font-family:sans-serif;padding:4px 2px;min-width:120px"><b style="font-size:13px">${safeName}</b><br><span style="color:#888;font-size:11px">${safeCategory}</span><br><span style="color:#D4AF37;font-size:12px;font-weight:700">★ ${v.rating}</span></div>');
  `;
  }).join("\n");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0a0a0f; }
    #map { width: 100vw; height: 100vh; }
    .leaflet-popup-content-wrapper {
      background: #1a1a2e; color: #e8e8e8;
      border: 1px solid #D4AF3740; border-radius: 10px;
    }
    .leaflet-popup-tip { background: #1a1a2e; }
    .leaflet-popup-close-button { color: #888 !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: true }).setView([36.5101, -4.8863], 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO', maxZoom: 19,
    }).addTo(map);
    ${markers}
  </script>
</body>
</html>`;
}

export default function MapScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const [selectedCategory, setSelectedCategory] = useState("All");

  const { data: venues, loading, error } = useAllVenuesForMap();

  const mapVenues = venues
    .filter(v => v.lat != null && v.lng != null)
    .map(v => ({
      slug: v.slug,
      name: v.name,
      category: v.category,
      lat: v.lat!,
      lng: v.lng!,
      rating: v.rating,
    }));

  const venueCount = selectedCategory === "All"
    ? mapVenues.length
    : mapVenues.filter(v => v.category === selectedCategory).length;

  if (Platform.OS === "web") {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 16 }}>
          <Text style={{ fontSize: 48 }}>🗺️</Text>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.primary, textAlign: "center" }}>
            {t("map.mobileOnly")}
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center" }}>
            {t("map.mobileDesc")}
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 8 }}>
            <Text style={{ color: colors.primary, fontSize: 14 }}>{t("common.back")}</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const html = loading || mapVenues.length === 0 ? "" : buildMapHTML(mapVenues, selectedCategory);

  return (
    <View style={{ flex: 1, backgroundColor: "#0a0a0f" }}>
      {/* Header */}
      <View style={{
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 16, paddingTop: 56, paddingBottom: 10,
        backgroundColor: "rgba(10,10,15,0.95)", gap: 12, zIndex: 10,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ backgroundColor: "rgba(212,175,55,0.15)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}
        >
          <Text style={{ color: "#D4AF37", fontSize: 14, fontWeight: "600" }}>{t("common.back")}</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: "800", color: "#D4AF37" }}>
          🗺️ {t("map.title")}
        </Text>
        <Text style={{ fontSize: 11, color: "#888", marginLeft: "auto" }}>
          {loading ? "..." : `${venueCount} ${t("map.venues")}`}
        </Text>
      </View>

      {/* Category filter */}
      <View style={{
        backgroundColor: "rgba(10,10,15,0.95)", paddingHorizontal: 12,
        paddingBottom: 10, flexDirection: "row", flexWrap: "nowrap",
        gap: 6, zIndex: 10,
      }}>
        {CATEGORY_FILTERS.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            style={{
              paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
              backgroundColor: selectedCategory === cat ? "#D4AF37" : "rgba(255,255,255,0.07)",
              borderWidth: 1,
              borderColor: selectedCategory === cat ? "#D4AF37" : "rgba(255,255,255,0.1)",
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: "600", color: selectedCategory === cat ? "#0A0E13" : "#aaa" }}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Loading overlay */}
      {loading && (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center", zIndex: 20, backgroundColor: "rgba(10,10,15,0.8)" }}>
          <ActivityIndicator color="#D4AF37" size="large" />
          <Text style={{ color: "#888", marginTop: 12, fontSize: 13 }}>{t("common.loading")}</Text>
        </View>
      )}

      {/* Map */}
      {!loading && html ? (
        <WebView
          key={`${selectedCategory}-${mapVenues.length}`}
          source={{ html }}
          style={{ flex: 1 }}
          scrollEnabled={false}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={["*"]}
          mixedContentMode="always"
        />
      ) : !loading && (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "#888" }}>{error ?? "No venues with GPS data"}</Text>
        </View>
      )}
    </View>
  );
}
