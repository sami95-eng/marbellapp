import { useState, useCallback } from "react";
import {
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { useDemo } from "@/lib/demo-context";
import {
  useVipData,
  type VipOffer,
  type VipEventDiscount,
  type VipMemberPerk,
} from "@/hooks/use-vip";
import { submitPost } from "@/lib/vip-service";

type VipCategory = "tables" | "discounts" | "members";
type TierKey = "bronze" | "silver" | "gold" | "platinum";

// --- Tier system ---
const VIP_TIERS: Record<TierKey, {
  label: string; color: string; bg: string; icon: string;
  requirement: string; perks: string[];
}> = {
  bronze: {
    label: "Bronze", color: "#CD7F32", bg: "rgba(205,127,50,0.12)", icon: "🥉",
    requirement: "0 – 4 posts",
    perks: [
      "Liste prioritaire pour les réservations",
      "5% de réduction sur les venues sélectionnées",
      "Newsletter exclusive Marbell'app",
      "Accès aux offres de la semaine",
    ],
  },
  silver: {
    label: "Silver", color: "#A8A9AD", bg: "rgba(168,169,173,0.12)", icon: "🥈",
    requirement: "5 – 14 posts",
    perks: [
      "Toutes les offres Bronze",
      "File prioritaire dans tous les venues partenaires",
      "10% de réduction sur les tables VIP",
      "Cocktail de bienvenue offert",
      "Accès aux événements membres mensuels",
    ],
  },
  gold: {
    label: "Gold", color: "#D4AF37", bg: "rgba(212,175,55,0.12)", icon: "🥇",
    requirement: "15 – 29 posts",
    perks: [
      "Toutes les offres Silver",
      "20% de réduction exclusive sur toutes les venues",
      "Bouteille offerte pour toute table VIP",
      "Réservation prioritaire 48h avant l'ouverture",
      "Accès aux événements privés Gold",
      "Upgrade automatique à la meilleure table disponible",
    ],
  },
  platinum: {
    label: "Platinum", color: "#E8E8E8", bg: "rgba(232,232,232,0.12)", icon: "💎",
    requirement: "30+ posts",
    perks: [
      "Toutes les offres Gold",
      "40% de réduction exclusive — le meilleur tarif",
      "Concierge personnel 24h/24 7j/7",
      "Accès backstage aux événements Starlite",
      "Dîners privés avec les chefs étoilés",
      "Accès aux yachts privatisés Puerto Banús",
      "Invitation aux galas et soirées fermées",
    ],
  },
};

// --- Sub-Components ---

function CategoryTab({
  label, icon, active, onPress, colors,
}: {
  label: string; icon: string; active: boolean; onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flex: 1, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 12,
        backgroundColor: active ? colors.primary : colors.surface,
        borderWidth: active ? 0 : 1, borderColor: colors.border,
        alignItems: "center", gap: 4,
      }}
    >
      <Text style={{ fontSize: 18 }}>{icon}</Text>
      <Text style={{ fontSize: 11, fontWeight: active ? "700" : "500", color: active ? "#0A0E13" : colors.muted }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const OFFER_TYPE_ICONS: Record<string, string> = {
  table: "🪑", bed: "🛏️", bottle: "🍾", private: "🔒",
};
const OFFER_TYPE_LABELS: Record<string, string> = {
  table: "Table", bed: "Lit/Daybed", bottle: "Bouteille", private: "Privatif",
};

function VipOfferCard({
  item, colors, onBook,
}: {
  item: VipOffer; colors: ReturnType<typeof useColors>; onBook: (item: VipOffer) => void;
}) {
  const savings = item.original_price - item.vip_price;
  const savingsPercent = Math.round((savings / item.original_price) * 100);

  return (
    <View style={{
      backgroundColor: colors.surface, borderRadius: 16, marginBottom: 16,
      overflow: "hidden", borderWidth: 1, borderColor: colors.border,
    }}>
      <View style={{ position: "relative" }}>
        <Image
          source={{ uri: item.image_url ?? "" }}
          style={{ width: "100%", height: 160 }}
          contentFit="cover"
        />
        {item.tag && (
          <View style={{
            position: "absolute", top: 12, left: 12,
            backgroundColor: item.tag === "LAST SPOT" ? "#EF4444" : item.tag === "EXCLUSIVE" || item.tag === "PREMIUM" ? "#7C3AED" : colors.primary,
            paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
          }}>
            <Text style={{ color: "#0A0E13", fontSize: 11, fontWeight: "800" }}>{item.tag}</Text>
          </View>
        )}
        <View style={{
          position: "absolute", top: 12, right: 12,
          backgroundColor: "rgba(0,0,0,0.7)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
        }}>
          <Text style={{ color: "#4ADE80", fontSize: 12, fontWeight: "700" }}>-{savingsPercent}%</Text>
        </View>
        <View style={{
          position: "absolute", bottom: 12, left: 12,
          backgroundColor: "rgba(0,0,0,0.65)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
          flexDirection: "row", alignItems: "center", gap: 4,
        }}>
          <Text style={{ fontSize: 12 }}>{OFFER_TYPE_ICONS[item.offer_type] ?? "🎯"}</Text>
          <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>{OFFER_TYPE_LABELS[item.offer_type] ?? item.offer_type}</Text>
        </View>
      </View>

      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>{item.venue_name}</Text>
        <Text style={{ fontSize: 13, color: colors.primary, marginTop: 2, fontWeight: "600" }}>{item.table_type}</Text>

        <View style={{ flexDirection: "row", marginTop: 10, gap: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ fontSize: 14 }}>📅</Text>
            <Text style={{ fontSize: 13, color: colors.muted }}>{item.event_date}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ fontSize: 14 }}>🕐</Text>
            <Text style={{ fontSize: 13, color: colors.muted }}>{item.event_time}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ fontSize: 14 }}>👥</Text>
            <Text style={{ fontSize: 13, color: colors.muted }}>≤ {item.capacity}</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          {item.perks.map((perk) => (
            <View key={perk} style={{
              backgroundColor: "rgba(212,175,55,0.15)", paddingHorizontal: 8,
              paddingVertical: 4, borderRadius: 6,
            }}>
              <Text style={{ fontSize: 11, color: colors.primary, fontWeight: "600" }}>{perk}</Text>
            </View>
          ))}
        </View>

        <View style={{
          flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14,
        }}>
          <View>
            <Text style={{ fontSize: 13, color: colors.muted, textDecorationLine: "line-through" }}>
              €{item.original_price}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
              <Text style={{ fontSize: 24, fontWeight: "800", color: colors.primary }}>€{item.vip_price}</Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>prix VIP</Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 11, color: item.spots_left <= 2 ? "#EF4444" : colors.muted, marginBottom: 6 }}>
              {item.spots_left} place{item.spots_left > 1 ? "s" : ""} restante{item.spots_left > 1 ? "s" : ""}
            </Text>
            <TouchableOpacity
              onPress={() => onBook(item)}
              activeOpacity={0.7}
              style={{ backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 }}
            >
              <Text style={{ color: "#0A0E13", fontWeight: "700", fontSize: 14 }}>Réserver</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

function DiscountCard({
  item, colors, onCopy,
}: {
  item: VipEventDiscount; colors: ReturnType<typeof useColors>; onCopy: (code: string) => void;
}) {
  const discountedPrice = Math.round(item.original_price * (1 - item.discount_pct / 100));

  return (
    <View style={{
      backgroundColor: colors.surface, borderRadius: 16, marginBottom: 16,
      overflow: "hidden", borderWidth: 1, borderColor: colors.border,
    }}>
      <View style={{ position: "relative" }}>
        <Image source={{ uri: item.image_url ?? "" }} style={{ width: "100%", height: 140 }} contentFit="cover" />
        <View style={{
          position: "absolute", top: 12, left: 12, backgroundColor: "#EF4444",
          paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8,
        }}>
          <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "800" }}>-{item.discount_pct}%</Text>
        </View>
        <View style={{
          position: "absolute", bottom: 12, left: 12, backgroundColor: "rgba(0,0,0,0.7)",
          paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
        }}>
          <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "600" }}>{item.category}</Text>
        </View>
      </View>

      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 17, fontWeight: "700", color: colors.foreground }}>{item.title}</Text>
        <Text style={{ fontSize: 13, color: colors.primary, marginTop: 2 }}>{item.venue_name}</Text>
        <Text style={{ fontSize: 13, color: colors.muted, marginTop: 6, lineHeight: 18 }}>{item.description}</Text>

        <View style={{ flexDirection: "row", marginTop: 10, gap: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ fontSize: 13 }}>📅</Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>{item.event_date}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ fontSize: 13 }}>⏰</Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>Jusqu'au {item.valid_until}</Text>
          </View>
        </View>

        <View style={{
          flexDirection: "row", alignItems: "center", justifyContent: "space-between",
          marginTop: 14, backgroundColor: "rgba(212,175,55,0.1)", padding: 12, borderRadius: 10,
          borderWidth: 1, borderColor: "rgba(212,175,55,0.3)",
        }}>
          <View>
            <Text style={{ fontSize: 11, color: colors.muted }}>CODE PROMO</Text>
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.primary, letterSpacing: 2 }}>
              {item.code}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
              <Text style={{ fontSize: 13, color: colors.muted, textDecorationLine: "line-through" }}>
                €{item.original_price}
              </Text>
              <Text style={{ fontSize: 20, fontWeight: "800", color: colors.primary }}>€{discountedPrice}</Text>
            </View>
            <TouchableOpacity
              onPress={() => onCopy(item.code)}
              activeOpacity={0.7}
              style={{ backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8, marginTop: 4 }}
            >
              <Text style={{ color: "#0A0E13", fontWeight: "700", fontSize: 12 }}>Copier</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

// Seuil (nombre de posts) pour atteindre le tier suivant
const TIER_NEXT: Record<TierKey, { label: string; at: number } | null> = {
  bronze:   { label: "Silver",   at: 5 },
  silver:   { label: "Gold",     at: 15 },
  gold:     { label: "Platinum", at: 30 },
  platinum: null,
};
const TIER_FLOOR: Record<TierKey, number> = { bronze: 0, silver: 5, gold: 15, platinum: 30 };
// Réduction par palier (cohérente avec les perks affichés sur cet écran).
const TIER_DISCOUNT: Record<TierKey, number> = { bronze: 5, silver: 10, gold: 20, platinum: 40 };

function TierBadge({ tier, posts, colors }: { tier: TierKey; posts: number; colors: ReturnType<typeof useColors> }) {
  const t = VIP_TIERS[tier];
  const next = TIER_NEXT[tier];
  const floor = TIER_FLOOR[tier];
  const remaining = next ? Math.max(0, next.at - posts) : 0;
  const progress = next ? Math.min(1, (posts - floor) / (next.at - floor)) : 1;

  return (
    <View style={{
      backgroundColor: t.bg, borderWidth: 1, borderColor: t.color,
      borderRadius: 12, padding: 16, marginBottom: 20,
    }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <Text style={{ fontSize: 32 }}>{t.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: colors.muted, fontWeight: "600" }}>TON NIVEAU ACTUEL</Text>
          <Text style={{ fontSize: 22, fontWeight: "800", color: t.color }}>{t.label}</Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>{t.requirement}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: t.color }}>{posts}</Text>
          <Text style={{ fontSize: 10, color: colors.muted }}>posts partenaires</Text>
        </View>
      </View>

      {/* Réduction actuelle — bien visible */}
      <View style={{
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 10,
        paddingHorizontal: 12, paddingVertical: 10, marginBottom: 14,
      }}>
        <Text style={{ fontSize: 13, color: colors.foreground, fontWeight: "600" }}>Ta réduction actuelle</Text>
        <Text style={{ fontSize: 20, fontWeight: "800", color: t.color }}>{TIER_DISCOUNT[tier]}%</Text>
      </View>

      {/* Progression vers le tier suivant */}
      <View style={{ marginBottom: 14 }}>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
          <View style={{ width: `${progress * 100}%`, height: "100%", backgroundColor: t.color }} />
        </View>
        <Text style={{ fontSize: 11, color: colors.muted, marginTop: 6 }}>
          {next
            ? `Plus que ${remaining} post${remaining > 1 ? "s" : ""} pour atteindre ${next.label}`
            : "Niveau maximum atteint — merci pour ton soutien ! 🎉"}
        </Text>
      </View>

      <View style={{ gap: 6 }}>
        {t.perks.map((perk) => (
          <View key={perk} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ color: t.color, fontSize: 13 }}>✓</Text>
            <Text style={{ fontSize: 13, color: colors.foreground }}>{perk}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function TierComparisonRow({ colors }: { colors: ReturnType<typeof useColors> }) {
  const tierKeys: TierKey[] = ["bronze", "silver", "gold", "platinum"];
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
        Tous les niveaux
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
        {tierKeys.map((key) => {
          const tier = VIP_TIERS[key];
          return (
            <View key={key} style={{
              width: 180, backgroundColor: colors.surface, borderRadius: 12,
              borderWidth: 1, borderColor: tier.color, padding: 14, marginHorizontal: 4,
            }}>
              <Text style={{ fontSize: 24, marginBottom: 6 }}>{tier.icon}</Text>
              <Text style={{ fontSize: 15, fontWeight: "800", color: tier.color, marginBottom: 2 }}>
                {tier.label}
              </Text>
              <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 10 }}>{tier.requirement}</Text>
              {tier.perks.slice(0, 3).map((perk) => (
                <View key={perk} style={{ flexDirection: "row", gap: 6, marginBottom: 4 }}>
                  <Text style={{ color: tier.color, fontSize: 11 }}>✓</Text>
                  <Text style={{ fontSize: 11, color: colors.muted, flex: 1 }}>{perk}</Text>
                </View>
              ))}
              {tier.perks.length > 3 && (
                <Text style={{ fontSize: 11, color: tier.color, marginTop: 4 }}>
                  +{tier.perks.length - 3} autres avantages
                </Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function MemberOfferCard({ item, colors }: { item: VipMemberPerk; colors: ReturnType<typeof useColors> }) {
  const tier = VIP_TIERS[item.min_tier as TierKey] ?? VIP_TIERS.bronze;
  return (
    <View style={{
      backgroundColor: colors.surface, borderRadius: 16, marginBottom: 16,
      overflow: "hidden", borderWidth: 1, borderColor: tier.color,
    }}>
      <View style={{ position: "relative" }}>
        <Image source={{ uri: item.image_url ?? "" }} style={{ width: "100%", height: 110 }} contentFit="cover" />
        <View style={{
          position: "absolute", top: 12, left: 12, backgroundColor: tier.color,
          paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
          flexDirection: "row", alignItems: "center", gap: 4,
        }}>
          <Text style={{ fontSize: 12 }}>{tier.icon}</Text>
          <Text style={{ color: "#0A0E13", fontSize: 11, fontWeight: "800" }}>{tier.label.toUpperCase()}</Text>
        </View>
        {item.is_new && (
          <View style={{
            position: "absolute", top: 12, right: 12, backgroundColor: "#EF4444",
            paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
          }}>
            <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "800" }}>NEW</Text>
          </View>
        )}
      </View>
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, flex: 1 }}>{item.title}</Text>
          <View style={{ backgroundColor: tier.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginLeft: 8 }}>
            <Text style={{ fontSize: 11, color: tier.color, fontWeight: "700" }}>{item.benefit}</Text>
          </View>
        </View>
        <Text style={{ fontSize: 12, color: colors.primary, marginTop: 2 }}>{item.venue_name}</Text>
        <Text style={{ fontSize: 13, color: colors.muted, marginTop: 6, lineHeight: 18 }}>{item.description}</Text>
      </View>
    </View>
  );
}

// --- Section explicative "Comment ça marche" (basée sur les posts Instagram) ---
const VIP_STEPS = [
  { n: "1", icon: "📸", title: "Renseigne ton Instagram",
    desc: "Indique ton compte Instagram dans Marbell'app." },
  { n: "2", icon: "👑", title: "Profite de l'expérience",
    desc: "Accède aux offres exclusives de nos partenaires : tables VIP, réductions et invitations privées." },
  { n: "3", icon: "🔓", title: "Partage ta soirée",
    desc: "Poste sur Instagram en taguant l'établissement et débloque encore plus d'avantages." },
];

function HowItWorksVIP({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <View style={{ alignItems: "center", marginBottom: 14 }}>
        <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground }}>Comment ça marche</Text>
        <Text style={{ fontSize: 12, color: colors.muted, textAlign: "center", marginTop: 4, lineHeight: 18 }}>
          Plus tu postes et tagues les établissements partenaires, plus tu débloques d'avantages.
        </Text>
      </View>

      {VIP_STEPS.map((s) => (
        <View key={s.n} style={{
          flexDirection: "row", gap: 14, alignItems: "center",
          backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 10,
          borderWidth: 1, borderColor: "rgba(212,175,55,0.18)",
        }}>
          <View style={{
            width: 46, height: 46, borderRadius: 13,
            backgroundColor: "rgba(212,175,55,0.12)", borderWidth: 1, borderColor: "rgba(212,175,55,0.3)",
            alignItems: "center", justifyContent: "center",
          }}>
            <Text style={{ fontSize: 22 }}>{s.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{
                fontSize: 11, fontWeight: "800", color: "#0A0E13", backgroundColor: "#D4AF37",
                width: 18, height: 18, borderRadius: 9, textAlign: "center", overflow: "hidden", lineHeight: 18,
              }}>{s.n}</Text>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>{s.title}</Text>
            </View>
            <Text style={{ fontSize: 12.5, color: colors.muted, marginTop: 4, lineHeight: 18 }}>{s.desc}</Text>
          </View>
        </View>
      ))}

      <View style={{
        backgroundColor: "rgba(212,175,55,0.06)", borderRadius: 12, padding: 12,
        borderWidth: 1, borderColor: "rgba(212,175,55,0.18)",
      }}>
        <Text style={{ fontSize: 12, color: colors.muted, textAlign: "center", lineHeight: 18 }}>
          ✨ Le statut VIP récompense tes{" "}
          <Text style={{ color: colors.primary, fontWeight: "700" }}>posts Instagram</Text> chez les partenaires —{" "}
          <Text style={{ color: colors.primary, fontWeight: "700" }}>pas</Text> ton nombre de followers.
        </Text>
      </View>
    </View>
  );
}

function InstagramGate({ isAuthenticated, router, colors, onSaveHandle, saving }: {
  isAuthenticated: boolean; router: ReturnType<typeof useRouter>; colors: ReturnType<typeof useColors>;
  onSaveHandle: (handle: string) => void; saving: boolean;
}) {
  const [handle, setHandle] = useState("");
  const valid = handle.trim().replace(/^@/, "").length >= 2;

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 60 }}
      >
        <View style={{ alignItems: "center", gap: 14, marginBottom: 24 }}>
          <Text style={{ fontSize: 56 }}>👑</Text>
          <Text style={{ fontSize: 24, fontWeight: "800", color: colors.primary, textAlign: "center" }}>
            Accès VIP
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", lineHeight: 22 }}>
            {isAuthenticated
              ? "Renseigne ton compte Instagram pour débloquer les offres VIP de nos établissements partenaires."
              : "Connecte-toi à ton compte Marbell'app, puis renseigne ton Instagram pour accéder aux offres VIP."}
          </Text>
        </View>

        {isAuthenticated ? (
          <View style={{ marginBottom: 28, gap: 10 }}>
            <Text style={{ fontSize: 11, color: colors.muted, fontWeight: "600", marginLeft: 4, letterSpacing: 0.5 }}>
              TON COMPTE INSTAGRAM
            </Text>
            <View style={{
              flexDirection: "row", alignItems: "center",
              backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border,
              paddingHorizontal: 14,
            }}>
              <Text style={{ fontSize: 16, color: colors.primary, fontWeight: "700" }}>@</Text>
              <TextInput
                value={handle}
                onChangeText={(v) => setHandle(v.replace(/\s/g, ""))}
                placeholder="moncompte"
                placeholderTextColor="#555"
                autoCapitalize="none"
                autoCorrect={false}
                style={{ flex: 1, color: colors.foreground, fontSize: 15, paddingVertical: 14, paddingHorizontal: 6 }}
              />
            </View>
            <TouchableOpacity
              onPress={() => onSaveHandle(handle)}
              disabled={!valid || saving}
              style={{
                backgroundColor: valid ? colors.primary : "#333", borderRadius: 50,
                paddingVertical: 14, alignItems: "center", marginTop: 4, opacity: saving ? 0.6 : 1,
              }}
              activeOpacity={0.85}
            >
              {saving
                ? <ActivityIndicator color="#0A0E13" />
                : <Text style={{ color: valid ? "#0A0E13" : "#666", fontWeight: "800", fontSize: 15 }}>Débloquer mon accès VIP</Text>}
            </TouchableOpacity>
            <Text style={{ fontSize: 11, color: colors.muted, textAlign: "center", marginTop: 2 }}>
              Tague les établissements partenaires dans tes posts pour faire grimper ton niveau.
            </Text>
          </View>
        ) : (
          <View style={{ alignItems: "center", marginBottom: 28 }}>
            <TouchableOpacity
              onPress={() => router.push("/login")}
              style={{
                backgroundColor: colors.primary, borderRadius: 50,
                paddingVertical: 14, paddingHorizontal: 36,
              }}
              activeOpacity={0.85}
            >
              <Text style={{ color: "#0A0E13", fontWeight: "800", fontSize: 15 }}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        )}

        <HowItWorksVIP colors={colors} />
      </ScrollView>
    </ScreenContainer>
  );
}

// --- Main Screen ---
export default function VipScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { isDemoMode } = useDemo();

  const [activeCategory, setActiveCategory] = useState<VipCategory>("tables");

  // Soumission d'un post Instagram (directement depuis l'écran VIP).
  const [showSubmit, setShowSubmit] = useState(false);
  const [postUrl, setPostUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { offers, discounts, perks, loading } = useVipData();

  // partner_post_count est mis à jour manuellement par l'admin (18 en démo).
  const { profile, save: saveProfile, saving: savingProfile } = useProfile(isDemoMode ? undefined : user?.id);

  // Instagram « connecté » si login Instagram OU handle renseigné manuellement.
  const isInstagramUser =
    isDemoMode ||
    (isAuthenticated && (user?.loginMethod === "instagram" || !!profile?.instagram_handle));

  // Enregistre le handle Instagram saisi manuellement dans profiles.instagram_handle.
  const handleSaveHandle = useCallback(async (handle: string) => {
    const h = handle.trim().replace(/^@/, "");
    if (!h) return;
    try {
      await saveProfile({ instagram_handle: h });
    } catch (e: any) {
      const msg = e?.message ?? "Échec de l'enregistrement.";
      if (Platform.OS === "web") window.alert(msg); else Alert.alert("Instagram", msg);
    }
  }, [saveProfile]);

  const notify = (m: string) => { if (Platform.OS === "web") window.alert(m); else Alert.alert(m); };

  // Soumet un post Instagram (URL) → vip_posts (statut "pending", validé par l'admin).
  const handleSubmitPost = useCallback(async () => {
    const url = postUrl.trim();
    if (!url.toLowerCase().includes("instagram.com")) {
      notify("Colle l'URL d'un post Instagram (doit contenir « instagram.com »).");
      return;
    }
    setSubmitting(true);
    try {
      await submitPost(url, profile?.instagram_handle ?? "");
      setPostUrl(""); setShowSubmit(false);
      notify("Post soumis ! Il sera validé par l'équipe.");
    } catch (e: any) {
      notify(e?.message ?? "Échec de l'envoi.");
    } finally {
      setSubmitting(false);
    }
  }, [postUrl, profile?.instagram_handle]);

  const partnerPosts = isDemoMode ? 18 : (profile?.partner_post_count ?? 0);
  const currentTier: TierKey =
    partnerPosts >= 30 ? "platinum" :
    partnerPosts >= 15 ? "gold" :
    partnerPosts >= 5  ? "silver" : "bronze";

  const handleBook = useCallback((item: VipOffer) => {
    router.push({
      pathname: "/vip-qr",
      params: {
        offerId:         item.id,
        offerTitle:      item.table_type,
        venue:           item.venue_name,
        date:            item.event_date,
        type:            item.offer_type,
        instagramHandle: item.instagram_handle ?? "",
        requirement:     `Poste une story ou un reel en taguant ${item.instagram_handle} le soir même`,
      },
    });
  }, [router]);

  const handleCopyCode = useCallback((code: string) => {
    if (Platform.OS === "web") {
      try {
        navigator.clipboard.writeText(code);
        Alert.alert("Code copié !", `Code : ${code}`);
      } catch {
        Alert.alert("Code promo", `Code : ${code}`);
      }
    } else {
      Alert.alert("Code copié !", `Code : ${code}`);
    }
  }, []);

  const renderOfferItem = useCallback(
    ({ item }: { item: VipOffer }) => (
      <VipOfferCard item={item} colors={colors} onBook={handleBook} />
    ),
    [colors, handleBook]
  );

  const renderDiscountItem = useCallback(
    ({ item }: { item: VipEventDiscount }) => (
      <DiscountCard item={item} colors={colors} onCopy={handleCopyCode} />
    ),
    [colors, handleCopyCode]
  );

  const renderMemberItem = useCallback(
    ({ item }: { item: VipMemberPerk }) => (
      <MemberOfferCard item={item} colors={colors} />
    ),
    [colors]
  );

  // Tant que la session n'est pas confirmée, on n'affiche pas le gate « Se
  // connecter » (évite un flash non-connecté → connecté). Inutile en mode démo.
  if (authLoading && !isDemoMode) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!isInstagramUser) {
    return (
      <InstagramGate
        isAuthenticated={isAuthenticated}
        router={router}
        colors={colors}
        onSaveHandle={handleSaveHandle}
        saving={savingProfile}
      />
    );
  }

  if (loading) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
          <ActivityIndicator color="#D4AF37" size="large" />
          <Text style={{ color: colors.muted, fontSize: 13 }}>Chargement des offres VIP…</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, alignItems: "center" }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: colors.primary }}>👑 VIP Access</Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
            Offres exclusives · Réservé aux membres Instagram
          </Text>
          {/* Soumettre un post Instagram — directement depuis l'écran VIP */}
          <TouchableOpacity
            onPress={() => { setPostUrl(""); setShowSubmit(true); }}
            activeOpacity={0.85}
            style={{
              marginTop: 12, flexDirection: "row", alignItems: "center", gap: 8,
              backgroundColor: colors.primary, borderRadius: 50,
              paddingVertical: 10, paddingHorizontal: 20,
            }}
          >
            <Text style={{ fontSize: 14 }}>📸</Text>
            <Text style={{ color: colors.onPrimary, fontWeight: "800", fontSize: 13 }}>
              Soumettre un post Instagram
            </Text>
          </TouchableOpacity>
        </View>

        {/* Category Tabs */}
        <View style={{ flexDirection: "row", paddingHorizontal: 20, gap: 8, marginBottom: 16 }}>
          <CategoryTab label="Tables & Beds" icon="🍾" active={activeCategory === "tables"}
            onPress={() => setActiveCategory("tables")} colors={colors} />
          <CategoryTab label="Réductions" icon="🏷️" active={activeCategory === "discounts"}
            onPress={() => setActiveCategory("discounts")} colors={colors} />
          <CategoryTab label="Mon Tier" icon="💎" active={activeCategory === "members"}
            onPress={() => setActiveCategory("members")} colors={colors} />
        </View>

        {activeCategory === "tables" && (
          <FlatList
            data={offers}
            renderItem={renderOfferItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View>
                <HowItWorksVIP colors={colors} />
                <View style={{ marginBottom: 14 }}>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
                    Offres de la Semaine
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
                    Tables · Daybeds · Bouteilles · Accès Privatifs
                  </Text>
                </View>
              </View>
            }
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <Text style={{ fontSize: 36, marginBottom: 8 }}>🍾</Text>
                <Text style={{ color: colors.muted, fontSize: 14 }}>Aucune offre disponible</Text>
              </View>
            }
          />
        )}

        {activeCategory === "discounts" && (
          <FlatList
            data={discounts}
            renderItem={renderDiscountItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
                  Codes & Réductions
                </Text>
                <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
                  Présente le code au venue pour en bénéficier
                </Text>
              </View>
            }
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <Text style={{ fontSize: 36, marginBottom: 8 }}>🏷️</Text>
                <Text style={{ color: colors.muted, fontSize: 14 }}>Aucune réduction disponible</Text>
              </View>
            }
          />
        )}

        {activeCategory === "members" && (
          <FlatList
            data={perks}
            renderItem={renderMemberItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={{ marginBottom: 4 }}>
                <TierBadge tier={currentTier} posts={partnerPosts} colors={colors} />
                <TierComparisonRow colors={colors} />
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
                  Avantages Membres
                </Text>
              </View>
            }
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <Text style={{ fontSize: 36, marginBottom: 8 }}>💎</Text>
                <Text style={{ color: colors.muted, fontSize: 14 }}>Aucun avantage disponible</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Modal : soumettre un post Instagram */}
      <Modal visible={showSubmit} transparent animationType="slide" onRequestClose={() => setShowSubmit(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, borderWidth: 1, borderColor: colors.border, gap: 14 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground }}>Soumettre un post</Text>
              <TouchableOpacity onPress={() => setShowSubmit(false)} accessibilityRole="button" accessibilityLabel="Fermer">
                <Text style={{ fontSize: 22, color: colors.muted }}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 19 }}>
              Colle l'URL de ton post Instagram où tu tagues un établissement partenaire. Une fois validé par l'équipe, il fait grimper ton palier VIP.
            </Text>
            <TextInput
              value={postUrl}
              onChangeText={setPostUrl}
              placeholder="https://www.instagram.com/p/..."
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                backgroundColor: colors.surface, color: colors.foreground, borderRadius: 12,
                paddingHorizontal: 14, paddingVertical: 12, fontSize: 14,
                borderWidth: 1, borderColor: colors.border,
              }}
            />
            <TouchableOpacity
              onPress={handleSubmitPost}
              disabled={submitting}
              activeOpacity={0.85}
              style={{ backgroundColor: colors.primary, borderRadius: 50, paddingVertical: 15, alignItems: "center", opacity: submitting ? 0.6 : 1 }}
            >
              {submitting
                ? <ActivityIndicator color={colors.onPrimary} />
                : <Text style={{ color: colors.onPrimary, fontWeight: "800", fontSize: 15 }}>Envoyer</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
