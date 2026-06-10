import { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";

type Step = 1 | 2 | 3;

export default function JoinPartnerScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);

  const VENUE_TYPES = [
    { id: "beach-club", label: t("venueType.beachClub"), icon: "🏖️" },
    { id: "restaurant", label: t("venueType.restaurant"), icon: "🍽️" },
    { id: "nightclub", label: t("venueType.nightclub"), icon: "🎉" },
    { id: "spa", label: t("venueType.spa"), icon: "🧘" },
    { id: "hotel", label: t("venueType.hotel"), icon: "🏨" },
    { id: "other", label: t("venueType.other"), icon: "✨" },
  ];

  const OFFER_TYPES = [
    { id: "table", label: t("offerType.table"), icon: "🪑" },
    { id: "bed", label: t("offerType.bed"), icon: "🛏️" },
    { id: "bottle", label: t("offerType.bottle"), icon: "🍾" },
    { id: "discount", label: t("offerType.discount"), icon: "🏷️" },
    { id: "experience", label: t("offerType.experience"), icon: "💎" },
  ];

  // Step 1
  const [venueName, setVenueName] = useState("");
  const [venueType, setVenueType] = useState("");
  const [instagram, setInstagram] = useState("");

  // Step 2
  const [selectedOffers, setSelectedOffers] = useState<string[]>([]);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const canStep1 = venueName.length > 1 && venueType !== "" && instagram.length > 1;
  const canStep2 = selectedOffers.length > 0 && contactName.length > 1 && contactEmail.includes("@");

  const toggleOffer = (id: string) => {
    setSelectedOffers(prev =>
      prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      // Appel Edge Function Supabase pour envoyer les emails
      const { error: fnError } = await supabase.functions.invoke("notify-partner", {
        body: {
          venueName,
          venueType,
          instagram,
          contactName,
          contactEmail,
          contactPhone: contactPhone || null,
          offerTypes: selectedOffers.join(", "),
        },
      });

      // On avance même si l'email échoue (Edge Function pas encore déployée)
      if (fnError) {
        console.warn("Email notification failed (Edge Function may not be deployed):", fnError.message);
      }

      setStep(3);
    } catch (err: any) {
      console.error("handleSubmit error:", err);
      Alert.alert("Erreur", t("joinPartner.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const stepIndicator = (n: number) => (
    <View style={{
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: step >= n ? colors.primary : colors.surface,
      borderWidth: 1,
      borderColor: step >= n ? colors.primary : colors.border,
      alignItems: "center",
      justifyContent: "center",
    }}>
      <Text style={{ fontSize: 12, fontWeight: "700", color: step >= n ? "#0A0E13" : colors.muted }}>
        {n}
      </Text>
    </View>
  );

  return (
    <ScreenContainer className="px-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <TouchableOpacity onPress={() => step > 1 && step < 3 ? setStep((step - 1) as Step) : router.back()}>
            <Text style={{ color: colors.primary, fontSize: 16 }}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 22, fontWeight: "800", color: colors.primary }}>
              {t("joinPartner.title")}
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>
              {t("joinPartner.subtitle")}
            </Text>
          </View>
        </View>

        {/* Step indicator */}
        {step < 3 && (
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 28, gap: 0 }}>
            {stepIndicator(1)}
            <View style={{ flex: 1, height: 1, backgroundColor: step >= 2 ? colors.primary : colors.border, marginHorizontal: 6 }} />
            {stepIndicator(2)}
            <View style={{ flex: 1, height: 1, backgroundColor: step >= 3 ? colors.primary : colors.border, marginHorizontal: 6 }} />
            {stepIndicator(3)}
          </View>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <View style={{ gap: 20 }}>
            <View>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 4 }}>
                {t("joinPartner.step1Title")}
              </Text>
              <Text style={{ fontSize: 13, color: colors.muted }}>
                {t("joinPartner.step1Desc")}
              </Text>
            </View>

            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 12, color: colors.muted }}>{t("joinPartner.venueNameLbl")}</Text>
              <TextInput
                value={venueName}
                onChangeText={setVenueName}
                placeholder={t("joinPartner.venueNamePlaceholder")}
                placeholderTextColor="#444"
                style={inputStyle(colors)}
              />
            </View>

            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 12, color: colors.muted }}>{t("joinPartner.venueTypeLbl")}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {VENUE_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    onPress={() => setVenueType(type.id)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      paddingHorizontal: 14,
                      paddingVertical: 9,
                      borderRadius: 20,
                      backgroundColor: venueType === type.id ? colors.primary : colors.surface,
                      borderWidth: 1,
                      borderColor: venueType === type.id ? colors.primary : colors.border,
                    }}
                  >
                    <Text style={{ fontSize: 14 }}>{type.icon}</Text>
                    <Text style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: venueType === type.id ? "#0A0E13" : colors.muted,
                    }}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 12, color: colors.muted }}>{t("joinPartner.instagramHandleLbl")}</Text>
              <TextInput
                value={instagram}
                onChangeText={setInstagram}
                placeholder={t("joinPartner.instagramPlaceholder")}
                placeholderTextColor="#444"
                autoCapitalize="none"
                style={inputStyle(colors)}
              />
            </View>

            <TouchableOpacity
              onPress={() => setStep(2)}
              disabled={!canStep1}
              style={{
                backgroundColor: canStep1 ? colors.primary : "#222",
                borderRadius: 50,
                paddingVertical: 15,
                alignItems: "center",
                marginTop: 8,
              }}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 15, fontWeight: "700", color: canStep1 ? "#0A0E13" : "#555" }}>
                {t("joinPartner.continue")}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <View style={{ gap: 20 }}>
            <View>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 4 }}>
                {t("joinPartner.step2Title")}
              </Text>
              <Text style={{ fontSize: 13, color: colors.muted }}>
                {t("joinPartner.step2Desc")}
              </Text>
            </View>

            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 12, color: colors.muted }}>{t("joinPartner.offerTypesLbl")}</Text>
              <View style={{ gap: 8 }}>
                {OFFER_TYPES.map((o) => {
                  const selected = selectedOffers.includes(o.id);
                  return (
                    <TouchableOpacity
                      key={o.id}
                      onPress={() => toggleOffer(o.id)}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        padding: 14,
                        borderRadius: 12,
                        backgroundColor: selected ? "rgba(212,175,55,0.12)" : colors.surface,
                        borderWidth: 1,
                        borderColor: selected ? colors.primary : colors.border,
                      }}
                    >
                      <Text style={{ fontSize: 20 }}>{o.icon}</Text>
                      <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                        {o.label}
                      </Text>
                      <View style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: selected ? colors.primary : "transparent",
                        borderWidth: 1,
                        borderColor: selected ? colors.primary : colors.border,
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        {selected && <Text style={{ fontSize: 10, color: "#0A0E13", fontWeight: "800" }}>✓</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={{ gap: 12 }}>
              <Text style={{ fontSize: 12, color: colors.muted }}>{t("joinPartner.contactLbl")}</Text>
              <TextInput value={contactName} onChangeText={setContactName} placeholder={t("joinPartner.fullName")} placeholderTextColor="#444" style={inputStyle(colors)} />
              <TextInput value={contactEmail} onChangeText={setContactEmail} placeholder={t("joinPartner.professionalEmail")} placeholderTextColor="#444" keyboardType="email-address" autoCapitalize="none" style={inputStyle(colors)} />
              <TextInput value={contactPhone} onChangeText={setContactPhone} placeholder={t("joinPartner.phone")} placeholderTextColor="#444" keyboardType="phone-pad" style={inputStyle(colors)} />
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!canStep2 || isLoading}
              style={{
                backgroundColor: canStep2 ? colors.primary : "#222",
                borderRadius: 50,
                paddingVertical: 15,
                alignItems: "center",
                marginTop: 8,
              }}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#0A0E13" />
              ) : (
                <Text style={{ fontSize: 15, fontWeight: "700", color: canStep2 ? "#0A0E13" : "#555" }}>
                  {t("joinPartner.sendRequest")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 3 — Confirmation */}
        {step === 3 && (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 24, paddingVertical: 40 }}>
            <Text style={{ fontSize: 72 }}>🎉</Text>
            <Text style={{ fontSize: 24, fontWeight: "800", color: colors.primary, textAlign: "center" }}>
              {t("joinPartner.successTitle")}
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", lineHeight: 22 }}>
              {t("joinPartner.successDesc")}{"\n"}
              <Text style={{ color: colors.primary, fontWeight: "600" }}>{contactEmail}</Text>
            </Text>

            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: colors.border,
              width: "100%",
              gap: 10,
            }}>
              {[
                { icon: "✅", text: t("joinPartner.status1") },
                { icon: "📞", text: t("joinPartner.status2") },
                { icon: "🚀", text: t("joinPartner.status3") },
              ].map((item, i) => (
                <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                  <Text style={{ fontSize: 13, color: colors.foreground, flex: 1 }}>{item.text}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => router.replace("/(tabs)")}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 50,
                paddingVertical: 14,
                paddingHorizontal: 40,
              }}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#0A0E13" }}>
                {t("joinPartner.backHome")}
              </Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </ScreenContainer>
  );
}

function inputStyle(colors: ReturnType<typeof useColors>) {
  return {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 14,
    color: colors.foreground,
  } as const;
}
