import { ThemedView } from "@/components/themed-view";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";

// Callback OAuth Supabase (Google). Sur web, Google redirige ici avec un ?code=
// (PKCE). Le client Supabase (detectSessionInUrl) l'échange automatiquement ;
// on attend simplement la session puis on redirige. En repli, on échange le
// code manuellement.
export default function OAuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const gotoApp = async (): Promise<boolean> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && mounted) {
        setStatus("success");
        router.replace("/(tabs)");
        return true;
      }
      return false;
    };

    const run = async () => {
      // 1) detectSessionInUrl a peut-être déjà créé la session.
      if (await gotoApp()) return;

      // 2) Échange manuel du code PKCE (repli web).
      try {
        if (Platform.OS === "web" && typeof window !== "undefined") {
          const code = new URLSearchParams(window.location.search).get("code");
          if (code) await supabase.auth.exchangeCodeForSession(code);
        }
      } catch {
        // Le code a probablement déjà été consommé par detectSessionInUrl.
      }
      if (await gotoApp()) return;

      // 3) La session peut arriver de façon asynchrone.
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
        if (session && mounted) {
          setStatus("success");
          router.replace("/(tabs)");
        }
      });

      // 4) Abandon après un délai.
      setTimeout(async () => {
        if (mounted && !(await gotoApp())) {
          setStatus("error");
          setErrorMessage("Connexion Google impossible. Réessaie depuis l'écran de connexion.");
        }
      }, 5000);

      return () => subscription.unsubscribe();
    };

    run();
    return () => { mounted = false; };
  }, [router]);

  return (
    <SafeAreaView className="flex-1" edges={["top", "bottom", "left", "right"]}>
      <ThemedView className="flex-1 items-center justify-center gap-4 p-5">
        {status === "processing" && (
          <>
            <ActivityIndicator size="large" color="#D4AF37" />
            <Text className="mt-4 text-base leading-6 text-center text-foreground">
              Connexion en cours…
            </Text>
          </>
        )}
        {status === "success" && (
          <Text className="text-base leading-6 text-center text-foreground">
            Connexion réussie ! Redirection…
          </Text>
        )}
        {status === "error" && (
          <>
            <Text className="mb-2 text-xl font-bold leading-7 text-error">
              Échec de la connexion
            </Text>
            <Text className="text-base leading-6 text-center text-foreground">
              {errorMessage}
            </Text>
          </>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}
