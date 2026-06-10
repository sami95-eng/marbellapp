import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";

// Permet à expo-web-browser de finaliser proprement une session d'auth (no-op web).
WebBrowser.maybeCompleteAuthSession();

/**
 * Connexion Google via Supabase OAuth — fonctionne sur web ET mobile.
 *
 * Web    : redirection plein écran vers Google, retour sur /oauth/callback ;
 *          le client Supabase (detectSessionInUrl) récupère la session.
 * Natif  : ouvre le navigateur système (openAuthSessionAsync), récupère le
 *          deep link de retour, puis échange le code PKCE contre une session.
 */
export async function signInWithGoogle(): Promise<void> {
  if (Platform.OS === "web") {
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/oauth/callback` : undefined;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) throw error;
    // Le navigateur redirige vers Google ; rien d'autre à faire ici.
    return;
  }

  // ── Natif (Expo Go / dev build / prod) ──────────────────────────────
  const redirectTo = Linking.createURL("/oauth/callback");
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data?.url) throw new Error("Supabase n'a pas renvoyé d'URL OAuth.");

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success" || !result.url) {
    // L'utilisateur a fermé/annulé le navigateur.
    return;
  }

  // PKCE (défaut) : échanger le ?code= contre une session.
  const { queryParams } = Linking.parse(result.url);
  const code = typeof queryParams?.code === "string" ? queryParams.code : undefined;
  if (code) {
    const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
    if (exErr) throw exErr;
    return;
  }

  // Repli : flux implicite avec tokens dans le fragment (#access_token=...).
  const fragment = result.url.includes("#") ? result.url.split("#")[1] : "";
  const fp = new URLSearchParams(fragment);
  const access_token = fp.get("access_token");
  const refresh_token = fp.get("refresh_token");
  if (access_token && refresh_token) {
    const { error: sErr } = await supabase.auth.setSession({ access_token, refresh_token });
    if (sErr) throw sErr;
    return;
  }

  throw new Error("Le retour OAuth ne contenait ni code ni tokens.");
}
