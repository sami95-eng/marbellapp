import { ScrollView, Text, View, TouchableOpacity, Alert, Platform, Modal, TextInput, ActivityIndicator, Linking } from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { useBookings } from "@/hooks/use-bookings";
import { useNotifications } from "@/lib/notifications-context";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { Image } from "expo-image";
import { getUserVipStatus, submitPost, type VipStatus } from "@/lib/vip-service";

type IoniconName = keyof typeof Ionicons.glyphMap;

const BADGES: { icon: IoniconName; name: string; unlocked: boolean }[] = [
  { icon: "compass-outline",    name: "Explorer",    unlocked: true },
  { icon: "sparkles-outline",   name: "Party Goer",  unlocked: true },
  { icon: "restaurant-outline", name: "Foodie",      unlocked: true },
  { icon: "umbrella-outline",   name: "Beach Lover", unlocked: true },
  { icon: "diamond-outline",    name: "VIP",         unlocked: false },
  { icon: "boat-outline",       name: "Yacht Life",  unlocked: false },
];

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const { user, logout } = useAuth();
  const { profile } = useProfile(user?.id);
  const { bookings } = useBookings(user?.id);
  const { unreadCount } = useNotifications();

  // ── VIP Instagram ────────────────────────────────────────────────
  const [vipStatus, setVipStatus] = useState<VipStatus | null>(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [postUrl, setPostUrl] = useState("");
  const [igHandle, setIgHandle] = useState("");
  const [agreed, setAgreed] = useState(false);
  const urlValid = postUrl.trim().toLowerCase().includes("instagram.com");

  const reloadVip = () => {
    if (!user?.id) { setVipStatus(null); return; }
    getUserVipStatus(user.id).then(setVipStatus).catch(() => {});
  };
  useEffect(() => {
    if (!user?.id) { setVipStatus(null); return; }
    let cancelled = false;
    getUserVipStatus(user.id).then((s) => { if (!cancelled) setVipStatus(s); }).catch(() => {});
    return () => { cancelled = true; };
  }, [user?.id]);

  const vipNotify = (m: string) => { if (Platform.OS === "web") window.alert(m); else Alert.alert(m); };
  const handleSubmitPost = async () => {
    if (!postUrl.trim()) { vipNotify("Colle l'URL de ton post Instagram."); return; }
    if (!urlValid) { vipNotify("L'URL doit être un lien Instagram (contenir « instagram.com »)."); return; }
    if (!agreed) { vipNotify("Coche la case confirmant que tu as respecté les conditions."); return; }
    setSubmitting(true);
    try {
      await submitPost(postUrl, igHandle);
      setPostUrl(""); setIgHandle(""); setAgreed(false); setShowSubmit(false);
      reloadVip();
      vipNotify("Post soumis ! Il sera validé par l'équipe.");
    } catch (e: any) {
      vipNotify(e.message ?? "Échec de l'envoi.");
    } finally {
      setSubmitting(false);
    }
  };

  const completedCount = bookings.filter((b) => b.status === "completed" || b.status === "confirmed").length;

  const STATS: { label: string; value: string; icon: IoniconName }[] = [
    { label: t("profile.experiences"), value: completedCount > 0 ? String(completedCount) : "0", icon: "sparkles-outline" },
    { label: t("profile.photos"),        value: "47", icon: "camera-outline" },
    { label: t("profile.partnerPosts"),  value: vipStatus ? String(vipStatus.post_count) : "0", icon: "pricetag-outline" },
  ];

  const MENU_ITEMS: { label: string; icon: IoniconName; route: string | null }[] = [
    { label: t("profile.myReservations"), icon: "list-outline", route: "/my-reservations" },
    { label: t("profile.favorites"), icon: "heart-outline", route: "/favorites" },
    { label: t("profile.notifications"), icon: "notifications-outline", route: "/notifications" },
    { label: t("profile.settings"), icon: "settings-outline", route: "/settings" },
    { label: t("profile.helpSupport"), icon: "chatbubble-ellipses-outline", route: null },
  ];

  const doLogout = async () => {
    console.log("[Profile] doLogout: step 1 — calling supabase.auth.signOut()");
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("[Profile] signOut error:", error.message);
    } else {
      console.log("[Profile] signOut OK");
    }

    if (typeof window !== "undefined") {
      try {
        const keyCount = window.localStorage.length;
        window.localStorage.clear();
        window.sessionStorage.clear();
        console.log("[Profile] cleared localStorage (" + keyCount + " keys) + sessionStorage");
      } catch (e) {
        console.error("[Profile] storage clear error:", e);
      }
      console.log("[Profile] redirecting → /login via window.location.href");
      window.location.href = window.location.origin + "/login";
    } else {
      console.log("[Profile] native: router.replace('/login')");
      router.replace("/login");
    }
  };

  const handleLogout = () => {
    if (Platform.OS === "web") {
      console.log("[Profile] handleLogout called (web)");
      doLogout();
      return;
    }
    Alert.alert(
      t("common.signOut"),
      t("common.signOutConfirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("common.signOut"), style: "destructive", onPress: doLogout },
      ]
    );
  };

  const displayName   = profile?.display_name || user?.name || "Marbella Member";
  const displayHandle = profile?.instagram_handle
    ? `@${profile.instagram_handle.replace(/^@/, "")}`
    : user?.email ? `@${user.email.split("@")[0]}` : "@marbella";
  const avatarUrl = profile?.avatar_url ?? null;

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>
          <Text style={{ fontSize: 28, fontWeight: "800", color: colors.foreground }}>
            {t("profile.title")}
          </Text>
        </View>

        {/* Profile Card */}
        <View style={{
          marginHorizontal: 20, marginTop: 14,
          backgroundColor: colors.surface, borderRadius: 20, padding: 24,
          alignItems: "center", borderWidth: 1, borderColor: colors.border,
        }}>
          <View style={{
            width: 88, height: 88, borderRadius: 44,
            backgroundColor: colors.background,
            alignItems: "center", justifyContent: "center",
            borderWidth: 3, borderColor: colors.primary,
            overflow: "hidden",
          }}>
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                transition={300}
              />
            ) : (
              <Ionicons name="person" size={44} color={colors.muted} />
            )}
          </View>
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.foreground, marginTop: 12 }}>
            {displayName}
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2, fontWeight: "600" }}>
            {displayHandle}
          </Text>
          {profile?.bio && (
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 6, textAlign: "center", paddingHorizontal: 16 }}>
              {profile.bio}
            </Text>
          )}
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 6, textAlign: "center", paddingHorizontal: 20 }}>
            {t("profile.member")}
          </Text>
          <View style={{
            marginTop: 14, flexDirection: "row", alignItems: "center", gap: 6,
            backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
            paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
          }}>
            <Ionicons name="ribbon-outline" size={14} color={colors.primary} />
            <Text style={{ fontSize: 12, fontWeight: "700", color: colors.foreground }}>
              {vipStatus ? `${vipStatus.tier.label} Member` : "Member"}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/edit-profile")}
            style={{ marginTop: 16, backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 10, borderRadius: 12 }}
          >
            <Text style={{ color: colors.background, fontWeight: "700", fontSize: 13 }}>{t("profile.editProfile")}</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: "row", paddingHorizontal: 20, gap: 10, marginTop: 16 }}>
          {STATS.map((stat) => (
            <View key={stat.label} style={{
              flex: 1, backgroundColor: colors.surface, borderRadius: 14, padding: 14,
              alignItems: "center", borderWidth: 1, borderColor: colors.border,
            }}>
              <Ionicons name={stat.icon} size={18} color={colors.muted} />
              <Text style={{ fontSize: 20, fontWeight: "800", color: colors.foreground, marginTop: 4 }}>{stat.value}</Text>
              <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Statut VIP */}
        <View style={{ paddingHorizontal: 20, marginTop: 22 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>Statut VIP</Text>
            <TouchableOpacity onPress={() => { setAgreed(false); setShowSubmit(true); }} activeOpacity={0.8}
              style={{
                flexDirection: "row", alignItems: "center", gap: 4,
                backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
                paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
              }}>
              <Ionicons name="add" size={14} color={colors.foreground} />
              <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 12 }}>Soumettre un post</Text>
            </TouchableOpacity>
          </View>

          {/* Carte palier + progression */}
          <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{
                  width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center",
                  backgroundColor: (vipStatus?.tier.color ?? "#CD7F32") + "33",
                  borderWidth: 2, borderColor: vipStatus?.tier.color ?? "#CD7F32",
                }}>
                  <Ionicons name="ribbon-outline" size={18} color={vipStatus?.tier.color ?? colors.muted} />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: "800", color: vipStatus?.tier.color ?? colors.foreground }}>
                    {vipStatus?.tier.label ?? "Bronze"}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.muted }}>
                    {vipStatus ? `${vipStatus.post_count} post${vipStatus.post_count !== 1 ? "s" : ""} approuvé${vipStatus.post_count !== 1 ? "s" : ""}` : "…"}
                  </Text>
                </View>
              </View>
              {vipStatus && vipStatus.discount_pct > 0 ? (
                <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.success, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ color: colors.success, fontWeight: "700", fontSize: 12 }}>-{vipStatus.discount_pct}%</Text>
                </View>
              ) : null}
            </View>

            {vipStatus?.nextTier ? (
              <View style={{ marginTop: 14 }}>
                <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: "hidden" }}>
                  <View style={{
                    height: "100%", backgroundColor: vipStatus.nextTier.color,
                    width: `${Math.max(4, Math.min(100, Math.round(((vipStatus.post_count - vipStatus.tier.min_posts) / Math.max(1, vipStatus.nextTier.min_posts - vipStatus.tier.min_posts)) * 100)))}%`,
                  }} />
                </View>
                <Text style={{ fontSize: 11, color: colors.muted, marginTop: 6 }}>
                  Encore {Math.max(0, vipStatus.nextTier.min_posts - vipStatus.post_count)} post(s) pour {vipStatus.nextTier.label} (-{vipStatus.nextTier.discount_pct}%)
                </Text>
              </View>
            ) : vipStatus ? (
              <Text style={{ fontSize: 11, color: colors.muted, marginTop: 12 }}>Palier maximum atteint.</Text>
            ) : null}
          </View>

          {/* Posts soumis */}
          {vipStatus && vipStatus.posts.length > 0 && (
            <View style={{ marginTop: 12, gap: 8 }}>
              {vipStatus.posts.map((p) => {
                const sc = p.status === "approved" ? colors.success : p.status === "rejected" ? colors.error : colors.warning;
                const sl = p.status === "approved" ? "Approuvé" : p.status === "rejected" ? "Rejeté" : "En attente";
                return (
                  <View key={p.id} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border }}>
                    <TouchableOpacity style={{ flex: 1, marginRight: 10 }} onPress={() => Linking.openURL(p.post_url).catch(() => {})} activeOpacity={0.7}>
                      <Text style={{ fontSize: 12, color: colors.foreground }} numberOfLines={1}>{p.post_url}</Text>
                      <Text style={{ fontSize: 10, color: colors.muted, marginTop: 2 }}>
                        {new Date(p.submitted_at).toLocaleDateString("fr-FR")}
                      </Text>
                    </TouchableOpacity>
                    <View style={{ backgroundColor: sc + "22", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                      <Text style={{ color: sc, fontWeight: "700", fontSize: 11 }}>{sl}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Badges */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
            {t("profile.badges")}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {BADGES.map((badge) => (
              <View key={badge.name} style={{
                backgroundColor: badge.unlocked ? colors.surface : colors.background,
                borderRadius: 14, padding: 12, alignItems: "center", width: 90,
                borderWidth: 1, borderColor: colors.border,
                opacity: badge.unlocked ? 1 : 0.4,
              }}>
                <Ionicons name={badge.icon} size={26} color={badge.unlocked ? colors.foreground : colors.muted} />
                <Text style={{
                  fontSize: 10, color: badge.unlocked ? colors.foreground : colors.muted,
                  textAlign: "center", fontWeight: "600", marginTop: 4,
                }}>{badge.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Menu */}
        <View style={{ paddingHorizontal: 20, marginTop: 20, gap: 8 }}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => item.route && router.push(item.route as any)}
              activeOpacity={0.7}
              style={{
                backgroundColor: colors.surface, borderRadius: 14, padding: 16,
                flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                borderWidth: 1, borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Ionicons name={item.icon} size={18} color={colors.foreground} />
                <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>
                  {item.label}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {item.route === "/notifications" && unreadCount > 0 && (
                  <View style={{
                    backgroundColor: colors.error, borderRadius: 11, minWidth: 22, height: 22,
                    paddingHorizontal: 6, alignItems: "center", justifyContent: "center",
                  }}>
                    <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800" }}>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleLogout}
            style={{
              backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.error,
              borderRadius: 14, padding: 16, alignItems: "center", marginTop: 4,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.error }}>
              {t("profile.signOut")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal : soumettre un post VIP */}
      <Modal visible={showSubmit} transparent animationType="slide" onRequestClose={() => setShowSubmit(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, borderWidth: 1, borderColor: colors.border, gap: 14 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground }}>Soumettre un post</Text>
              <TouchableOpacity onPress={() => setShowSubmit(false)} accessibilityRole="button" accessibilityLabel={t("common.cancel")}>
                <Ionicons name="close" size={22} color={colors.muted} />
              </TouchableOpacity>
            </View>
            {/* Mini-tuto */}
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: "800", color: colors.foreground }}>Comment gagner des points VIP ?</Text>
              {[
                { n: "1", text: "Suis @marbellapp sur Instagram (obligatoire — c'est ainsi qu'on peut voir ton post même si ton compte est privé)" },
                { n: "2", text: "Publie une vraie photo ou un vrai post pris sur place, dans l'établissement que tu as visité à Marbella. Les montages, reposts ou photos génériques ne seront pas validés." },
                { n: "3", text: "Ajoute #marbellappvip dans ta légende" },
                { n: "4", text: "Ouvre le post → ••• → « Copier le lien »" },
                { n: "5", text: "Colle le lien ci-dessous et envoie" },
              ].map((s) => (
                <View key={s.n} style={{
                  flexDirection: "row", gap: 10, alignItems: "flex-start",
                  backgroundColor: colors.surface, borderRadius: 12, padding: 10,
                  borderWidth: 1, borderColor: colors.border,
                }}>
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: colors.background, fontWeight: "800", fontSize: 12 }}>{s.n}</Text>
                  </View>
                  <Text style={{ flex: 1, fontSize: 12, color: colors.foreground, lineHeight: 17 }}>{s.text}</Text>
                </View>
              ))}
            </View>

            {/* Conditions */}
            <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border, gap: 4 }}>
              <Text style={{ fontSize: 12, color: colors.foreground, fontWeight: "700", marginBottom: 2 }}>Conditions à respecter</Text>
              <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 18 }}>
                • Je suis{" "}
                <Text
                  style={{ color: colors.primary, fontWeight: "700" }}
                  onPress={() => Linking.openURL("https://www.instagram.com/marbellapp").catch(() => {})}
                >
                  @marbellapp
                </Text>
                {" "}sur Instagram
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 18 }}>• Mon post contient #marbellappvip</Text>
              <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 18 }}>• Ma vraie photo ou mon vrai post a été pris sur place dans l'établissement visité</Text>
            </View>

            {/* Case à cocher obligatoire */}
            <TouchableOpacity
              onPress={() => setAgreed((v) => !v)}
              activeOpacity={0.7}
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <View style={{
                width: 22, height: 22, borderRadius: 6, borderWidth: 2,
                borderColor: agreed ? colors.primary : colors.border,
                backgroundColor: agreed ? colors.primary : "transparent",
                alignItems: "center", justifyContent: "center",
              }}>
                {agreed ? <Ionicons name="checkmark" size={14} color={colors.background} /> : null}
              </View>
              <Text style={{ fontSize: 13, color: colors.foreground, flex: 1 }}>
                J'ai respecté toutes les conditions
              </Text>
            </TouchableOpacity>

            <View>
              <Text style={{ fontSize: 10, color: colors.muted, fontWeight: "700", marginBottom: 4 }}>URL DU POST *</Text>
              <TextInput value={postUrl} onChangeText={setPostUrl} placeholder="https://instagram.com/p/..." placeholderTextColor={colors.muted} autoCapitalize="none"
                style={{ backgroundColor: colors.surface, color: colors.foreground, borderRadius: 12, padding: 12, fontSize: 14, borderWidth: 1, borderColor: (postUrl.trim() && !urlValid) ? colors.error : colors.border }} />
              {postUrl.trim() && !urlValid ? (
                <Text style={{ fontSize: 11, color: colors.error, marginTop: 4 }}>Le lien doit contenir « instagram.com ».</Text>
              ) : null}
            </View>
            <View>
              <Text style={{ fontSize: 10, color: colors.muted, fontWeight: "700", marginBottom: 4 }}>@INSTAGRAM</Text>
              <TextInput value={igHandle} onChangeText={setIgHandle} placeholder="@ton_compte" placeholderTextColor={colors.muted} autoCapitalize="none"
                style={{ backgroundColor: colors.surface, color: colors.foreground, borderRadius: 12, padding: 12, fontSize: 14, borderWidth: 1, borderColor: colors.border }} />
            </View>
            <TouchableOpacity onPress={handleSubmitPost} disabled={submitting || !urlValid || !agreed} activeOpacity={0.85}
              style={{ backgroundColor: (urlValid && agreed) ? colors.primary : colors.surface, borderRadius: 50, paddingVertical: 14, alignItems: "center", marginTop: 4 }}>
              {submitting ? <ActivityIndicator color={colors.background} /> : <Text style={{ color: (urlValid && agreed) ? colors.background : colors.muted, fontWeight: "800", fontSize: 15 }}>Envoyer</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
