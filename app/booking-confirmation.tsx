import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";

export default function BookingConfirmationScreen() {
  const { t } = useTranslation();
  const { session_id, venueId, venueName: venueNameParam, date, time, guests, tableName, tablePrice, confirmationNumber } = useLocalSearchParams<{
    session_id?: string;
    venueId: string;
    venueName?: string;
    date: string;
    time: string;
    guests: string;
    tableName?: string;
    tablePrice?: string;
    confirmationNumber?: string;
  }>();
  const router = useRouter();

  // Statut de paiement : interrogé via get-checkout-status quand on revient de
  // Stripe Checkout (success_url = .../booking-confirmation?session_id=...).
  type PayState = "none" | "checking" | "paid" | "pending";
  const [payState, setPayState] = useState<PayState>(session_id ? "checking" : "none");

  useEffect(() => {
    if (!session_id) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-checkout-status", {
          body: { sessionId: session_id },
        });
        if (cancelled) return;
        const d = data as { paymentStatus?: string; status?: string } | null;
        const paid = !error && (d?.paymentStatus === "paid" || d?.status === "complete");
        setPayState(paid ? "paid" : "pending");
      } catch {
        if (!cancelled) setPayState("pending");
      }
    })();
    return () => { cancelled = true; };
  }, [session_id]);

  // Use passed venueName, fall back to a lookup, then to a generic label
  const VENUE_NAME_MAP: Record<string, string> = {
    "ocean-club": "Ocean Club Marbella", "nikki-beach": "Nikki Beach Marbella",
    "playa-padre": "Playa Padre", "opium-beach": "Opium Beach Club",
    "olivia-valere": "Olivia Valere", "mirage-nightclub": "Mirage Nightclub",
    "starlite-festival": "Starlite Auditorium", "lena-marbella": "Leña by Dani García",
    "skina": "Skina", "messina": "Messina", "ta-kumi": "Ta-Kumi",
    "finca-cortesin-spa": "Finca Cortesín Spa",
  };
  const venueName = venueNameParam || VENUE_NAME_MAP[venueId ?? ""] || "Exclusive Venue";
  const confirmNum = confirmationNumber || `MSS-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  return (
    <ScreenContainer className="px-6">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Statut */}
        <View className="items-center pt-12 pb-8">
          {payState === "paid" ? (
            <>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(74,222,128,0.18)", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Text style={{ fontSize: 44 }}>✅</Text>
              </View>
              <Text className="text-3xl font-bold text-foreground" style={{ textAlign: "center" }}>
                Paiement confirmé
              </Text>
              <Text className="text-sm text-muted mt-2" style={{ textAlign: "center" }}>
                Ta réservation est payée. Tu recevras un email de confirmation.
              </Text>
            </>
          ) : payState === "checking" ? (
            <>
              <ActivityIndicator color="#D4AF37" size="large" style={{ marginBottom: 16 }} />
              <Text className="text-3xl font-bold text-foreground" style={{ textAlign: "center" }}>
                Vérification du paiement…
              </Text>
            </>
          ) : payState === "pending" ? (
            <>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(245,158,11,0.18)", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Text style={{ fontSize: 44 }}>⏳</Text>
              </View>
              <Text className="text-3xl font-bold text-foreground" style={{ textAlign: "center" }}>
                En attente de paiement
              </Text>
              <Text className="text-sm text-muted mt-2" style={{ textAlign: "center" }}>
                Si tu viens de payer, le statut se met à jour sous peu.
              </Text>
            </>
          ) : (
            // Flux sans paiement (réservation en attente de validation partenaire)
            <>
              <View className="w-20 h-20 rounded-full bg-primary items-center justify-center mb-4">
                <Text className="text-5xl">⏳</Text>
              </View>
              <Text className="text-3xl font-bold text-foreground" style={{ textAlign: "center" }}>
                {t("bookingConfirm.title")}
              </Text>
            </>
          )}
        </View>

        {/* Détails + n° : seulement hors retour Stripe (params présents). */}
        {!session_id && (<>
        {/* Confirmation Details */}
        <View className="bg-surface rounded-2xl p-6 mb-6 border border-border">
          <Text className="text-lg font-bold text-foreground mb-4">
            {t("bookingConfirm.reservationDetails")}
          </Text>

          <View className="mb-4">
            <Text className="text-xs text-muted font-semibold mb-1">{t("bookingConfirm.venue")}</Text>
            <Text className="text-base font-semibold text-foreground">
              {venueName}
            </Text>
          </View>

          <View className="mb-4">
            <Text className="text-xs text-muted font-semibold mb-1">{t("bookingConfirm.date")}</Text>
            <Text className="text-base font-semibold text-foreground">{date}</Text>
          </View>

          <View className="mb-4">
            <Text className="text-xs text-muted font-semibold mb-1">{t("bookingConfirm.time")}</Text>
            <Text className="text-base font-semibold text-foreground">{time}</Text>
          </View>

          <View>
            <Text className="text-xs text-muted font-semibold mb-1">{t("bookingConfirm.guests")}</Text>
            <Text className="text-base font-semibold text-foreground">
              {guests} {guests === "1" ? t("common.person") : t("common.people")}
            </Text>
          </View>

          {tableName ? (
            <View className="mt-4 pt-4 border-t border-border">
              <Text className="text-xs text-muted font-semibold mb-1">TABLE</Text>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Text style={{ fontSize: 14 }}>🪑</Text>
                  <Text className="text-base font-semibold text-foreground">{tableName}</Text>
                </View>
                {tablePrice && tablePrice !== "" && (
                  <View style={{
                    backgroundColor: "rgba(212,175,55,0.15)",
                    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
                  }}>
                    <Text style={{ color: "#D4AF37", fontWeight: "700", fontSize: 13 }}>
                      From €{parseInt(tablePrice).toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ) : null}
        </View>

        {/* Confirmation Number */}
        <View className="bg-surface rounded-2xl p-6 mb-6 border border-border">
          <Text className="text-xs text-muted font-semibold mb-2">
            {t("bookingConfirm.confirmationNumber")}
          </Text>
          <Text className="text-2xl font-bold text-primary">{confirmNum}</Text>
          <Text className="text-xs text-muted mt-2">
            {t("bookingConfirm.saveNumber")}
          </Text>
        </View>
        </>)}

        {/* What to Expect */}
        <View className="bg-surface rounded-2xl p-6 mb-6 border border-border">
          <Text className="text-lg font-bold text-foreground mb-4">
            {t("bookingConfirm.whatToExpect")}
          </Text>
          <View className="gap-3">
            <View className="flex-row gap-3">
              <Text className="text-lg">📧</Text>
              <View className="flex-1">
                <Text className="font-semibold text-foreground">
                  {t("bookingConfirm.confirmEmail")}
                </Text>
                <Text className="text-xs text-muted mt-1">
                  {t("bookingConfirm.confirmEmailDesc")}
                </Text>
              </View>
            </View>
            <View className="flex-row gap-3">
              <Text className="text-lg">📸</Text>
              <View className="flex-1">
                <Text className="font-semibold text-foreground">
                  {t("bookingConfirm.shareExperience")}
                </Text>
                <Text className="text-xs text-muted mt-1">
                  {t("bookingConfirm.shareExperienceDesc")}
                </Text>
              </View>
            </View>
            <View className="flex-row gap-3">
              <Text className="text-lg">🏆</Text>
              <View className="flex-1">
                <Text className="font-semibold text-foreground">
                  {t("bookingConfirm.earnBadges")}
                </Text>
                <Text className="text-xs text-muted mt-1">
                  {t("bookingConfirm.earnBadgesDesc")}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* CTA Buttons */}
        <View className="gap-3 mb-8">
          <TouchableOpacity
            onPress={() => router.push("/(tabs)")}
            className="bg-primary rounded-full py-4 items-center"
            activeOpacity={0.8}
          >
            <Text className="text-foreground font-bold text-lg">
              {t("bookingConfirm.backHome")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/(tabs)/bookings")}
            className="border-2 border-primary rounded-full py-4 items-center"
            activeOpacity={0.8}
          >
            <Text className="text-primary font-bold">{t("bookingConfirm.viewBookings")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
