import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";

export type PushRegistrationResult =
  | { status: "ok"; token: string }
  | { status: "skipped"; reason: string }
  | { status: "error"; reason: string };

/** projectId EAS (requis par getExpoPushTokenAsync en SDK 49+). */
function getProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    // Champ legacy (anciennes versions d'expo-constants)
    (Constants as any).easConfig?.projectId
  );
}

/**
 * Demande la permission, récupère le token Expo et le sauvegarde dans
 * public.profiles.push_token. Ne jette jamais : renvoie un résultat typé.
 * Cas gérés : web, permission refusée, simulateur / device non compatible,
 * absence de session, erreur réseau / RLS.
 */
export async function registerForPushNotifications(): Promise<PushRegistrationResult> {
  // Les push tokens Expo ne sont pas supportés sur le web.
  if (Platform.OS === "web") {
    return { status: "skipped", reason: "web" };
  }

  try {
    // 1) Permission (demande seulement si pas déjà accordée).
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      return { status: "skipped", reason: "permission-denied" };
    }

    // Android : un canal est requis pour afficher les notifications.
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.DEFAULT,
        lightColor: "#D4AF37",
      });
    }

    // 2) Token Expo. Échoue sur simulateur/émulateur ("Must use physical
    //    device…") → on le capture pour ne pas casser le démarrage.
    const projectId = getProjectId();
    let token: string;
    try {
      const res = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      );
      token = res.data;
    } catch (e: any) {
      return { status: "skipped", reason: `no-device: ${e?.message ?? e}` };
    }

    // 3) Sauvegarde du token sur le profil de l'utilisateur connecté.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { status: "skipped", reason: "no-session" };
    }
    const { error } = await supabase
      .from("profiles")
      .update({ push_token: token })
      .eq("id", user.id);
    if (error) {
      return { status: "error", reason: error.message };
    }

    return { status: "ok", token };
  } catch (e: any) {
    // Erreur réseau ou imprévue : on reste silencieux côté UI.
    return { status: "error", reason: e?.message ?? String(e) };
  }
}

// Abonnements conservés au niveau module pour pouvoir les retirer si besoin.
let handlersConfigured = false;
let receivedSub: ReturnType<typeof Notifications.addNotificationReceivedListener> | null = null;
let responseSub: ReturnType<typeof Notifications.addNotificationResponseReceivedListener> | null = null;

/**
 * Configure l'affichage en foreground + les listeners (réception / tap).
 * Idempotent : un second appel ne ré-enregistre pas les listeners.
 */
export function setupNotificationHandlers(): void {
  if (handlersConfigured) return;
  handlersConfigured = true;

  // Affichage même quand l'app est au premier plan.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  // Notification reçue alors que l'app est ouverte → simple log.
  receivedSub = Notifications.addNotificationReceivedListener((notification) => {
    console.log("[push] received:", notification.request.content.title);
  });

  // Tap sur la notification → navigation selon data.screen (+ params éventuels).
  responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as
      | { screen?: string; params?: Record<string, unknown> }
      | undefined;
    const screen = data?.screen;
    if (!screen) return;
    try {
      router.push({ pathname: screen as any, params: (data?.params ?? {}) as any });
    } catch (e: any) {
      console.warn("[push] navigation failed:", e?.message);
    }
  });
}

/** Retire les listeners (utile pour les tests / hot reload). */
export function teardownNotificationHandlers(): void {
  receivedSub?.remove();
  responseSub?.remove();
  receivedSub = null;
  responseSub = null;
  handlersConfigured = false;
}
