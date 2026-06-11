import { ThemedView } from "@/components/themed-view";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { countFromCode } from "@/lib/instagram-connect";

// Retour OAuth Instagram (web). Instagram redirige ici avec ?code=… ;
// on échange le code via l'Edge Function (qui met à jour partner_post_count),
// puis on revient sur la page VIP.
export default function InstagramCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (Platform.OS !== "web" || typeof window === "undefined") {
          router.replace("/(tabs)/vip");
          return;
        }
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const err = params.get("error_description") || params.get("error");
        if (err) throw new Error(err);
        if (!code) throw new Error("Aucun code Instagram reçu.");

        const redirectUri = `${window.location.origin}/instagram-callback`;
        const res = await countFromCode(code, redirectUri);
        if (!mounted) return;
        setStatus("success");
        setMessage(`${res.partnerPostCount} post(s) partenaire(s) détecté(s).`);
        setTimeout(() => router.replace("/(tabs)/vip"), 1400);
      } catch (e: any) {
        if (!mounted) return;
        setStatus("error");
        setMessage(e?.message ?? "Connexion Instagram impossible.");
        setTimeout(() => router.replace("/(tabs)/vip"), 2600);
      }
    })();
    return () => { mounted = false; };
  }, [router]);

  return (
    <SafeAreaView className="flex-1" edges={["top", "bottom", "left", "right"]}>
      <ThemedView className="flex-1 items-center justify-center gap-4 p-6">
        {status === "processing" && (
          <>
            <ActivityIndicator size="large" color="#D4AF37" />
            <Text className="mt-3 text-base text-center text-foreground">
              Analyse de tes posts Instagram…
            </Text>
          </>
        )}
        {status === "success" && (
          <>
            <Text style={{ fontSize: 44 }}>👑</Text>
            <Text className="text-base text-center text-foreground">{message}</Text>
            <Text className="text-sm text-center text-muted">Mise à jour de ton niveau VIP…</Text>
          </>
        )}
        {status === "error" && (
          <>
            <Text className="mb-1 text-xl font-bold text-error">Échec</Text>
            <Text className="text-sm text-center text-muted">{message}</Text>
          </>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}
