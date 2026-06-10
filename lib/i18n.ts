import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import en from "@/locales/en";
import fr from "@/locales/fr";
import es from "@/locales/es";
import ru from "@/locales/ru";

export const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
] as const;

export type LangCode = (typeof LANGUAGES)[number]["code"];

const LANG_STORAGE_KEY = "marbellapp_lang";

i18next.use(initReactI18next).init({
  compatibilityJSON: "v4",
  lng: "en",
  fallbackLng: "en",
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    es: { translation: es },
    ru: { translation: ru },
  },
  interpolation: { escapeValue: false },
});

/** Restore saved language on app start */
export async function loadSavedLanguage(): Promise<void> {
  try {
    const saved = await AsyncStorage.getItem(LANG_STORAGE_KEY);
    if (saved && LANGUAGES.some((l) => l.code === saved)) {
      await i18next.changeLanguage(saved);
    }
  } catch {
    // ignore — default English is fine
  }
}

/** Change language and persist the choice */
export async function changeLanguage(code: LangCode): Promise<void> {
  await i18next.changeLanguage(code);
  try {
    await AsyncStorage.setItem(LANG_STORAGE_KEY, code);
  } catch {
    // ignore
  }
}

export default i18next;
