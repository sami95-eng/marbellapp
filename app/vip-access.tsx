import { useState, useCallback } from "react";
import {
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useTranslation } from "react-i18next";

// --- Types ---
type VipCategory = "tables" | "discounts" | "members";

interface VipTableOffer {
  id: string;
  venue: string;
  venueId: string;
  image: string;
  date: string;
  time: string;
  tableType: string;
  capacity: number;
  originalPrice: number;
  vipPrice: number;
  perks: string[];
  spotsLeft: number;
  tag: string;
}

interface EventDiscount {
  id: string;
  title: string;
  venue: string;
  venueId: string;
  image: string;
  date: string;
  discount: number;
  originalPrice: number;
  description: string;
  code: string;
  validUntil: string;
  category: string;
}

interface MemberOffer {
  id: string;
  title: string;
  venue: string;
  venueId: string;
  image: string;
  description: string;
  benefit: string;
  tier: "gold" | "platinum" | "diamond";
  isNew: boolean;
}

// --- Data ---
const VIP_TABLES: VipTableOffer[] = [
  {
    id: "t1",
    venue: "Ocean Club Marbella",
    venueId: "ocean-club",
    image: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600",
    date: "Sat, Jun 7",
    time: "22:00 - 04:00",
    tableType: "VIP Cabana",
    capacity: 8,
    originalPrice: 2000,
    vipPrice: 1200,
    perks: ["2 Premium Bottles", "Dedicated Server", "Pool Access"],
    spotsLeft: 2,
    tag: "HOT",
  },
  {
    id: "t2",
    venue: "Nikki Beach Marbella",
    venueId: "nikki-beach",
    image: "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=600",
    date: "Fri, Jun 6",
    time: "14:00 - 22:00",
    tableType: "Beachfront Table",
    capacity: 6,
    originalPrice: 1500,
    vipPrice: 900,
    perks: ["1 Magnum Champagne", "Priority Seating", "Sunset View"],
    spotsLeft: 4,
    tag: "POPULAR",
  },
  {
    id: "t3",
    venue: "Bonbonniere Marbella",
    venueId: "bonbonniere-marbella",
    image: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=600",
    date: "Sat, Jun 7",
    time: "23:30 - 06:00",
    tableType: "VIP Booth",
    capacity: 10,
    originalPrice: 3000,
    vipPrice: 1800,
    perks: ["3 Premium Bottles", "VIP Entrance", "DJ Meet & Greet"],
    spotsLeft: 1,
    tag: "LAST SPOT",
  },
  {
    id: "t4",
    venue: "Opium Beach Club",
    venueId: "opium-beach",
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600",
    date: "Sun, Jun 8",
    time: "13:00 - 20:00",
    tableType: "Daybed Premium",
    capacity: 4,
    originalPrice: 800,
    vipPrice: 500,
    perks: ["1 Bottle Rosé", "Towel Service", "Food Menu Access"],
    spotsLeft: 6,
    tag: "BEST VALUE",
  },
  {
    id: "t5",
    venue: "Playa Padre",
    venueId: "playa-padre",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600",
    date: "Fri, Jun 6",
    time: "12:00 - 20:00",
    tableType: "Front Row Sunbed",
    capacity: 2,
    originalPrice: 400,
    vipPrice: 250,
    perks: ["Welcome Cocktails", "Beach Towels", "Wifi Premium"],
    spotsLeft: 8,
    tag: "NEW",
  },
];

const EVENT_DISCOUNTS: EventDiscount[] = [
  {
    id: "d1",
    title: "Starlite Festival - Opening Night",
    venue: "Starlite Auditorium",
    venueId: "starlite-festival",
    image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600",
    date: "Jun 15, 2026",
    discount: 30,
    originalPrice: 150,
    description: "Exclusive 30% off on opening night tickets. Live performances, gourmet food & premium cocktails under the stars.",
    code: "MARBELLVIP30",
    validUntil: "Jun 14, 2026",
    category: "Festival",
  },
  {
    id: "d2",
    title: "Full Moon Party at Nikki Beach",
    venue: "Nikki Beach Marbella",
    venueId: "nikki-beach",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600",
    date: "Jun 11, 2026",
    discount: 25,
    originalPrice: 80,
    description: "Moonlit beach party with international DJs. VIP members get 25% off entry + complimentary welcome drink.",
    code: "MOONVIP25",
    validUntil: "Jun 10, 2026",
    category: "Party",
  },
  {
    id: "d3",
    title: "Wine & Dine at Skina",
    venue: "Skina Restaurant",
    venueId: "skina-restaurant",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600",
    date: "Jun 20, 2026",
    discount: 20,
    originalPrice: 250,
    description: "Exclusive tasting menu with wine pairing at this 2-Michelin star restaurant. 20% off for Marbell'app members.",
    code: "SKINAVIP20",
    validUntil: "Jun 19, 2026",
    category: "Dining",
  },
  {
    id: "d4",
    title: "Spa Day at Six Senses",
    venue: "Six Senses Spa",
    venueId: "six-senses-spa",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600",
    date: "Any day in June",
    discount: 35,
    originalPrice: 300,
    description: "Full day spa experience with massage, facial & pool access. 35% exclusive discount for VIP members.",
    code: "SPAVIP35",
    validUntil: "Jun 30, 2026",
    category: "Wellness",
  },
  {
    id: "d5",
    title: "Yacht Sunset Cruise",
    venue: "Puerto Banús Marina",
    venueId: "puerto-banus-shopping",
    image: "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=600",
    date: "Every Saturday",
    discount: 15,
    originalPrice: 500,
    description: "Private yacht cruise along the Golden Mile with champagne, canapés & DJ. 15% off for app members.",
    code: "YACHTVIP15",
    validUntil: "Jul 31, 2026",
    category: "Experience",
  },
];

const MEMBER_OFFERS: MemberOffer[] = [
  {
    id: "m1",
    title: "Priority Queue at All Partner Venues",
    venue: "All Venues",
    venueId: "ocean-club",
    image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600",
    description: "Skip the line at all partner venues. Show your Marbell'app VIP badge at the door for instant access.",
    benefit: "No Wait",
    tier: "gold",
    isNew: false,
  },
  {
    id: "m2",
    title: "Complimentary Welcome Drink",
    venue: "Selected Beach Clubs",
    venueId: "nikki-beach",
    image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600",
    description: "Enjoy a complimentary signature cocktail or glass of champagne at any partner beach club upon arrival.",
    benefit: "Free Drink",
    tier: "gold",
    isNew: false,
  },
  {
    id: "m3",
    title: "Personal Concierge Service",
    venue: "Marbell'app Exclusive",
    venueId: "ocean-club",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600",
    description: "24/7 personal concierge to arrange reservations, transport, and bespoke experiences across Marbella.",
    benefit: "24/7 Service",
    tier: "platinum",
    isNew: true,
  },
  {
    id: "m4",
    title: "Monthly Exclusive Event Access",
    venue: "Rotating Venues",
    venueId: "bonbonniere-marbella",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600",
    description: "Invitation to one exclusive members-only event per month. Private dinners, yacht parties, and gallery openings.",
    benefit: "Exclusive Events",
    tier: "platinum",
    isNew: false,
  },
  {
    id: "m5",
    title: "Diamond Upgrade Package",
    venue: "All Partner Venues",
    venueId: "ocean-club",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600",
    description: "Automatic upgrade to the best available table, room, or experience at any partner venue. Diamond members always get the best.",
    benefit: "Auto Upgrade",
    tier: "diamond",
    isNew: true,
  },
];

// --- Components ---
function CategoryTab({
  label,
  icon,
  active,
  onPress,
  colors,
}: {
  label: string;
  icon: string;
  active: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 12,
        backgroundColor: active ? colors.primary : colors.surface,
        borderWidth: active ? 0 : 1,
        borderColor: colors.border,
        alignItems: "center",
        gap: 4,
      }}
    >
      <Text style={{ fontSize: 18 }}>{icon}</Text>
      <Text
        style={{
          fontSize: 11,
          fontWeight: active ? "700" : "500",
          color: active ? "#0A0E13" : colors.muted,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function VipTableCard({
  item,
  colors,
  onBook,
}: {
  item: VipTableOffer;
  colors: ReturnType<typeof useColors>;
  onBook: (item: VipTableOffer) => void;
}) {
  const savings = item.originalPrice - item.vipPrice;
  const savingsPercent = Math.round((savings / item.originalPrice) * 100);

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        marginBottom: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ position: "relative" }}>
        <Image
          source={{ uri: item.image }}
          style={{ width: "100%", height: 160 }}
          contentFit="cover"
        />
        <View
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            backgroundColor: item.tag === "LAST SPOT" ? "#EF4444" : colors.primary,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#0A0E13", fontSize: 11, fontWeight: "800" }}>
            {item.tag}
          </Text>
        </View>
        <View
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            backgroundColor: "rgba(0,0,0,0.7)",
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#4ADE80", fontSize: 12, fontWeight: "700" }}>
            -{savingsPercent}%
          </Text>
        </View>
      </View>

      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>
          {item.venue}
        </Text>
        <Text style={{ fontSize: 13, color: colors.primary, marginTop: 2, fontWeight: "600" }}>
          {item.tableType}
        </Text>

        <View style={{ flexDirection: "row", marginTop: 10, gap: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ fontSize: 14 }}>📅</Text>
            <Text style={{ fontSize: 13, color: colors.muted }}>{item.date}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ fontSize: 14 }}>🕐</Text>
            <Text style={{ fontSize: 13, color: colors.muted }}>{item.time}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ fontSize: 14 }}>👥</Text>
            <Text style={{ fontSize: 13, color: colors.muted }}>Up to {item.capacity}</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          {item.perks.map((perk) => (
            <View
              key={perk}
              style={{
                backgroundColor: "rgba(212,175,55,0.15)",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
              }}
            >
              <Text style={{ fontSize: 11, color: colors.primary, fontWeight: "600" }}>
                {perk}
              </Text>
            </View>
          ))}
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 14,
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 13,
                color: colors.muted,
                textDecorationLine: "line-through",
              }}
            >
              €{item.originalPrice}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
              <Text style={{ fontSize: 24, fontWeight: "800", color: colors.primary }}>
                €{item.vipPrice}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>VIP Price</Text>
            </View>
          </View>

          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 11, color: item.spotsLeft <= 2 ? "#EF4444" : colors.muted, marginBottom: 6 }}>
              {item.spotsLeft} spots left
            </Text>
            <TouchableOpacity
              onPress={() => onBook(item)}
              activeOpacity={0.7}
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 24,
                paddingVertical: 10,
                borderRadius: 10,
              }}
            >
              <Text style={{ color: "#0A0E13", fontWeight: "700", fontSize: 14 }}>
                BOOK TABLE
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

function DiscountCard({
  item,
  colors,
  onCopy,
}: {
  item: EventDiscount;
  colors: ReturnType<typeof useColors>;
  onCopy: (code: string) => void;
}) {
  const discountedPrice = Math.round(item.originalPrice * (1 - item.discount / 100));

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        marginBottom: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ position: "relative" }}>
        <Image
          source={{ uri: item.image }}
          style={{ width: "100%", height: 140 }}
          contentFit="cover"
        />
        <View
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            backgroundColor: "#EF4444",
            paddingHorizontal: 12,
            paddingVertical: 5,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "800" }}>
            -{item.discount}%
          </Text>
        </View>
        <View
          style={{
            position: "absolute",
            bottom: 12,
            left: 12,
            backgroundColor: "rgba(0,0,0,0.7)",
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 6,
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "600" }}>
            {item.category}
          </Text>
        </View>
      </View>

      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 17, fontWeight: "700", color: colors.foreground }}>
          {item.title}
        </Text>
        <Text style={{ fontSize: 13, color: colors.primary, marginTop: 2 }}>
          {item.venue}
        </Text>
        <Text style={{ fontSize: 13, color: colors.muted, marginTop: 6, lineHeight: 18 }}>
          {item.description}
        </Text>

        <View style={{ flexDirection: "row", marginTop: 10, gap: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ fontSize: 13 }}>📅</Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>{item.date}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ fontSize: 13 }}>⏰</Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>Valid until {item.validUntil}</Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 14,
            backgroundColor: "rgba(212,175,55,0.1)",
            padding: 12,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: "rgba(212,175,55,0.3)",
          }}
        >
          <View>
            <Text style={{ fontSize: 11, color: colors.muted }}>Promo Code</Text>
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.primary, letterSpacing: 2 }}>
              {item.code}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
              <Text style={{ fontSize: 13, color: colors.muted, textDecorationLine: "line-through" }}>
                €{item.originalPrice}
              </Text>
              <Text style={{ fontSize: 20, fontWeight: "800", color: colors.primary }}>
                €{discountedPrice}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => onCopy(item.code)}
              activeOpacity={0.7}
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 16,
                paddingVertical: 6,
                borderRadius: 8,
                marginTop: 4,
              }}
            >
              <Text style={{ color: "#0A0E13", fontWeight: "700", fontSize: 12 }}>
                COPY CODE
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

function MemberOfferCard({
  item,
  colors,
}: {
  item: MemberOffer;
  colors: ReturnType<typeof useColors>;
}) {
  const tierColors = {
    gold: "#D4AF37",
    platinum: "#C0C0C0",
    diamond: "#B9F2FF",
  };
  const tierLabels = {
    gold: "GOLD",
    platinum: "PLATINUM",
    diamond: "DIAMOND",
  };

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        marginBottom: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: tierColors[item.tier],
      }}
    >
      <View style={{ position: "relative" }}>
        <Image
          source={{ uri: item.image }}
          style={{ width: "100%", height: 120 }}
          contentFit="cover"
        />
        <View
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            backgroundColor: tierColors[item.tier],
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#0A0E13", fontSize: 11, fontWeight: "800" }}>
            {tierLabels[item.tier]}
          </Text>
        </View>
        {item.isNew && (
          <View
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              backgroundColor: "#EF4444",
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 6,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "800" }}>NEW</Text>
          </View>
        )}
      </View>

      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, flex: 1 }}>
            {item.title}
          </Text>
          <View
            style={{
              backgroundColor: "rgba(212,175,55,0.15)",
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 8,
              marginLeft: 8,
            }}
          >
            <Text style={{ fontSize: 11, color: colors.primary, fontWeight: "700" }}>
              {item.benefit}
            </Text>
          </View>
        </View>
        <Text style={{ fontSize: 13, color: colors.primary, marginTop: 2 }}>
          {item.venue}
        </Text>
        <Text style={{ fontSize: 13, color: colors.muted, marginTop: 6, lineHeight: 18 }}>
          {item.description}
        </Text>
      </View>
    </View>
  );
}

// --- Main Screen ---
export default function VipAccessScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const [activeCategory, setActiveCategory] = useState<VipCategory>("tables");

  const handleBookTable = useCallback((item: VipTableOffer) => {
    router.push({
      pathname: "/booking",
      params: { venueId: item.venueId, venueName: item.venue },
    });
  }, [router]);

  const handleCopyCode = useCallback((code: string) => {
    if (Platform.OS === "web") {
      try {
        navigator.clipboard.writeText(code);
        Alert.alert("Code Copied!", `Promo code ${code} copied to clipboard.`);
      } catch {
        Alert.alert("Promo Code", `Your code: ${code}`);
      }
    } else {
      Alert.alert("Code Copied!", `Promo code ${code} copied to clipboard.`);
    }
  }, []);

  const renderTableItem = useCallback(
    ({ item }: { item: VipTableOffer }) => (
      <VipTableCard item={item} colors={colors} onBook={handleBookTable} />
    ),
    [colors, handleBookTable]
  );

  const renderDiscountItem = useCallback(
    ({ item }: { item: EventDiscount }) => (
      <DiscountCard item={item} colors={colors} onCopy={handleCopyCode} />
    ),
    [colors, handleCopyCode]
  );

  const renderMemberItem = useCallback(
    ({ item }: { item: MemberOffer }) => (
      <MemberOfferCard item={item} colors={colors} />
    ),
    [colors]
  );

  return (
    <ScreenContainer>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
              <Text style={{ fontSize: 28, color: colors.foreground }}>←</Text>
            </TouchableOpacity>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 22, fontWeight: "800", color: colors.primary }}>
                👑 {t("vip.title")}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                {t("vip.perks")}
              </Text>
            </View>
            <View style={{ width: 28 }} />
          </View>
        </View>

        {/* Category Tabs */}
        <View style={{ flexDirection: "row", paddingHorizontal: 20, gap: 8, marginBottom: 16 }}>
          <CategoryTab label={t("vip.tables")}    icon="🍾" active={activeCategory === "tables"}    onPress={() => setActiveCategory("tables")}    colors={colors} />
          <CategoryTab label={t("vip.discounts")} icon="🏷️" active={activeCategory === "discounts"} onPress={() => setActiveCategory("discounts")} colors={colors} />
          <CategoryTab label={t("vip.members")}   icon="💎" active={activeCategory === "members"}   onPress={() => setActiveCategory("members")}   colors={colors} />
        </View>

        {/* Content */}
        {activeCategory === "tables" && (
          <FlatList
            data={VIP_TABLES}
            renderItem={renderTableItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>{t("vip.weeklyTables")}</Text>
                <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>{t("vip.exclusivePricing")}</Text>
              </View>
            }
          />
        )}

        {activeCategory === "discounts" && (
          <FlatList
            data={EVENT_DISCOUNTS}
            renderItem={renderDiscountItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>{t("vip.eventDiscounts")}</Text>
                <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>{t("vip.promoCodesDesc")}</Text>
              </View>
            }
          />
        )}

        {activeCategory === "members" && (
          <FlatList
            data={MEMBER_OFFERS}
            renderItem={renderMemberItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>{t("vip.memberBenefits")}</Text>
                <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>{t("vip.memberBenefitsDesc")}</Text>
              </View>
            }
          />
        )}
      </View>
    </ScreenContainer>
  );
}
