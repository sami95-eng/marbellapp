import { ScrollView, Text, View, TouchableOpacity, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { useBookings } from "@/hooks/use-bookings";
import { useNotifications } from "@/lib/notifications-context";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { Image } from "expo-image";

const BADGES = [
  { emoji: "🌟", name: "Explorer", unlocked: true },
  { emoji: "🎉", name: "Party Goer", unlocked: true },
  { emoji: "🍽️", name: "Foodie", unlocked: true },
  { emoji: "🏖️", name: "Beach Lover", unlocked: true },
  { emoji: "💎", name: "VIP", unlocked: false },
  { emoji: "🛥️", name: "Yacht Life", unlocked: false },
];

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const { user, logout } = useAuth();
  const { profile } = useProfile(user?.id);
  const { bookings } = useBookings(user?.id);
  const { unreadCount } = useNotifications();

  const completedCount = bookings.filter((b) => b.status === "completed" || b.status === "confirmed").length;

  const STATS = [
    { label: t("profile.experiences"), value: completedCount > 0 ? String(completedCount) : "0", icon: "✨" },
    { label: t("profile.photos"),      value: "47",   icon: "📸" },
    { label: t("profile.followers"),   value: "3.2K", icon: "👥" },
  ];

  const MENU_ITEMS = [
    { label: t("profile.myReservations"), icon: "📋", route: "/my-reservations" },
    { label: t("profile.favorites"), icon: "❤️", route: "/favorites" },
    { label: t("profile.notifications"), icon: "🔔", route: "/notifications" },
    { label: t("profile.settings"), icon: "⚙️", route: "/settings" },
    { label: t("profile.helpSupport"), icon: "💬", route: null },
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
            backgroundColor: "rgba(212,175,55,0.2)",
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
              <Text style={{ fontSize: 44 }}>👤</Text>
            )}
          </View>
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.foreground, marginTop: 12 }}>
            {displayName}
          </Text>
          <Text style={{ fontSize: 13, color: colors.primary, marginTop: 2, fontWeight: "600" }}>
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
            backgroundColor: "rgba(212,175,55,0.15)", paddingHorizontal: 14,
            paddingVertical: 6, borderRadius: 20,
          }}>
            <Text style={{ fontSize: 14 }}>👑</Text>
            <Text style={{ fontSize: 12, fontWeight: "700", color: colors.primary }}>Gold Member</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/edit-profile")}
            style={{ marginTop: 16, backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 10, borderRadius: 12 }}
          >
            <Text style={{ color: "#0A0E13", fontWeight: "700", fontSize: 13 }}>{t("profile.editProfile")}</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: "row", paddingHorizontal: 20, gap: 10, marginTop: 16 }}>
          {STATS.map((stat) => (
            <View key={stat.label} style={{
              flex: 1, backgroundColor: colors.surface, borderRadius: 14, padding: 14,
              alignItems: "center", borderWidth: 1, borderColor: colors.border,
            }}>
              <Text style={{ fontSize: 16 }}>{stat.icon}</Text>
              <Text style={{ fontSize: 20, fontWeight: "800", color: colors.primary, marginTop: 4 }}>{stat.value}</Text>
              <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Badges */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
            {t("profile.badges")}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {BADGES.map((badge) => (
              <View key={badge.name} style={{
                backgroundColor: badge.unlocked ? colors.surface : "rgba(255,255,255,0.03)",
                borderRadius: 14, padding: 12, alignItems: "center", width: 90,
                borderWidth: 1, borderColor: badge.unlocked ? colors.border : "rgba(255,255,255,0.05)",
                opacity: badge.unlocked ? 1 : 0.4,
              }}>
                <Text style={{ fontSize: 28 }}>{badge.emoji}</Text>
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
                <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>
                  {item.label}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {item.route === "/notifications" && unreadCount > 0 && (
                  <View style={{
                    backgroundColor: "#EF4444", borderRadius: 11, minWidth: 22, height: 22,
                    paddingHorizontal: 6, alignItems: "center", justifyContent: "center",
                  }}>
                    <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800" }}>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Text>
                  </View>
                )}
                <Text style={{ fontSize: 16, color: colors.muted }}>›</Text>
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleLogout}
            style={{
              backgroundColor: "rgba(239,68,68,0.15)", borderRadius: 14,
              padding: 16, alignItems: "center", marginTop: 4,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#EF4444" }}>
              {t("profile.signOut")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
