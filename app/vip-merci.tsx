import { Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

// Page de retour après souscription "Marbellapp VIP" (success_url du Checkout).
// Servie par le rewrite SPA sur app.marbellapp.vip.
export default function VipMerciScreen() {
  const router = useRouter();
  const colors = useColors();

  return (
    <ScreenContainer className="flex-1">
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, gap: 16 }}>
        <View style={{
          width: 96, height: 96, borderRadius: 48,
          backgroundColor: "rgba(212,175,55,0.15)",
          borderWidth: 1, borderColor: colors.primary,
          alignItems: "center", justifyContent: "center",
        }}>
          <Text style={{ fontSize: 48 }}>⭐</Text>
        </View>

        <Text style={{ fontSize: 26, fontWeight: "800", color: colors.primary, textAlign: "center" }}>
          Bienvenue chez Marbellapp VIP
        </Text>

        <Text style={{ fontSize: 15, color: colors.foreground, textAlign: "center", lineHeight: 22 }}>
          Ton abonnement est activé. Ton essai gratuit de 7 jours a démarré — aucun prélèvement avant la fin de l'essai.
        </Text>

        <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center", lineHeight: 20 }}>
          Ensuite : 19,90€/mois pendant 6 mois, puis 49,90€/mois. Annulable à tout moment.
        </Text>

        <Text style={{ fontSize: 12, color: colors.muted, textAlign: "center", lineHeight: 18, opacity: 0.85 }}>
          Paiement par prélèvement SEPA : le premier prélèvement intervient après l'essai et peut mettre quelques jours ouvrés à apparaître sur ton relevé.
        </Text>

        <TouchableOpacity
          onPress={() => router.replace("/(tabs)" as any)}
          activeOpacity={0.85}
          style={{
            backgroundColor: colors.primary, borderRadius: 50,
            paddingVertical: 15, paddingHorizontal: 40, marginTop: 8,
            flexDirection: "row", alignItems: "center", gap: 8,
          }}
        >
          <Ionicons name="home-outline" size={18} color={colors.onPrimary} />
          <Text style={{ color: colors.onPrimary, fontWeight: "800", fontSize: 15 }}>Retour à l'accueil</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
