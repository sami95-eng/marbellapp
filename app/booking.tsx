import {
  ScrollView, Text, View, TouchableOpacity, TextInput,
  ActivityIndicator, FlatList, Alert, Platform, Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { useVenueTables } from "@/hooks/use-tables";
import { useDemo } from "@/lib/demo-context";
import { DEMO_TABLES } from "@/constants/demo-data";
import type { VenueTable } from "@/lib/tables-service";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { createBooking } from "@/lib/bookings-service";
import { getAvailableSlots, bookSlot, releaseSlot, type AvailabilitySlot } from "@/lib/availability-service";
import { getVenueSlotWindow } from "@/lib/venues-service";
import { getUserVipStatus } from "@/lib/vip-service";
import { venueAcceptsCash } from "@/lib/subscriptions-service";

type IoniconName = keyof typeof Ionicons.glyphMap;

// Le date-picker natif ne supporte pas le web : on ne le charge que sur natif
// (le require n'est jamais exécuté sur web → aucun crash de bundle).
let DateTimePicker: any = null;
if (Platform.OS !== "web") {
  DateTimePicker = require("@react-native-community/datetimepicker").default;
}

// ── Helpers de date (YYYY-MM-DD, comparaisons locales) ──────────────
const toISODate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const parseISODate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1);
};
const formatDisplayDate = (iso: string) =>
  parseISODate(iso).toLocaleDateString(undefined, {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
// Comparaison sûre sur des chaînes YYYY-MM-DD (ordre lexicographique = ordre temporel)
const isPastDate = (iso: string) => iso < toISODate(new Date());

// Minutes depuis minuit pour comparer des "HH:MM".
const timeToMin = (hhmm: string) => { const [h, m] = hhmm.split(":").map(Number); return (h || 0) * 60 + (m || 0); };
// Un créneau est-il dans la fenêtre d'ouverture ? (gère le passage de minuit, ex. 23:00 → 06:00)
const inOpeningWindow = (time: string, start: string, end: string) => {
  const s = timeToMin(start);
  let e = timeToMin(end); if (e <= s) e += 1440;
  let t = timeToMin(time); if (t < s) t += 1440;
  return t >= s && t < e;
};

// Formate un montant en centimes vers une chaîne € FR (5000 → "50,00 €").
const formatEur = (cents: number) =>
  (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

// ── Table selector card ────────────────────────────────────────────
function TableCard({
  table,
  selected,
  onSelect,
}: {
  table: VenueTable | null; // null = "No preference"
  selected: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation();
  const colors = useColors();

  if (!table) {
    return (
      <TouchableOpacity
        onPress={onSelect}
        activeOpacity={0.8}
        style={{
          width: 130, marginRight: 10,
          backgroundColor: colors.surface,
          borderRadius: 14, padding: 14,
          borderWidth: selected ? 1.5 : 1,
          borderColor: selected ? colors.primary : colors.border,
          alignItems: "center", justifyContent: "center",
          height: 150,
        }}
      >
        {/* Badge "Gratuit" — l'entrée sans table n'implique aucun paiement. */}
        <View style={{
          position: "absolute", top: 6, right: 6,
          backgroundColor: "rgba(74,222,128,0.18)",
          borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2,
        }}>
          <Text style={{ fontSize: 9, fontWeight: "800", color: colors.success }}>
            {t("booking.freeBadge")}
          </Text>
        </View>
        <Ionicons name="shuffle-outline" size={28} color={selected ? colors.primary : colors.muted} style={{ marginBottom: 8 }} />
        <Text style={{ color: selected ? colors.primary : colors.foreground, fontWeight: "700", fontSize: 12, textAlign: "center" }}>
          {t("booking.noPreference")}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 10, textAlign: "center", marginTop: 4 }}>
          {t("booking.noPreferenceDesc")}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onSelect}
      activeOpacity={0.8}
      style={{
        width: 160, marginRight: 10,
        backgroundColor: colors.surface,
        borderRadius: 14, overflow: "hidden",
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? colors.primary : colors.border,
        height: 195,
      }}
    >
      {/* Photo */}
      <View style={{ height: 90, position: "relative" }}>
        {table.photo_url ? (
          <Image
            source={{ uri: table.photo_url }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="image-outline" size={28} color={colors.muted} />
          </View>
        )}
        {table.is_vip && (
          <View style={{
            position: "absolute", top: 6, right: 6,
            backgroundColor: "rgba(10,14,19,0.55)",
            borderWidth: 1, borderColor: colors.primary,
            borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2,
          }}>
            <Text style={{ fontSize: 9, fontWeight: "800", color: colors.primary }}>VIP</Text>
          </View>
        )}
        {selected && (
          <View style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(212,175,55,0.15)",
            alignItems: "center", justifyContent: "center",
          }}>
            <Ionicons name="checkmark-circle" size={26} color={colors.primary} />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={{ padding: 10, gap: 3 }}>
        <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 12 }} numberOfLines={1}>
          {table.name}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Ionicons name="people-outline" size={11} color={colors.muted} />
          <Text style={{ color: colors.muted, fontSize: 10 }}>
            {table.capacity_min}–{table.capacity_max} guests
          </Text>
        </View>
        <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 11, marginTop: 2 }}>
          From €{table.price_min.toLocaleString()}
        </Text>
        {table.description && (
          <Text style={{ color: colors.muted, fontSize: 9, lineHeight: 13, marginTop: 2 }} numberOfLines={2}>
            {table.description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Main screen ────────────────────────────────────────────────────
export default function BookingScreen() {
  const { t } = useTranslation();
  const {
    venueId,
    venueUuid:     venueUuidParam,
    venueName:     venueNameParam,
    venueCategory: venueCategoryParam,
    venueEmail:    venueEmailParam,
    venueWhatsapp: venueWhatsappParam,
  } = useLocalSearchParams<{
    venueId: string;
    venueUuid?: string;
    venueName?: string;
    venueCategory?: string;
    venueEmail?: string;
    venueWhatsapp?: string;
  }>();
  const router = useRouter();
  const { isDemoMode } = useDemo();
  const { user } = useAuth();
  const colors = useColors();

  const cardStyle = {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  } as const;
  const labelStyle = {
    fontSize: 11,
    fontWeight: "700" as const,
    color: colors.muted,
    letterSpacing: 1,
    marginBottom: 8,
  };
  const inputStyle = { fontSize: 15, color: colors.foreground };
  const stepperBtn = {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  };

  // Table data
  const { data: supabaseTables, loading: tablesLoading } = useVenueTables(
    isDemoMode ? "" : (venueId ?? "")
  );
  const tables: VenueTable[] = isDemoMode ? (DEMO_TABLES as VenueTable[]) : supabaseTables;

  const [selectedTable, setSelectedTable] = useState<VenueTable | null | undefined>(undefined);
  // undefined = nothing selected yet, null = "no preference"

  const [date, setDate] = useState(() => toISODate(new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [time, setTime] = useState("19:00");
  const [guests, setGuests] = useState("2");
  const [notes, setNotes] = useState("");
  const [phone, setPhone] = useState("");
  // Choix de paiement : totalité ("full"), acompte 30% ("deposit") ou paiement
  // à l'établissement ("cash" — proposé seulement si la venue est abonnée).
  const [paymentOption, setPaymentOption] = useState<"full" | "deposit" | "cash">("full");
  // La venue accepte-t-elle le paiement sur place ? (abonnement partenaire actif)
  const [acceptsCash, setAcceptsCash] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Créneaux de disponibilité définis par l'établissement
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);

  // Réduction VIP de l'utilisateur (palier Instagram).
  const [vipDiscountPct, setVipDiscountPct] = useState(0);
  const [vipTierLabel, setVipTierLabel] = useState("");

  // Charge les créneaux disponibles pour le jour de la date choisie
  useEffect(() => {
    if (isDemoMode || !venueUuidParam || !date) { setSlots([]); setSelectedSlot(null); return; }
    const day = new Date(date).getDay(); // 0 = dimanche … 6 = samedi
    if (Number.isNaN(day)) { setSlots([]); return; }
    let cancelled = false;
    setSlotsLoading(true);
    getAvailableSlots(venueUuidParam, day)
      .then((s) => { if (!cancelled) { setSlots(s); setSelectedSlot(null); } })
      .catch(() => { if (!cancelled) setSlots([]); })
      .finally(() => { if (!cancelled) setSlotsLoading(false); });
    return () => { cancelled = true; };
  }, [venueUuidParam, date, isDemoMode]);

  // Fenêtre d'ouverture (slot_start/slot_end) de l'établissement.
  const [slotWindow, setSlotWindow] = useState<{ slot_start: string; slot_end: string } | null>(null);
  useEffect(() => {
    if (isDemoMode || !venueUuidParam) { setSlotWindow(null); return; }
    let cancelled = false;
    getVenueSlotWindow(venueUuidParam)
      .then((w) => { if (!cancelled && w) { setSlotWindow(w); setTime(w.slot_start); } })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [venueUuidParam, isDemoMode]);

  const hasSlotSystem = !isDemoMode && !!venueUuidParam;

  // N'affiche que les créneaux dans la fenêtre d'ouverture réelle
  // (ex. un club ouvrant à 23h ne propose pas de créneau à 19h).
  const windowSlots = slotWindow
    ? slots.filter((s) => inOpeningWindow(s.time, slotWindow.slot_start, slotWindow.slot_end))
    : slots;

  // La venue accepte le paiement sur place uniquement si elle a un abonnement
  // partenaire actif (vérifié via RPC SECURITY DEFINER — la RLS bloque la lecture
  // directe de partner_subscriptions côté client). En démo : toujours proposé.
  useEffect(() => {
    if (isDemoMode) { setAcceptsCash(true); return; }
    if (!venueUuidParam) { setAcceptsCash(false); return; }
    let cancelled = false;
    venueAcceptsCash(venueUuidParam)
      .then((ok) => { if (!cancelled) setAcceptsCash(ok); })
      .catch(() => { if (!cancelled) setAcceptsCash(false); });
    return () => { cancelled = true; };
  }, [venueUuidParam, isDemoMode]);

  // Charge la réduction VIP de l'utilisateur (palier Instagram).
  useEffect(() => {
    if (isDemoMode || !user?.id) return;
    let cancelled = false;
    getUserVipStatus(user.id)
      .then((s) => { if (!cancelled) { setVipDiscountPct(s.discount_pct); setVipTierLabel(s.tier.label); } })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user?.id, isDemoMode]);

  // Montant à payer : uniquement si une table est sélectionnée (price_min).
  // Sans table → amountCents null → réservation "pending" sans paiement Stripe.
  const priceEur: number | null = selectedTable ? selectedTable.price_min : null;
  const baseCents: number | null =
    priceEur != null && priceEur > 0 ? Math.round(priceEur * 100) : null;
  // Réduction VIP appliquée automatiquement au montant facturé.
  const amountCents: number | null =
    baseCents != null
      ? (vipDiscountPct > 0 ? Math.round(baseCents * (1 - vipDiscountPct / 100)) : baseCents)
      : null;
  const payable = amountCents != null;
  // Paiement sur place ("cash") : seulement si la venue est abonnée ET que le
  // client l'a choisi. Robuste si l'abonnement disparaît (acceptsCash repasse à
  // false → on retombe sur un paiement carte).
  const isCash = acceptsCash && paymentOption === "cash";
  // Paiement Stripe uniquement si un montant est dû ET que ce n'est pas du cash.
  const useStripeCheckout = payable && !isCash;

  // Acompte = 30% du total. Si l'option "deposit" est choisie, c'est ce montant
  // qui est encaissé en ligne ; le solde (70%) est réglé sur place à la venue.
  const DEPOSIT_RATE = 0.30;
  const depositCents: number | null =
    amountCents != null ? Math.round(amountCents * DEPOSIT_RATE) : null;
  const isDeposit = useStripeCheckout && paymentOption === "deposit";
  // Montant réellement encaissé en ligne (acompte ou totalité).
  const chargeCents: number | null =
    amountCents == null ? null : (isDeposit ? depositCents : amountCents);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  };

  const handleConfirmBooking = async () => {
    if (isSubmitting) return;

    // Phone number is required before confirming
    if (!phone.trim()) {
      if (Platform.OS === "web") window.alert(t("booking.phoneRequired"));
      else Alert.alert(t("booking.phoneRequired"));
      return;
    }

    // La date ne peut pas être dans le passé
    if (isPastDate(date)) {
      const msg = t("booking.dateInPast");
      if (Platform.OS === "web") window.alert(msg); else Alert.alert(msg);
      return;
    }

    // Authentification requise : on autorise la simulation (table, date, créneau…)
    // sans compte, mais la confirmation exige une session. Sans session → on
    // redirige vers l'écran de connexion (avant de réserver le moindre créneau).
    {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!(authUser?.id ?? user?.id)) {
        router.push("/login");
        return;
      }
    }

    // Si l'établissement gère des créneaux, il faut en choisir un disponible
    if (hasSlotSystem && windowSlots.length > 0 && !selectedSlot) {
      const msg = t("booking.selectSlotRequired");
      if (Platform.OS === "web") window.alert(msg); else Alert.alert(msg);
      return;
    }

    setIsSubmitting(true);

    // Réserve la place sur le créneau (incrément atomique). Si complet → stop.
    if (selectedSlot) {
      try {
        const ok = await bookSlot(selectedSlot.id);
        if (!ok) {
          const msg = t("booking.slotFull");
          if (Platform.OS === "web") window.alert(msg); else Alert.alert(msg);
          setSlots((prev) => prev.filter((s) => s.id !== selectedSlot.id)); // disparaît
          setSelectedSlot(null);
          setIsSubmitting(false);
          return;
        }
      } catch (e: any) {
        console.warn("[booking] bookSlot failed:", e?.message);
      }
    }

    // Generate confirmation number once, share between navigation + email
    const confirmNum = `MSS-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    const resolvedVenueName = venueNameParam || venueId || "Exclusive Venue";

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const userId = authUser?.id ?? user?.id ?? null;

      if (!userId) {
        // Session perdue entre-temps → libère le créneau et renvoie vers /login.
        if (selectedSlot) releaseSlot(selectedSlot.id).catch(() => {});
        setIsSubmitting(false);
        router.push("/login");
        return;
      }

      const created = await createBooking({
        user_id:             userId,
        venue_id:            venueUuidParam     || null,
        venue_name:          resolvedVenueName,
        venue_slug:          venueId            || null,
        venue_category:      venueCategoryParam || null,
        date,
        time,
        guests:              parseInt(guests) || 1,
        table_id:            selectedTable?.id        ?? null,
        table_name:          selectedTable?.name      ?? null,
        table_price:         selectedTable?.price_min ?? null,
        notes:               notes || null,
        phone_number:        phone.trim(),
        user_email:          authUser?.email ?? user?.email ?? null,
        user_name:           user?.name || (authUser?.email ?? user?.email ?? "").split("@")[0] || null,
        status:              "pending",
        payment_method:      isCash ? "cash" : "card",
        confirmation_number: confirmNum,
        slot_id:             selectedSlot?.id ?? null,
        // Acompte : trace le type de paiement choisi. deposit_amount en euros.
        deposit_only:        isDeposit,
        deposit_amount:      isDeposit && depositCents != null ? depositCents / 100 : null,
      });

      // Notification "étape 1" (demande reçue · sous 2h) à la CRÉATION uniquement
      // pour les réservations sans paiement carte en ligne : cash ou entrée
      // gratuite (!useStripeCheckout). Pour la carte, c'est le webhook Stripe qui
      // déclenche l'étape 1 APRÈS le paiement (sinon on notifierait trop tôt).
      if (user?.email && !useStripeCheckout) {
        supabase.functions.invoke("booking-notification", {
          body: {
            userId,
            userEmail:          user.email,
            userName:           user.name || user.email.split("@")[0],
            venueName:          resolvedVenueName,
            venueEmail:         venueEmailParam    || undefined,
            venueWhatsapp:      venueWhatsappParam || undefined,
            date,
            time,
            guests,
            tableName:          selectedTable?.name  ?? undefined,
            tablePrice:         selectedTable ? String(selectedTable.price_min) : undefined,
            notes:              notes || undefined,
            userPhone:          phone.trim(),
            confirmationNumber: confirmNum,
          },
        }).catch((e) => console.warn("[booking] notification email failed:", e?.message));
      }

      if (useStripeCheckout && chargeCents && amountCents) {
        // ── Paiement Stripe Checkout ─────────────────────────────────
        // Crée la session côté serveur puis redirige vers la page Stripe.
        // (Au retour, success_url renvoie vers /booking-confirmation ; le
        //  webhook confirme la réservation après paiement.)
        // amount = montant encaissé (acompte ou totalité) ; totalAmount = total
        // de la réservation → la commission plateforme reste 10% du TOTAL.
        const { data: checkout, error: checkoutErr } = await supabase.functions.invoke(
          "create-checkout-session",
          {
            body: {
              bookingId:   created.id,
              venueId:     venueUuidParam || venueId,
              amount:      chargeCents,  // montant encaissé en ligne (centimes)
              totalAmount: amountCents,  // total de la réservation (centimes)
              depositOnly: isDeposit,
              currency:    "eur",
            },
          },
        );
        const checkoutUrl = (checkout as { url?: string } | null)?.url;
        if (checkoutErr || !checkoutUrl) {
          throw new Error(checkoutErr?.message ?? "URL de paiement indisponible");
        }
        if (Platform.OS === "web") {
          // La redirection externe vers Stripe puis le retour rechargent la page :
          // on sauvegarde la session pour pouvoir la restaurer sur l'écran de
          // confirmation (sinon la lecture RLS de la réservation échoue).
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token && session?.refresh_token) {
              window.localStorage.setItem(
                "marbellapp_session_backup",
                JSON.stringify({ access_token: session.access_token, refresh_token: session.refresh_token }),
              );
            }
          } catch { /* best-effort */ }
          window.location.href = checkoutUrl;
        } else {
          await Linking.openURL(checkoutUrl);
        }
        // Redirection en cours — réservation "pending" jusqu'au paiement.
      } else {
        // Pas de paiement Stripe : soit aucun prix en base, soit le client a
        // choisi de régler à l'établissement → réservation "pending" + cash.
        router.push({
          pathname: "/booking-confirmation",
          params: {
            venueId,
            venueName:  resolvedVenueName,
            date,
            time,
            guests,
            tableId:    selectedTable?.id   ?? "",
            tableName:  selectedTable?.name ?? "",
            tablePrice: selectedTable ? String(selectedTable.price_min) : "",
            confirmationNumber: confirmNum,
            paymentMethod: isCash ? "cash" : "card",
          },
        });
      }
    } catch (e: any) {
      // Échec d'enregistrement OU d'ouverture du paiement → libère le créneau
      if (selectedSlot) releaseSlot(selectedSlot.id).catch(() => {});
      console.warn("[booking] confirm/checkout failed:", e?.message);
      const msg = t("booking.saveFailed");
      if (Platform.OS === "web") window.alert(msg); else Alert.alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Adjust guests when table selected to respect capacity
  const handleSelectTable = (table: VenueTable | null) => {
    setSelectedTable(table);
    if (table) {
      const g = parseInt(guests);
      if (g < table.capacity_min) setGuests(String(table.capacity_min));
      if (g > table.capacity_max) setGuests(String(table.capacity_max));
    }
  };

  return (
    <ScreenContainer className="px-6">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={{ marginBottom: 20, paddingTop: 4 }}>
          <TouchableOpacity onPress={goBack} activeOpacity={0.6} style={{ marginBottom: 16, alignSelf: "flex-start" }}>
            <Text style={{ color: colors.muted, fontSize: 15, fontWeight: "600" }}>{t("common.back")}</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 28, fontWeight: "800", color: colors.foreground }}>{t("booking.title")}</Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 6 }}>{t("booking.subtitle")}</Text>
        </View>

        {/* ── Table Selection ─────────────────────────────────────── */}
        <View style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: colors.muted, letterSpacing: 1 }}>
              {t("booking.selectTable")}
            </Text>
            {selectedTable !== undefined && (
              <TouchableOpacity onPress={() => setSelectedTable(undefined)}>
                <Text style={{ fontSize: 11, color: colors.muted }}>{t("booking.clearTable")}</Text>
              </TouchableOpacity>
            )}
          </View>

          {tablesLoading && !isDemoMode ? (
            <View style={{ height: 195, justifyContent: "center", alignItems: "center" }}>
              <ActivityIndicator color={colors.muted} />
            </View>
          ) : (
            <FlatList
              data={[null, ...tables] as (VenueTable | null)[]}
              keyExtractor={(item) => item?.id ?? "no-pref"}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 6 }}
              renderItem={({ item }) => (
                <TableCard
                  table={item}
                  selected={
                    item === null
                      ? selectedTable === null
                      : selectedTable?.id === item?.id
                  }
                  onSelect={() => handleSelectTable(item)}
                />
              )}
            />
          )}

          {/* Selected table summary */}
          {selectedTable !== undefined && selectedTable !== null && (
            <View style={{
              marginTop: 10, backgroundColor: colors.surface,
              borderRadius: 12, padding: 12,
              borderWidth: 1, borderColor: colors.border,
              flexDirection: "row", alignItems: "center", gap: 10,
            }}>
              <Ionicons name="restaurant-outline" size={18} color={colors.muted} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 13 }}>
                  {selectedTable.name}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                  <Ionicons name="people-outline" size={11} color={colors.muted} />
                  <Text style={{ color: colors.muted, fontSize: 11 }}>
                    {selectedTable.capacity_min}–{selectedTable.capacity_max} guests · From €{selectedTable.price_min.toLocaleString()}
                  </Text>
                </View>
              </View>
              {selectedTable.is_vip && (
                <View style={{ backgroundColor: "rgba(10,14,19,0.55)", borderWidth: 1, borderColor: colors.primary, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ fontSize: 10, color: colors.primary, fontWeight: "700" }}>VIP</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* ── Date ────────────────────────────────────────────────── */}
        <View style={cardStyle}>
          <Text style={labelStyle}>{t("booking.date")}</Text>
          {Platform.OS === "web" ? (
            // Sélecteur natif du navigateur (le picker RN ne gère pas le web).
            // `min` empêche déjà la sélection d'une date passée côté UI.
            <input
              type="date"
              value={date}
              min={toISODate(new Date())}
              onChange={(e: any) => setDate(e.target.value)}
              style={{
                fontSize: 15,
                color: colors.foreground,
                background: "transparent",
                border: "none",
                outline: "none",
                colorScheme: "dark",
                width: "100%",
              }}
            />
          ) : (
            <>
              <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
                <Text style={{ fontSize: 15, color: colors.foreground }}>{formatDisplayDate(date)}</Text>
              </TouchableOpacity>
              {showDatePicker && DateTimePicker && (
                <DateTimePicker
                  value={parseISODate(date)}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={(event: any, selected?: Date) => {
                    setShowDatePicker(false);
                    if (event?.type === "dismissed") return;
                    if (selected) setDate(toISODate(selected));
                  }}
                />
              )}
            </>
          )}
        </View>

        {/* ── Créneaux disponibles (si l'établissement en définit) ── */}
        {hasSlotSystem && (
          <View style={cardStyle}>
            <Text style={labelStyle}>{t("booking.availableSlots")}</Text>
            {slotsLoading ? (
              <View style={{ height: 44, justifyContent: "center" }}>
                <ActivityIndicator color={colors.muted} />
              </View>
            ) : windowSlots.length === 0 ? (
              <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 18 }}>
                {t("booking.noSlots")}
              </Text>
            ) : (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 2 }}>
                {windowSlots.map((s) => {
                  const sel = selectedSlot?.id === s.id;
                  const left = s.max_capacity - s.current_bookings;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      onPress={() => { setSelectedSlot(s); setTime(s.time); }}
                      activeOpacity={0.8}
                      style={{
                        paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
                        backgroundColor: sel ? colors.primary : colors.surface,
                        borderWidth: 1, borderColor: sel ? colors.primary : colors.border,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: sel ? colors.onPrimary : colors.foreground, fontWeight: "800", fontSize: 14 }}>{s.time}</Text>
                      <Text style={{ color: sel ? colors.onPrimary : colors.muted, fontSize: 9, marginTop: 2 }}>
                        {left} {t("booking.slotsLeft")}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ── Time (saisie libre — si pas de système de créneaux) ──── */}
        {(!hasSlotSystem || windowSlots.length === 0) && (
          <View style={cardStyle}>
            <Text style={labelStyle}>{t("booking.time")}</Text>
            <TextInput
              value={time}
              onChangeText={setTime}
              placeholder="HH:MM"
              placeholderTextColor={colors.muted}
              style={inputStyle}
            />
          </View>
        )}

        {/* ── Guests ──────────────────────────────────────────────── */}
        <View style={cardStyle}>
          <Text style={labelStyle}>{t("booking.guests")}</Text>
          {selectedTable && (
            <Text style={{ fontSize: 10, color: colors.muted, marginBottom: 8 }}>
              {selectedTable.capacity_min}–{selectedTable.capacity_max} guests for {selectedTable.name}
            </Text>
          )}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginTop: 4 }}>
            <TouchableOpacity
              onPress={() => {
                const min = selectedTable?.capacity_min ?? 1;
                setGuests(String(Math.max(min, parseInt(guests) - 1)));
              }}
              activeOpacity={0.8}
              style={stepperBtn}
            >
              <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: "700", lineHeight: 24 }}>−</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, flex: 1, textAlign: "center" }}>
              {guests}
            </Text>
            <TouchableOpacity
              onPress={() => {
                const max = selectedTable?.capacity_max ?? 99;
                setGuests(String(Math.min(max, parseInt(guests) + 1)));
              }}
              activeOpacity={0.8}
              style={stepperBtn}
            >
              <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: "700", lineHeight: 24 }}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Phone (required) ────────────────────────────────────── */}
        <View style={cardStyle}>
          <Text style={labelStyle}>
            {t("booking.phone")} <Text style={{ color: colors.primary }}>*</Text>
          </Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder={t("booking.phonePlaceholder")}
            placeholderTextColor={colors.muted}
            keyboardType="phone-pad"
            style={inputStyle}
          />
        </View>

        {/* ── Notes ───────────────────────────────────────────────── */}
        <View style={cardStyle}>
          <Text style={labelStyle}>{t("booking.notes")}</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder={t("booking.notesPlaceholder")}
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={3}
            style={[inputStyle, { height: 80, textAlignVertical: "top" }]}
          />
        </View>

        {/* ── Total à payer ───────────────────────────────────────── */}
        <View style={[cardStyle, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
          <View style={{ flex: 1 }}>
            <Text style={labelStyle}>{t("booking.total") || "TOTAL À PAYER"}</Text>
            <Text style={{ fontSize: 11, color: colors.muted }}>
              {isCash
                ? "Paiement à l'établissement"
                : (payable && selectedTable ? `Table · ${selectedTable.name}` : "Paiement non requis")}
            </Text>
            {!isCash && baseCents != null && vipDiscountPct > 0 ? (
              <Text style={{ fontSize: 11, color: colors.success, fontWeight: "700", marginTop: 4 }}>
                Réduction VIP {vipTierLabel} −{vipDiscountPct}%
              </Text>
            ) : null}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            {!isCash && baseCents != null && vipDiscountPct > 0 ? (
              <Text style={{ fontSize: 12, color: colors.muted, textDecorationLine: "line-through" }}>
                {formatEur(baseCents)}
              </Text>
            ) : null}
            <Text style={{ fontSize: 22, fontWeight: "800", color: colors.primary }}>
              {isCash ? "Sur place" : (amountCents != null ? formatEur(amountCents) : "Prix sur demande")}
            </Text>
          </View>
        </View>

        {/* ── Options de paiement ─────────────────────────────────── */}
        {payable && amountCents != null && depositCents != null && (
          <View style={{ marginBottom: 16 }}>
            <Text style={[labelStyle, { marginBottom: 10 }]}>{t("booking.paymentOptions")}</Text>

            {/* Option 1 — Payer la totalité */}
            <TouchableOpacity
              onPress={() => setPaymentOption("full")}
              activeOpacity={0.85}
              accessibilityRole="radio"
              accessibilityState={{ selected: paymentOption === "full" }}
              style={[cardStyle, {
                marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 12,
                borderColor: paymentOption === "full" ? colors.primary : colors.border,
                borderWidth: paymentOption === "full" ? 1.5 : 1,
              }]}
            >
              <Ionicons
                name={paymentOption === "full" ? "radio-button-on" : "radio-button-off"}
                size={20}
                color={paymentOption === "full" ? colors.primary : colors.muted}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
                  {t("booking.payFull")}
                </Text>
                <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                  {t("booking.payNow")}
                </Text>
              </View>
              <Text style={{ fontSize: 16, fontWeight: "800", color: colors.primary }}>
                {formatEur(amountCents)}
              </Text>
            </TouchableOpacity>

            {/* Option 2 — Payer un acompte (30%) */}
            <TouchableOpacity
              onPress={() => setPaymentOption("deposit")}
              activeOpacity={0.85}
              accessibilityRole="radio"
              accessibilityState={{ selected: paymentOption === "deposit" }}
              style={[cardStyle, {
                marginBottom: acceptsCash ? 10 : 0,
                borderColor: paymentOption === "deposit" ? colors.primary : colors.border,
                borderWidth: paymentOption === "deposit" ? 1.5 : 1,
              }]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Ionicons
                  name={paymentOption === "deposit" ? "radio-button-on" : "radio-button-off"}
                  size={20}
                  color={paymentOption === "deposit" ? colors.primary : colors.muted}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
                    {t("booking.payDeposit")}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                    {t("booking.depositInfo")}
                  </Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: "800", color: colors.primary }}>
                  {formatEur(depositCents)}
                </Text>
              </View>
              <Text style={{ fontSize: 11, color: colors.error, fontWeight: "600", marginTop: 8 }}>
                ⚠️ {t("booking.depositNonRefundable")}
              </Text>
            </TouchableOpacity>

            {/* Option 3 — Payer à l'établissement (cash) — venues abonnées only */}
            {acceptsCash && (
              <TouchableOpacity
                onPress={() => setPaymentOption("cash")}
                activeOpacity={0.85}
                accessibilityRole="radio"
                accessibilityState={{ selected: paymentOption === "cash" }}
                style={[cardStyle, {
                  marginTop: 10, marginBottom: 0, flexDirection: "row", alignItems: "center", gap: 12,
                  borderColor: paymentOption === "cash" ? colors.primary : colors.border,
                  borderWidth: paymentOption === "cash" ? 1.5 : 1,
                }]}
              >
                <Ionicons
                  name={paymentOption === "cash" ? "radio-button-on" : "radio-button-off"}
                  size={20}
                  color={paymentOption === "cash" ? colors.primary : colors.muted}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
                    {t("booking.payAtVenue")}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                    {t("booking.payAtVenueDesc")}
                  </Text>
                </View>
                {/* Rien n'est encaissé en ligne pour un paiement sur place. */}
                <Text style={{ fontSize: 14, fontWeight: "800", color: colors.muted }}>—</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Terms ───────────────────────────────────────────────── */}
        <View style={[cardStyle, { marginBottom: 28 }]}>
          <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 18 }}>{t("booking.terms")}</Text>
        </View>

        {/* ── Confirm & pay ───────────────────────────────────────── */}
        <TouchableOpacity
          onPress={handleConfirmBooking}
          disabled={isSubmitting}
          activeOpacity={0.8}
          style={{
            backgroundColor: isSubmitting ? colors.muted : colors.primary,
            borderRadius: 50, paddingVertical: 16,
            alignItems: "center", marginBottom: 32,
          }}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={{ color: colors.onPrimary, fontWeight: "800", fontSize: 16 }}>
              {useStripeCheckout && chargeCents != null
                ? `${t("booking.confirmAndPay") || "Confirmer et payer"} · ${formatEur(chargeCents)}`
                : (t("booking.confirmBtn") || "Confirmer la réservation")}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
