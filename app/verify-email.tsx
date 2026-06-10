import { Text, View, TouchableOpacity, TextInput, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { useState, useRef } from "react";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputs = useRef<(TextInput | null)[]>([]);

  const email = user?.email ?? "your email";

  const handleSendCode = async () => {
    try {
      setIsSending(true);
      setError(null);
      // Simulate sending code (replace with real API call when backend is ready)
      await new Promise((r) => setTimeout(r, 1000));
      setSent(true);
    } catch {
      setError("Failed to send code. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleChangeCode = (val: string, idx: number) => {
    const next = [...code];
    next[idx] = val.slice(-1);
    setCode(next);
    if (val && idx < 5) {
      inputs.current[idx + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === "Backspace" && !code[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join("");
    if (fullCode.length < 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      // Simulate verification (replace with real API call when backend is ready)
      await new Promise((r) => setTimeout(r, 1200));
      await refresh();
      router.replace("/(tabs)");
    } catch {
      setError("Invalid code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      "Skip verification?",
      "You can verify your email later in Settings. Some features may be limited.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Skip for now", onPress: () => router.replace("/(tabs)") },
      ]
    );
  };

  return (
    <ScreenContainer className="px-6">
      <View style={{ flex: 1, justifyContent: "center", gap: 32 }}>

        {/* Icon + Title */}
        <View style={{ alignItems: "center", gap: 12 }}>
          <Text style={{ fontSize: 64 }}>✉️</Text>
          <Text style={{ fontSize: 28, fontWeight: "700", color: "#D4AF37", textAlign: "center" }}>
            Verify your email
          </Text>
          <Text style={{ fontSize: 14, color: "#888", textAlign: "center", lineHeight: 22 }}>
            {sent
              ? `We sent a 6-digit code to\n${email}`
              : `Confirm your identity by verifying\n${email}`}
          </Text>
        </View>

        {!sent ? (
          /* Send code button */
          <TouchableOpacity
            onPress={handleSendCode}
            disabled={isSending}
            style={{
              backgroundColor: "#D4AF37",
              borderRadius: 50,
              paddingVertical: 16,
              alignItems: "center",
            }}
            activeOpacity={0.8}
          >
            {isSending ? (
              <ActivityIndicator color="#0a0a0f" />
            ) : (
              <Text style={{ color: "#0a0a0f", fontWeight: "700", fontSize: 16 }}>
                Send verification code
              </Text>
            )}
          </TouchableOpacity>
        ) : (
          /* Code input + verify */
          <View style={{ gap: 24 }}>
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
                  maxLength={1}
                  style={{
                    width: 46,
                    height: 56,
                    borderRadius: 12,
                    borderWidth: digit ? 2 : 1,
                    borderColor: digit ? "#D4AF37" : "#333",
                    backgroundColor: "#111120",
                    textAlign: "center",
                    fontSize: 22,
                    fontWeight: "700",
                    color: "#D4AF37",
                  }}
                />
              ))}
            </View>

            {/* Error */}
            {error && (
              <View style={{ backgroundColor: "rgba(239,68,68,0.15)", borderRadius: 10, padding: 12 }}>
                <Text style={{ color: "#EF4444", fontSize: 13, textAlign: "center" }}>{error}</Text>
              </View>
            )}

            {/* Verify button */}
            <TouchableOpacity
              onPress={handleVerify}
              disabled={isLoading || code.join("").length < 6}
              style={{
                backgroundColor: code.join("").length === 6 ? "#D4AF37" : "#333",
                borderRadius: 50,
                paddingVertical: 16,
                alignItems: "center",
              }}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#0a0a0f" />
              ) : (
                <Text style={{ color: code.join("").length === 6 ? "#0a0a0f" : "#666", fontWeight: "700", fontSize: 16 }}>
                  Verify
                </Text>
              )}
            </TouchableOpacity>

            {/* Resend */}
            <TouchableOpacity onPress={handleSendCode} disabled={isSending} style={{ alignItems: "center" }}>
              <Text style={{ color: "#888", fontSize: 13 }}>
                Didn't receive it?{" "}
                <Text style={{ color: "#D4AF37", fontWeight: "600" }}>Resend code</Text>
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Skip */}
        <TouchableOpacity onPress={handleSkip} style={{ alignItems: "center" }}>
          <Text style={{ color: "#555", fontSize: 13 }}>Skip for now</Text>
        </TouchableOpacity>

      </View>
    </ScreenContainer>
  );
}
