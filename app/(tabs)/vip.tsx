import { useState, useCallback, useEffect } from "react";
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
import { useTranslation } from "react-i18next";
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
import { submitPost, getUserVipStatus, getVipTiers, type VipStatus, type VipTier } from "@/lib/vip-service";

type VipCategory = "tables" | "discounts" | "members";
type TierKey = "bronze" | "silver" | "gold" | "platinum";

// --- Tier system ---
// Valeurs NON textuelles (label proper-noun + couleur/bg/icône). Les "perks"
// (textes) vivent dans i18n : t(tierPerksKey(slug), { returnObjects: true }).
const VIP_TIERS: Record<TierKey, {
  label: string; color: string; bg: string; icon: string;
}> = {
  bronze:   { label: "Bronze",   color: "#CD7F32", bg: "rgba(205,127,50,0.12)", icon: "🥉" },
  silver:   { label: "Silver",   color: "#A8A9AD", bg: "rgba(168,169,173,0.12)", icon: "🥈" },
  gold:     { label: "Gold",     color: "#D4AF37", bg: "rgba(212,175,55,0.12)", icon: "🥇" },
  platinum: { label: "Platinum", color: "#E8E8E8", bg: "rgba(232,232,232,0.12)", icon: "💎" },
};

// Clé i18n des perks d'un palier (tableau via returnObjects). Slug inconnu → bronze.
const TIER_ORDER: TierKey[] = ["bronze", "silver", "gold", "platinum"];
const tierPerksKey = (slug: string): string => {
  const s: TierKey = (TIER_ORDER as string[]).includes(slug) ? (slug as TierKey) : "bronze";
  return `vip.tier${s.charAt(0).toUpperCase()}${s.slice(1)}Perks`;
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
const OFFER_TYPE_LABEL_KEYS: Record<string, string> = {
  table: "vip.offerTypeTable", bed: "vip.offerTypeBed", bottle: "vip.offerTypeBottle", private: "vip.offerTypePrivate",
};

function VipOfferCard({
  item, colors, onBook,
}: {
  item: VipOffer; colors: ReturnType<typeof useColors>; onBook: (item: VipOffer) => void;
}) {
  const { t } = useTranslation();
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
          <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>{OFFER_TYPE_LABEL_KEYS[item.offer_type] ? t(OFFER_TYPE_LABEL_KEYS[item.offer_type]) : item.offer_type}</Text>
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
              <Text style={{ fontSize: 12, color: colors.muted }}>{t("vip.vipPrice")}</Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 11, color: item.spots_left <= 2 ? "#EF4444" : colors.muted, marginBottom: 6 }}>
              {t("vip.spotsRemaining", { count: item.spots_left })}
            </Text>
            <TouchableOpacity
              onPress={() => onBook(item)}
              activeOpacity={0.7}
              style={{ backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 }}
            >
              <Text style={{ color: "#0A0E13", fontWeight: "700", fontSize: 14 }}>{t("vip.bookTable")}</Text>
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
  const { t } = useTranslation();
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
            <Text style={{ fontSize: 12, color: colors.muted }}>{t("vip.until", { date: item.valid_until })}</Text>
          </View>
        </View>

        <View style={{
          flexDirection: "row", alignItems: "center", justifyContent: "space-between",
          marginTop: 14, backgroundColor: "rgba(212,175,55,0.1)", padding: 12, borderRadius: 10,
          borderWidth: 1, borderColor: "rgba(212,175,55,0.3)",
        }}>
          <View>
            <Text style={{ fontSize: 11, color: colors.muted }}>{t("vip.promoCode")}</Text>
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
              <Text style={{ color: "#0A0E13", fontWeight: "700", fontSize: 12 }}>{t("vip.copyCode")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

// Seuil (nombre de posts) pour atteindre le tier suivant
// Métadonnées UI par palier (icône + bg) — label/couleur/réduction/seuils
// viennent de la BASE (vip_tiers via getUserVipStatus / getVipTiers).
const TIER_UI: Record<string, { icon: string; bg: string }> = {
  bronze:   { icon: "🥉", bg: "rgba(205,127,50,0.12)" },
  silver:   { icon: "🥈", bg: "rgba(168,169,173,0.12)" },
  gold:     { icon: "🥇", bg: "rgba(212,175,55,0.12)" },
  platinum: { icon: "💎", bg: "rgba(232,232,232,0.12)" },
};
const tierUi = (slug: string) => TIER_UI[slug] ?? TIER_UI.bronze;

function TierBadge({ status, colors }: { status: VipStatus; colors: ReturnType<typeof useColors> }) {
  const { t } = useTranslation();
  const slug = status.tier.tier;
  const perks = t(tierPerksKey(slug), { returnObjects: true }) as unknown as string[];
  const ui = tierUi(slug);
  const color = status.tier.color;
  const posts = status.post_count;
  const next = status.nextTier;
  const floor = status.tier.min_posts;
  const remaining = next ? Math.max(0, next.min_posts - posts) : 0;
  const progress = next ? Math.min(1, (posts - floor) / Math.max(1, next.min_posts - floor)) : 1;

  return (
    <View style={{
      backgroundColor: ui.bg, borderWidth: 1, borderColor: color,
      borderRadius: 12, padding: 16, marginBottom: 20,
    }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <Text style={{ fontSize: 32 }}>{ui.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: colors.muted, fontWeight: "600" }}>{t("vip.currentTier")}</Text>
          <Text style={{ fontSize: 22, fontWeight: "800", color }}>{status.tier.label}</Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>{t("vip.approvedPostsFloor", { count: floor })}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color }}>{posts}</Text>
          <Text style={{ fontSize: 10, color: colors.muted }}>{t("vip.approvedPosts")}</Text>
        </View>
      </View>

      {/* Réduction actuelle — bien visible (source : vip_tiers) */}
      <View style={{
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 10,
        paddingHorizontal: 12, paddingVertical: 10, marginBottom: 14,
      }}>
        <Text style={{ fontSize: 13, color: colors.foreground, fontWeight: "600" }}>{t("vip.currentDiscount")}</Text>
        <Text style={{ fontSize: 20, fontWeight: "800", color }}>{status.discount_pct}%</Text>
      </View>

      {/* Progression vers le palier suivant */}
      <View style={{ marginBottom: 14 }}>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
          <View style={{ width: `${progress * 100}%`, height: "100%", backgroundColor: color }} />
        </View>
        <Text style={{ fontSize: 11, color: colors.muted, marginTop: 6 }}>
          {next
            ? t("vip.postsToNextTier", { count: remaining, tier: next.label, pct: next.discount_pct })
            : t("vip.maxTierReached")}
        </Text>
      </View>

      <View style={{ gap: 6 }}>
        {perks.map((perk) => (
          <View key={perk} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ color, fontSize: 13 }}>✓</Text>
            <Text style={{ fontSize: 13, color: colors.foreground }}>{perk}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function TierComparisonRow({ tiers, colors }: { tiers: VipTier[]; colors: ReturnType<typeof useColors> }) {
  const { t } = useTranslation();
  const sorted = [...tiers].sort((a, b) => a.min_posts - b.min_posts);
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
        {t("vip.allTiers")}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
        {sorted.map((tier, i) => {
          const ui = tierUi(tier.tier);
          const perks = t(tierPerksKey(tier.tier), { returnObjects: true }) as unknown as string[];
          const nextAt = sorted[i + 1]?.min_posts;
          const requirement = nextAt != null
            ? t("vip.postsRange", { min: tier.min_posts, max: nextAt - 1 })
            : t("vip.postsMin", { min: tier.min_posts });
          return (
            <View key={tier.tier} style={{
              width: 180, backgroundColor: colors.surface, borderRadius: 12,
              borderWidth: 1, borderColor: tier.color, padding: 14, marginHorizontal: 4,
            }}>
              <Text style={{ fontSize: 24, marginBottom: 6 }}>{ui.icon}</Text>
              <Text style={{ fontSize: 15, fontWeight: "800", color: tier.color, marginBottom: 2 }}>
                {tier.label} · {tier.discount_pct}%
              </Text>
              <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 10 }}>{requirement}</Text>
              {perks.slice(0, 3).map((perk) => (
                <View key={perk} style={{ flexDirection: "row", gap: 6, marginBottom: 4 }}>
                  <Text style={{ color: tier.color, fontSize: 11 }}>✓</Text>
                  <Text style={{ fontSize: 11, color: colors.muted, flex: 1 }}>{perk}</Text>
                </View>
              ))}
              {perks.length > 3 && (
                <Text style={{ fontSize: 11, color: tier.color, marginTop: 4 }}>
                  {t("vip.morePerks", { count: perks.length - 3 })}
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
  { n: "1", icon: "📸", titleKey: "vip.step1Title", descKey: "vip.step1Desc" },
  { n: "2", icon: "👑", titleKey: "vip.step2Title", descKey: "vip.step2Desc" },
  { n: "3", icon: "🔓", titleKey: "vip.step3Title", descKey: "vip.step3Desc" },
];

function HowItWorksVIP({ colors }: { colors: ReturnType<typeof useColors> }) {
  const { t } = useTranslation();
  return (
    <View style={{ marginBottom: 20 }}>
      <View style={{ alignItems: "center", marginBottom: 14 }}>
        <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground }}>{t("vip.howItWorks")}</Text>
        <Text style={{ fontSize: 12, color: colors.muted, textAlign: "center", marginTop: 4, lineHeight: 18 }}>
          {t("vip.howItWorksSub")}
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
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>{t(s.titleKey)}</Text>
            </View>
            <Text style={{ fontSize: 12.5, color: colors.muted, marginTop: 4, lineHeight: 18 }}>{t(s.descKey)}</Text>
          </View>
        </View>
      ))}

      <View style={{
        backgroundColor: "rgba(212,175,55,0.06)", borderRadius: 12, padding: 12,
        borderWidth: 1, borderColor: "rgba(212,175,55,0.18)",
      }}>
        <Text style={{ fontSize: 12, color: colors.muted, textAlign: "center", lineHeight: 18 }}>
          {t("vip.howItWorksNote")}
        </Text>
      </View>
    </View>
  );
}

function InstagramGate({ isAuthenticated, router, colors, onSaveHandle, saving }: {
  isAuthenticated: boolean; router: ReturnType<typeof useRouter>; colors: ReturnType<typeof useColors>;
  onSaveHandle: (handle: string) => void; saving: boolean;
}) {
  const { t } = useTranslation();
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
            {t("vip.title")}
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", lineHeight: 22 }}>
            {isAuthenticated ? t("vip.gateAuthDesc") : t("vip.gateUnauthDesc")}
          </Text>
        </View>

        {isAuthenticated ? (
          <View style={{ marginBottom: 28, gap: 10 }}>
            <Text style={{ fontSize: 11, color: colors.muted, fontWeight: "600", marginLeft: 4, letterSpacing: 0.5 }}>
              {t("vip.yourInstagram")}
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
                placeholder={t("vip.handlePlaceholder")}
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
                : <Text style={{ color: valid ? "#0A0E13" : "#666", fontWeight: "800", fontSize: 15 }}>{t("vip.unlockVip")}</Text>}
            </TouchableOpacity>
            <Text style={{ fontSize: 11, color: colors.muted, textAlign: "center", marginTop: 2 }}>
              {t("vip.gateHint")}
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
              <Text style={{ color: "#0A0E13", fontWeight: "800", fontSize: 15 }}>{t("vip.signIn")}</Text>
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
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { isDemoMode } = useDemo();

  const [activeCategory, setActiveCategory] = useState<VipCategory>("tables");

  // Soumission d'un post Instagram (directement depuis l'écran VIP).
  const [showSubmit, setShowSubmit] = useState(false);
  const [postUrl, setPostUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Source de vérité paliers/réduction : base vip_tiers (via getUserVipStatus).
  const [vipStatus, setVipStatus] = useState<VipStatus | null>(null);
  const [allTiers, setAllTiers] = useState<VipTier[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const tiers = await getVipTiers();
        if (cancelled) return;
        setAllTiers(tiers);
        if (isDemoMode) {
          const sorted = [...tiers].sort((a, b) => a.min_posts - b.min_posts);
          const count = 18;
          let cur = sorted[0];
          for (const tr of sorted) if (count >= tr.min_posts) cur = tr;
          const nx = sorted.find((tr) => tr.min_posts > cur.min_posts) ?? null;
          setVipStatus({ tier: cur, nextTier: nx, discount_pct: cur.discount_pct, post_count: count, posts: [] });
        } else if (user?.id) {
          const s = await getUserVipStatus(user.id);
          if (!cancelled) setVipStatus(s);
        }
      } catch { /* garde les valeurs par défaut */ }
    })();
    return () => { cancelled = true; };
  }, [isDemoMode, user?.id]);

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
      const msg = e?.message ?? t("vip.saveHandleError");
      if (Platform.OS === "web") window.alert(msg); else Alert.alert("Instagram", msg);
    }
  }, [saveProfile]);

  const notify = (m: string) => { if (Platform.OS === "web") window.alert(m); else Alert.alert(m); };

  // Soumet un post Instagram (URL) → vip_posts (statut "pending", validé par l'admin).
  const handleSubmitPost = useCallback(async () => {
    const url = postUrl.trim();
    if (!url.toLowerCase().includes("instagram.com")) {
      notify(t("vip.invalidPostUrl"));
      return;
    }
    setSubmitting(true);
    try {
      await submitPost(url, profile?.instagram_handle ?? "");
      setPostUrl(""); setShowSubmit(false);
      notify(t("vip.postSubmitted"));
    } catch (e: any) {
      notify(e?.message ?? t("vip.submitError"));
    } finally {
      setSubmitting(false);
    }
  }, [postUrl, profile?.instagram_handle]);

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
        requirement:     t("vip.bookRequirement", { handle: item.instagram_handle }),
      },
    });
  }, [router]);

  const handleCopyCode = useCallback((code: string) => {
    if (Platform.OS === "web") {
      try {
        navigator.clipboard.writeText(code);
        Alert.alert(t("vip.codeCopied"), t("vip.codeMessage", { code }));
      } catch {
        Alert.alert(t("vip.promoCode"), t("vip.codeMessage", { code }));
      }
    } else {
      Alert.alert(t("vip.codeCopied"), t("vip.codeMessage", { code }));
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
          <Text style={{ color: colors.muted, fontSize: 13 }}>{t("vip.loadingOffers")}</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, alignItems: "center" }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: colors.primary }}>👑 {t("vip.title")}</Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
            {t("vip.headerSubtitle")}
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
              {t("vip.submitPostCta")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Category Tabs */}
        <View style={{ flexDirection: "row", paddingHorizontal: 20, gap: 8, marginBottom: 16 }}>
          <CategoryTab label={t("vip.catTables")} icon="🍾" active={activeCategory === "tables"}
            onPress={() => setActiveCategory("tables")} colors={colors} />
          <CategoryTab label={t("vip.discounts")} icon="🏷️" active={activeCategory === "discounts"}
            onPress={() => setActiveCategory("discounts")} colors={colors} />
          <CategoryTab label={t("vip.catMyTier")} icon="💎" active={activeCategory === "members"}
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
                    {t("vip.weeklyOffers")}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
                    {t("vip.weeklyOffersDesc")}
                  </Text>
                </View>
              </View>
            }
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <Text style={{ fontSize: 36, marginBottom: 8 }}>🍾</Text>
                <Text style={{ color: colors.muted, fontSize: 14 }}>{t("vip.noOffers")}</Text>
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
                  {t("vip.codesDiscounts")}
                </Text>
                <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
                  {t("vip.codesDiscountsDesc")}
                </Text>
              </View>
            }
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <Text style={{ fontSize: 36, marginBottom: 8 }}>🏷️</Text>
                <Text style={{ color: colors.muted, fontSize: 14 }}>{t("vip.noDiscounts")}</Text>
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
                {vipStatus && <TierBadge status={vipStatus} colors={colors} />}
                {allTiers.length > 0 && <TierComparisonRow tiers={allTiers} colors={colors} />}
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
                  {t("vip.memberBenefits")}
                </Text>
              </View>
            }
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <Text style={{ fontSize: 36, marginBottom: 8 }}>💎</Text>
                <Text style={{ color: colors.muted, fontSize: 14 }}>{t("vip.noBenefits")}</Text>
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
              <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground }}>{t("vip.submitPostTitle")}</Text>
              <TouchableOpacity onPress={() => setShowSubmit(false)} accessibilityRole="button" accessibilityLabel={t("vip.close")}>
                <Text style={{ fontSize: 22, color: colors.muted }}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 19 }}>
              {t("vip.submitPostDesc")}
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
                : <Text style={{ color: colors.onPrimary, fontWeight: "800", fontSize: 15 }}>{t("vip.send")}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
