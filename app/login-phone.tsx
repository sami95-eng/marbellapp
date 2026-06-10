import {
  ScrollView, Text, View, TouchableOpacity, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "react-i18next";

export default function LoginPhoneScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [countryCode, setCountryCode] = useState("+33");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Normalise en E.164 : indicatif + numéro national (sans 0 initial ni espaces).
  const fullPhone = (): string => {
    const ccDigits = countryCode.replace(/[^\d]/g, "");
    const national = phone.replace(/\D/g, "").replace(/^0+/, "");
    return `+${ccDigits}${national}`;
  };
  const phoneValid = /^\+\d{8,15}$/.test(fullPhone());
  const codeValid = /^\d{6}$/.test(code.trim());

  const sendCode = async () => {
    if (!phoneValid) { setError(t("loginPhone.invalidPhone")); return; }
    setIsLoading(true);
    setError(null);
    try {
      const { error: otpErr } = await supabase.auth.signInWithOtp({ phone: fullPhone() });
      if (otpErr) throw otpErr;
      setStep("otp");
    } catch (err: any) {
      setError(err?.message ?? t("loginPhone.sendFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!codeValid) { setError(t("loginPhone.invalidCode")); return; }
    setIsLoading(true);
    setError(null);
    try {
      const { error: vErr } = await supabase.auth.verifyOtp({
        phone: fullPhone(),
        token: code.trim(),
        type: "sms",
      });
      if (vErr) throw vErr;
      // Succès : onAuthStateChange → AuthRedirect navigue vers l'app.
      // (On ne navigue pas ici pour éviter une course avec AuthRedirect.)
    } catch (err: any) {
      setError(err?.message ?? t("loginPhone.verifyFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer className="px-6">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <View style={{ flex: 1, justifyContent: "center", gap: 28 }}>

            {/* Back + Title */}
            <View style={{ gap: 6 }}>
              <TouchableOpacity
                onPress={() => (step === "otp" ? setStep("phone") : router.back())}
                style={{ marginBottom: 8 }}
              >
                <Text style={{ color: "#D4AF37", fontSize: 15 }}>{t("loginPhone.back")}</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 26, fontWeight: "800", color: "#D4AF37" }}>
                {t("loginPhone.title")}
              </Text>
              <Text style={{ fontSize: 13, color: "#888" }}>
                {step === "phone"
                  ? t("loginPhone.subtitle")
                  : t("loginPhone.sentTo", { phone: fullPhone() })}
              </Text>
            </View>

            {/* STEP 1 — numéro */}
            {step === "phone" && (
              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ width: 90, gap: 4 }}>
                    <Text style={{ fontSize: 12, color: "#888", marginLeft: 4 }}>{t("loginPhone.countryCode")}</Text>
                    <TextInput
                      value={countryCode}
                      onChangeText={setCountryCode}
                      placeholder="+33"
                      placeholderTextColor="#555"
                      keyboardType="phone-pad"
                      autoCapitalize="none"
                      style={inputStyle}
                    />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ fontSize: 12, color: "#888", marginLeft: 4 }}>{t("loginPhone.phoneLabel")}</Text>
                    <TextInput
                      value={phone}
                      onChangeText={setPhone}
                      placeholder={t("loginPhone.phonePlaceholder")}
                      placeholderTextColor="#555"
                      keyboardType="phone-pad"
                      autoCapitalize="none"
                      style={inputStyle}
                    />
                  </View>
                </View>

                {error && (
                  <View style={{ backgroundColor: "rgba(239,68,68,0.15)", borderRadius: 10, padding: 12 }}>
                    <Text style={{ color: "#EF4444", fontSize: 13, textAlign: "center" }}>{error}</Text>
                  </View>
                )}

                <TouchableOpacity
                  onPress={sendCode}
                  disabled={!phoneValid || isLoading}
                  style={{
                    backgroundColor: phoneValid ? "#D4AF37" : "#222",
                    borderRadius: 50, paddingVertical: 16, alignItems: "center",
                  }}
                  activeOpacity={0.8}
                >
                  {isLoading
                    ? <ActivityIndicator color="#0a0a0f" />
                    : <Text style={{ color: phoneValid ? "#0a0a0f" : "#555", fontWeight: "700", fontSize: 16 }}>
                        {t("loginPhone.sendCode")}
                      </Text>}
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 2 — code OTP */}
            {step === "otp" && (
              <View style={{ gap: 12 }}>
                <View style={{ gap: 4 }}>
                  <Text style={{ fontSize: 12, color: "#888", marginLeft: 4 }}>{t("loginPhone.codeLabel")}</Text>
                  <TextInput
                    value={code}
                    onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    placeholderTextColor="#555"
                    keyboardType="number-pad"
                    maxLength={6}
                    style={[inputStyle, { textAlign: "center", letterSpacing: 8, fontSize: 22, fontWeight: "700" }]}
                  />
                </View>

                {error && (
                  <View style={{ backgroundColor: "rgba(239,68,68,0.15)", borderRadius: 10, padding: 12 }}>
                    <Text style={{ color: "#EF4444", fontSize: 13, textAlign: "center" }}>{error}</Text>
                  </View>
                )}

                <TouchableOpacity
                  onPress={verifyCode}
                  disabled={!codeValid || isLoading}
                  style={{
                    backgroundColor: codeValid ? "#D4AF37" : "#222",
                    borderRadius: 50, paddingVertical: 16, alignItems: "center",
                  }}
                  activeOpacity={0.8}
                >
                  {isLoading
                    ? <ActivityIndicator color="#0a0a0f" />
                    : <Text style={{ color: codeValid ? "#0a0a0f" : "#555", fontWeight: "700", fontSize: 16 }}>
                        {t("loginPhone.verify")}
                      </Text>}
                </TouchableOpacity>

                <TouchableOpacity onPress={sendCode} disabled={isLoading} style={{ alignItems: "center" }}>
                  <Text style={{ color: "#D4AF37", fontSize: 13 }}>{t("loginPhone.resend")}</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const inputStyle = {
  backgroundColor: "#111120",
  borderWidth: 1,
  borderColor: "#D4AF3730",
  borderRadius: 14,
  paddingHorizontal: 16,
  paddingVertical: 14,
  fontSize: 15,
  color: "#e8e8e8",
};
