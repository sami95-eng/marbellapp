import { Text, View, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { useState, useRef } from "react";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = params.email ?? user?.email ?? "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleChangeCode = (val: string, idx: number) => {
    const digits = val.replace(/\D/g, "");
    if (digits.length > 1) {
      // collage d'un code complet
      const next = digits.slice(0, 6).split("");
      const filled = [...code];
      for (let i = 0; i < 6; i++) filled[i] = next[i] ?? "";
      setCode(filled);
      inputs.current[Math.min(next.length, 5)]?.focus();
      return;
    }
    const next = [...code];
    next[idx] = digits.slice(-1);
    setCode(next);
    if (digits && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === "Backspace" && !code[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join("");
    if (fullCode.length < 6) { setError("Entre le code à 6 chiffres reçu par email."); return; }
    if (!email) { setError("Email introuvable. Reprends l'inscription."); return; }
    try {
      setIsLoading(true);
      setError(null);
      const { error: vErr } = await supabase.auth.verifyOtp({
        email,
        token: fullCode,
        type: "signup",
      });
      if (vErr) throw vErr;
      // Succès → session créée → onAuthStateChange → AuthRedirect ouvre l'app.
      router.replace("/(tabs)");
    } catch (err: any) {
      setError(err?.message ?? "Code incorrect ou expiré.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) { setError("Email introuvable."); return; }
    try {
      setIsSending(true);
      setError(null);
      setInfo(null);
      const { error: rErr } = await supabase.auth.resend({ type: "signup", email });
      if (rErr) throw rErr;
      setInfo("Nouveau code envoyé. Vérifie ta boîte mail.");
    } catch (err: any) {
      setError(err?.message ?? "Impossible de renvoyer le code.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <ScreenContainer className="px-6">
      <View style={{ flex: 1, justifyContent: "center", gap: 32 }}>
        {/* Icon + Title */}
        <View style={{ alignItems: "center", gap: 12 }}>
          <Text style={{ fontSize: 64 }}>✉️</Text>
          <Text style={{ fontSize: 28, fontWeight: "700", color: "#D4AF37", textAlign: "center" }}>
            Vérifie ton email
          </Text>
          <Text style={{ fontSize: 14, color: "#888", textAlign: "center", lineHeight: 22 }}>
            Nous avons envoyé un code à 6 chiffres à{"\n"}
            <Text style={{ color: "#D4AF37" }}>{email || "ton adresse email"}</Text>
          </Text>
        </View>

        {/* 6-digit boxes */}
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 10 }}>
          {code.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={(r) => { inputs.current[idx] = r; }}
              value={digit}
              onChangeText={(v) => handleChangeCode(v, idx)}
              onKeyPress={(e) => handleKeyPress(e, idx)}
              keyboardType="number-pad"
              maxLength={idx === 0 ? 6 : 1}
              style={{
                width: 46, height: 56, borderRadius: 12,
                borderWidth: digit ? 2 : 1, borderColor: digit ? "#D4AF37" : "#333",
                backgroundColor: "#111120", textAlign: "center",
                fontSize: 22, fontWeight: "700", color: "#D4AF37",
              }}
            />
          ))}
        </View>

        {info && (
          <View style={{ backgroundColor: "rgba(74,222,128,0.12)", borderRadius: 10, padding: 12 }}>
            <Text style={{ color: "#4ADE80", fontSize: 13, textAlign: "center" }}>{info}</Text>
          </View>
        )}
        {error && (
          <View style={{ backgroundColor: "rgba(239,68,68,0.15)", borderRadius: 10, padding: 12 }}>
            <Text style={{ color: "#EF4444", fontSize: 13, textAlign: "center" }}>{error}</Text>
          </View>
        )}

        {/* Verify */}
        <TouchableOpacity
          onPress={handleVerify}
          disabled={isLoading || code.join("").length < 6}
          style={{
            backgroundColor: code.join("").length === 6 ? "#D4AF37" : "#333",
            borderRadius: 50, paddingVertical: 16, alignItems: "center",
          }}
          activeOpacity={0.8}
        >
          {isLoading
            ? <ActivityIndicator color="#0a0a0f" />
            : <Text style={{ color: code.join("").length === 6 ? "#0a0a0f" : "#666", fontWeight: "700", fontSize: 16 }}>Vérifier</Text>}
        </TouchableOpacity>

        {/* Resend */}
        <TouchableOpacity onPress={handleResend} disabled={isSending} style={{ alignItems: "center" }}>
          <Text style={{ color: "#888", fontSize: 13 }}>
            Pas reçu ?{" "}
            <Text style={{ color: "#D4AF37", fontWeight: "600" }}>
              {isSending ? "Envoi…" : "Renvoyer le code"}
            </Text>
          </Text>
        </TouchableOpacity>

        {/* Back to login */}
        <TouchableOpacity onPress={() => router.replace("/login")} style={{ alignItems: "center" }}>
          <Text style={{ color: "#555", fontSize: 13 }}>← Retour à la connexion</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
