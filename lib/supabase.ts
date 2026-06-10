import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Native: persist session in SecureStore (encrypted)
const SecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

// Web: SSR-safe localStorage adapter — persiste la session dans
// window.localStorage. Guard contre window undefined (pré-rendu statique
// Expo Router/SSG) + try/catch (navigation privée / storage désactivé)
// pour que l'auth ne casse jamais.
const WebStorageAdapter = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    try { return window.localStorage.getItem(key); } catch { return null; }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === "undefined") return;
    try { window.localStorage.setItem(key, value); } catch { /* ignore */ }
  },
  removeItem: (key: string): void => {
    if (typeof window === "undefined") return;
    try { window.localStorage.removeItem(key); } catch { /* ignore */ }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === "web" ? WebStorageAdapter : SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
  },
});
