import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

const IG_APP_ID = process.env.EXPO_PUBLIC_INSTAGRAM_APP_ID ?? "";

export type CountResult = { partnerPostCount: number; username?: string | null };

function authorizeUrl(redirectUri: string): string {
  const u = new URL("https://www.instagram.com/oauth/authorize");
  u.searchParams.set("client_id", IG_APP_ID);
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("response_type", "code");
  // Lecture du profil + des médias (Instagram API with Instagram Login)
  u.searchParams.set("scope", "instagram_business_basic");
  return u.toString();
}

/** Échange le code OAuth via l'Edge Function et met à jour partner_post_count. */
export async function countFromCode(code: string, redirectUri: string): Promise<CountResult> {
  const { data, error } = await supabase.functions.invoke("count-instagram-posts", {
    body: { code, redirectUri },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as CountResult;
}

/**
 * Lance la connexion Instagram puis déclenche le comptage.
 * - Web : redirection plein écran vers Instagram → retour sur /instagram-callback.
 * - Natif : navigateur système, récupère le code, appelle l'Edge Function.
 */
export async function connectInstagram(): Promise<CountResult | null> {
  if (Platform.OS === "web") {
    const redirectUri = `${window.location.origin}/instagram-callback`;
    window.location.href = authorizeUrl(redirectUri);
    return null; // la suite est gérée par la route /instagram-callback
  }

  const redirectUri = Linking.createURL("/instagram-callback");
  const res = await WebBrowser.openAuthSessionAsync(authorizeUrl(redirectUri), redirectUri);
  if (res.type !== "success" || !res.url) return null;

  const { queryParams } = Linking.parse(res.url);
  const code = typeof queryParams?.code === "string" ? queryParams.code : undefined;
  if (!code) throw new Error("Aucun code Instagram reçu.");

  return countFromCode(code, redirectUri);
}
