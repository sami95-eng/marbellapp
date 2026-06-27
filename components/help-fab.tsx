import { useState } from "react";
import { View, Text, TouchableOpacity, Pressable, Linking, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

// Couleurs "La Nuit Méditerranéenne" (valeurs explicites demandées).
const GOLD = "#D4AF37";
const INK = "#0A0E13";
const CREAM = "#E8E8E8";

// TODO: remplacer par le vrai numéro WhatsApp (format international sans +, ex: 34600112233).
const WHATSAPP_NUMBER = "0000000000";
const SUPPORT_EMAIL = "contact@marbellapp.vip";

/**
 * Bouton flottant "Aide" (web + natif), positionné au-dessus de la tab bar.
 * Au clic : petit menu avec WhatsApp + Email.
 */
export function HelpFab() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const openWhatsApp = () => {
    setOpen(false);
    Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}`).catch(() => {});
  };
  const openEmail = () => {
    setOpen(false);
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {});
  };

  return (
    <>
      {/* Backdrop pour fermer au clic extérieur */}
      {open && (
        <Pressable
          onPress={() => setOpen(false)}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }}
          accessibilityRole="button"
          accessibilityLabel={t("common.cancel")}
        />
      )}

      {/* Menu */}
      {open && (
        <View
          style={{
            position: "absolute", right: 16, bottom: 156, zIndex: 1000,
            minWidth: 200, backgroundColor: INK, borderRadius: 16,
            borderWidth: 1, borderColor: `${GOLD}55`, paddingVertical: 6,
            shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
            elevation: 12,
          }}
        >
          <Text style={{ color: GOLD, fontSize: 11, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6 }}>
            {t("help.title")}
          </Text>
          <TouchableOpacity
            onPress={openWhatsApp}
            activeOpacity={0.7}
            style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 }}
          >
            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            <Text style={{ color: CREAM, fontSize: 14, fontWeight: "600" }}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={openEmail}
            activeOpacity={0.7}
            style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 }}
          >
            <Ionicons name="mail-outline" size={20} color={GOLD} />
            <Text style={{ color: CREAM, fontSize: 14, fontWeight: "600" }}>Email</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bouton flottant */}
      <TouchableOpacity
        onPress={() => setOpen((o) => !o)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={t("help.title")}
        style={{
          position: "absolute", right: 16, bottom: 90, zIndex: 1000,
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: INK, borderWidth: 1.5, borderColor: GOLD,
          alignItems: "center", justifyContent: "center",
          shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
          elevation: 12,
        }}
      >
        <Ionicons name={open ? "close" : "chatbubble-ellipses"} size={24} color={GOLD} />
      </TouchableOpacity>
    </>
  );
}
