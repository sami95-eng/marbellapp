import { useState, useEffect, useCallback } from "react";
import { ScrollView, Text, View, TouchableOpacity, FlatList, TextInput, Switch, ActivityIndicator, Alert, Platform } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useTranslation } from "react-i18next";
import { useDemo } from "@/lib/demo-context";
import { Image } from "expo-image";
import {
  DEMO_PARTNER, DEMO_RESERVATIONS, DEMO_VIP_OFFERS,
  DEMO_METRICS, DEMO_ACTIVITY, DEMO_MONTHLY, DEMO_TOP_OFFERS, DEMO_TABLES,
} from "@/constants/demo-data";
import { useVenueTables } from "@/hooks/use-tables";
import type { VenueTable } from "@/lib/tables-service";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { getManagedBookings, updateBookingStatus, updateBookingSchedule } from "@/lib/bookings-service";
import { getVenueBySlug } from "@/lib/venues-service";
import {
  getVenueSlots, createSlot, toggleSlot, deleteSlot, type AvailabilitySlot,
} from "@/lib/availability-service";

type Tab = "overview" | "reservations" | "availability" | "tables" | "offers" | "stats";

const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

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
            <Text style={{ fontSize: 22 }}>{m.icon}</Text>
            <Text style={{ fontSize: 22, fontWeight: "800", color: colors.primary, marginTop: 8 }}>{m.value}</Text>
            <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{m.label}</Text>
            <Text style={{ fontSize: 11, color: "#4ADE80", marginTop: 4, fontWeight: "600" }}>{m.trend}</Text>
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
          <Text style={{ fontSize: 20 }}>{a.icon}</Text>
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
};

function ReservationsTab({ colors, isDemo }: { colors: ReturnType<typeof useColors>; isDemo: boolean }) {
  const { t } = useTranslation();

  const statusColors: Record<string, string> = {
    confirmed: "#4ADE80",
    pending:   "#FBBF24",
    cancelled: "#EF4444",
    completed: "#D4AF37",
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
        <Text style={{ fontSize: 32 }}>⚠️</Text>
        <Text style={{ color: colors.muted, fontSize: 13, textAlign: "center" }}>{error}</Text>
        <TouchableOpacity onPress={load} style={{ marginTop: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>↻ {t("common.retry") || "Réessayer"}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const Field = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
      <Text style={{ fontSize: 12 }}>{icon}</Text>
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
          <TouchableOpacity onPress={load} activeOpacity={0.7} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 12 }}>↻</Text>
          </TouchableOpacity>
        </View>
      }
      ListEmptyComponent={
        <View style={{ paddingVertical: 40, alignItems: "center", gap: 8 }}>
          <Text style={{ fontSize: 32 }}>📋</Text>
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
                <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "700" }}>
                  {editingId === item.id ? "✕" : `✏️ ${t("partner.edit")}`}
                </Text>
              </TouchableOpacity>
            )}
            <View style={{
              backgroundColor: `${statusColors[item.status] ?? "#888"}20`,
              paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
            }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: statusColors[item.status] ?? "#888" }}>
                {statusLabel(item.status)}
              </Text>
            </View>
          </View>

          {/* Venue */}
          {item.venueName ? (
            <Text style={{ fontSize: 13, color: colors.primary, marginTop: 4, fontWeight: "700" }}>
              📍 {item.venueName}
            </Text>
          ) : null}

          {/* Détails complets */}
          <View style={{ marginTop: 8 }}>
            <View style={{ flexDirection: "row", gap: 16 }}>
              <Text style={{ fontSize: 12, color: colors.muted }}>📅 {item.date}</Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>🕐 {item.time}</Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>👥 {item.guests} {t("partner.persons")}</Text>
            </View>
            {item.phone ? <Field icon="📞" label="Tél" value={item.phone} /> : null}
            {item.userEmail ? <Field icon="✉️" label="Email" value={item.userEmail} /> : null}
            {item.tableName ? (
              <Field
                icon="🪑"
                label="Table"
                value={item.tableName + (item.tablePrice != null ? ` · From €${Number(item.tablePrice).toLocaleString()}` : "")}
              />
            ) : null}
            {item.confirmationNumber ? <Field icon="🔖" label="Réf" value={item.confirmationNumber} /> : null}
          </View>

          {/* Panneau d'édition date/heure */}
          {editingId === item.id && (
            <View style={{
              marginTop: 12, padding: 12, borderRadius: 12,
              backgroundColor: colors.background, borderWidth: 1, borderColor: "rgba(212,175,55,0.3)", gap: 10,
            }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.primary }}>📅 {t("partner.edit")}</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ fontSize: 10, color: colors.muted, fontWeight: "600" }}>{t("partner.dateLabel")}</Text>
                  <TextInput
                    value={editDate}
                    onChangeText={setEditDate}
                    placeholder="2026-06-20"
                    placeholderTextColor="#555"
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
                    placeholderTextColor="#555"
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
                    ? <ActivityIndicator color="#0A0E13" size="small" />
                    : <Text style={{ color: "#0A0E13", fontWeight: "800", fontSize: 13 }}>{t("partner.save")}</Text>}
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
                    style={{ flex: 1, backgroundColor: "#4ADE80", borderRadius: 10, paddingVertical: 11, alignItems: "center", opacity: busy ? 0.5 : 1 }}
                  >
                    {busy
                      ? <ActivityIndicator color="#0A0E13" size="small" />
                      : <Text style={{ color: "#0A0E13", fontWeight: "800", fontSize: 13 }}>✓ {t("partner.confirm")}</Text>}
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  disabled={busy}
                  onPress={() => decide(item, "cancelled")}
                  activeOpacity={0.8}
                  style={{ flex: 1, backgroundColor: "rgba(239,68,68,0.12)", borderWidth: 1, borderColor: "#EF4444", borderRadius: 10, paddingVertical: 11, alignItems: "center", opacity: busy ? 0.5 : 1 }}
                >
                  {busy && item.status === "confirmed"
                    ? <ActivityIndicator color="#EF4444" size="small" />
                    : <Text style={{ color: "#EF4444", fontWeight: "800", fontSize: 13 }}>
                        ✕ {item.status === "pending" ? t("partner.refuse") : t("partner.cancelBooking")}
                      </Text>}
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
// Availability Tab — créneaux jour/heure + capacité
// ─────────────────────────────────────────────────────────────────────────────
const DEMO_SLOTS: AvailabilitySlot[] = [
  { id: "ds1", venue_id: "demo", day_of_week: 5, time: "20:00", max_capacity: 12, current_bookings: 8, is_active: true, created_at: "" },
  { id: "ds2", venue_id: "demo", day_of_week: 5, time: "22:30", max_capacity: 12, current_bookings: 12, is_active: true, created_at: "" },
  { id: "ds3", venue_id: "demo", day_of_week: 6, time: "21:00", max_capacity: 16, current_bookings: 4, is_active: true, created_at: "" },
];

function AvailabilityTab({ colors, isDemo }: { colors: ReturnType<typeof useColors>; isDemo: boolean }) {
  const { t } = useTranslation();
  const [venueId, setVenueId] = useState<string | null>(null);
  const [slots, setSlots]     = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(!isDemo);
  const [error, setError]     = useState<string | null>(null);
  const [saving, setSaving]   = useState(false);
  const [form, setForm] = useState({ day_of_week: 5, time: "21:00", max_capacity: 10 });

  const notify = (m: string) => { if (Platform.OS === "web") window.alert(m); else Alert.alert(m); };

  const load = useCallback(async () => {
    if (isDemo) { setSlots(DEMO_SLOTS); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const venue = await getVenueBySlug(DEMO_PARTNER.slug);
      setVenueId(venue?.id ?? null);
      if (venue?.id) setSlots(await getVenueSlots(venue.id));
      else setError(t("partner.noVenueBinding") || "Aucune venue liée à ce compte.");
    } catch (e: any) { setError(e.message ?? "Erreur de chargement"); }
    finally { setLoading(false); }
  }, [isDemo]);

  useEffect(() => { load(); }, [load]);

  const addSlot = async () => {
    if (!/^\d{1,2}:\d{2}$/.test(form.time)) { notify(t("partner.slotTimeFormat") || "Heure au format HH:MM."); return; }
    if (isDemo) {
      setSlots((p) => [...p, { id: `d-${Date.now()}`, venue_id: "demo", ...form, current_bookings: 0, is_active: true, created_at: "" }]);
      return;
    }
    if (!venueId) { notify(t("partner.noVenueBinding") || "Aucune venue liée."); return; }
    setSaving(true);
    try {
      const s = await createSlot({ venue_id: venueId, ...form });
      setSlots((p) => [...p, s]);
    } catch (e: any) { notify(e.message ?? "Échec de l'ajout"); }
    finally { setSaving(false); }
  };

  const toggle = async (s: AvailabilitySlot) => {
    setSlots((p) => p.map((x) => (x.id === s.id ? { ...x, is_active: !x.is_active } : x)));
    if (!isDemo) { try { await toggleSlot(s.id, !s.is_active); } catch (e: any) { notify(e.message); load(); } }
  };
  const remove = async (s: AvailabilitySlot) => {
    setSlots((p) => p.filter((x) => x.id !== s.id));
    if (!isDemo) { try { await deleteSlot(s.id); } catch (e: any) { notify(e.message); load(); } }
  };

  if (loading) {
    return <View style={{ paddingVertical: 40, alignItems: "center" }}><ActivityIndicator color={colors.primary} /></View>;
  }

  const byDay = [...slots].sort((a, b) => a.day_of_week - b.day_of_week || a.time.localeCompare(b.time));

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Formulaire d'ajout */}
      <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "rgba(212,175,55,0.3)", gap: 12 }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary }}>📅 {t("partner.addSlot") || "Nouveau créneau"}</Text>

        {/* Jour */}
        <Text style={{ fontSize: 10, color: colors.muted, fontWeight: "600" }}>{t("partner.slotDay") || "JOUR"}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {DAY_LABELS.map((d, i) => (
            <TouchableOpacity key={i} onPress={() => setForm((f) => ({ ...f, day_of_week: i }))}
              style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: form.day_of_week === i ? colors.primary : colors.background, borderWidth: 1, borderColor: form.day_of_week === i ? colors.primary : colors.border }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: form.day_of_week === i ? "#0A0E13" : colors.muted }}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          {/* Heure */}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, color: colors.muted, fontWeight: "600", marginBottom: 4 }}>{t("partner.slotTime") || "HEURE"}</Text>
            <TextInput value={form.time} onChangeText={(v) => setForm((f) => ({ ...f, time: v }))} placeholder="21:00" placeholderTextColor="#555"
              style={{ backgroundColor: colors.background, color: colors.foreground, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, fontSize: 14, borderWidth: 1, borderColor: colors.border }} />
          </View>
          {/* Capacité */}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, color: colors.muted, fontWeight: "600", marginBottom: 4 }}>{t("partner.slotCapacity") || "CAPACITÉ MAX"}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <TouchableOpacity onPress={() => setForm((f) => ({ ...f, max_capacity: Math.max(1, f.max_capacity - 1) }))} style={{ backgroundColor: colors.primary, borderRadius: 8, width: 30, height: 30, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#0A0E13", fontWeight: "800" }}>−</Text>
              </TouchableOpacity>
              <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16, minWidth: 28, textAlign: "center" }}>{form.max_capacity}</Text>
              <TouchableOpacity onPress={() => setForm((f) => ({ ...f, max_capacity: f.max_capacity + 1 }))} style={{ backgroundColor: colors.primary, borderRadius: 8, width: 30, height: 30, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#0A0E13", fontWeight: "800" }}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity onPress={addSlot} disabled={saving} style={{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, alignItems: "center", opacity: saving ? 0.6 : 1 }}>
          {saving ? <ActivityIndicator color="#0A0E13" /> : <Text style={{ color: "#0A0E13", fontWeight: "800", fontSize: 14 }}>{t("partner.addSlot") || "Ajouter le créneau"}</Text>}
        </TouchableOpacity>
      </View>

      {error && (
        <View style={{ paddingVertical: 8, marginBottom: 8 }}>
          <Text style={{ color: colors.muted, fontSize: 12, textAlign: "center" }}>{error}</Text>
        </View>
      )}

      {/* Liste des créneaux */}
      {byDay.length === 0 ? (
        <View style={{ alignItems: "center", paddingVertical: 30, gap: 8 }}>
          <Text style={{ fontSize: 32 }}>📅</Text>
          <Text style={{ color: colors.muted, fontSize: 13 }}>{t("partner.noSlots") || "Aucun créneau défini"}</Text>
        </View>
      ) : byDay.map((s) => {
        const full = s.current_bookings >= s.max_capacity;
        return (
          <View key={s.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: s.is_active ? colors.border : "rgba(239,68,68,0.25)", opacity: s.is_active ? 1 : 0.6 }}>
            <View style={{ alignItems: "center", width: 48 }}>
              <Text style={{ fontSize: 12, fontWeight: "800", color: colors.primary }}>{DAY_LABELS[s.day_of_week]}</Text>
              <Text style={{ fontSize: 15, fontWeight: "800", color: colors.foreground }}>{s.time}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: colors.foreground, fontWeight: "600" }}>
                {s.current_bookings}/{s.max_capacity} {t("partner.slotBooked") || "réservés"}
              </Text>
              <Text style={{ fontSize: 11, color: full ? "#EF4444" : "#4ADE80", marginTop: 2, fontWeight: "700" }}>
                {full ? (t("partner.slotFullLabel") || "Complet") : `${s.max_capacity - s.current_bookings} ${t("booking.slotsLeft") || "restant(s)"}`}
              </Text>
            </View>
            <Switch value={s.is_active} onValueChange={() => toggle(s)} trackColor={{ false: "#3A3A3A", true: "#D4AF37" }} style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }} />
            <TouchableOpacity onPress={() => remove(s)} style={{ padding: 4 }}>
              <Text style={{ fontSize: 14, color: "#EF4444" }}>🗑</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Offers Tab
// ─────────────────────────────────────────────────────────────────────────────
function OffersTab({ colors, isDemo }: { colors: ReturnType<typeof useColors>; isDemo: boolean }) {
  const { t } = useTranslation();
  const typeIcon: Record<string, string> = { table: "🪑", bed: "🛏️", bottle: "🍾" };

  const offers = isDemo ? DEMO_VIP_OFFERS : DEMO_VIP_OFFERS.slice(0, 1);

  return (
    <FlatList
      data={offers}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
      ListHeaderComponent={
        <TouchableOpacity style={{
          backgroundColor: colors.primary, borderRadius: 12, padding: 14,
          alignItems: "center", marginBottom: 16, flexDirection: "row",
          justifyContent: "center", gap: 8,
        }}>
          <Text style={{ fontSize: 16 }}>+</Text>
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#0A0E13" }}>
            {t("partner.createOffer")}
          </Text>
        </TouchableOpacity>
      }
      renderItem={({ item }) => (
        <View style={{
          backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 10,
          borderWidth: 1,
          borderColor: item.active ? colors.border : "rgba(239,68,68,0.2)",
          opacity: item.active ? 1 : 0.6,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Text style={{ fontSize: 24 }}>{typeIcon[item.type] ?? "🎫"}</Text>
              <View>
                <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>{item.title}</Text>
                <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "600" }}>{item.type}</Text>
              </View>
            </View>
            <View style={{
              backgroundColor: item.active ? "rgba(74,222,128,0.15)" : "rgba(239,68,68,0.15)",
              paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
            }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: item.active ? "#4ADE80" : "#EF4444" }}>
                {item.active ? t("partner.active") : t("partner.inactive")}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", marginTop: 10, gap: 16, alignItems: "center" }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primary }}>€{item.vipPrice}</Text>
            <Text style={{ fontSize: 11, color: "#888", textDecorationLine: "line-through" }}>€{item.originalPrice}</Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>{item.spotsLeft} {t("partner.spotsLeft")}</Text>
          </View>
        </View>
      )}
    />
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

function TablesTab({ colors, isDemo }: { colors: ReturnType<typeof useColors>; isDemo: boolean }) {
  const { data: supabaseTables, loading, toggle, create, remove } = useVenueTables(
    isDemo ? "" : DEMO_PARTNER.slug
  );
  const [localDemoTables, setLocalDemoTables] = useState<VenueTable[]>(
    DEMO_TABLES as VenueTable[]
  );
  const tables = isDemo ? localDemoTables : supabaseTables;

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const handleToggle = async (id: string, active: boolean) => {
    if (isDemo) {
      setLocalDemoTables((prev) => prev.map((t) => t.id === id ? { ...t, is_active: active } : t));
      return;
    }
    await toggle(id, active);
  };

  const handleDelete = async (id: string) => {
    if (isDemo) {
      setLocalDemoTables((prev) => prev.filter((t) => t.id !== id));
      return;
    }
    await remove(id);
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
          sort_order: localDemoTables.length + 1,
          created_at: new Date().toISOString(),
        };
        setLocalDemoTables((prev) => [...prev, newTable]);
      } else {
        // In production, we'd need the real venue UUID — for now use demo slug
        // await create(REAL_VENUE_UUID, form);
      }
      setForm({ ...EMPTY_FORM });
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
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
        <Text style={{ fontSize: 16, color: showForm ? colors.muted : "#0A0E13" }}>
          {showForm ? "✕" : "+"}
        </Text>
        <Text style={{ fontSize: 14, fontWeight: "700", color: showForm ? colors.muted : "#0A0E13" }}>
          {showForm ? "Cancel" : "Add New Table"}
        </Text>
      </TouchableOpacity>

      {/* Inline add form */}
      {showForm && (
        <View style={{
          backgroundColor: colors.surface, borderRadius: 16, padding: 16,
          marginBottom: 16, borderWidth: 1, borderColor: "rgba(212,175,55,0.3)",
          gap: 12,
        }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary, marginBottom: 4 }}>
            🪑 New Table
          </Text>

          {/* Name */}
          <View>
            <Text style={{ fontSize: 10, color: colors.muted, marginBottom: 4, fontWeight: "600" }}>TABLE NAME *</Text>
            <TextInput
              value={form.name}
              onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
              placeholder="e.g. VIP Cabana"
              placeholderTextColor="#444"
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
              placeholderTextColor="#444"
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
                  <Text style={{ color: "#0A0E13", fontWeight: "700" }}>−</Text>
                </TouchableOpacity>
                <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16, width: 24, textAlign: "center" }}>{form.capacity_min}</Text>
                <TouchableOpacity onPress={() => setForm((p) => ({ ...p, capacity_min: p.capacity_min + 1 }))}
                  style={{ backgroundColor: colors.primary, borderRadius: 8, width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: "#0A0E13", fontWeight: "700" }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, color: colors.muted, marginBottom: 4, fontWeight: "600" }}>MAX GUESTS</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <TouchableOpacity onPress={() => setForm((p) => ({ ...p, capacity_max: Math.max(p.capacity_min, p.capacity_max - 1) }))}
                  style={{ backgroundColor: colors.primary, borderRadius: 8, width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: "#0A0E13", fontWeight: "700" }}>−</Text>
                </TouchableOpacity>
                <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16, width: 24, textAlign: "center" }}>{form.capacity_max}</Text>
                <TouchableOpacity onPress={() => setForm((p) => ({ ...p, capacity_max: p.capacity_max + 1 }))}
                  style={{ backgroundColor: colors.primary, borderRadius: 8, width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: "#0A0E13", fontWeight: "700" }}>+</Text>
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
              placeholderTextColor="#444"
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
              placeholderTextColor="#444"
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
              trackColor={{ false: "#3A3A3A", true: "#D4AF37" }}
            />
          </View>

          {/* Save button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving || !form.name.trim()}
            style={{
              backgroundColor: form.name.trim() ? colors.primary : "#333",
              borderRadius: 12, paddingVertical: 13, alignItems: "center", marginTop: 4,
            }}
          >
            {saving ? (
              <ActivityIndicator color="#0A0E13" />
            ) : (
              <Text style={{ color: "#0A0E13", fontWeight: "700", fontSize: 14 }}>Save Table</Text>
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
          <Text style={{ fontSize: 36 }}>🪑</Text>
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
            borderColor: table.is_active ? colors.border : "rgba(239,68,68,0.2)",
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
                    <Text style={{ fontSize: 28 }}>🪑</Text>
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
                    <View style={{ backgroundColor: "rgba(212,175,55,0.2)", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 9, color: "#D4AF37", fontWeight: "700" }}>VIP</Text>
                    </View>
                  )}
                </View>
                <Text style={{ color: colors.muted, fontSize: 11 }}>
                  👥 {table.capacity_min}–{table.capacity_max} guests
                </Text>
                <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 12 }}>
                  From €{table.price_min.toLocaleString()}
                  {table.price_max ? ` · Max €${table.price_max.toLocaleString()}` : ""}
                </Text>
              </View>

              {/* Controls */}
              <View style={{ padding: 12, alignItems: "flex-end", justifyContent: "space-between" }}>
                <Switch
                  value={table.is_active}
                  onValueChange={(v) => handleToggle(table.id, v)}
                  trackColor={{ false: "#3A3A3A", true: "#D4AF37" }}
                  style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                />
                <TouchableOpacity
                  onPress={() => handleDelete(table.id)}
                  style={{ padding: 4 }}
                >
                  <Text style={{ fontSize: 14, color: "#EF4444" }}>🗑</Text>
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
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function PartnerDashboardScreen() {
  const { t } = useTranslation();
  const { isDemoMode } = useDemo();
  const router = useRouter();
  const colors = useColors();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "overview",     label: t("partner.tabOverview"),     icon: "📊" },
    { id: "reservations", label: t("partner.tabReservations"), icon: "📋" },
    { id: "availability", label: t("partner.tabAvailability"), icon: "📅" },
    { id: "tables",       label: t("partner.tabTables"),       icon: "🪑" },
    { id: "offers",       label: t("partner.tabOffers"),       icon: "👑" },
    { id: "stats",        label: t("partner.tabStats"),        icon: "📈" },
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
          <Text style={{ fontSize: 40 }}>🔒</Text>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, textAlign: "center" }}>
            {t("partner.loginRequired") || "Connecte-toi pour accéder au dashboard partenaire"}
          </Text>
          <TouchableOpacity
            onPress={() => router.replace("/login")}
            style={{ marginTop: 8, backgroundColor: colors.primary, borderRadius: 50, paddingVertical: 12, paddingHorizontal: 28 }}
            activeOpacity={0.8}
          >
            <Text style={{ color: "#0A0E13", fontWeight: "800", fontSize: 14 }}>{t("common.login") || "Se connecter"}</Text>
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
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}>
            <Text style={{ color: colors.primary, fontSize: 15 }}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: colors.primary }}>{t("partner.title")}</Text>
            <Text style={{ fontSize: 11, color: colors.muted }}>{partnerName}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {isDemoMode && (
              <View style={{ backgroundColor: "rgba(212,175,55,0.15)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                <Text style={{ fontSize: 9, color: "#D4AF37", fontWeight: "700" }}>DEMO</Text>
              </View>
            )}
            <View style={{ backgroundColor: "rgba(74,222,128,0.15)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#4ADE80" }}>{t("partner.online")}</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: "row", paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8, gap: 6 }}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
              style={{
                flex: 1, alignItems: "center", paddingVertical: 9, borderRadius: 10,
                backgroundColor: activeTab === tab.id ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: activeTab === tab.id ? colors.primary : colors.border,
                gap: 3,
              }}
            >
              <Text style={{ fontSize: 14 }}>{tab.icon}</Text>
              <Text style={{ fontSize: 9, fontWeight: "700", color: activeTab === tab.id ? "#0A0E13" : colors.muted }}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 12 }}>
          {activeTab === "overview"     && <OverviewTab     colors={colors} isDemo={isDemoMode} />}
          {activeTab === "reservations" && <ReservationsTab colors={colors} isDemo={isDemoMode} />}
          {activeTab === "availability" && <AvailabilityTab colors={colors} isDemo={isDemoMode} />}
          {activeTab === "tables"       && <TablesTab       colors={colors} isDemo={isDemoMode} />}
          {activeTab === "offers"       && <OffersTab       colors={colors} isDemo={isDemoMode} />}
          {activeTab === "stats"        && <StatsTab        colors={colors} isDemo={isDemoMode} />}
        </View>
      </View>
    </ScreenContainer>
  );
}
