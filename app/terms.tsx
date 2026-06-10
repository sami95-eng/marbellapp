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

export default function TermsScreen() {
  const router = useRouter();
  const colors = useColors();

  return (
    <ScreenContainer className="px-6">
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingTop: 8, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace("/login"))}>
          <Text style={{ color: colors.primary, fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 24, fontWeight: "800", color: colors.foreground }}>Conditions d'utilisation</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 20 }}>
          Dernière mise à jour : 10 juin 2026
        </Text>

        <Section title="1. Objet" colors={colors}>
          Les présentes conditions générales d'utilisation (CGU) régissent l'accès et l'utilisation de
          l'application Marbell'app, plateforme mettant en relation ses membres avec des établissements
          partenaires de Marbella. En utilisant l'application, vous acceptez ces conditions.
        </Section>

        <Section title="2. Compte utilisateur" colors={colors}>
          La création d'un compte requiert une adresse email valide. Vous êtes responsable de
          l'exactitude des informations fournies et de la confidentialité de vos identifiants.
          Vous devez être majeur pour utiliser le service.
        </Section>

        <Section title="3. Réservations" colors={colors}>
          Marbell'app permet d'émettre des demandes de réservation auprès des établissements partenaires.
          Une demande n'est définitive qu'après confirmation par l'établissement (sous un délai indicatif
          de 2 heures). Marbell'app agit en tant qu'intermédiaire et ne garantit pas la disponibilité.
        </Section>

        <Section title="4. Annulation" colors={colors}>
          Vous pouvez annuler une réservation en attente ou confirmée depuis l'application. Les conditions
          d'annulation propres à chaque établissement peuvent s'appliquer. Un établissement peut également
          être amené à annuler une réservation confirmée, auquel cas vous en serez informé par email.
        </Section>

        <Section title="5. Comportement des utilisateurs" colors={colors}>
          Vous vous engagez à utiliser le service de bonne foi, à ne pas effectuer de réservations
          frauduleuses ou abusives, et à honorer les réservations confirmées. Tout abus peut entraîner
          la suspension du compte.
        </Section>

        <Section title="6. Responsabilité" colors={colors}>
          Les prestations sont fournies par les établissements partenaires, seuls responsables de la
          qualité et de l'exécution de leurs services. Marbell'app ne saurait être tenue responsable des
          litiges survenant entre un membre et un établissement.
        </Section>

        <Section title="7. Propriété intellectuelle" colors={colors}>
          La marque Marbell'app, son logo et le contenu de l'application sont protégés. Toute
          reproduction non autorisée est interdite.
        </Section>

        <Section title="8. Modification des CGU" colors={colors}>
          Marbell'app se réserve le droit de modifier les présentes conditions. Les utilisateurs seront
          informés des changements substantiels via l'application.
        </Section>

        <Section title="9. Contact" colors={colors}>
          Pour toute question relative aux présentes conditions : contact@marbellapp.vip
        </Section>
      </ScrollView>
    </ScreenContainer>
  );
}
