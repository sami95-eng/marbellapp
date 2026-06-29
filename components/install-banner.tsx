import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import { useTranslation } from "react-i18next";

// Bandeau "Installer l'app" — WEB MOBILE uniquement, affiché une seule fois.
// Caché définitivement après fermeture (localStorage) ou si l'app est déjà
// installée (mode standalone). No-op sur natif.
const DISMISS_KEY = "marbellapp_install_dismissed";
const GOLD = "#D4AF37";
const INK = "#0A0E13";

export function InstallBanner() {
  const { t } = useTranslation();
  const [platform, setPlatform] = useState<"ios" | "android" | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (typeof window === "undefined" || typeof navigator === "undefined") return;
    try {
      if (window.localStorage.getItem(DISMISS_KEY)) return; // déjà fermé une fois
    } catch { /* localStorage indispo → on tente quand même l'affichage */ }

    // Déjà installé (PWA standalone) → ne rien afficher.
    const standalone =
      (typeof window.matchMedia === "function" && window.matchMedia("(display-mode: standalone)").matches) ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const ua = navigator.userAgent || "";
    if (/iPad|iPhone|iPod/.test(ua)) setPlatform("ios");
    else if (/Android/.test(ua)) setPlatform("android");
    // Desktop → reste null → bandeau non affiché.
  }, []);

  if (Platform.OS !== "web" || !platform) return null;

  const dismiss = () => {
    try { window.localStorage.setItem(DISMISS_KEY, "1"); } catch { /* best-effort */ }
    setPlatform(null);
  };

  return (
    <View
      style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 9999,
        backgroundColor: INK, borderBottomWidth: 1, borderBottomColor: `${GOLD}55`,
        flexDirection: "row", alignItems: "center", gap: 10,
        paddingHorizontal: 14, paddingVertical: 12,
      }}
    >
      <Text style={{ flex: 1, color: GOLD, fontSize: 13, fontWeight: "700", lineHeight: 18 }}>
        {platform === "ios" ? t("install.ios") : t("install.android")}
      </Text>
      <TouchableOpacity onPress={dismiss} accessibilityRole="button" accessibilityLabel={t("common.cancel")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={{ color: GOLD, fontSize: 18, fontWeight: "800", paddingHorizontal: 4 }}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}
