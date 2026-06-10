import {
  ScrollView, Text, View, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useState } from "react";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useBookings } from "@/hooks/use-bookings";
import { useDemo } from "@/lib/demo-context";
import { DEMO_BOOKINGS } from "@/constants/demo-data";
import type { Booking } from "@/lib/bookings-service";
import { getVenueImage } from "@/constants/venue-images";

const STATUS_COLORS: Record<string, string> = {
  confirmed: "#4ADE80",
  pending:   "#FBBF24",
  completed: "#D4AF37",
  cancelled: "#EF4444",
};
const STATUS_BGS: Record<string, string> = {
  confirmed: "rgba(74,222,128,0.15)",
  pending:   "rgba(251,191,36,0.15)",
  completed: "rgba(212,175,55,0.15)",
  cancelled: "rgba(239,68,68,0.15)",
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

function isUpcoming(b: Booking): boolean {
  if (b.status === "cancelled" || b.status === "completed") return false;
  const d = new Date(b.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d >= today;
}

export default function MyReservationsScreen() {
  const { t }    = useTranslation();
  const router   = useRouter();
  const { user } = useAuth();
  const { isDemoMode } = useDemo();

  const { bookings: realBookings, loading, error, refetch, cancel } = useBookings(
    isDemoMode ? undefined : user?.id
  );

  const bookings: Booking[] = isDemoMode
    ? (DEMO_BOOKINGS as unknown as Booking[])
    : realBookings;

  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  const upcoming = bookings.filter((b) => isUpcoming(b));
  const past     = bookings.filter((b) => !isUpcoming(b));
  const list     = activeTab === "upcoming" ? upcoming : past;

  const statusLabel = (s: string) => ({
    confirmed: t("myRes.confirmed"),
    pending:   t("myRes.pending"),
    completed: t("myRes.completed"),
    cancelled: t("myRes.cancelled"),
  }[s] ?? s);

  const ReservationCard = ({ r }: { r: Booking }) => (
    <View style={{
      backgroundColor: "#111120", borderRadius: 18, marginBottom: 14,
      overflow: "hidden", borderWidth: 1, borderColor: "rgba(212,175,55,0.15)",
    }}>
      {/* Photo */}
      <View style={{ height: 110, position: "relative" }}>
        <Image
          source={{ uri: r.venue_slug
            ? getVenueImage(r.venue_slug, r.venue_category ?? "")
            : "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
          }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          transition={300}
        />
        <View style={{
          position: "absolute", top: 10, right: 10,
          backgroundColor: STATUS_BGS[r.status] ?? STATUS_BGS.confirmed,
          paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
          borderWidth: 0.5,
          borderColor: (STATUS_COLORS[r.status] ?? "#4ADE80") + "60",
        }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: STATUS_COLORS[r.status] ?? "#4ADE80" }}>
            {statusLabel(r.status)}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={{ padding: 14 }}>
        <Text style={{ fontSize: 16, fontWeight: "700", color: "#e8e8e8", marginBottom: 2 }}>
          {r.venue_name}
        </Text>
        {r.venue_category && (
          <Text style={{ fontSize: 11, color: "#D4AF37", fontWeight: "600", marginBottom: 2 }}>
            {r.venue_category}
          </Text>
        )}
        <Text style={{ fontSize: 11, color: "#888", marginBottom: 10 }}>Marbella, Spain</Text>

        <View style={{ flexDirection: "row", gap: 16, marginBottom: 12 }}>
          <View style={{ flex: 1, backgroundColor: "#0a0a0f", borderRadius: 10, padding: 10 }}>
            <Text style={{ fontSize: 10, color: "#666", marginBottom: 3 }}>{t("myRes.dateTime")}</Text>
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#e8e8e8" }}>{formatDate(r.date)}</Text>
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#D4AF37" }}>{r.time}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: "#0a0a0f", borderRadius: 10, padding: 10 }}>
            <Text style={{ fontSize: 10, color: "#666", marginBottom: 3 }}>{t("myRes.guests")}</Text>
            <Text style={{ fontSize: 22, fontWeight: "800", color: "#D4AF37" }}>{r.guests}</Text>
            <Text style={{ fontSize: 10, color: "#666" }}>
              {r.guests === 1 ? t("common.person") : t("common.people")}
            </Text>
          </View>
        </View>

        {/* Table info */}
        {r.table_name && (
          <View style={{
            flexDirection: "row", alignItems: "center", gap: 6,
            backgroundColor: "#0a0a0f", borderRadius: 8, padding: 8, marginBottom: 10,
          }}>
            <Text style={{ fontSize: 13 }}>🪑</Text>
            <Text style={{ fontSize: 12, color: "#888" }}>
              {r.table_name}
              {r.table_price ? ` · From €${Number(r.table_price).toLocaleString()}` : ""}
            </Text>
          </View>
        )}

        {/* Ref */}
        {r.confirmation_number && (
          <Text style={{ fontSize: 10, color: "#444", marginBottom: 10, letterSpacing: 0.5 }}>
            Ref: {r.confirmation_number}
          </Text>
        )}

        {/* Actions */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          {(r.status === "confirmed" || r.status === "pending") && isUpcoming(r) && (
            <TouchableOpacity
              onPress={() => cancel(r.id)}
              style={{ flex: 1, backgroundColor: "rgba(239,68,68,0.15)", borderRadius: 10, paddingVertical: 9, alignItems: "center" }}
            >
              <Text style={{ color: "#EF4444", fontWeight: "700", fontSize: 12 }}>{t("myRes.cancel")}</Text>
            </TouchableOpacity>
          )}
          {(r.status === "completed" || r.status === "cancelled" || !isUpcoming(r)) && (
            <TouchableOpacity
              onPress={() => router.push({ pathname: "/booking", params: { venueId: r.venue_slug ?? "", venueName: r.venue_name } })}
              style={{ flex: 1, backgroundColor: "#D4AF37", borderRadius: 10, paddingVertical: 9, alignItems: "center" }}
            >
              <Text style={{ color: "#0a0a0f", fontWeight: "700", fontSize: 12 }}>{t("myRes.bookAgain")}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <ScreenContainer className="px-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ fontSize: 22, color: "#D4AF37" }}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 26, fontWeight: "800", color: "#e8e8e8", marginLeft: 12 }}>
            {t("myRes.title")}
          </Text>
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
          {(["upcoming", "past"] as const).map((tab) => {
            const active = activeTab === tab;
            const count  = tab === "upcoming" ? upcoming.length : past.length;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={{
                  flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center",
                  backgroundColor: active ? "#D4AF37" : "#111120",
                  borderWidth: 1, borderColor: active ? "#D4AF37" : "rgba(212,175,55,0.2)",
                }}
              >
                <Text style={{ fontWeight: "700", fontSize: 13, color: active ? "#0a0a0f" : "#888" }}>
                  {tab === "upcoming" ? t("myRes.upcoming") : t("myRes.past")}
                </Text>
                <Text style={{ fontSize: 11, color: active ? "#0a0a0f" : "#555", marginTop: 2 }}>
                  {loading ? "…" : count}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Loading */}
        {loading && (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <ActivityIndicator color="#D4AF37" size="large" />
          </View>
        )}

        {/* Error */}
        {!loading && error && (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Text style={{ fontSize: 36, marginBottom: 12 }}>⚠️</Text>
            <Text style={{ color: "#888", textAlign: "center", marginBottom: 16 }}>{error}</Text>
            <TouchableOpacity onPress={refetch}
              style={{ backgroundColor: "#D4AF37", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 }}>
              <Text style={{ color: "#0a0a0f", fontWeight: "700" }}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* List */}
        {!loading && !error && list.map((r) => <ReservationCard key={r.id} r={r} />)}

        {/* Empty */}
        {!loading && !error && list.length === 0 && (
          <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 48 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📅</Text>
            <Text style={{ fontSize: 17, fontWeight: "700", color: "#e8e8e8", marginBottom: 6 }}>
              {activeTab === "upcoming" ? t("myRes.noUpcoming") : t("myRes.noPast")}
            </Text>
            <Text style={{ fontSize: 13, color: "#666", textAlign: "center" }}>
              {activeTab === "upcoming" ? t("myRes.noUpcomingDesc") : t("myRes.noPastDesc")}
            </Text>
          </View>
        )}

        {/* Summary */}
        {!loading && !error && (
          <View style={{
            backgroundColor: "#111120", borderRadius: 16, padding: 16,
            borderWidth: 1, borderColor: "rgba(212,175,55,0.15)", marginTop: 8, marginBottom: 24,
          }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#e8e8e8", marginBottom: 12 }}>
              {t("myRes.summary")}
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {[
                { value: upcoming.length,                                       label: t("myRes.upcoming"),  color: "#4ADE80" },
                { value: past.filter((r) => r.status === "completed").length,   label: t("myRes.completed"), color: "#D4AF37" },
                { value: bookings.filter((r) => r.status === "cancelled").length, label: t("myRes.cancelled"), color: "#EF4444" },
              ].map((s) => (
                <View key={s.label} style={{
                  flex: 1, backgroundColor: "#0a0a0f", borderRadius: 10, padding: 10, alignItems: "center",
                }}>
                  <Text style={{ fontSize: 22, fontWeight: "800", color: s.color }}>{s.value}</Text>
                  <Text style={{ fontSize: 10, color: "#666", marginTop: 2 }}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
