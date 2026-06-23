import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { getBookingById, type Booking } from "@/lib/bookings-service";

export default function BookingConfirmationScreen() {
  const { t } = useTranslation();
  const { session_id, venueId, venueName: venueNameParam, date, time, guests, tableName, tablePrice, confirmationNumber, paymentMethod } = useLocalSearchParams<{
    session_id?: string;
    venueId: string;
    venueName?: string;
    date: string;
    time: string;
    guests: string;
    tableName?: string;
    tablePrice?: string;
    confirmationNumber?: string;
    paymentMethod?: string;
  }>();
  const router = useRouter();

  // Statut de paiement : interrogé via get-checkout-status quand on revient de
  // Stripe Checkout (success_url = .../booking-confirmation?session_id=...).
  type PayState = "none" | "checking" | "paid" | "pending";
  const fromStripe = !!session_id;
  const [payState, setPayState] = useState<PayState>(fromStripe ? "checking" : "none");

  // Détails réels de la réservation, récupérés après retour de Stripe Checkout
  // via le bookingId renvoyé par get-checkout-status.
  const [booking, setBooking] = useState<Booking | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(fromStripe);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [amountPaid, setAmountPaid] = useState<number | null>(null); // centimes
  const [currency, setCurrency] = useState("eur");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!session_id) return;
    let cancelled = false;
    setPayState("checking");
    setDetailsLoading(true);
    setDetailsError(null);
    (async () => {
      try {
        // La redirection externe vers Stripe peut faire perdre la session au
        // retour (rechargement de page). On la restaure depuis la sauvegarde
        // locale pour que la lecture RLS de la réservation fonctionne.
        if (Platform.OS === "web") {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
              const backup = window.localStorage.getItem("marbellapp_session_backup");
              if (backup) {
                const { access_token, refresh_token } = JSON.parse(backup) as {
                  access_token?: string; refresh_token?: string;
                };
                if (access_token && refresh_token) {
                  await supabase.auth.setSession({ access_token, refresh_token });
                }
              }
            }
            window.localStorage.removeItem("marbellapp_session_backup");
          } catch { /* best-effort */ }
        }

        const { data, error } = await supabase.functions.invoke("get-checkout-status", {
          body: { sessionId: session_id },
        });
        if (cancelled) return;
        const d = data as {
          paymentStatus?: string; status?: string;
          bookingId?: string | null; amountTotal?: number | null; currency?: string;
        } | null;
        const paid = !error && (d?.paymentStatus === "paid" || d?.status === "complete");
        setPayState(paid ? "paid" : "pending");
        if (d?.amountTotal != null) setAmountPaid(d.amountTotal);
        if (d?.currency) setCurrency(d.currency);

        // Récupère les vraies données de la réservation depuis Supabase.
        if (error || !d?.bookingId) { setDetailsError(t("bookingConfirm.detailsError")); return; }
        const b = await getBookingById(d.bookingId);
        if (cancelled) return;
        if (!b) { setDetailsError(t("bookingConfirm.detailsError")); return; }
        setBooking(b);
      } catch (e: any) {
        if (!cancelled) {
          setPayState("pending");
          setDetailsError(e?.message ?? t("bookingConfirm.detailsError"));
        }
      } finally {
        if (!cancelled) setDetailsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [session_id, retryKey, t]);

  // Use passed venueName, fall back to a lookup, then to a generic label
  const VENUE_NAME_MAP: Record<string, string> = {
    "ocean-club": "Ocean Club Marbella", "nikki-beach": "Nikki Beach Marbella",
    "playa-padre": "Playa Padre", "opium-beach": "Opium Beach Club",
    "bonbonniere-marbella": "Bonbonniere Marbella", "mirage-nightclub": "Mirage Nightclub",
    "starlite-festival": "Starlite Auditorium", "lena-marbella": "Leña by Dani García",
    "skina": "Skina", "messina": "Messina", "ta-kumi": "Ta-Kumi",
    "finca-cortesin-spa": "Finca Cortesín Spa",
  };
  const paramVenueName = venueNameParam || VENUE_NAME_MAP[venueId ?? ""] || "Exclusive Venue";

  // Valeurs affichées : retour Stripe → données réelles ; sinon → params de navigation.
  const dispVenue      = fromStripe ? (booking?.venue_name ?? paramVenueName) : paramVenueName;
  const dispDate       = fromStripe ? (booking?.date ?? "") : date;
  const dispTime       = fromStripe ? (booking?.time ?? "") : time;
  const dispGuests     = fromStripe ? (booking?.guests != null ? String(booking.guests) : "") : guests;
  const dispTable      = fromStripe ? (booking?.table_name ?? null) : (tableName ?? null);
  const dispTablePrice = fromStripe
    ? (booking?.table_price != null ? String(booking.table_price) : "")
    : (tablePrice ?? "");
  const dispConfirm    = fromStripe
    ? (booking?.confirmation_number ?? confirmationNumber ?? "—")
    : (confirmationNumber || `MSS-${Date.now().toString(36).toUpperCase().slice(-6)}`);

  // Paiement à l'établissement (cash) : jamais de passage Stripe, l'info vient
  // donc du paramètre de navigation (ou de la réservation si rechargée).
  const isCash = paymentMethod === "cash" || booking?.payment_method === "cash";

  const formatMoney = (cents: number) =>
    (cents / 100).toLocaleString(undefined, { style: "currency", currency: (currency || "eur").toUpperCase() });

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
                <Text className="text-5xl">{isCash ? "💶" : "⏳"}</Text>
              </View>
              <Text className="text-3xl font-bold text-foreground" style={{ textAlign: "center" }}>
                {t("bookingConfirm.title")}
              </Text>
              {isCash && (
                <Text className="text-sm text-muted mt-2" style={{ textAlign: "center" }}>
                  Votre réservation est confirmée. Présentez votre numéro de confirmation à l'arrivée.
                </Text>
              )}
            </>
          )}
        </View>

        {/* Détails de la réservation — vraies données au retour de Stripe. */}
        {fromStripe && detailsLoading ? (
          /* Skeleton pendant le chargement des détails */
          <View className="bg-surface rounded-2xl p-6 mb-6 border border-border">
            <View className="h-5 rounded bg-border mb-5" style={{ width: "55%" }} />
            {[0, 1, 2, 3].map((i) => (
              <View key={i} className="mb-4">
                <View className="h-3 rounded bg-border mb-2" style={{ width: "30%" }} />
                <View className="h-4 rounded bg-border" style={{ width: "70%" }} />
              </View>
            ))}
          </View>
        ) : fromStripe && detailsError && !booking ? (
          /* Échec de chargement des détails (le paiement reste pris en compte) */
          <View className="bg-surface rounded-2xl p-6 mb-6 border border-border items-center">
            <Text style={{ fontSize: 28, marginBottom: 8 }}>⚠️</Text>
            <Text className="text-sm text-muted mb-4" style={{ textAlign: "center" }}>
              {detailsError}
            </Text>
            <TouchableOpacity
              onPress={() => setRetryKey((k) => k + 1)}
              accessibilityRole="button"
              accessibilityLabel={t("common.retry")}
              className="bg-primary rounded-full px-6 py-2.5"
              activeOpacity={0.8}
            >
              <Text className="font-bold" style={{ color: "#0A0E13" }}>{t("common.retry")}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Confirmation Details */}
            <View className="bg-surface rounded-2xl p-6 mb-6 border border-border">
              <Text className="text-lg font-bold text-foreground mb-4">
                {t("bookingConfirm.reservationDetails")}
              </Text>

              <View className="mb-4">
                <Text className="text-xs text-muted font-semibold mb-1">{t("bookingConfirm.venue")}</Text>
                <Text className="text-base font-semibold text-foreground">
                  {dispVenue}
                </Text>
              </View>

              <View className="mb-4">
                <Text className="text-xs text-muted font-semibold mb-1">{t("bookingConfirm.date")}</Text>
                <Text className="text-base font-semibold text-foreground">{dispDate || "—"}</Text>
              </View>

              <View className="mb-4">
                <Text className="text-xs text-muted font-semibold mb-1">{t("bookingConfirm.time")}</Text>
                <Text className="text-base font-semibold text-foreground">{dispTime || "—"}</Text>
              </View>

              <View>
                <Text className="text-xs text-muted font-semibold mb-1">{t("bookingConfirm.guests")}</Text>
                <Text className="text-base font-semibold text-foreground">
                  {dispGuests || "—"}{dispGuests ? ` ${dispGuests === "1" ? t("common.person") : t("common.people")}` : ""}
                </Text>
              </View>

              {dispTable ? (
                <View className="mt-4 pt-4 border-t border-border">
                  <Text className="text-xs text-muted font-semibold mb-1">TABLE</Text>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <Text style={{ fontSize: 14 }}>🪑</Text>
                      <Text className="text-base font-semibold text-foreground">{dispTable}</Text>
                    </View>
                    {dispTablePrice && dispTablePrice !== "" && (
                      <View style={{
                        backgroundColor: "rgba(212,175,55,0.15)",
                        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
                      }}>
                        <Text style={{ color: "#D4AF37", fontWeight: "700", fontSize: 13 }}>
                          From €{parseInt(dispTablePrice).toLocaleString()}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ) : null}

              {/* Montant payé — retour Stripe, paiement confirmé */}
              {payState === "paid" && amountPaid != null && (
                <View className="mt-4 pt-4 border-t border-border flex-row items-center justify-between">
                  <Text className="text-xs text-muted font-semibold">{t("bookingConfirm.amountPaid")}</Text>
                  <Text className="text-base font-bold text-primary">{formatMoney(amountPaid)}</Text>
                </View>
              )}

              {/* Paiement à l'établissement (cash) — pas de montant Stripe */}
              {isCash && (
                <View className="mt-4 pt-4 border-t border-border flex-row items-center justify-between">
                  <Text className="text-xs text-muted font-semibold">PAIEMENT</Text>
                  <View className="flex-row items-center gap-2">
                    <Text style={{ fontSize: 14 }}>💶</Text>
                    <Text className="text-base font-bold text-primary">Paiement à l'établissement</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Confirmation Number */}
            <View className="bg-surface rounded-2xl p-6 mb-6 border border-border">
              <Text className="text-xs text-muted font-semibold mb-2">
                {t("bookingConfirm.confirmationNumber")}
              </Text>
              <Text className="text-2xl font-bold text-primary">{dispConfirm}</Text>
              <Text className="text-xs text-muted mt-2">
                {t("bookingConfirm.saveNumber")}
              </Text>
            </View>
          </>
        )}

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
            onPress={() => router.replace("/(tabs)")}
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
