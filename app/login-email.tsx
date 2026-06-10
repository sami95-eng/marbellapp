import {
  ScrollView, Text, View, TouchableOpacity, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "react-i18next";

export default function LoginEmailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid =
    email.includes("@") &&
    password.length >= 6 &&
    (mode === "signin" || name.length > 1);

  const handleSubmit = async () => {
    if (!isValid) return;
    setIsLoading(true);
    setError(null);

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name, login_method: "email" } },
        });
        if (signUpError) throw signUpError;
        // Si la confirmation email est activée, aucune session n'est créée :
        // on dirige vers l'écran de vérification (code OTP envoyé par Supabase).
        if (!data.session) {
          router.replace({ pathname: "/verify-email", params: { email } });
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
      // Auth succeeded. Supabase fires onAuthStateChange → useAuth sets
      // isAuthenticated = true → AuthRedirect navigates to /(tabs).
      // We must NOT call router.replace here: navigating to (tabs) before
      // isAuthenticated is true causes AuthRedirect to kick the user back to /login.
    } catch (err: any) {
      setError(err?.message ?? t("loginEmail.authFailed"));
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
              <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 8 }}>
                <Text style={{ color: "#D4AF37", fontSize: 15 }}>← Back</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 26, fontWeight: "800", color: "#D4AF37" }}>
                {mode === "signin" ? t("loginEmail.welcomeBack") : t("loginEmail.createAccount")}
              </Text>
              <Text style={{ fontSize: 13, color: "#888" }}>
                {mode === "signin" ? t("loginEmail.signInSubtitle") : t("loginEmail.signUpSubtitle")}
              </Text>
            </View>

            {/* Toggle */}
            <View style={{
              flexDirection: "row",
              backgroundColor: "#111120",
              borderRadius: 50,
              borderWidth: 1,
              borderColor: "#D4AF3720",
              padding: 4,
            }}>
              {(["signin", "signup"] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => { setMode(m); setError(null); }}
                  style={{
                    flex: 1, alignItems: "center", paddingVertical: 10,
                    borderRadius: 50,
                    backgroundColor: mode === m ? "#D4AF37" : "transparent",
                  }}
                >
                  <Text style={{
                    fontSize: 14, fontWeight: "600",
                    color: mode === m ? "#0a0a0f" : "#888",
                  }}>
                    {m === "signin" ? t("loginEmail.signIn") : t("loginEmail.signUp")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Fields */}
            <View style={{ gap: 12 }}>
              {mode === "signup" && (
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder={t("loginEmail.fullName")}
                  placeholderTextColor="#555"
                  style={inputStyle}
                  autoCapitalize="words"
                />
              )}
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder={t("loginEmail.emailAddress")}
                placeholderTextColor="#555"
                style={inputStyle}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={t("loginEmail.password")}
                placeholderTextColor="#555"
                style={inputStyle}
                secureTextEntry
              />
            </View>

            {/* Error */}
            {error && (
              <View style={{ backgroundColor: "rgba(239,68,68,0.15)", borderRadius: 10, padding: 12 }}>
                <Text style={{ color: "#EF4444", fontSize: 13, textAlign: "center" }}>{error}</Text>
              </View>
            )}

            {/* Submit */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!isValid || isLoading}
              style={{
                backgroundColor: isValid ? "#D4AF37" : "#222",
                borderRadius: 50,
                paddingVertical: 16,
                alignItems: "center",
              }}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#0a0a0f" />
              ) : (
                <Text style={{ color: isValid ? "#0a0a0f" : "#555", fontWeight: "700", fontSize: 16 }}>
                  {mode === "signin" ? t("loginEmail.signIn") : t("loginEmail.createAccount")}
                </Text>
              )}
            </TouchableOpacity>

            {mode === "signin" && (
              <TouchableOpacity style={{ alignItems: "center" }}>
                <Text style={{ color: "#D4AF37", fontSize: 13 }}>{t("loginEmail.forgotPassword")}</Text>
              </TouchableOpacity>
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
