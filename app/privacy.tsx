import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={{ marginBottom: 22 }}>
      <Text style={{ fontSize: 16, fontWeight: "800", color: colors.primary, marginBottom: 8 }}>{title}</Text>
      <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 22 }}>{children}</Text>
    </View>
  );
}

export default function PrivacyScreen() {
  const router = useRouter();
  const colors = useColors();

  return (
    <ScreenContainer className="px-6">
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingTop: 8, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace("/login"))}>
          <Text style={{ color: colors.primary, fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 24, fontWeight: "800", color: colors.foreground }}>Confidentialité</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 20 }}>
          Dernière mise à jour : 10 juin 2026
        </Text>

        <Section title="1. Qui sommes-nous ?" colors={colors}>
          Marbell'app est une plateforme de réservation mettant en relation ses membres avec des
          établissements de luxe de Marbella (beach clubs, restaurants, vie nocturne, spas).
          Le présent document explique quelles données nous collectons et comment nous les utilisons,
          conformément au Règlement Général sur la Protection des Données (RGPD).
        </Section>

        <Section title="2. Données que nous collectons" colors={colors}>
          • Données de compte : nom, adresse email, et (le cas échéant) numéro de téléphone.{"\n"}
          • Données de réservation : établissement, date, heure, nombre de personnes, table choisie, notes.{"\n"}
          • Données techniques : identifiant de session, préférences (langue, favoris).{"\n"}
          Nous ne collectons aucune donnée de paiement : les transactions éventuelles se font directement
          auprès des établissements.
        </Section>

        <Section title="3. Finalités du traitement" colors={colors}>
          Vos données servent à : créer et sécuriser votre compte, traiter vos demandes de réservation,
          vous envoyer les confirmations et notifications, transmettre les informations nécessaires à
          l'établissement concerné, et améliorer le service.
        </Section>

        <Section title="4. Partage des données" colors={colors}>
          Les détails d'une réservation (nom, contact, détails de la demande) sont transmis à
          l'établissement concerné afin de traiter votre réservation. Nous faisons appel à des
          sous-traitants techniques (hébergement de la base de données et envoi d'emails) agissant
          pour notre compte. Vos données ne sont jamais vendues à des tiers.
        </Section>

        <Section title="5. Conservation" colors={colors}>
          Vos données sont conservées tant que votre compte est actif, puis supprimées ou anonymisées
          dans un délai raisonnable après la fermeture du compte, sauf obligation légale contraire.
        </Section>

        <Section title="6. Vos droits (RGPD)" colors={colors}>
          Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition
          et de portabilité de vos données. Vous pouvez exercer ces droits à tout moment en nous
          contactant. Vous pouvez également supprimer votre compte depuis l'application.
        </Section>

        <Section title="7. Sécurité" colors={colors}>
          Vos sessions sont chiffrées et stockées de façon sécurisée. L'accès aux données est restreint
          par des règles de sécurité au niveau de la base de données (RLS).
        </Section>

        <Section title="8. Contact" colors={colors}>
          Pour toute question relative à vos données personnelles ou pour exercer vos droits :{"\n"}
          contact@marbellapp.vip
        </Section>
      </ScrollView>
    </ScreenContainer>
  );
}
