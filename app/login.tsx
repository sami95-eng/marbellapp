import {
  ScrollView, Text, View, TouchableOpacity, ActivityIndicator,
  TextInput, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/language-selector";
import { supabase } from "@/lib/supabase";
import { setPartnerLoginIntent } from "@/lib/login-intent";

type Mode = "user" | "etablissement";

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("user");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleEtablissementLogin = async () => {
    if (!email.includes("@") || password.length < 6) {
      setError("Email invalide ou mot de passe trop court (min. 6 caractères).");
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      // Vraie authentification Supabase (même backend que le login utilisateur).
      // L'accès partenaire = un compte dont profiles.role = 'partner' ou 'admin'.
      setPartnerLoginIntent(true); // → AuthRedirect ouvrira /partner-dashboard
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setPartnerLoginIntent(false);
        throw signInError;
      }
      // Succès : onAuthStateChange → AuthRedirect navigue vers /partner-dashboard.
      // (On ne navigue pas ici pour éviter une course avec AuthRedirect.)
    } catch (err: any) {
      setError(err?.message ?? "Identifiants incorrects.");
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

            {/* Logo */}
            <View style={{ alignItems: "center", gap: 8 }}>
              <Text style={{ fontSize: 52 }}>✨</Text>
              <Text style={{ fontSize: 28, fontWeight: "800", color: "#D4AF37" }}>Marbell'app</Text>
              <Text style={{ fontSize: 13, color: "#888", textAlign: "center" }}>
                {t("login.tagline")}
              </Text>
              <View style={{ marginTop: 4 }}>
                <LanguageSelector />
              </View>
            </View>

            {/* Mode switch */}
            <View style={{
              flexDirection: "row",
              backgroundColor: "#111120",
              borderRadius: 50,
              borderWidth: 1,
              borderColor: "#D4AF3725",
              padding: 4,
            }}>
              <TouchableOpacity
                onPress={() => { setMode("user"); setError(null); }}
                style={{
                  flex: 1, alignItems: "center", paddingVertical: 10,
                  borderRadius: 50,
                  backgroundColor: mode === "user" ? "#D4AF37" : "transparent",
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: mode === "user" ? "#0a0a0f" : "#666" }}>
                  👤  {t("login.userTab")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setMode("etablissement"); setError(null); }}
                style={{
                  flex: 1, alignItems: "center", paddingVertical: 10,
                  borderRadius: 50,
                  backgroundColor: mode === "etablissement" ? "#D4AF37" : "transparent",
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: mode === "etablissement" ? "#0a0a0f" : "#666" }}>
                  🏢  {t("login.establishmentTab")}
                </Text>
              </TouchableOpacity>
            </View>

            {/* MODE UTILISATEUR */}
            {mode === "user" && (
              <View style={{ gap: 10 }}>
                <TouchableOpacity
                  onPress={() => router.push("/login-email")}
                  style={[styles.btn, { backgroundColor: "#111120", borderColor: "#D4AF3730" }]}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 18 }}>✉️</Text>
                  <Text style={[styles.btnText, { color: "#e8e8e8" }]}>{t("login.emailBtn")}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* MODE ÉTABLISSEMENT */}
            {mode === "etablissement" && (
              <View style={{ gap: 12 }}>
                <View style={{ gap: 4 }}>
                  <Text style={{ fontSize: 12, color: "#888", marginLeft: 4 }}>{t("login.emailLabel")}</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="contact@monétablissement.com"
                    placeholderTextColor="#444"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                  />
                </View>
                <View style={{ gap: 4 }}>
                  <Text style={{ fontSize: 12, color: "#888", marginLeft: 4 }}>{t("login.passwordLabel")}</Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#444"
                    secureTextEntry
                    style={styles.input}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleEtablissementLogin}
                  disabled={isLoading}
                  style={{
                    backgroundColor: "#D4AF37",
                    borderRadius: 50,
                    paddingVertical: 15,
                    alignItems: "center",
                    marginTop: 4,
                  }}
                  activeOpacity={0.8}
                >
                  {isLoading
                    ? <ActivityIndicator color="#0a0a0f" />
                    : <Text style={{ fontSize: 15, fontWeight: "700", color: "#0a0a0f" }}>
                        {t("login.loginBtn")}
                      </Text>}
                </TouchableOpacity>

                <TouchableOpacity style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 12, color: "#D4AF37" }}>{t("login.forgotPassword")}</Text>
                </TouchableOpacity>

                <View style={{
                  backgroundColor: "#111120",
                  borderRadius: 10,
                  padding: 12,
                  borderWidth: 0.5,
                  borderColor: "#D4AF3720",
                }}>
                  <Text style={{ fontSize: 11, color: "#666", textAlign: "center", lineHeight: 18 }}>
                    <Text style={{ color: "#D4AF37" }}>{t("login.contactUs")}</Text>
                  </Text>
                </View>
              </View>
            )}

            {/* Error */}
            {error && (
              <View style={{ backgroundColor: "rgba(239,68,68,.15)", borderRadius: 10, padding: 12 }}>
                <Text style={{ color: "#EF4444", fontSize: 12, textAlign: "center" }}>{error}</Text>
              </View>
            )}

            {/* Terms */}
            <Text style={{ fontSize: 11, color: "#444", textAlign: "center", lineHeight: 18 }}>
              {t("login.terms")}
            </Text>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = {
  btn: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 10,
    borderWidth: 1,
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  btnText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  input: {
    backgroundColor: "#111120",
    borderWidth: 1,
    borderColor: "#D4AF3730",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 14,
    color: "#e8e8e8",
  },
};
