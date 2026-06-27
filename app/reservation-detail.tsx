import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getBookingById, type Booking } from "@/lib/bookings-service";
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

const formatDate = (s: string) => {
  try { return new Date(s).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }); }
  catch { return s; }
};
const formatEur = (n: number) => `€${Number(n).toLocaleString()}`;

export default function ReservationDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const { id, venueSlug, venueCategory } = useLocalSearchParams<{
    id: string; venueSlug?: string; venueCategory?: string;
  }>();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) { setError(t("resDetail.notFound")); setLoading(false); return; }
    let cancelled = false;
    setLoading(true); setError(null);
    getBookingById(id)
      .then((b) => { if (!cancelled) { setBooking(b); if (!b) setError(t("resDetail.notFound")); } })
      .catch((e) => { if (!cancelled) setError(e?.message ?? t("resDetail.notFound")); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const statusLabel = (s: string) => ({
    confirmed: t("myRes.confirmed"),
    pending:   t("myRes.pending"),
    completed: t("myRes.completed"),
    cancelled: t("myRes.cancelled"),
  }[s] ?? s);

  const Row = ({ icon, label, value }: { icon: any; label: string; value: string }) => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Ionicons name={icon} size={18} color={colors.muted} />
      <Text style={{ flex: 1, fontSize: 13, color: colors.muted }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, textAlign: "right", flexShrink: 1 }}>{value}</Text>
    </View>
  );

  return (
    <ScreenContainer className="px-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 18, paddingTop: 4 }}>
          <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace("/my-reservations"))} accessibilityRole="button" accessibilityLabel={t("common.back")}>
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.foreground, marginLeft: 8 }}>
            {t("resDetail.title")}
          </Text>
        </View>

        {loading && (
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        )}

        {!loading && error && (
          <View style={{ alignItems: "center", paddingVertical: 60, gap: 10 }}>
            <Ionicons name="alert-circle-outline" size={36} color={colors.muted} />
            <Text style={{ color: colors.muted, fontSize: 14, textAlign: "center" }}>{error}</Text>
          </View>
        )}

        {!loading && booking && (
          <>
            {/* Cover + status */}
            <View style={{ height: 160, borderRadius: 18, overflow: "hidden", marginBottom: 16 }}>
              <Image
                source={{ uri: booking.venue_slug
                  ? getVenueImage(booking.venue_slug, booking.venue_category ?? venueCategory ?? "")
                  : getVenueImage(venueSlug ?? "", venueCategory ?? "") }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                transition={300}
              />
              <View style={{
                position: "absolute", top: 12, right: 12,
                backgroundColor: STATUS_BGS[booking.status] ?? STATUS_BGS.confirmed,
                paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8,
                borderWidth: 0.5, borderColor: (STATUS_COLORS[booking.status] ?? "#4ADE80") + "60",
              }}>
                <Text style={{ fontSize: 12, fontWeight: "800", color: STATUS_COLORS[booking.status] ?? "#4ADE80" }}>
                  {statusLabel(booking.status)}
                </Text>
              </View>
            </View>

            <Text style={{ fontSize: 22, fontWeight: "800", color: colors.foreground }}>{booking.venue_name}</Text>
            {booking.venue_category ? (
              <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "700", marginTop: 2 }}>{booking.venue_category}</Text>
            ) : null}

            {/* Détails */}
            <View style={{ backgroundColor: colors.surface, borderRadius: 16, paddingHorizontal: 16, marginTop: 16, borderWidth: 1, borderColor: colors.border }}>
              <Row icon="calendar-outline" label={t("resDetail.dateTime")} value={`${formatDate(booking.date)} · ${booking.time}`} />
              <Row icon="people-outline" label={t("myRes.guests")} value={`${booking.guests} ${booking.guests === 1 ? t("common.person") : t("common.people")}`} />
              {booking.table_name ? (
                <Row icon="restaurant-outline" label={t("booking.selectTable")} value={booking.table_name + (booking.table_price ? ` · ${formatEur(booking.table_price)}` : "")} />
              ) : null}
              {booking.confirmation_number ? (
                <Row icon="pricetag-outline" label={t("resDetail.ref")} value={booking.confirmation_number} />
              ) : null}
            </View>

            {/* Montant / paiement */}
            <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginTop: 12, borderWidth: 1, borderColor: colors.border }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 13, color: colors.muted }}>{t("resDetail.amount")}</Text>
                <Text style={{ fontSize: 20, fontWeight: "800", color: colors.primary }}>
                  {booking.table_price != null ? formatEur(booking.table_price) : "—"}
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 6 }}>
                {booking.payment_method === "cash"
                  ? t("resDetail.payCash")
                  : booking.deposit_only && booking.deposit_amount != null
                    ? `${t("resDetail.depositPaid")} ${formatEur(booking.deposit_amount)} · ${t("resDetail.balanceOnSite")}`
                    : t("resDetail.payCard")}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
