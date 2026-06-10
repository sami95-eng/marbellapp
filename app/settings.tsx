import { ScrollView, Text, View, TouchableOpacity, Switch, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useState } from "react";
import { useThemeContext } from "@/lib/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/language-selector";
import { useDemo } from "@/lib/demo-context";
import { supabase } from "@/lib/supabase";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colorScheme, setColorScheme } = useThemeContext();
  const { logout } = useAuth();
  const { isDemoMode, toggleDemoMode } = useDemo();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const darkMode = colorScheme === "dark";
  const setDarkMode = (value: boolean) => setColorScheme(value ? "dark" : "light");

  const doLogout = async () => {
    console.log("[Settings] doLogout: step 1 — calling supabase.auth.signOut()");
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("[Settings] signOut error:", error.message);
      // Proceed anyway — clear local state regardless of server error
    } else {
      console.log("[Settings] signOut OK");
    }

    // Wipe every possible storage key
    if (typeof window !== "undefined") {
      try {
        const keyCount = window.localStorage.length;
        window.localStorage.clear();
        window.sessionStorage.clear();
        console.log("[Settings] cleared localStorage (" + keyCount + " keys) + sessionStorage");
      } catch (e) {
        console.error("[Settings] storage clear error:", e);
      }

      console.log("[Settings] redirecting → /login via window.location.href");
      // Use href (not replace) so the full page reloads fresh — avoids
      // any in-memory Supabase session cache and AuthRedirect race conditions.
      window.location.href = window.location.origin + "/login";
    } else {
      console.log("[Settings] native: router.replace('/login')");
      router.replace("/login");
    }
  };

  const handleLogout = () => {
    if (Platform.OS === "web") {
      // window.confirm is blocked in many dev/iframe contexts — skip it on web
      // and rely on the button press itself as the confirmation.
      console.log("[Settings] handleLogout called (web)");
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

  const handleDemoToggle = (value: boolean) => {
    if (value) {
      Alert.alert(
        "✨ Demo Mode",
        "Demo mode simulates a partner account for Ocean Club Marbella with real bookings and VIP offers. Perfect for presentations.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Enable Demo",
            onPress: () => {
              toggleDemoMode();
              router.push("/partner-dashboard");
            }
          },
        ]
      );
    } else {
      toggleDemoMode();
    }
  };

  return (
    <ScreenContainer className="px-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View className="flex-row items-center gap-4 mb-6">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-primary font-bold text-lg">←</Text>
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-foreground">{t("settings.title")}</Text>
        </View>

        {/* Notifications */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">{t("settings.notifications")}</Text>
          <View className="bg-surface rounded-2xl p-4 mb-3 border border-border flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="font-semibold text-foreground">{t("settings.pushNotifications")}</Text>
              <Text className="text-xs text-muted mt-1">{t("settings.pushNotificationsDesc")}</Text>
            </View>
            <Switch value={pushNotifications} onValueChange={setPushNotifications} trackColor={{ false: "#3A3A3A", true: "#D4AF37" }} />
          </View>
          <View className="bg-surface rounded-2xl p-4 border border-border flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="font-semibold text-foreground">{t("settings.emailNotifications")}</Text>
              <Text className="text-xs text-muted mt-1">{t("settings.emailNotificationsDesc")}</Text>
            </View>
            <Switch value={emailNotifications} onValueChange={setEmailNotifications} trackColor={{ false: "#3A3A3A", true: "#D4AF37" }} />
          </View>
        </View>

        {/* Appearance */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">{t("settings.appearance")}</Text>
          <View className="bg-surface rounded-2xl p-4 mb-3 border border-border flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="font-semibold text-foreground">{t("settings.darkMode")}</Text>
            </View>
            <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ false: "#3A3A3A", true: "#D4AF37" }} />
          </View>
        </View>

        {/* Language */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">{t("settings.language")}</Text>
          <View className="bg-surface rounded-2xl p-4 border border-border flex-row items-center justify-between">
            <Text className="font-semibold text-foreground">{t("settings.language")}</Text>
            <LanguageSelector />
          </View>
        </View>

        {/* Account */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">{t("settings.account")}</Text>
          <TouchableOpacity
            className="bg-surface rounded-2xl p-4 mb-3 border border-border flex-row items-center justify-between"
            activeOpacity={0.7}
            onPress={() => router.push("/verify-email")}
          >
            <View style={{ flex: 1 }}>
              <Text className="font-semibold text-foreground">{t("settings.verifyEmail")}</Text>
              <Text className="text-xs text-muted mt-1">{t("settings.verifyEmailDesc")}</Text>
            </View>
            <Text className="text-muted">→</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-surface rounded-2xl p-4 border border-border flex-row items-center justify-between"
            activeOpacity={0.7}
            onPress={() => router.push("/join-partner")}
          >
            <View style={{ flex: 1 }}>
              <Text className="font-semibold text-foreground">{t("settings.joinPartner")}</Text>
              <Text className="text-xs text-muted mt-1">{t("settings.joinPartnerDesc")}</Text>
            </View>
            <Text className="text-muted">→</Text>
          </TouchableOpacity>
        </View>

        {/* ── Demo Mode ─────────────────────────────────────────────── */}
        <View className="mb-6">
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Text className="text-lg font-bold text-foreground">Demo</Text>
            <View style={{
              backgroundColor: "rgba(212,175,55,0.15)",
              paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8,
            }}>
              <Text style={{ fontSize: 10, color: "#D4AF37", fontWeight: "700" }}>PARTNER DEMO</Text>
            </View>
          </View>

          {/* Demo Mode Toggle */}
          <View style={{
            backgroundColor: isDemoMode ? "rgba(212,175,55,0.08)" : undefined,
            borderColor: isDemoMode ? "rgba(212,175,55,0.4)" : undefined,
          }} className="bg-surface rounded-2xl p-4 mb-3 border border-border flex-row items-center justify-between">
            <View className="flex-1">
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text className="font-semibold text-foreground">Demo Mode</Text>
                {isDemoMode && (
                  <View style={{ backgroundColor: "#D4AF37", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 9, fontWeight: "800", color: "#0A0E13" }}>ACTIVE</Text>
                  </View>
                )}
              </View>
              <Text className="text-xs text-muted mt-1">
                {isDemoMode
                  ? "Ocean Club Marbella partner account active"
                  : "Simulate a partner account for presentations"}
              </Text>
            </View>
            <Switch
              value={isDemoMode}
              onValueChange={handleDemoToggle}
              trackColor={{ false: "#3A3A3A", true: "#D4AF37" }}
            />
          </View>

          {/* Quick access to demo features when active */}
          {isDemoMode && (
            <>
              <TouchableOpacity
                className="bg-surface rounded-2xl p-4 mb-3 border border-border flex-row items-center justify-between"
                activeOpacity={0.7}
                onPress={() => router.push("/partner-dashboard")}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Text style={{ fontSize: 18 }}>📊</Text>
                  <View>
                    <Text className="font-semibold text-foreground">Partner Dashboard</Text>
                    <Text className="text-xs text-muted mt-1">Ocean Club · 47 bookings · €18.4K revenue</Text>
                  </View>
                </View>
                <Text className="text-muted">→</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-surface rounded-2xl p-4 mb-3 border border-border flex-row items-center justify-between"
                activeOpacity={0.7}
                onPress={() => router.push({ pathname: "/vip-qr", params: {
                  offerId: "demo-vip-001",
                  offerTitle: "VIP Cabana Weekend",
                  venue: "Ocean Club Marbella",
                  date: "Sat, Jun 7 · 22:00",
                  type: "table",
                  instagramHandle: "@oceanclubmarbella",
                }})}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Text style={{ fontSize: 18 }}>🎫</Text>
                  <View>
                    <Text className="font-semibold text-foreground">Demo VIP QR Code</Text>
                    <Text className="text-xs text-muted mt-1">VIP Cabana · Ocean Club Marbella</Text>
                  </View>
                </View>
                <Text className="text-muted">→</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-surface rounded-2xl p-4 border border-border flex-row items-center justify-between"
                activeOpacity={0.7}
                onPress={() => router.push("/map")}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Text style={{ fontSize: 18 }}>🗺️</Text>
                  <View>
                    <Text className="font-semibold text-foreground">Venue Map</Text>
                    <Text className="text-xs text-muted mt-1">58 venues · Live Supabase data</Text>
                  </View>
                </View>
                <Text className="text-muted">→</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Legal */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">{t("settings.legal")}</Text>
          <TouchableOpacity
            className="bg-surface rounded-2xl p-4 mb-3 border border-border flex-row items-center justify-between"
            activeOpacity={0.7}
            onPress={() => router.push("/privacy")}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Text style={{ fontSize: 18 }}>🔒</Text>
              <Text className="font-semibold text-foreground">{t("legal.privacy")}</Text>
            </View>
            <Text className="text-muted">→</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-surface rounded-2xl p-4 border border-border flex-row items-center justify-between"
            activeOpacity={0.7}
            onPress={() => router.push("/terms")}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Text style={{ fontSize: 18 }}>📄</Text>
              <Text className="font-semibold text-foreground">{t("legal.terms")}</Text>
            </View>
            <Text className="text-muted">→</Text>
          </TouchableOpacity>
        </View>

        {/* Version */}
        <View className="bg-surface rounded-2xl p-4 border border-border mb-8 items-center">
          <Text className="text-xs text-muted">{t("settings.version")}</Text>
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          className="bg-error rounded-full py-4 items-center mb-8"
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text className="text-background font-bold text-lg">{t("settings.signOut")}</Text>
        </TouchableOpacity>

      </ScrollView>
    </ScreenContainer>
  );
}
