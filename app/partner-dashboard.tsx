import { useState, useEffect, useCallback } from "react";
import { ScrollView, Text, View, TouchableOpacity, FlatList, TextInput, Switch, ActivityIndicator, Alert, Platform, Modal, Linking } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useTranslation } from "react-i18next";
import { useDemo } from "@/lib/demo-context";
import { Image } from "expo-image";
import {
  DEMO_PARTNER, DEMO_RESERVATIONS, DEMO_VIP_OFFERS,
  DEMO_METRICS, DEMO_ACTIVITY, DEMO_MONTHLY, DEMO_TOP_OFFERS, DEMO_TABLES,
} from "@/constants/demo-data";
import type { VenueTable } from "@/lib/tables-service";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { getManagedBookings, updateBookingStatus, updateBookingSchedule } from "@/lib/bookings-service";
import { getAllVenuesBasic, getManagedVenues, updateVenueSlotConfig, type VenueBasic } from "@/lib/venues-service";
import {
  getVenueTablesByUUID, createVenueTable, toggleTableActive, deleteVenueTable,
} from "@/lib/tables-service";
import {
  getVenueOffers, createVenueOffer, toggleVenueOffer, deleteVenueOffer,
  type VipOffer, type OfferType,
} from "@/lib/offers-service";
import {
  getOwnerVenues, uploadCover, removeCover, uploadGalleryPhoto, removeGalleryPhoto,
  type OwnerVenue,
} from "@/lib/venue-photos-service";
import { getPendingPosts, approvePost, rejectPost, type PendingPost } from "@/lib/vip-service";
import * as ImagePicker from "expo-image-picker";
import { decode as decodeBase64 } from "base64-arraybuffer";
import {
  getVenueSlots, createSlots, toggleSlot, releaseSlot, type AvailabilitySlot,
} from "@/lib/availability-service";
import {
  getAdminClients, getBookingsThisMonthCount, getClientBookings,
  type AdminClient, type ClientBooking,
} from "@/lib/clients-service";

type Tab = "overview" | "reservations" | "availability" | "tables" | "offers" | "photos" | "stats" | "clients" | "vip-posts";
type IoniconName = keyof typeof Ionicons.glyphMap;

// Resolves the emoji icons coming from demo-data / metric arrays to the
// Ionicons line family, so the dashboard shares the app-wide icon system.
const EMOJI_TO_ICON: Record<string, IoniconName> = {
  "📋": "list-outline", "💰": "cash-outline", "📸": "camera-outline",
  "⭐": "star-outline", "👑": "ribbon-outline", "📅": "calendar-outline",
  "🕐": "time-outline", "📈": "trending-up-outline", "📊": "stats-chart-outline",
  "👥": "people-outline", "🆕": "sparkles-outline", "⚡": "flash-outline",
  "🪑": "restaurant-outline", "📷": "camera-outline", "🏢": "business-outline",
};
const iconFor = (e?: string): IoniconName => EMOJI_TO_ICON[e ?? ""] ?? "ellipse-outline";

// ─────────────────────────────────────────────────────────────────────────────
// Overview Tab
// ─────────────────────────────────────────────────────────────────────────────
function OverviewTab({ colors, isDemo }: { colors: ReturnType<typeof useColors>; isDemo: boolean }) {
  const { t } = useTranslation();
  const metrics = isDemo
    ? [
        { label: t("partner.bookingsThisMonth"), value: DEMO_METRICS.bookingsThisMonth.value, icon: DEMO_METRICS.bookingsThisMonth.icon, trend: DEMO_METRICS.bookingsThisMonth.trend },
        { label: t("partner.vipRevenue"),        value: DEMO_METRICS.vipRevenue.value,        icon: DEMO_METRICS.vipRevenue.icon,        trend: DEMO_METRICS.vipRevenue.trend },
        { label: t("partner.instagramPosts"),    value: DEMO_METRICS.instagramPosts.value,    icon: DEMO_METRICS.instagramPosts.icon,    trend: DEMO_METRICS.instagramPosts.trend },
        { label: t("partner.avgRating"),         value: DEMO_METRICS.avgRating.value,         icon: DEMO_METRICS.avgRating.icon,         trend: DEMO_METRICS.avgRating.trend },
      ]
    : [
        { label: t("partner.bookingsThisMonth"), value: "12", icon: "📋", trend: "+3%" },
        { label: t("partner.vipRevenue"),        value: "€4.2K", icon: "💰", trend: "+8%" },
        { label: t("partner.instagramPosts"),    value: "5",  icon: "📸", trend: "+2" },
        { label: t("partner.avgRating"),         value: "4.5", icon: "⭐", trend: t("partner.trend.stable") },
      ];

  const activities = isDemo ? DEMO_ACTIVITY : [
    { msg: t("partner.activity1"), time: t("partner.ago2h"),    icon: "📋" },
    { msg: t("partner.activity2"), time: t("partner.ago4h"),    icon: "📸" },
    { msg: t("partner.activity3"), time: t("partner.yesterday"), icon: "💰" },
    { msg: t("partner.activity4"), time: t("partner.yesterday"), icon: "👑" },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 14 }}>{t("partner.month")}</Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        {metrics.map((m) => (
          <View key={m.label} style={{
            width: "47%", backgroundColor: colors.surface, borderRadius: 16,
            padding: 16, borderWidth: 1, borderColor: colors.border,
          }}>
            <Ionicons name={iconFor(m.icon)} size={22} color={colors.muted} />
            <Text style={{ fontSize: 22, fontWeight: "800", color: colors.foreground, marginTop: 8 }}>{m.value}</Text>
            <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{m.label}</Text>
            <Text style={{ fontSize: 11, color: colors.success, marginTop: 4, fontWeight: "600" }}>{m.trend}</Text>
          </View>
        ))}
      </View>

      <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
        {t("partner.recentActivity")}
      </Text>
      {activities.map((a, i) => (
        <View key={i} style={{
          flexDirection: "row", alignItems: "center", backgroundColor: colors.surface,
          borderRadius: 12, padding: 12, marginBottom: 8,
          borderWidth: 1, borderColor: colors.border, gap: 12,
        }}>
          <Ionicons name={iconFor(a.icon)} size={20} color={colors.muted} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, color: colors.foreground }}>{a.msg}</Text>
            <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{a.time}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Reservations Tab
// ─────────────────────────────────────────────────────────────────────────────
type PartnerRow = {
  id: string;
  guestName: string;
  date: string;
  time: string;
  guests: number;
  detail: string;
  status: string;
  userId?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  phone?: string | null;
  venueName?: string;
  tableName?: string | null;
  tablePrice?: number | null;
  confirmationNumber?: string | null;
  slotId?: string | null;
};

function ReservationsTab({ colors, isDemo }: { colors: ReturnType<typeof useColors>; isDemo: boolean }) {
  const { t } = useTranslation();

  const statusColors: Record<string, string> = {
    confirmed: colors.success,
    pending:   colors.warning,
    cancelled: colors.error,
    completed: colors.primary,
  };
  const statusLabel = (s: string) => ({
    confirmed: t("partner.confirmed"),
    pending:   t("partner.pending"),
    cancelled: t("partner.cancelled"),
  }[s] ?? s);

  const [rows, setRows]       = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(!isDemo);
  const [error, setError]     = useState<string | null>(null);
  // Verrou PAR ligne : chaque réservation a son propre état "en cours" — agir
  // sur une réservation ne bloque jamais les boutons des autres.
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  // Édition de la date/heure (une seule réservation éditée à la fois).
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate]   = useState("");
  const [editTime, setEditTime]   = useState("");

  const load = useCallback(async () => {
    if (isDemo) {
      setRows(DEMO_RESERVATIONS.map((r) => ({
        id: r.id, guestName: r.guest, date: r.date, time: r.time,
        guests: r.guests, detail: r.type, status: r.status,
      })));
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // ── Vérifie qu'une session authentifiée est bien attachée ──────
      // Sans session, le client utilise la clé anon (auth.uid() = null) et
      // la RLS "Partners view all" renvoie 0 ligne → dashboard vide.
      const { data: { session } } = await supabase.auth.getSession();
      console.warn("[partner] session uid:", session?.user?.id ?? "NONE (anon — pas de session)");
      if (!session) {
        setRows([]);
        setError(t("partner.noSession") || "Aucune session authentifiée — connecte-toi avec le compte admin/partner pour voir les réservations.");
        setLoading(false);
        return;
      }

      const data = await getManagedBookings();
      console.warn(`[partner] ${data.length} réservation(s) chargée(s) en tant que ${session.user.id}`);
      setRows(data.map((b) => ({
        id: b.id,
        guestName: b.user_name ?? "Client",
        date: b.date,
        time: b.time,
        guests: b.guests,
        detail: b.table_name ?? b.venue_name,
        status: b.status,
        userId: b.user_id,
        userEmail: b.user_email,
        userName: b.user_name,
        phone: b.phone_number,
        venueName: b.venue_name,
        tableName: b.table_name,
        tablePrice: b.table_price,
        confirmationNumber: b.confirmation_number,
        slotId: b.slot_id,
      })));
    } catch (e: any) {
      setError(e.message ?? "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [isDemo]);

  useEffect(() => { load(); }, [load]);
  // Recharge à chaque fois que le dashboard reprend le focus (nouvelles réservations)
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const notify = (msg: string) => {
    if (Platform.OS === "web") window.alert(msg);
    else Alert.alert(msg);
  };

  // Confirmation avant d'annuler une réservation DÉJÀ confirmée (évite les
  // clics accidentels : le client recevra un email d'annulation).
  const confirmRevoke = (): Promise<boolean> =>
    new Promise((resolve) => {
      const msg = t("partner.confirmCancel");
      if (Platform.OS === "web") { resolve(window.confirm(msg)); return; }
      Alert.alert(t("partner.cancelBooking"), msg, [
        { text: t("common.cancel"), style: "cancel", onPress: () => resolve(false) },
        { text: t("partner.cancelBooking"), style: "destructive", onPress: () => resolve(true) },
      ]);
    });

  const decide = async (row: PartnerRow, status: "confirmed" | "cancelled") => {
    console.warn(`[decide] clic → id=${row.id} owner=${row.userId} from=${row.status} → ${status}`);
    // Garde par ligne : on n'ignore que les double-clics sur CETTE réservation.
    if (busyIds.has(row.id)) { console.warn(`[decide] ignoré (déjà en cours) id=${row.id}`); return; }

    // Annulation d'une réservation confirmée → email d'excuses (type "revoked"),
    // refus d'une demande en attente → email "non confirmée" (type "cancelled").
    const isRevoke = status === "cancelled" && row.status === "confirmed";
    const emailType = isRevoke ? "revoked" : status;
    if (isRevoke) {
      const ok = await confirmRevoke();
      if (!ok) { console.warn(`[decide] annulation abandonnée id=${row.id}`); return; }
    }

    setBusyIds((s) => { const n = new Set(s); n.add(row.id); return n; });
    const prevStatus = row.status; // pour rollback ciblé sur cette seule ligne
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, status } : r))); // optimiste
    try {
      if (!isDemo) {
        await updateBookingStatus(row.id, status);
        console.warn(`[decide] OK id=${row.id} → ${status} (email=${emailType})`);
        // Annulation/refus → libère la place sur le créneau de disponibilité
        if (status === "cancelled" && row.slotId) {
          releaseSlot(row.slotId).catch((e) => console.warn("[decide] releaseSlot failed:", e?.message));
        }
        // Email au client (non bloquant) — confirmation / refus / annulation
        if (row.userEmail) {
          supabase.functions.invoke("booking-notification", {
            body: {
              type:               emailType,
              userId:             row.userId ?? undefined,
              userEmail:          row.userEmail,
              userName:           row.userName ?? row.guestName,
              venueName:          row.venueName ?? "",
              date:               row.date,
              time:               row.time,
              guests:             String(row.guests),
              tableName:          row.tableName ?? undefined,
              tablePrice:         row.tablePrice != null ? String(row.tablePrice) : undefined,
              confirmationNumber: row.confirmationNumber ?? undefined,
            },
          }).catch((e) => console.warn("[partner] notification email failed:", e?.message));
        }
      }
    } catch (e: any) {
      console.error(`[decide] ÉCHEC id=${row.id}:`, e?.message);
      // Rollback de la seule ligne concernée (pas de snapshot global)
      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, status: prevStatus } : r)));
      notify(e.message ?? "Échec de la mise à jour");
    } finally {
      setBusyIds((s) => { const n = new Set(s); n.delete(row.id); return n; });
    }
  };

  const startEdit = (row: PartnerRow) => {
    setEditingId(row.id);
    setEditDate(row.date ?? "");
    setEditTime(row.time ?? "");
  };
  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (row: PartnerRow) => {
    const newDate = editDate.trim();
    const newTime = editTime.trim();
    if (!newDate || !newTime) { notify(t("partner.editRequired")); return; }
    if (busyIds.has(row.id)) return;

    setBusyIds((s) => { const n = new Set(s); n.add(row.id); return n; });
    const prev = { date: row.date, time: row.time };
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, date: newDate, time: newTime } : r))); // optimiste
    setEditingId(null);
    try {
      if (!isDemo) {
        await updateBookingSchedule(row.id, newDate, newTime);
        // Email de reprogrammation au client (non bloquant) — expéditeur Marbell'app
        if (row.userEmail) {
          supabase.functions.invoke("booking-notification", {
            body: {
              type:               "rescheduled",
              userId:             row.userId ?? undefined,
              userEmail:          row.userEmail,
              userName:           row.userName ?? row.guestName,
              venueName:          row.venueName ?? "",
              date:               newDate,
              time:               newTime,
              guests:             String(row.guests),
              tableName:          row.tableName ?? undefined,
              tablePrice:         row.tablePrice != null ? String(row.tablePrice) : undefined,
              confirmationNumber: row.confirmationNumber ?? undefined,
            },
          }).catch((e) => console.warn("[partner] reschedule email failed:", e?.message));
        }
      }
    } catch (e: any) {
      console.error(`[saveEdit] ÉCHEC id=${row.id}:`, e?.message);
      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, date: prev.date, time: prev.time } : r))); // rollback
      notify(e.message ?? "Échec de la modification");
    } finally {
      setBusyIds((s) => { const n = new Set(s); n.delete(row.id); return n; });
    }
  };

  if (loading) {
    return (
      <View style={{ paddingVertical: 40, alignItems: "center" }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ paddingVertical: 40, alignItems: "center", gap: 8 }}>
        <Ionicons name="cloud-offline-outline" size={32} color={colors.muted} />
        <Text style={{ color: colors.muted, fontSize: 13, textAlign: "center" }}>{error}</Text>
        <TouchableOpacity onPress={load} accessibilityRole="button" accessibilityLabel={t("common.retry")}
          style={{ marginTop: 8, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.border }}>
          <Ionicons name="reload" size={14} color={colors.foreground} />
          <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 13 }}>{t("common.retry") || "Réessayer"}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const Field = ({ icon, label, value }: { icon: IoniconName; label: string; value: string }) => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
      <Ionicons name={icon} size={12} color={colors.muted} />
      <Text style={{ fontSize: 12, color: colors.muted }}>
        <Text style={{ color: colors.muted, fontWeight: "700" }}>{label}: </Text>{value}
      </Text>
    </View>
  );

  return (
    <FlatList
      data={rows}
      keyExtractor={(item) => item.id}
      extraData={`${editingId ?? ""}|${editDate}|${editTime}|${[...busyIds].join(",")}`}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
      ListHeaderComponent={
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <Text style={{ fontSize: 13, color: colors.muted }}>
            {rows.length} · {t("partner.tabReservations")}
          </Text>
          <TouchableOpacity onPress={load} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t("common.retry")} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
            <Ionicons name="reload" size={14} color={colors.muted} />
          </TouchableOpacity>
        </View>
      }
      ListEmptyComponent={
        <View style={{ paddingVertical: 40, alignItems: "center", gap: 8 }}>
          <Ionicons name="list-outline" size={32} color={colors.muted} />
          <Text style={{ color: colors.muted, fontSize: 13 }}>{t("partner.noReservations") || "Aucune réservation"}</Text>
          {!isDemo && (
            <Text style={{ color: colors.muted, fontSize: 11, textAlign: "center", paddingHorizontal: 24, marginTop: 4 }}>
              {t("partner.reservationsHint") || "Si vous attendez des réservations : vérifiez que votre compte a le rôle admin/partner (RLS)."}
            </Text>
          )}
        </View>
      }
      renderItem={({ item }) => (
        <View style={{
          backgroundColor: colors.surface, borderRadius: 14,
          padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border,
        }}>
          {/* En-tête : client + (modifier) + statut */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.foreground, flex: 1 }} numberOfLines={1}>
              {item.guestName}
            </Text>
            {(item.status === "pending" || item.status === "confirmed") && (
              <TouchableOpacity
                onPress={() => (editingId === item.id ? cancelEdit() : startEdit(item))}
                disabled={busyIds.has(item.id)}
                activeOpacity={0.7}
                style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}
              >
                {editingId === item.id ? (
                  <Ionicons name="close" size={14} color={colors.muted} />
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Ionicons name="create-outline" size={13} color={colors.foreground} />
                    <Text style={{ fontSize: 12, color: colors.foreground, fontWeight: "700" }}>{t("partner.edit")}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            <View style={{
              backgroundColor: `${statusColors[item.status] ?? colors.muted}20`,
              paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
            }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: statusColors[item.status] ?? colors.muted }}>
                {statusLabel(item.status)}
              </Text>
            </View>
          </View>

          {/* Venue */}
          {item.venueName ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
              <Ionicons name="location-outline" size={13} color={colors.muted} />
              <Text style={{ fontSize: 13, color: colors.foreground, fontWeight: "700" }}>{item.venueName}</Text>
            </View>
          ) : null}

          {/* Détails complets */}
          <View style={{ marginTop: 8 }}>
            <View style={{ flexDirection: "row", gap: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons name="calendar-outline" size={12} color={colors.muted} />
                <Text style={{ fontSize: 12, color: colors.muted }}>{item.date}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons name="time-outline" size={12} color={colors.muted} />
                <Text style={{ fontSize: 12, color: colors.muted }}>{item.time}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons name="people-outline" size={12} color={colors.muted} />
                <Text style={{ fontSize: 12, color: colors.muted }}>{item.guests} {t("partner.persons")}</Text>
              </View>
            </View>
            {item.phone ? <Field icon="call-outline" label="Tél" value={item.phone} /> : null}
            {item.userEmail ? <Field icon="mail-outline" label="Email" value={item.userEmail} /> : null}
            {item.tableName ? (
              <Field
                icon="restaurant-outline"
                label="Table"
                value={item.tableName + (item.tablePrice != null ? ` · From €${Number(item.tablePrice).toLocaleString()}` : "")}
              />
            ) : null}
            {item.confirmationNumber ? <Field icon="bookmark-outline" label="Réf" value={item.confirmationNumber} /> : null}
          </View>

          {/* Panneau d'édition date/heure */}
          {editingId === item.id && (
            <View style={{
              marginTop: 12, padding: 12, borderRadius: 12,
              backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, gap: 10,
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="calendar-outline" size={13} color={colors.primary} />
                <Text style={{ fontSize: 12, fontWeight: "700", color: colors.primary }}>{t("partner.edit")}</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ fontSize: 10, color: colors.muted, fontWeight: "600" }}>{t("partner.dateLabel")}</Text>
                  <TextInput
                    value={editDate}
                    onChangeText={setEditDate}
                    placeholder="2026-06-20"
                    placeholderTextColor={colors.muted}
                    autoCapitalize="none"
                    style={{ backgroundColor: colors.surface, color: colors.foreground, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9, fontSize: 13, borderWidth: 1, borderColor: colors.border }}
                  />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ fontSize: 10, color: colors.muted, fontWeight: "600" }}>{t("partner.timeLabel")}</Text>
                  <TextInput
                    value={editTime}
                    onChangeText={setEditTime}
                    placeholder="21:00"
                    placeholderTextColor={colors.muted}
                    autoCapitalize="none"
                    style={{ backgroundColor: colors.surface, color: colors.foreground, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9, fontSize: 13, borderWidth: 1, borderColor: colors.border }}
                  />
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  onPress={cancelEdit}
                  disabled={busyIds.has(item.id)}
                  activeOpacity={0.8}
                  style={{ flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: "center", borderWidth: 1, borderColor: colors.border }}
                >
                  <Text style={{ color: colors.muted, fontWeight: "700", fontSize: 13 }}>{t("common.cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => saveEdit(item)}
                  disabled={busyIds.has(item.id)}
                  activeOpacity={0.8}
                  style={{ flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: "center", backgroundColor: colors.primary, opacity: busyIds.has(item.id) ? 0.5 : 1 }}
                >
                  {busyIds.has(item.id)
                    ? <ActivityIndicator color={colors.onPrimary} size="small" />
                    : <Text style={{ color: colors.onPrimary, fontWeight: "800", fontSize: 13 }}>{t("partner.save")}</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Actions partenaire :
              · pending   → Confirmer + Refuser
              · confirmed → Annuler (email d'excuses au client) */}
          {(item.status === "pending" || item.status === "confirmed") && (() => {
            const busy = busyIds.has(item.id);
            return (
              <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                {item.status === "pending" && (
                  <TouchableOpacity
                    disabled={busy}
                    onPress={() => decide(item, "confirmed")}
                    activeOpacity={0.8}
                    style={{ flex: 1, backgroundColor: colors.success, borderRadius: 10, paddingVertical: 11, alignItems: "center", opacity: busy ? 0.5 : 1 }}
                  >
                    {busy
                      ? <ActivityIndicator color={colors.onPrimary} size="small" />
                      : <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Ionicons name="checkmark" size={15} color={colors.onPrimary} />
                          <Text style={{ color: colors.onPrimary, fontWeight: "800", fontSize: 13 }}>{t("partner.confirm")}</Text>
                        </View>}
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  disabled={busy}
                  onPress={() => decide(item, "cancelled")}
                  activeOpacity={0.8}
                  style={{ flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.error, borderRadius: 10, paddingVertical: 11, alignItems: "center", opacity: busy ? 0.5 : 1 }}
                >
                  {busy && item.status === "confirmed"
                    ? <ActivityIndicator color={colors.error} size="small" />
                    : <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Ionicons name="close" size={15} color={colors.error} />
                        <Text style={{ color: colors.error, fontWeight: "800", fontSize: 13 }}>
                          {item.status === "pending" ? t("partner.refuse") : t("partner.cancelBooking")}
                        </Text>
                      </View>}
                </TouchableOpacity>
              </View>
            );
          })()}
        </View>
      )}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Availability Tab — calendrier hebdo (créneaux 30 min, fenêtre par venue)
// ─────────────────────────────────────────────────────────────────────────────
const DAYS_ORDER = [1, 2, 3, 4, 5, 6, 0];                       // Lun → Dim (day_of_week)
const DAY_SHORT: Record<number, string> = { 0: "Dim", 1: "Lun", 2: "Mar", 3: "Mer", 4: "Jeu", 5: "Ven", 6: "Sam" };
const cellKey = (day: number, time: string) => `${day}-${time}`;

const toMin = (hhmm: string) => { const [h, m] = hhmm.split(":").map(Number); return (h || 0) * 60 + (m || 0); };
const fromMin = (mins: number) => {
  const x = ((mins % 1440) + 1440) % 1440;
  return `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`;
};
// Génère les créneaux toutes les 30 min entre start et end (end<=start ⇒ +1 jour)
function genTimes(start: string, end: string): string[] {
  const s = toMin(start);
  let e = toMin(end);
  if (e <= s) e += 1440;
  const out: string[] = [];
  for (let m = s; m < e; m += 30) out.push(fromMin(m));
  return out;
}

const DEMO_VENUE: VenueBasic = { id: "demo", name: DEMO_PARTNER.name, category: "Beach Club", slot_start: "10:00", slot_end: "00:00", default_capacity: 10 };
const DEMO_SLOTS: AvailabilitySlot[] = [
  { id: "ds1", venue_id: "demo", day_of_week: 5, time: "20:00", max_capacity: 12, current_bookings: 8, is_active: true, created_at: "" },
  { id: "ds2", venue_id: "demo", day_of_week: 5, time: "22:00", max_capacity: 12, current_bookings: 12, is_active: false, created_at: "" },
  { id: "ds3", venue_id: "demo", day_of_week: 6, time: "22:30", max_capacity: 16, current_bookings: 4, is_active: true, created_at: "" },
];

function AvailabilityTab({ colors, isDemo, isAdmin, userId }: { colors: ReturnType<typeof useColors>; isDemo: boolean; isAdmin: boolean; userId?: string }) {
  const { t } = useTranslation();
  const [venues, setVenues]   = useState<VenueBasic[]>([]);
  const [venueId, setVenueId] = useState<string | null>(null);
  const [original, setOriginal] = useState<Record<string, AvailabilitySlot>>({});
  const [overrides, setOverrides] = useState<Record<string, boolean>>({}); // toggles locaux
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  // Fenêtre horaire + capacité (éditables) de la venue sélectionnée
  const [start, setStart] = useState("10:00");
  const [end, setEnd]     = useState("00:00");
  const [capacity, setCapacity] = useState(10);
  const [cfgOrig, setCfgOrig] = useState({ start: "10:00", end: "00:00", capacity: 10 });

  const notify = (m: string) => { if (Platform.OS === "web") window.alert(m); else Alert.alert(m); };
  const selectedVenue = venues.find((v) => v.id === venueId);
  const times = genTimes(/^\d{1,2}:\d{2}$/.test(start) ? start : "10:00", /^\d{1,2}:\d{2}$/.test(end) ? end : "00:00");

  // Charge la liste des établissements (admin = tous)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (isDemo) { setVenues([DEMO_VENUE]); setVenueId(DEMO_VENUE.id); return; }
        // Admin → toutes les venues ; partenaire → uniquement les siennes (owner_id).
        const vs = isAdmin ? await getAllVenuesBasic() : await getManagedVenues(userId ?? "");
        if (cancelled) return;
        setVenues(vs);
        setVenueId((prev) => prev ?? vs[0]?.id ?? null);
      } catch (e: any) { notify(e.message ?? "Erreur de chargement des établissements"); }
    })();
    return () => { cancelled = true; };
  }, [isDemo, isAdmin, userId]);

  // (Re)charge créneaux + config quand la venue change
  useEffect(() => {
    if (!venueId) return;
    const v = venues.find((x) => x.id === venueId);
    if (v) {
      setStart(v.slot_start); setEnd(v.slot_end); setCapacity(v.default_capacity);
      setCfgOrig({ start: v.slot_start, end: v.slot_end, capacity: v.default_capacity });
    }
    let cancelled = false;
    setLoading(true);
    setOverrides({});
    (async () => {
      try {
        const slots = isDemo ? DEMO_SLOTS : await getVenueSlots(venueId);
        if (cancelled) return;
        const map: Record<string, AvailabilitySlot> = {};
        for (const s of slots) map[cellKey(s.day_of_week, s.time)] = s;
        setOriginal(map);
      } catch (e: any) { if (!cancelled) notify(e.message ?? "Erreur de chargement"); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [venueId, isDemo, venues]);

  // État effectif d'une cellule : override > slot existant > actif par défaut
  const isActive = (key: string): boolean => {
    if (key in overrides) return overrides[key];
    const s = original[key];
    return s ? s.is_active : true; // tout activé par défaut
  };

  const toggleCell = (day: number, time: string) => {
    const key = cellKey(day, time);
    setOverrides((prev) => ({ ...prev, [key]: !isActive(key) }));
  };

  // Y a-t-il des changements à sauvegarder ?
  const configChanged = start !== cfgOrig.start || end !== cfgOrig.end || capacity !== cfgOrig.capacity;
  const gridChanged = (() => {
    for (const time of times) {
      for (const d of DAYS_ORDER) {
        const key = cellKey(d, time);
        const eff = isActive(key);
        const s = original[key];
        if (s) { if (eff !== s.is_active) return true; }
        else if (eff) return true; // création
      }
    }
    return false;
  })();
  const dirty = configChanged || gridChanged;

  const save = async () => {
    if (isDemo) { notify("Mode démo — changements non persistés."); return; }
    if (!venueId) return;
    if (!/^\d{1,2}:\d{2}$/.test(start) || !/^\d{1,2}:\d{2}$/.test(end)) { notify(t("partner.slotTimeFormat")); return; }
    setSaving(true);
    try {
      // 1) Config venue (fenêtre + capacité)
      if (configChanged) {
        await updateVenueSlotConfig(venueId, { slot_start: start, slot_end: end, default_capacity: capacity });
        setCfgOrig({ start, end, capacity });
      }
      // 2) Diff de la grille
      const toCreate: { venue_id: string; day_of_week: number; time: string; max_capacity: number }[] = [];
      const toggles: Promise<unknown>[] = [];
      for (const time of times) {
        for (const d of DAYS_ORDER) {
          const key = cellKey(d, time);
          const eff = isActive(key);
          const s = original[key];
          if (s) { if (eff !== s.is_active) toggles.push(toggleSlot(s.id, eff)); }
          else if (eff) toCreate.push({ venue_id: venueId, day_of_week: d, time, max_capacity: capacity });
        }
      }
      await Promise.all([createSlots(toCreate), ...toggles]);
      // 3) Recharge l'état réel
      const slots = await getVenueSlots(venueId);
      const map: Record<string, AvailabilitySlot> = {};
      for (const s of slots) map[cellKey(s.day_of_week, s.time)] = s;
      setOriginal(map);
      setOverrides({});
      notify(t("partner.slotsSaved"));
    } catch (e: any) { notify(e.message ?? "Échec de la sauvegarde"); }
    finally { setSaving(false); }
  };

  const COL_W = 46;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Sélecteur d'établissement */}
      <Text style={{ fontSize: 10, color: colors.muted, fontWeight: "700", letterSpacing: 0.5, marginBottom: 8 }}>
        {t("partner.selectVenue")}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }} contentContainerStyle={{ gap: 8 }}>
        {venues.map((v) => {
          const sel = v.id === venueId;
          return (
            <TouchableOpacity key={v.id} onPress={() => setVenueId(v.id)} activeOpacity={0.8}
              style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 50, backgroundColor: sel ? colors.primary : colors.surface, borderWidth: 1, borderColor: sel ? colors.primary : colors.border }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: sel ? colors.onPrimary : colors.foreground }} numberOfLines={1}>{v.name}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Fenêtre horaire + capacité */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 9, color: colors.muted, fontWeight: "700", marginBottom: 3 }}>{t("partner.slotStart")}</Text>
          <TextInput value={start} onChangeText={setStart} placeholder="10:00" placeholderTextColor={colors.muted}
            style={{ backgroundColor: colors.surface, color: colors.foreground, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 8, fontSize: 13, borderWidth: 1, borderColor: colors.border, textAlign: "center" }} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 9, color: colors.muted, fontWeight: "700", marginBottom: 3 }}>{t("partner.slotEnd")}</Text>
          <TextInput value={end} onChangeText={setEnd} placeholder="00:00" placeholderTextColor={colors.muted}
            style={{ backgroundColor: colors.surface, color: colors.foreground, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 8, fontSize: 13, borderWidth: 1, borderColor: colors.border, textAlign: "center" }} />
        </View>
        <View style={{ flex: 1.1 }}>
          <Text style={{ fontSize: 9, color: colors.muted, fontWeight: "700", marginBottom: 3 }}>{t("partner.slotCapacity")}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center" }}>
            <TouchableOpacity onPress={() => setCapacity((c) => Math.max(1, c - 1))} style={{ backgroundColor: colors.surface, borderRadius: 6, width: 26, height: 30, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.primary, fontWeight: "800" }}>−</Text>
            </TouchableOpacity>
            <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 14, minWidth: 22, textAlign: "center" }}>{capacity}</Text>
            <TouchableOpacity onPress={() => setCapacity((c) => c + 1)} style={{ backgroundColor: colors.surface, borderRadius: 6, width: 26, height: 30, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.primary, fontWeight: "800" }}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Légende */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: colors.success }} />
          <Text style={{ fontSize: 11, color: colors.muted }}>{t("partner.available")}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: colors.border }} />
          <Text style={{ fontSize: 11, color: colors.muted }}>{t("partner.unavailable")}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: colors.error }} />
          <Text style={{ fontSize: 11, color: colors.muted }}>{t("partner.slotFullLabel")}</Text>
        </View>
      </View>

      {loading ? (
        <View style={{ paddingVertical: 40, alignItems: "center" }}><ActivityIndicator color={colors.primary} /></View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* En-tête jours */}
            <View style={{ flexDirection: "row" }}>
              <View style={{ width: 44 }} />
              {DAYS_ORDER.map((d) => (
                <View key={d} style={{ width: COL_W, alignItems: "center", paddingBottom: 6 }}>
                  <Text style={{ fontSize: 11, fontWeight: "800", color: colors.muted }}>{DAY_SHORT[d]}</Text>
                </View>
              ))}
            </View>

            {/* Lignes : une par créneau de 30 min */}
            {times.map((time) => (
              <View key={time} style={{ flexDirection: "row", marginBottom: 4, alignItems: "center" }}>
                <View style={{ width: 44 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: colors.foreground }}>{time}</Text>
                </View>
                {DAYS_ORDER.map((d) => {
                  const key = cellKey(d, time);
                  const active = isActive(key);
                  const s = original[key];
                  const full = s ? s.current_bookings >= s.max_capacity : false;
                  return (
                    <TouchableOpacity
                      key={d}
                      onPress={() => toggleCell(d, time)}
                      activeOpacity={0.7}
                      style={{
                        width: COL_W - 4, height: 38, marginHorizontal: 2, borderRadius: 7,
                        backgroundColor: active ? (full ? colors.error : colors.success) : colors.border,
                        alignItems: "center", justifyContent: "center",
                      }}
                    >
                      {active && s ? (
                        <Text style={{ fontSize: 9, fontWeight: "800", color: colors.onPrimary }}>
                          {s.current_bookings}/{s.max_capacity}
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Sauvegarde */}
      <TouchableOpacity
        onPress={save}
        disabled={saving || !dirty}
        activeOpacity={0.85}
        style={{
          marginTop: 20, backgroundColor: dirty ? colors.primary : colors.surface,
          borderWidth: dirty ? 0 : 1, borderColor: colors.border,
          borderRadius: 50, paddingVertical: 15, alignItems: "center", opacity: saving ? 0.6 : 1,
        }}
      >
        {saving
          ? <ActivityIndicator color={colors.onPrimary} />
          : <Text style={{ color: dirty ? colors.onPrimary : colors.muted, fontWeight: "800", fontSize: 15 }}>
              {dirty ? t("partner.saveSlots") : t("partner.allSaved")}
            </Text>}
      </TouchableOpacity>

      {selectedVenue && (
        <Text style={{ fontSize: 11, color: colors.muted, textAlign: "center", marginTop: 10 }}>
          {selectedVenue.name} · {selectedVenue.category}
        </Text>
      )}
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Offers Tab
// ─────────────────────────────────────────────────────────────────────────────
const OFFER_TYPE_ICONS: Record<OfferType, IoniconName> = {
  table: "restaurant-outline", bed: "bed-outline", bottle: "wine-outline", discount: "pricetag-outline", experience: "diamond-outline",
};
const OFFER_TYPES: OfferType[] = ["table", "bed", "bottle", "discount", "experience"];
const EMPTY_OFFER = { title: "", type: "table" as OfferType, original_price: "", vip_price: "", spots_total: "10" };

// Map les offres démo (clés legacy) vers la forme VipOffer pour un rendu unifié.
function demoToOffers(): VipOffer[] {
  return (DEMO_VIP_OFFERS as any[]).map((o) => ({
    id: o.id, venue_id: "demo", title: o.title, type: o.type as OfferType,
    description: null, original_price: o.originalPrice ?? null, vip_price: o.vipPrice ?? null,
    capacity: 2, spots_total: o.spotsLeft ?? 0, spots_remaining: o.spotsLeft ?? 0,
    available_date: null, available_time: null, instagram_required: true, instagram_handle: null,
    is_active: o.active ?? true, created_at: new Date().toISOString(),
  }));
}

function OffersTab({ colors, isDemo, isAdmin, userId }: { colors: ReturnType<typeof useColors>; isDemo: boolean; isAdmin: boolean; userId?: string }) {
  const { t } = useTranslation();

  const [venues, setVenues] = useState<VenueBasic[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [offers, setOffers] = useState<VipOffer[]>([]);
  const [loading, setLoading] = useState(!isDemo);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_OFFER });

  const notify = (m: string) => { if (Platform.OS === "web") window.alert(m); else Alert.alert(m); };

  // Venue(s) gérée(s) : admin → toutes, partenaire → les siennes.
  useEffect(() => {
    if (isDemo) { setSelectedVenueId("demo"); return; }
    let cancelled = false;
    (async () => {
      try {
        const vs = isAdmin ? await getAllVenuesBasic() : await getManagedVenues(userId ?? "");
        if (cancelled) return;
        setVenues(vs);
        setSelectedVenueId((prev) => prev ?? vs[0]?.id ?? null);
        if (vs.length === 0) setLoading(false);
      } catch (e: any) { notify(e.message ?? "Erreur de chargement"); }
    })();
    return () => { cancelled = true; };
  }, [isDemo, isAdmin, userId]);

  // Offres de la venue sélectionnée.
  useEffect(() => {
    if (isDemo) { setOffers(demoToOffers()); setLoading(false); return; }
    if (!selectedVenueId) { setOffers([]); return; }
    let cancelled = false;
    setLoading(true);
    getVenueOffers(selectedVenueId)
      .then((rows) => { if (!cancelled) setOffers(rows); })
      .catch((e) => { if (!cancelled) notify(e.message ?? "Erreur de chargement des offres"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isDemo, selectedVenueId]);

  const handleToggle = async (id: string, active: boolean) => {
    setOffers((prev) => prev.map((o) => o.id === id ? { ...o, is_active: active } : o));
    if (isDemo) return;
    try { await toggleVenueOffer(id, active); }
    catch (e: any) {
      setOffers((prev) => prev.map((o) => o.id === id ? { ...o, is_active: !active } : o));
      notify(e.message ?? "Échec de la mise à jour");
    }
  };

  const handleDelete = async (id: string) => {
    const snapshot = offers;
    setOffers((p) => p.filter((o) => o.id !== id));
    if (isDemo) return;
    try { await deleteVenueOffer(id); }
    catch (e: any) { setOffers(snapshot); notify(e.message ?? "Échec de la suppression"); }
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        type: form.type,
        original_price: form.original_price ? parseFloat(form.original_price) : null,
        vip_price: form.vip_price ? parseFloat(form.vip_price) : null,
        spots_total: parseInt(form.spots_total) || 10,
      };
      if (isDemo) {
        const spots = payload.spots_total;
        setOffers((prev) => [{
          id: `do-${Date.now()}`, venue_id: "demo", title: payload.title, type: payload.type,
          description: null, original_price: payload.original_price, vip_price: payload.vip_price,
          capacity: 2, spots_total: spots, spots_remaining: spots,
          available_date: null, available_time: null, instagram_required: true, instagram_handle: null,
          is_active: true, created_at: new Date().toISOString(),
        }, ...prev]);
      } else {
        if (!selectedVenueId) { notify("Aucune venue sélectionnée."); return; }
        const created = await createVenueOffer(selectedVenueId, payload);
        setOffers((prev) => [created, ...prev]);
      }
      setForm({ ...EMPTY_OFFER });
      setShowForm(false);
    } catch (e: any) {
      notify(e.message ?? "Échec de l'enregistrement de l'offre");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Sélecteur de venue (si plusieurs) */}
      {!isDemo && venues.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} contentContainerStyle={{ gap: 8 }}>
          {venues.map((v) => {
            const sel = v.id === selectedVenueId;
            return (
              <TouchableOpacity key={v.id} onPress={() => setSelectedVenueId(v.id)} activeOpacity={0.8}
                style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 50, backgroundColor: sel ? colors.primary : colors.surface, borderWidth: 1, borderColor: sel ? colors.primary : colors.border }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: sel ? colors.onPrimary : colors.foreground }} numberOfLines={1}>{v.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Bouton Ajouter / Annuler */}
      <TouchableOpacity
        onPress={() => setShowForm((s) => !s)}
        disabled={!isDemo && venues.length === 0}
        style={{
          backgroundColor: showForm ? colors.surface : colors.primary, borderRadius: 12, padding: 14,
          alignItems: "center", marginBottom: 16, flexDirection: "row", justifyContent: "center", gap: 8,
          borderWidth: showForm ? 1 : 0, borderColor: colors.border, opacity: (!isDemo && venues.length === 0) ? 0.5 : 1,
        }}
      >
        <Ionicons name={showForm ? "close" : "add"} size={16} color={showForm ? colors.muted : colors.onPrimary} />
        <Text style={{ fontSize: 14, fontWeight: "700", color: showForm ? colors.muted : colors.onPrimary }}>
          {showForm ? t("common.cancel") : t("partner.createOffer")}
        </Text>
      </TouchableOpacity>

      {/* Formulaire de création */}
      {showForm && (
        <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border, gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="pricetags-outline" size={15} color={colors.primary} />
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary }}>Nouvelle offre</Text>
          </View>

          <View>
            <Text style={{ fontSize: 10, color: colors.muted, marginBottom: 4, fontWeight: "600" }}>TITRE *</Text>
            <TextInput value={form.title} onChangeText={(v) => setForm((p) => ({ ...p, title: v }))}
              placeholder="ex. Table VIP + bouteille" placeholderTextColor={colors.muted}
              style={{ backgroundColor: colors.background, color: colors.foreground, borderRadius: 10, padding: 10, fontSize: 14, borderWidth: 1, borderColor: colors.border }} />
          </View>

          <View>
            <Text style={{ fontSize: 10, color: colors.muted, marginBottom: 4, fontWeight: "600" }}>TYPE</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {OFFER_TYPES.map((ty) => {
                const sel = form.type === ty;
                return (
                  <TouchableOpacity key={ty} onPress={() => setForm((p) => ({ ...p, type: ty }))}
                    style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: sel ? colors.primary : colors.background, borderWidth: 1, borderColor: sel ? colors.primary : colors.border }}>
                    <Ionicons name={OFFER_TYPE_ICONS[ty]} size={14} color={sel ? colors.onPrimary : colors.muted} />
                    <Text style={{ fontSize: 12, fontWeight: "600", color: sel ? colors.onPrimary : colors.muted }}>{ty}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, color: colors.muted, marginBottom: 4, fontWeight: "600" }}>PRIX NORMAL (€)</Text>
              <TextInput value={form.original_price} onChangeText={(v) => setForm((p) => ({ ...p, original_price: v }))}
                keyboardType="numeric" placeholder="500" placeholderTextColor={colors.muted}
                style={{ backgroundColor: colors.background, color: colors.foreground, borderRadius: 10, padding: 10, fontSize: 14, borderWidth: 1, borderColor: colors.border }} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, color: colors.muted, marginBottom: 4, fontWeight: "600" }}>PRIX VIP (€)</Text>
              <TextInput value={form.vip_price} onChangeText={(v) => setForm((p) => ({ ...p, vip_price: v }))}
                keyboardType="numeric" placeholder="350" placeholderTextColor={colors.muted}
                style={{ backgroundColor: colors.background, color: colors.foreground, borderRadius: 10, padding: 10, fontSize: 14, borderWidth: 1, borderColor: colors.border }} />
            </View>
            <View style={{ width: 80 }}>
              <Text style={{ fontSize: 10, color: colors.muted, marginBottom: 4, fontWeight: "600" }}>PLACES</Text>
              <TextInput value={form.spots_total} onChangeText={(v) => setForm((p) => ({ ...p, spots_total: v }))}
                keyboardType="numeric" placeholder="10" placeholderTextColor={colors.muted}
                style={{ backgroundColor: colors.background, color: colors.foreground, borderRadius: 10, padding: 10, fontSize: 14, borderWidth: 1, borderColor: colors.border }} />
            </View>
          </View>

          <TouchableOpacity onPress={handleSave} disabled={saving || !form.title.trim()}
            style={{ backgroundColor: form.title.trim() ? colors.primary : colors.surface, borderRadius: 12, paddingVertical: 13, alignItems: "center", marginTop: 4 }}>
            {saving ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={{ color: colors.onPrimary, fontWeight: "700", fontSize: 14 }}>Enregistrer l'offre</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* Loading */}
      {loading && !isDemo && (
        <View style={{ alignItems: "center", paddingVertical: 40 }}><ActivityIndicator color={colors.primary} /></View>
      )}

      {/* Aucune venue rattachée */}
      {!isDemo && !loading && venues.length === 0 && (
        <View style={{ alignItems: "center", paddingVertical: 30, gap: 6 }}>
          <Ionicons name="business-outline" size={32} color={colors.muted} />
          <Text style={{ color: colors.muted, fontSize: 13, textAlign: "center" }}>Aucun établissement rattaché à ce compte.</Text>
        </View>
      )}

      {/* Liste des offres */}
      {!loading && venues.length > 0 || isDemo ? (
        offers.length === 0 && !loading ? (
          <View style={{ alignItems: "center", paddingVertical: 30, gap: 6 }}>
            <Ionicons name="pricetags-outline" size={32} color={colors.muted} />
            <Text style={{ color: colors.muted, fontSize: 13 }}>Aucune offre pour le moment</Text>
          </View>
        ) : offers.map((item) => (
          <View key={item.id} style={{
            backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 10,
            borderWidth: 1, borderColor: item.is_active ? colors.border : colors.error, opacity: item.is_active ? 1 : 0.6,
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                <Ionicons name={OFFER_TYPE_ICONS[item.type] ?? "ticket-outline"} size={22} color={colors.foreground} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }} numberOfLines={1}>{item.title}</Text>
                  <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "600" }}>{item.type}</Text>
                </View>
              </View>
              <Switch value={item.is_active} onValueChange={(v) => handleToggle(item.id, v)}
                trackColor={{ false: colors.border, true: colors.primary }} style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }} />
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 4, marginLeft: 4 }}>
                <Ionicons name="trash-outline" size={16} color={colors.error} />
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: "row", marginTop: 10, gap: 16, alignItems: "center" }}>
              {item.vip_price != null && <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primary }}>€{Number(item.vip_price).toLocaleString()}</Text>}
              {item.original_price != null && <Text style={{ fontSize: 11, color: colors.muted, textDecorationLine: "line-through" }}>€{Number(item.original_price).toLocaleString()}</Text>}
              <Text style={{ fontSize: 12, color: colors.muted }}>{item.spots_remaining}/{item.spots_total} {t("partner.spotsLeft")}</Text>
            </View>
          </View>
        ))
      ) : null}
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Photos Tab — cover + galerie via Supabase Storage (bucket "venues")
// ─────────────────────────────────────────────────────────────────────────────
const GALLERY_MAX = 10;

function PhotosTab({ colors, isDemo, userId }: { colors: ReturnType<typeof useColors>; isDemo: boolean; userId?: string }) {
  const [venues, setVenues] = useState<OwnerVenue[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isDemo);
  const [busy, setBusy] = useState(false);

  const notify = (m: string) => { if (Platform.OS === "web") window.alert(m); else Alert.alert(m); };
  const selected = venues.find((v) => v.slug === selectedSlug) ?? null;

  useEffect(() => {
    if (isDemo) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    getOwnerVenues(userId ?? "")
      .then((vs) => { if (!cancelled) { setVenues(vs); setSelectedSlug((p) => p ?? vs[0]?.slug ?? null); } })
      .catch((e) => { if (!cancelled) notify(e.message ?? "Erreur de chargement"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isDemo, userId]);

  const patch = (slug: string, p: Partial<OwnerVenue>) =>
    setVenues((vs) => vs.map((v) => (v.slug === slug ? { ...v, ...p } : v)));

  // Sélectionne une image et renvoie ses octets (cross-platform : base64 → ArrayBuffer).
  const pickBytes = async (): Promise<{ bytes: ArrayBuffer; mime: string } | null> => {
    if (Platform.OS !== "web") {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { notify("Permission d'accès aux photos refusée."); return null; }
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.8,
    });
    if (res.canceled || !res.assets?.length) return null;
    const a = res.assets[0];
    const mime = a.mimeType ?? "image/jpeg";
    const bytes = a.base64 ? decodeBase64(a.base64) : await (await fetch(a.uri)).arrayBuffer();
    return { bytes, mime };
  };

  const handleCover = async () => {
    if (!selected || busy) return;
    const picked = await pickBytes(); if (!picked) return;
    setBusy(true);
    try { const url = await uploadCover(selected.slug, picked.bytes, picked.mime); patch(selected.slug, { cover_image_url: url }); }
    catch (e: any) { notify(e.message ?? "Échec de l'upload de la couverture"); }
    finally { setBusy(false); }
  };

  const handleRemoveCover = async () => {
    if (!selected || busy || !selected.cover_image_url) return;
    setBusy(true);
    try { await removeCover(selected.slug); patch(selected.slug, { cover_image_url: null }); }
    catch (e: any) { notify(e.message ?? "Échec de la suppression"); }
    finally { setBusy(false); }
  };

  const handleAddGallery = async () => {
    if (!selected || busy) return;
    if (selected.images.length >= GALLERY_MAX) { notify(`Maximum ${GALLERY_MAX} photos de galerie.`); return; }
    const picked = await pickBytes(); if (!picked) return;
    setBusy(true);
    try { const next = await uploadGalleryPhoto(selected.slug, picked.bytes, picked.mime); patch(selected.slug, { images: next }); }
    catch (e: any) { notify(e.message ?? "Échec de l'upload"); }
    finally { setBusy(false); }
  };

  const handleRemoveGallery = async (url: string) => {
    if (!selected || busy) return;
    setBusy(true);
    try { const next = await removeGalleryPhoto(selected.slug, url); patch(selected.slug, { images: next }); }
    catch (e: any) { notify(e.message ?? "Échec de la suppression"); }
    finally { setBusy(false); }
  };

  if (isDemo) {
    return (
      <View style={{ paddingVertical: 40, alignItems: "center", gap: 8 }}>
        <Ionicons name="camera-outline" size={32} color={colors.muted} />
        <Text style={{ color: colors.muted, fontSize: 13, textAlign: "center", paddingHorizontal: 24 }}>
          L'upload de photos est désactivé en mode démo.
        </Text>
      </View>
    );
  }
  if (loading) return <View style={{ paddingVertical: 40, alignItems: "center" }}><ActivityIndicator color={colors.primary} /></View>;
  if (venues.length === 0) {
    return (
      <View style={{ paddingVertical: 30, alignItems: "center", gap: 6 }}>
        <Text style={{ fontSize: 32 }}>🏢</Text>
        <Text style={{ color: colors.muted, fontSize: 13, textAlign: "center" }}>Aucun établissement rattaché à ce compte.</Text>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Sélecteur de venue */}
      {venues.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }} contentContainerStyle={{ gap: 8 }}>
          {venues.map((v) => {
            const sel = v.slug === selectedSlug;
            return (
              <TouchableOpacity key={v.slug} onPress={() => setSelectedSlug(v.slug)} activeOpacity={0.8}
                style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 50, backgroundColor: sel ? colors.primary : colors.surface, borderWidth: 1, borderColor: sel ? colors.primary : colors.border }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: sel ? colors.onPrimary : colors.foreground }} numberOfLines={1}>{v.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* ── Cover ─────────────────────────────────────────────── */}
      <Text style={{ fontSize: 11, color: colors.muted, fontWeight: "700", letterSpacing: 0.5, marginBottom: 8 }}>PHOTO DE COUVERTURE</Text>
      <View style={{ height: 170, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: colors.border, marginBottom: 10, position: "relative", backgroundColor: colors.surface }}>
        {selected?.cover_image_url ? (
          <Image source={{ uri: selected.cover_image_url }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="image-outline" size={34} color={colors.muted} />
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>Aucune couverture</Text>
          </View>
        )}
        {selected?.cover_image_url ? (
          <TouchableOpacity onPress={handleRemoveCover} disabled={busy}
            style={{ position: "absolute", top: 8, right: 8, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 16, width: 32, height: 32, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="trash-outline" size={16} color={colors.error} />
          </TouchableOpacity>
        ) : null}
      </View>
      <TouchableOpacity onPress={handleCover} disabled={busy} activeOpacity={0.85}
        style={{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, alignItems: "center", marginBottom: 26, opacity: busy ? 0.6 : 1 }}>
        <Text style={{ color: colors.onPrimary, fontWeight: "800", fontSize: 14 }}>
          {selected?.cover_image_url ? "Remplacer la couverture" : "Ajouter une couverture"}
        </Text>
      </TouchableOpacity>

      {/* ── Galerie ───────────────────────────────────────────── */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <Text style={{ fontSize: 11, color: colors.muted, fontWeight: "700", letterSpacing: 0.5 }}>GALERIE</Text>
        <Text style={{ fontSize: 11, color: colors.muted }}>{selected?.images.length ?? 0}/{GALLERY_MAX}</Text>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {(selected?.images ?? []).map((url) => (
          <View key={url} style={{ width: "31%", aspectRatio: 1, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: colors.border, position: "relative" }}>
            <Image source={{ uri: url }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
            <TouchableOpacity onPress={() => handleRemoveGallery(url)} disabled={busy}
              style={{ position: "absolute", top: 4, right: 4, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 14, width: 26, height: 26, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="trash-outline" size={13} color={colors.error} />
            </TouchableOpacity>
          </View>
        ))}
        {(selected?.images.length ?? 0) < GALLERY_MAX && (
          <TouchableOpacity onPress={handleAddGallery} disabled={busy}
            style={{ width: "31%", aspectRatio: 1, borderRadius: 12, borderWidth: 1, borderColor: colors.border, borderStyle: "dashed", alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, opacity: busy ? 0.6 : 1 }}>
            <Text style={{ fontSize: 26, color: colors.primary }}>＋</Text>
            <Text style={{ fontSize: 10, color: colors.muted, marginTop: 2 }}>Ajouter</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Indicateur d'upload */}
      {busy && (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 18 }}>
          <ActivityIndicator color={colors.primary} />
          <Text style={{ color: colors.muted, fontSize: 12 }}>Transfert en cours…</Text>
        </View>
      )}
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats Tab
// ─────────────────────────────────────────────────────────────────────────────
function StatsTab({ colors, isDemo }: { colors: ReturnType<typeof useColors>; isDemo: boolean }) {
  const { t } = useTranslation();
  const monthly = isDemo ? DEMO_MONTHLY : { months: ["Jan","Feb","Mar","Apr","May","Jun"], values: [3,5,4,8,10,12] };
  const maxVal = Math.max(...monthly.values);
  const topOffers = isDemo ? DEMO_TOP_OFFERS : DEMO_TOP_OFFERS.slice(0, 2);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 16 }}>
        {t("partner.bookingsByMonth")}
      </Text>

      <View style={{
        backgroundColor: colors.surface, borderRadius: 16, padding: 16,
        borderWidth: 1, borderColor: colors.border, marginBottom: 20,
      }}>
        <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 120 }}>
          {monthly.values.map((v, i) => (
            <View key={i} style={{ alignItems: "center", gap: 6, flex: 1 }}>
              <Text style={{ fontSize: 10, color: colors.muted }}>{v}</Text>
              <View style={{
                width: "60%", height: (v / maxVal) * 80,
                backgroundColor: i === monthly.values.length - 1 ? colors.primary : `${colors.primary}50`,
                borderRadius: 4,
              }} />
              <Text style={{ fontSize: 10, color: colors.muted }}>{monthly.months[i]}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
        {t("partner.topVenues")}
      </Text>
      {topOffers.map((item, i) => (
        <View key={i} style={{
          backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 8,
          flexDirection: "row", alignItems: "center", justifyContent: "space-between",
          borderWidth: 1, borderColor: colors.border,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: colors.primary, width: 24 }}>{i + 1}</Text>
            <View>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>{item.name}</Text>
              <Text style={{ fontSize: 11, color: colors.muted }}>{item.bookings} {t("partner.bookings")}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primary }}>{item.revenue}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tables Tab
// ─────────────────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: "", description: "", capacity_min: 2, capacity_max: 8,
  price_min: 200, price_max: null as number | null,
  photo_url: "" as string | null, is_active: true, is_vip: false, sort_order: 99,
};

function TablesTab({ colors, isDemo, isAdmin, userId }: { colors: ReturnType<typeof useColors>; isDemo: boolean; isAdmin: boolean; userId?: string }) {
  const [venues, setVenues] = useState<VenueBasic[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [tables, setTables] = useState<VenueTable[]>([]);
  const [loading, setLoading] = useState(!isDemo);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const notify = (m: string) => { if (Platform.OS === "web") window.alert(m); else Alert.alert(m); };

  // Venue(s) gérée(s) : admin → toutes, partenaire → les siennes (owner_id).
  useEffect(() => {
    if (isDemo) { setSelectedVenueId("demo"); return; }
    let cancelled = false;
    (async () => {
      try {
        const vs = isAdmin ? await getAllVenuesBasic() : await getManagedVenues(userId ?? "");
        if (cancelled) return;
        setVenues(vs);
        setSelectedVenueId((prev) => prev ?? vs[0]?.id ?? null);
        if (vs.length === 0) setLoading(false);
      } catch (e: any) { notify(e.message ?? "Erreur de chargement"); }
    })();
    return () => { cancelled = true; };
  }, [isDemo, isAdmin, userId]);

  // Tables de la venue sélectionnée (vraie venue UUID, plus de stub).
  useEffect(() => {
    if (isDemo) { setTables(DEMO_TABLES as VenueTable[]); setLoading(false); return; }
    if (!selectedVenueId) { setTables([]); return; }
    let cancelled = false;
    setLoading(true);
    getVenueTablesByUUID(selectedVenueId)
      .then((rows) => { if (!cancelled) setTables(rows); })
      .catch((e) => { if (!cancelled) notify(e.message ?? "Erreur de chargement des tables"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isDemo, selectedVenueId]);

  const handleToggle = async (id: string, active: boolean) => {
    setTables((prev) => prev.map((t) => t.id === id ? { ...t, is_active: active } : t)); // optimiste
    if (isDemo) return;
    try { await toggleTableActive(id, active); }
    catch (e: any) {
      setTables((prev) => prev.map((t) => t.id === id ? { ...t, is_active: !active } : t)); // rollback
      notify(e.message ?? "Échec de la mise à jour");
    }
  };

  const handleDelete = async (id: string) => {
    const snapshot = tables;
    setTables((p) => p.filter((t) => t.id !== id)); // optimiste
    if (isDemo) return;
    try { await deleteVenueTable(id); }
    catch (e: any) { setTables(snapshot); notify(e.message ?? "Échec de la suppression"); }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (isDemo) {
        const newTable: VenueTable = {
          id: `dt-${Date.now()}`,
          venue_id: "demo-venue",
          name: form.name,
          description: form.description || null,
          capacity_min: form.capacity_min,
          capacity_max: form.capacity_max,
          price_min: form.price_min,
          price_max: form.price_max,
          photo_url: form.photo_url || null,
          is_active: form.is_active,
          is_vip: form.is_vip,
          sort_order: tables.length + 1,
          created_at: new Date().toISOString(),
        };
        setTables((prev) => [...prev, newTable]);
      } else {
        if (!selectedVenueId) { notify("Aucune venue sélectionnée."); return; }
        const created = await createVenueTable(selectedVenueId, {
          name: form.name,
          description: form.description || null,
          capacity_min: form.capacity_min,
          capacity_max: form.capacity_max,
          price_min: form.price_min,
          price_max: form.price_max,
          photo_url: form.photo_url || null,
          is_active: form.is_active,
          is_vip: form.is_vip,
          sort_order: tables.length + 1,
        });
        setTables((prev) => [...prev, created].sort((a, b) => a.sort_order - b.sort_order));
      }
      setForm({ ...EMPTY_FORM });
      setShowForm(false);
    } catch (e: any) {
      notify(e.message ?? "Échec de l'enregistrement de la table");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Sélecteur de venue (si le compte en gère plusieurs) */}
      {!isDemo && venues.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} contentContainerStyle={{ gap: 8 }}>
          {venues.map((v) => {
            const sel = v.id === selectedVenueId;
            return (
              <TouchableOpacity key={v.id} onPress={() => setSelectedVenueId(v.id)} activeOpacity={0.8}
                style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 50, backgroundColor: sel ? colors.primary : colors.surface, borderWidth: 1, borderColor: sel ? colors.primary : colors.border }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: sel ? colors.onPrimary : colors.foreground }} numberOfLines={1}>{v.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Aucune venue rattachée */}
      {!isDemo && !loading && venues.length === 0 && (
        <View style={{ alignItems: "center", paddingVertical: 30, gap: 6 }}>
          <Ionicons name="business-outline" size={32} color={colors.muted} />
          <Text style={{ color: colors.muted, fontSize: 13, textAlign: "center" }}>
            Aucun établissement rattaché à ce compte.
          </Text>
        </View>
      )}

      {/* Add button */}
      <TouchableOpacity
        onPress={() => setShowForm(!showForm)}
        style={{
          backgroundColor: showForm ? colors.surface : colors.primary,
          borderRadius: 12, padding: 14, alignItems: "center",
          marginBottom: 16, flexDirection: "row", justifyContent: "center", gap: 8,
          borderWidth: showForm ? 1 : 0, borderColor: colors.border,
        }}
      >
        <Ionicons name={showForm ? "close" : "add"} size={16} color={showForm ? colors.muted : colors.onPrimary} />
        <Text style={{ fontSize: 14, fontWeight: "700", color: showForm ? colors.muted : colors.onPrimary }}>
          {showForm ? "Cancel" : "Add New Table"}
        </Text>
      </TouchableOpacity>

      {/* Inline add form */}
      {showForm && (
        <View style={{
          backgroundColor: colors.surface, borderRadius: 16, padding: 16,
          marginBottom: 16, borderWidth: 1, borderColor: colors.border,
          gap: 12,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <Ionicons name="restaurant-outline" size={15} color={colors.primary} />
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary }}>New Table</Text>
          </View>

          {/* Name */}
          <View>
            <Text style={{ fontSize: 10, color: colors.muted, marginBottom: 4, fontWeight: "600" }}>TABLE NAME *</Text>
            <TextInput
              value={form.name}
              onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
              placeholder="e.g. VIP Cabana"
              placeholderTextColor={colors.muted}
              style={{ backgroundColor: colors.background, color: colors.foreground, borderRadius: 10, padding: 10, fontSize: 14, borderWidth: 1, borderColor: colors.border }}
            />
          </View>

          {/* Description */}
          <View>
            <Text style={{ fontSize: 10, color: colors.muted, marginBottom: 4, fontWeight: "600" }}>DESCRIPTION</Text>
            <TextInput
              value={form.description}
              onChangeText={(v) => setForm((p) => ({ ...p, description: v }))}
              placeholder="Brief description of this table..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={2}
              style={{ backgroundColor: colors.background, color: colors.foreground, borderRadius: 10, padding: 10, fontSize: 13, borderWidth: 1, borderColor: colors.border, height: 60, textAlignVertical: "top" }}
            />
          </View>

          {/* Capacity */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, color: colors.muted, marginBottom: 4, fontWeight: "600" }}>MIN GUESTS</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <TouchableOpacity onPress={() => setForm((p) => ({ ...p, capacity_min: Math.max(1, p.capacity_min - 1) }))}
                  style={{ backgroundColor: colors.primary, borderRadius: 8, width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: colors.onPrimary, fontWeight: "700" }}>−</Text>
                </TouchableOpacity>
                <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16, width: 24, textAlign: "center" }}>{form.capacity_min}</Text>
                <TouchableOpacity onPress={() => setForm((p) => ({ ...p, capacity_min: p.capacity_min + 1 }))}
                  style={{ backgroundColor: colors.primary, borderRadius: 8, width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: colors.onPrimary, fontWeight: "700" }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, color: colors.muted, marginBottom: 4, fontWeight: "600" }}>MAX GUESTS</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <TouchableOpacity onPress={() => setForm((p) => ({ ...p, capacity_max: Math.max(p.capacity_min, p.capacity_max - 1) }))}
                  style={{ backgroundColor: colors.primary, borderRadius: 8, width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: colors.onPrimary, fontWeight: "700" }}>−</Text>
                </TouchableOpacity>
                <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16, width: 24, textAlign: "center" }}>{form.capacity_max}</Text>
                <TouchableOpacity onPress={() => setForm((p) => ({ ...p, capacity_max: p.capacity_max + 1 }))}
                  style={{ backgroundColor: colors.primary, borderRadius: 8, width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: colors.onPrimary, fontWeight: "700" }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Price */}
          <View>
            <Text style={{ fontSize: 10, color: colors.muted, marginBottom: 4, fontWeight: "600" }}>MINIMUM PRICE (€) *</Text>
            <TextInput
              value={String(form.price_min)}
              onChangeText={(v) => setForm((p) => ({ ...p, price_min: parseInt(v) || 0 }))}
              keyboardType="numeric"
              placeholder="e.g. 500"
              placeholderTextColor={colors.muted}
              style={{ backgroundColor: colors.background, color: colors.foreground, borderRadius: 10, padding: 10, fontSize: 14, borderWidth: 1, borderColor: colors.border }}
            />
          </View>

          {/* Photo URL */}
          <View>
            <Text style={{ fontSize: 10, color: colors.muted, marginBottom: 4, fontWeight: "600" }}>PHOTO URL (optional)</Text>
            <TextInput
              value={form.photo_url ?? ""}
              onChangeText={(v) => setForm((p) => ({ ...p, photo_url: v || null }))}
              placeholder="https://images.unsplash.com/..."
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              style={{ backgroundColor: colors.background, color: colors.foreground, borderRadius: 10, padding: 10, fontSize: 12, borderWidth: 1, borderColor: colors.border }}
            />
          </View>

          {/* VIP toggle */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View>
              <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 13 }}>VIP Table</Text>
              <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>Show VIP badge to customers</Text>
            </View>
            <Switch
              value={form.is_vip}
              onValueChange={(v) => setForm((p) => ({ ...p, is_vip: v }))}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          {/* Save button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving || !form.name.trim()}
            style={{
              backgroundColor: form.name.trim() ? colors.primary : colors.surface,
              borderRadius: 12, paddingVertical: 13, alignItems: "center", marginTop: 4,
            }}
          >
            {saving ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={{ color: colors.onPrimary, fontWeight: "700", fontSize: 14 }}>Save Table</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Loading */}
      {loading && !isDemo && (
        <View style={{ alignItems: "center", paddingVertical: 40 }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {/* Table list */}
      {tables.length === 0 && !loading ? (
        <View style={{ alignItems: "center", paddingVertical: 40, gap: 8 }}>
          <Ionicons name="restaurant-outline" size={36} color={colors.muted} />
          <Text style={{ color: colors.muted, fontSize: 14 }}>No tables yet</Text>
          <Text style={{ color: colors.muted, fontSize: 12, textAlign: "center" }}>
            Add your first table to start accepting bookings
          </Text>
        </View>
      ) : (
        tables.map((table) => (
          <View key={table.id} style={{
            backgroundColor: colors.surface, borderRadius: 16,
            marginBottom: 12, overflow: "hidden",
            borderWidth: 1,
            borderColor: table.is_active ? colors.border : colors.error,
            opacity: table.is_active ? 1 : 0.65,
          }}>
            <View style={{ flexDirection: "row" }}>
              {/* Photo thumbnail */}
              <View style={{ width: 90, height: 90 }}>
                {table.photo_url ? (
                  <Image
                    source={{ uri: table.photo_url }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                ) : (
                  <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name="restaurant-outline" size={28} color={colors.muted} />
                  </View>
                )}
              </View>

              {/* Info */}
              <View style={{ flex: 1, padding: 12, gap: 3 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 14, flex: 1 }} numberOfLines={1}>
                    {table.name}
                  </Text>
                  {table.is_vip && (
                    <View style={{ backgroundColor: colors.background, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 9, color: colors.primary, fontWeight: "700" }}>VIP</Text>
                    </View>
                  )}
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Ionicons name="people-outline" size={11} color={colors.muted} />
                  <Text style={{ color: colors.muted, fontSize: 11 }}>
                    {table.capacity_min}–{table.capacity_max} guests
                  </Text>
                </View>
                <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 12 }}>
                  From €{table.price_min.toLocaleString()}
                  {table.price_max ? ` · Max €${table.price_max.toLocaleString()}` : ""}
                </Text>
              </View>

              {/* Controls */}
              <View style={{ padding: 12, alignItems: "flex-end", justifyContent: "space-between" }}>
                <Switch
                  value={table.is_active}
                  onValueChange={(v) => handleToggle(table.id, v)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                />
                <TouchableOpacity
                  onPress={() => handleDelete(table.id)}
                  style={{ padding: 4 }}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Description */}
            {table.description && (
              <View style={{ paddingHorizontal: 12, paddingBottom: 10, paddingTop: 4 }}>
                <Text style={{ color: colors.muted, fontSize: 11, lineHeight: 15 }} numberOfLines={2}>
                  {table.description}
                </Text>
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VIP Posts Tab (admin only) — validation des soumissions Instagram
// ─────────────────────────────────────────────────────────────────────────────
function VipPostsTab({ colors }: { colors: ReturnType<typeof useColors> }) {
  const [posts, setPosts] = useState<PendingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const notify = (m: string) => { if (Platform.OS === "web") window.alert(m); else Alert.alert(m); };

  const load = useCallback(async () => {
    setLoading(true);
    try { setPosts(await getPendingPosts()); }
    catch (e: any) { notify(e.message ?? "Erreur de chargement"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const decide = async (id: string, action: "approve" | "reject") => {
    if (busyId) return;
    setBusyId(id);
    try {
      if (action === "approve") await approvePost(id); else await rejectPost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (e: any) { notify(e.message ?? "Échec de l'opération"); }
    finally { setBusyId(null); }
  };

  if (loading) {
    return <View style={{ paddingVertical: 40, alignItems: "center" }}><ActivityIndicator color={colors.primary} /></View>;
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <Text style={{ fontSize: 13, color: colors.muted }}>{posts.length} post(s) en attente</Text>
        <TouchableOpacity onPress={load} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Rafraîchir" style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
          <Ionicons name="reload" size={14} color={colors.muted} />
        </TouchableOpacity>
      </View>

      {posts.length === 0 ? (
        <View style={{ paddingVertical: 40, alignItems: "center", gap: 8 }}>
          <Ionicons name="camera-outline" size={32} color={colors.muted} />
          <Text style={{ color: colors.muted, fontSize: 13 }}>Aucun post à valider</Text>
        </View>
      ) : posts.map((p) => {
        const busy = busyId === p.id;
        return (
          <View key={p.id} style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: "800", color: colors.foreground, flex: 1 }} numberOfLines={1}>
                {p.user_name ?? "Client"}
              </Text>
              {p.instagram_handle ? <Text style={{ fontSize: 12, color: colors.primary }}>@{p.instagram_handle}</Text> : null}
            </View>
            <TouchableOpacity onPress={() => Linking.openURL(p.post_url).catch(() => {})} activeOpacity={0.7} style={{ marginTop: 6 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="link-outline" size={13} color={colors.muted} />
                <Text style={{ fontSize: 12, color: colors.foreground, flex: 1 }} numberOfLines={1}>{p.post_url}</Text>
              </View>
            </TouchableOpacity>
            <Text style={{ fontSize: 10, color: colors.muted, marginTop: 4 }}>
              {p.hashtag ?? "#marbellappvip"} · {new Date(p.submitted_at).toLocaleDateString("fr-FR")}
            </Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <TouchableOpacity disabled={busy} onPress={() => decide(p.id, "approve")} activeOpacity={0.8}
                style={{ flex: 1, backgroundColor: colors.success, borderRadius: 10, paddingVertical: 11, alignItems: "center", opacity: busy ? 0.5 : 1 }}>
                {busy ? <ActivityIndicator color={colors.onPrimary} size="small" /> : (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name="checkmark" size={15} color={colors.onPrimary} />
                    <Text style={{ color: colors.onPrimary, fontWeight: "800", fontSize: 13 }}>Approuver</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity disabled={busy} onPress={() => decide(p.id, "reject")} activeOpacity={0.8}
                style={{ flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.error, borderRadius: 10, paddingVertical: 11, alignItems: "center", opacity: busy ? 0.5 : 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="close" size={15} color={colors.error} />
                  <Text style={{ color: colors.error, fontWeight: "800", fontSize: 13 }}>Rejeter</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Clients Tab (admin only)
// ─────────────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

const DEMO_CLIENTS: AdminClient[] = [
  { id: "c1", name: "Sofia Martín",  email: "sofia@example.com",  phone: "+34 600 111 222", created_at: new Date(Date.now() - 3 * 864e5).toISOString(),  last_booking_at: new Date(Date.now() - 2 * 864e5).toISOString(), total_bookings: 5, favorite_venue: "Ocean Club Marbella", active: true },
  { id: "c2", name: "Carlos Ruiz",   email: "carlos@example.com", phone: null,               created_at: new Date(Date.now() - 40 * 864e5).toISOString(), last_booking_at: new Date(Date.now() - 12 * 864e5).toISOString(), total_bookings: 3, favorite_venue: "Nikki Beach", active: true },
  { id: "c3", name: "Laura Torres",  email: "laura@example.com",  phone: "+34 600 333 444", created_at: new Date(Date.now() - 120 * 864e5).toISOString(), last_booking_at: new Date(Date.now() - 90 * 864e5).toISOString(), total_bookings: 8, favorite_venue: "Puente Romano", active: false },
];

function initials(name?: string | null, email?: string | null): string {
  const base = (name || email || "?").trim();
  const parts = base.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
}
function fmtDate(s?: string | null): string {
  if (!s) return "—";
  try { return new Date(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return "—"; }
}
function daysSince(s: string): number { return (Date.now() - new Date(s).getTime()) / 864e5; }

type SortKey = "created" | "last" | "bookings";

function ClientsTab({ colors, isDemo }: { colors: ReturnType<typeof useColors>; isDemo: boolean }) {
  const { t } = useTranslation();
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [bookingsMonth, setBookingsMonth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [venueFilter, setVenueFilter] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [page, setPage] = useState(0);

  const [selected, setSelected] = useState<AdminClient | null>(null);
  const [history, setHistory] = useState<ClientBooking[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setError(null);
      try {
        if (isDemo) {
          setClients(DEMO_CLIENTS); setBookingsMonth(11);
        } else {
          const [cl, cnt] = await Promise.all([getAdminClients(), getBookingsThisMonthCount()]);
          if (!cancelled) { setClients(cl); setBookingsMonth(cnt); }
        }
      } catch (e: any) { if (!cancelled) setError(e.message ?? "Erreur de chargement"); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [isDemo]);

  // Stats
  const startMonth = (() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d.getTime(); })();
  const stats = {
    total: clients.length,
    newMonth: clients.filter((c) => new Date(c.created_at).getTime() >= startMonth).length,
    active: clients.filter((c) => c.active).length,
    bookingsMonth,
  };

  // Venues présents (pour le filtre)
  const venueOptions = Array.from(new Set(clients.map((c) => c.favorite_venue).filter(Boolean))) as string[];

  // Filtrage + tri
  const filtered = clients
    .filter((c) => {
      const q = search.trim().toLowerCase();
      if (q && !(`${c.name ?? ""} ${c.email ?? ""}`.toLowerCase().includes(q))) return false;
      if (statusFilter === "active" && !c.active) return false;
      if (statusFilter === "inactive" && c.active) return false;
      if (venueFilter && c.favorite_venue !== venueFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortKey === "bookings") return b.total_bookings - a.total_bookings;
      if (sortKey === "last") return new Date(b.last_booking_at ?? 0).getTime() - new Date(a.last_booking_at ?? 0).getTime();
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const openClient = async (c: AdminClient) => {
    setSelected(c); setHistory([]); setHistoryLoading(true);
    try {
      if (isDemo) {
        setHistory([
          { id: "h1", venue_name: c.favorite_venue ?? "Ocean Club", date: "2026-06-14", time: "22:00", status: "confirmed", created_at: new Date().toISOString() },
          { id: "h2", venue_name: "Nikki Beach", date: "2026-05-20", time: "14:00", status: "completed", created_at: new Date().toISOString() },
        ]);
      } else {
        setHistory(await getClientBookings(c.id));
      }
    } catch { /* ignore */ }
    finally { setHistoryLoading(false); }
  };

  const StatCard = ({ label, value, icon }: { label: string; value: string | number; icon: string }) => (
    <View style={{ width: "47%", backgroundColor: colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border }}>
      <Ionicons name={iconFor(icon)} size={18} color={colors.muted} />
      <Text style={{ fontSize: 22, fontWeight: "800", color: colors.foreground, marginTop: 6 }}>{value}</Text>
      <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{label}</Text>
    </View>
  );

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <TouchableOpacity onPress={() => setSortKey(k)}
      style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: sortKey === k ? colors.primary : colors.surface, borderWidth: 1, borderColor: sortKey === k ? colors.primary : colors.border }}>
      <Text style={{ fontSize: 10, fontWeight: "700", color: sortKey === k ? colors.onPrimary : colors.muted }}>{label}</Text>
    </TouchableOpacity>
  );

  if (loading) return <View style={{ paddingVertical: 40, alignItems: "center" }}><ActivityIndicator color={colors.primary} /></View>;
  if (error) return (
    <View style={{ paddingVertical: 40, alignItems: "center", gap: 8 }}>
      <Ionicons name="cloud-offline-outline" size={32} color={colors.muted} />
      <Text style={{ color: colors.muted, fontSize: 13, textAlign: "center" }}>{error}</Text>
    </View>
  );

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Stats */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
        <StatCard icon="👥" label={t("admin.totalClients")}   value={stats.total} />
        <StatCard icon="🆕" label={t("admin.newThisMonth")}   value={stats.newMonth} />
        <StatCard icon="⚡" label={t("admin.activeClients")}  value={stats.active} />
        <StatCard icon="📋" label={t("admin.bookingsThisMonth")} value={stats.bookingsMonth} />
      </View>

      {/* Recherche */}
      <TextInput
        value={search}
        onChangeText={(v) => { setSearch(v); setPage(0); }}
        placeholder={t("admin.searchClients")}
        placeholderTextColor={colors.muted}
        style={{ backgroundColor: colors.surface, color: colors.foreground, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 10 }}
      />

      {/* Filtre statut */}
      <View style={{ flexDirection: "row", gap: 6, marginBottom: 8 }}>
        {(["all", "active", "inactive"] as const).map((s) => (
          <TouchableOpacity key={s} onPress={() => { setStatusFilter(s); setPage(0); }}
            style={{ flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 8, backgroundColor: statusFilter === s ? colors.primary : colors.surface, borderWidth: 1, borderColor: statusFilter === s ? colors.primary : colors.border }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: statusFilter === s ? colors.onPrimary : colors.muted }}>
              {s === "all" ? t("admin.all") : s === "active" ? t("admin.active") : t("admin.inactive")}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Filtre venue */}
      {venueOptions.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }} contentContainerStyle={{ gap: 6 }}>
          <TouchableOpacity onPress={() => { setVenueFilter(null); setPage(0); }}
            style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 50, backgroundColor: !venueFilter ? colors.primary : colors.surface, borderWidth: 1, borderColor: !venueFilter ? colors.primary : colors.border }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: !venueFilter ? colors.onPrimary : colors.muted }}>{t("admin.allVenues")}</Text>
          </TouchableOpacity>
          {venueOptions.map((v) => (
            <TouchableOpacity key={v} onPress={() => { setVenueFilter(v); setPage(0); }}
              style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 50, backgroundColor: venueFilter === v ? colors.primary : colors.surface, borderWidth: 1, borderColor: venueFilter === v ? colors.primary : colors.border }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: venueFilter === v ? colors.onPrimary : colors.muted }} numberOfLines={1}>{v}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Tri */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 }}>
        <Text style={{ fontSize: 10, color: colors.muted }}>{t("admin.sortBy")}</Text>
        <SortBtn k="created"  label={t("admin.registered")} />
        <SortBtn k="last"     label={t("admin.lastBooking")} />
        <SortBtn k="bookings" label={t("admin.bookings")} />
      </View>

      {/* Liste */}
      {pageRows.length === 0 ? (
        <View style={{ alignItems: "center", paddingVertical: 30, gap: 8 }}>
          <Ionicons name="people-outline" size={32} color={colors.muted} />
          <Text style={{ color: colors.muted, fontSize: 13 }}>{t("admin.noClients")}</Text>
        </View>
      ) : pageRows.map((c) => (
        <TouchableOpacity key={c.id} onPress={() => openClient(c)} activeOpacity={0.7}
          style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 14 }}>{initials(c.name, c.email)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, flexShrink: 1 }} numberOfLines={1}>{c.name ?? "—"}</Text>
              {daysSince(c.created_at) < 7 && (
                <View style={{ backgroundColor: "rgba(74,222,128,0.18)", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 }}>
                  <Text style={{ fontSize: 8, fontWeight: "800", color: colors.success }}>{t("admin.new")}</Text>
                </View>
              )}
            </View>
            <Text style={{ fontSize: 11, color: colors.muted }} numberOfLines={1}>{c.email ?? "—"}</Text>
            <Text style={{ fontSize: 10, color: colors.muted, marginTop: 2 }} numberOfLines={1}>
              {fmtDate(c.created_at)} · {fmtDate(c.last_booking_at)} · {c.favorite_venue ?? "—"}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 4 }}>
            <View style={{ backgroundColor: c.active ? "rgba(74,222,128,0.15)" : "rgba(239,68,68,0.12)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ fontSize: 10, fontWeight: "700", color: c.active ? colors.success : colors.error }}>{c.active ? t("admin.active") : t("admin.inactive")}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: "800", color: colors.foreground }}>{c.total_bookings}</Text>
              <Ionicons name="list-outline" size={12} color={colors.muted} />
            </View>
          </View>
        </TouchableOpacity>
      ))}

      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 10 }}>
          <TouchableOpacity disabled={safePage === 0} onPress={() => setPage(safePage - 1)} accessibilityRole="button" accessibilityLabel="Précédent" style={{ opacity: safePage === 0 ? 0.4 : 1, padding: 8 }}>
            <Ionicons name="chevron-back" size={18} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={{ fontSize: 12, color: colors.muted }}>{safePage + 1} / {pageCount}</Text>
          <TouchableOpacity disabled={safePage >= pageCount - 1} onPress={() => setPage(safePage + 1)} accessibilityRole="button" accessibilityLabel="Suivant" style={{ opacity: safePage >= pageCount - 1 ? 0.4 : 1, padding: 8 }}>
            <Ionicons name="chevron-forward" size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      )}

      {/* Fiche client (modal slide-over) */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "85%", borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground }}>{t("admin.clientFile")}</Text>
              <TouchableOpacity onPress={() => setSelected(null)} accessibilityRole="button" accessibilityLabel={t("common.cancel")}>
                <Ionicons name="close" size={22} color={colors.muted} />
              </TouchableOpacity>
            </View>
            {selected && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 }}>
                  <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 18 }}>{initials(selected.name, selected.email)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground }}>{selected.name ?? "—"}</Text>
                      {daysSince(selected.created_at) < 7 && (
                        <View style={{ backgroundColor: "rgba(74,222,128,0.18)", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 }}>
                          <Text style={{ fontSize: 9, fontWeight: "800", color: colors.success }}>{t("admin.new")}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 13, color: colors.muted }}>{selected.email ?? "—"}</Text>
                  </View>
                </View>

                <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: colors.border, gap: 6 }}>
                  {selected.phone ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Ionicons name="call-outline" size={13} color={colors.muted} />
                      <Text style={{ fontSize: 13, color: colors.foreground }}>{selected.phone}</Text>
                    </View>
                  ) : null}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Ionicons name="calendar-outline" size={13} color={colors.muted} />
                    <Text style={{ fontSize: 13, color: colors.foreground }}>{t("admin.registered")} : {fmtDate(selected.created_at)}</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Ionicons name="restaurant-outline" size={13} color={colors.muted} />
                    <Text style={{ fontSize: 13, color: colors.foreground }}>{t("admin.totalBookings")} : {selected.total_bookings}</Text>
                  </View>
                  {selected.favorite_venue ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Ionicons name="location-outline" size={13} color={colors.muted} />
                      <Text style={{ fontSize: 13, color: colors.foreground }}>{t("admin.favoriteVenue")} : {selected.favorite_venue}</Text>
                    </View>
                  ) : null}
                </View>

                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 10 }}>{t("admin.history")}</Text>
                {historyLoading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : history.length === 0 ? (
                  <Text style={{ fontSize: 12, color: colors.muted }}>{t("admin.noHistory")}</Text>
                ) : history.map((h) => (
                  <View key={h.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.surface, borderRadius: 10, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: colors.border }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }} numberOfLines={1}>{h.venue_name}</Text>
                      <Text style={{ fontSize: 11, color: colors.muted }}>{h.date} · {h.time}</Text>
                    </View>
                    <View style={{ backgroundColor: colors.background, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ fontSize: 10, fontWeight: "700", color: colors.primary }}>{h.status}</Text>
                    </View>
                  </View>
                ))}
                <View style={{ height: 30 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function PartnerDashboardScreen() {
  const { t } = useTranslation();
  const { isDemoMode } = useDemo();
  const router = useRouter();
  const colors = useColors();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { profile } = useProfile(isDemoMode ? undefined : user?.id);
  const isAdmin = isDemoMode || profile?.role === "admin";
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "overview",     label: t("partner.tabOverview"),     icon: "📊" },
    { id: "reservations", label: t("partner.tabReservations"), icon: "📋" },
    { id: "availability", label: t("partner.tabAvailability"), icon: "📅" },
    { id: "tables",       label: t("partner.tabTables"),       icon: "🪑" },
    { id: "offers",       label: t("partner.tabOffers"),       icon: "👑" },
    { id: "photos",       label: "Photos",                     icon: "📷" },
    { id: "stats",        label: t("partner.tabStats"),        icon: "📈" },
    // Onglets réservés aux admins
    ...(isAdmin ? [
      { id: "vip-posts" as Tab, label: "Posts VIP", icon: "📸" },
      { id: "clients" as Tab, label: t("admin.clients"), icon: "👥" },
    ] : []),
  ];

  const partnerName = isDemoMode ? DEMO_PARTNER.name : "My Venue";

  // Hors démo : attendre la restauration de session avant de décider quoi que
  // ce soit (évite de traiter l'utilisateur comme déconnecté pendant le chargement).
  if (!isDemoMode && authLoading) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  // Session chargée mais pas connecté → inviter à se connecter (pas de redirection brutale)
  if (!isDemoMode && !isAuthenticated) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 }}>
          <Ionicons name="lock-closed-outline" size={40} color={colors.muted} />
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, textAlign: "center" }}>
            {t("partner.loginRequired") || "Connecte-toi pour accéder au dashboard partenaire"}
          </Text>
          <TouchableOpacity
            onPress={() => router.replace("/login")}
            style={{ marginTop: 8, backgroundColor: colors.primary, borderRadius: 50, paddingVertical: 12, paddingHorizontal: 28 }}
            activeOpacity={0.8}
          >
            <Text style={{ color: colors.onPrimary, fontWeight: "800", fontSize: 14 }}>{t("common.login") || "Se connecter"}</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{
          flexDirection: "row", alignItems: "center",
          paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
          gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border,
        }}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")} accessibilityRole="button" accessibilityLabel={t("common.back")}>
            <Ionicons name="chevron-back" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: colors.primary }}>{t("partner.title")}</Text>
            <Text style={{ fontSize: 11, color: colors.muted }}>{partnerName}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {isDemoMode && (
              <View style={{ backgroundColor: colors.background, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                <Text style={{ fontSize: 9, color: colors.primary, fontWeight: "700" }}>DEMO</Text>
              </View>
            )}
            <View style={{ backgroundColor: "rgba(74,222,128,0.15)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.success }}>{t("partner.online")}</Text>
            </View>
          </View>
        </View>

        {/* Tabs (scrollable horizontalement — jusqu'à 7 onglets) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8, gap: 6 }}
        >
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
              style={{
                width: 70, alignItems: "center", paddingVertical: 9, borderRadius: 10,
                backgroundColor: activeTab === tab.id ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: activeTab === tab.id ? colors.primary : colors.border,
                gap: 3,
              }}
            >
              <Ionicons name={iconFor(tab.icon)} size={16} color={activeTab === tab.id ? colors.onPrimary : colors.muted} />
              <Text style={{ fontSize: 9, fontWeight: "700", color: activeTab === tab.id ? colors.onPrimary : colors.muted }}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Content */}
        <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 12 }}>
          {activeTab === "overview"     && <OverviewTab     colors={colors} isDemo={isDemoMode} />}
          {activeTab === "reservations" && <ReservationsTab colors={colors} isDemo={isDemoMode} />}
          {activeTab === "availability" && <AvailabilityTab colors={colors} isDemo={isDemoMode} isAdmin={isAdmin} userId={user?.id} />}
          {activeTab === "tables"       && <TablesTab       colors={colors} isDemo={isDemoMode} isAdmin={isAdmin} userId={user?.id} />}
          {activeTab === "offers"       && <OffersTab       colors={colors} isDemo={isDemoMode} isAdmin={isAdmin} userId={user?.id} />}
          {activeTab === "photos"       && <PhotosTab       colors={colors} isDemo={isDemoMode} userId={user?.id} />}
          {activeTab === "stats"        && <StatsTab        colors={colors} isDemo={isDemoMode} />}
          {activeTab === "vip-posts"    && isAdmin && <VipPostsTab colors={colors} />}
          {activeTab === "clients"      && isAdmin && <ClientsTab colors={colors} isDemo={isDemoMode} />}
        </View>
      </View>
    </ScreenContainer>
  );
}
