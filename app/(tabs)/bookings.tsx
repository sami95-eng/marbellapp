import { useState, useCallback } from "react";
import {
  ScrollView, Text, View, TouchableOpacity,
  FlatList, ActivityIndicator, Alert, Platform,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useBookings } from "@/hooks/use-bookings";
import { useDemo } from "@/lib/demo-context";
import { DEMO_BOOKINGS } from "@/constants/demo-data";
import type { Booking } from "@/lib/bookings-service";

// ── Helpers ────────────────────────────────────────────────────────

const CATEGORY_EMOJI: Record<string, string> = {
  "Beach Club":     "🌊",
  "Fine Dining":    "🍽️",
  "Spa & Wellness": "🧖",
  "Nightlife":      "🎉",
  "Events":         "🌟",
  "Shopping":       "🛍️",
  "Hotel":          "🏨",
};

const STATUS_COLORS = {
  confirmed: { color: "#4ADE80", bg: "rgba(74,222,128,0.15)"  },
  pending:   { color: "#F59E0B", bg: "rgba(245,158,11,0.15)"  },
  completed: { color: "#D4AF37", bg: "rgba(212,175,55,0.15)"  },
  cancelled: { color: "#EF4444", bg: "rgba(239,68,68,0.15)"   },
};

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// Determine display tab from booking status + date
function getDisplayTab(b: Booking): "upcoming" | "past" | "cancelled" {
  if (b.status === "cancelled") return "cancelled";
  if (b.status === "completed") return "past";
  // confirmed/pending: compare date
  const bookingDate = new Date(b.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return bookingDate >= today ? "upcoming" : "past";
}

// ── Booking card ───────────────────────────────────────────────────

function BookingCard({
  item,
  onCancel,
  onRebook,
}: {
  item: Booking;
  onCancel: (id: string) => void;
  onRebook: (b: Booking) => void;
}) {
  const colors = useColors();
  const router = useRouter();
  const { t }  = useTranslation();

  const tab        = getDisplayTab(item);
  const statusKey  = item.status as keyof typeof STATUS_COLORS;
  const statusCfg  = STATUS_COLORS[statusKey] ?? STATUS_COLORS.confirmed;
  const emoji      = CATEGORY_EMOJI[item.venue_category ?? ""] ?? "✨";

  const statusLabel: Record<string, string> = {
    confirmed: t("bookings.confirmed"),
    pending:   t("bookings.pending") || "Pending",
    completed: t("bookings.completed"),
    cancelled: t("bookings.cancelled"),
  };

  return (
    <TouchableOpacity
      onPress={() =>
        item.venue_slug &&
        router.push({ pathname: "/venue-detail", params: { id: item.venue_slug } })
      }
      activeOpacity={0.7}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16, padding: 16, marginBottom: 12,
        borderWidth: 1, borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 14 }}>
        {/* Icon */}
        <View style={{
          width: 56, height: 56, borderRadius: 14,
          backgroundColor: "rgba(212,175,55,0.15)",
          alignItems: "center", justifyContent: "center",
        }}>
          <Text style={{ fontSize: 28 }}>{emoji}</Text>
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          {/* Name + status */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, flex: 1 }} numberOfLines={1}>
              {item.venue_name}
            </Text>
            <View style={{ backgroundColor: statusCfg.bg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: statusCfg.color }}>
                {statusLabel[item.status] ?? item.status}
              </Text>
            </View>
          </View>

          {/* Category */}
          {item.venue_category && (
            <Text style={{ fontSize: 12, color: colors.primary, marginTop: 2, fontWeight: "600" }}>
              {item.venue_category}
            </Text>
          )}

          {/* Date / time / guests */}
          <View style={{ flexDirection: "row", marginTop: 8, gap: 12, flexWrap: "wrap" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ fontSize: 13 }}>📅</Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>{formatDate(item.date)}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ fontSize: 13 }}>🕐</Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>{item.time}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ fontSize: 13 }}>👥</Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>
                {item.guests} {item.guests === 1 ? t("common.guest") : t("common.guests")}
              </Text>
            </View>
          </View>

          {/* Table info */}
          {item.table_name && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
              <Text style={{ fontSize: 12 }}>🪑</Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>
                {item.table_name}
                {item.table_price ? ` · From €${Number(item.table_price).toLocaleString()}` : ""}
              </Text>
            </View>
          )}

          {/* Confirmation ref */}
          {item.confirmation_number && (
            <Text style={{ fontSize: 10, color: "#555", marginTop: 5, letterSpacing: 0.5 }}>
              Ref: {item.confirmation_number}
            </Text>
          )}

          {/* Actions */}
          {tab === "upcoming" && (
            <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onCancel(item.id)}
                style={{
                  flex: 1, backgroundColor: "rgba(239,68,68,0.15)",
                  paddingVertical: 8, borderRadius: 8, alignItems: "center",
                }}
              >
                <Text style={{ color: "#EF4444", fontWeight: "700", fontSize: 12 }}>
                  {t("bookings.cancel")}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {tab === "past" && item.status === "completed" && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onRebook(item)}
              style={{
                marginTop: 10, backgroundColor: "rgba(212,175,55,0.15)",
                paddingVertical: 8, borderRadius: 8, alignItems: "center",
              }}
            >
              <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 12 }}>
                {t("bookings.bookAgain")}
              </Text>
            </TouchableOpacity>
          )}

          {tab === "cancelled" && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onRebook(item)}
              style={{
                marginTop: 10, backgroundColor: colors.primary,
                paddingVertical: 8, borderRadius: 8, alignItems: "center",
              }}
            >
              <Text style={{ color: "#0A0E13", fontWeight: "700", fontSize: 12 }}>
                {t("bookings.bookAgain")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Main screen ────────────────────────────────────────────────────

export default function BookingsScreen() {
  const { t }      = useTranslation();
  const router     = useRouter();
  const colors     = useColors();
  const { user }   = useAuth();
  const { isDemoMode } = useDemo();

  const { bookings: realBookings, loading, error, refetch, cancel } = useBookings(
    isDemoMode ? undefined : user?.id
  );

  // Refetch every time this tab comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!isDemoMode && user?.id) refetch();
    }, [refetch, isDemoMode, user?.id])
  );

  // In demo mode show demo reservations cast to Booking shape
  const bookings: Booking[] = isDemoMode
    ? (DEMO_BOOKINGS as unknown as Booking[])
    : realBookings;

  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "cancelled">("upcoming");

  const upcoming  = bookings.filter((b) => getDisplayTab(b) === "upcoming");
  const past      = bookings.filter((b) => getDisplayTab(b) === "past");
  const cancelled = bookings.filter((b) => getDisplayTab(b) === "cancelled");

  const filtered = activeTab === "upcoming" ? upcoming
                 : activeTab === "past"     ? past
                 : cancelled;

  const handleCancel = (id: string) => {
    const doCancel = async () => {
      try {
        await cancel(id);
      } catch (e: any) {
        if (Platform.OS === "web") {
          window.alert(`Failed to cancel: ${e?.message}`);
        } else {
          Alert.alert("Error", e?.message ?? "Failed to cancel booking.");
        }
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm("Cancel this booking?")) doCancel();
    } else {
      Alert.alert(
        t("bookings.cancel"),
        "Are you sure you want to cancel this booking?",
        [
          { text: t("common.cancel"), style: "cancel" },
          { text: "Yes, cancel", style: "destructive", onPress: doCancel },
        ]
      );
    }
  };

  const handleRebook = (b: Booking) => {
    router.push({
      pathname: "/booking",
      params: { venueId: b.venue_slug ?? "", venueName: b.venue_name },
    });
  };

  return (
    <ScreenContainer>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>
          <Text style={{ fontSize: 28, fontWeight: "800", color: colors.foreground }}>
            {t("bookings.title")}
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
            {t("bookings.subtitle")}
          </Text>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: "row", paddingHorizontal: 20, gap: 10, marginTop: 14, marginBottom: 16 }}>
          {[
            { label: t("bookings.upcoming"),  count: upcoming.length,  color: "#4ADE80" },
            { label: t("bookings.completed"), count: past.length,      color: "#D4AF37" },
            { label: t("bookings.cancelled"), count: cancelled.length, color: "#EF4444" },
          ].map((stat) => (
            <View key={stat.label} style={{
              flex: 1, backgroundColor: colors.surface, borderRadius: 12,
              padding: 12, alignItems: "center", borderWidth: 1, borderColor: colors.border,
            }}>
              <Text style={{ fontSize: 22, fontWeight: "800", color: stat.color }}>
                {stat.count}
              </Text>
              <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: "row", paddingHorizontal: 20, gap: 8, marginBottom: 16 }}>
          {(["upcoming", "past", "cancelled"] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.7}
                style={{
                  flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center",
                  backgroundColor: isActive ? colors.primary : colors.surface,
                  borderWidth: isActive ? 0 : 1, borderColor: colors.border,
                }}
              >
                <Text style={{
                  fontSize: 13, fontWeight: isActive ? "700" : "500",
                  color: isActive ? "#0A0E13" : colors.muted,
                }}>
                  {tab === "upcoming" ? t("bookings.tabUpcoming")
                   : tab === "past"   ? t("bookings.tabPast")
                   : t("bookings.tabCancelled")}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Loading */}
        {loading && (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        )}

        {/* Error */}
        {!loading && error && (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>⚠️</Text>
            <Text style={{ color: colors.muted, textAlign: "center", marginBottom: 16 }}>{error}</Text>
            <TouchableOpacity onPress={refetch} activeOpacity={0.7}
              style={{ backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 }}>
              <Text style={{ color: "#0A0E13", fontWeight: "700" }}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* List */}
        {!loading && !error && filtered.length > 0 && (
          <FlatList
            data={filtered}
            renderItem={({ item }) => (
              <BookingCard item={item} onCancel={handleCancel} onRebook={handleRebook} />
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <ScrollView contentContainerStyle={{ flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 80 }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>📭</Text>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>
              {t("bookings.noBookings")}
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted, marginTop: 6, textAlign: "center", paddingHorizontal: 40 }}>
              {t("bookings.noBookingsDesc")}
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)")}
              activeOpacity={0.7}
              style={{ marginTop: 20, backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
            >
              <Text style={{ color: "#0A0E13", fontWeight: "700", fontSize: 14 }}>
                {t("bookings.exploreVenues")}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </ScreenContainer>
  );
}
