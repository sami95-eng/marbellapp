import { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DEMO_KEY = "marbellapp_demo_mode";

interface DemoContextValue {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  enableDemoMode: () => void;
  disableDemoMode: () => void;
}

const DemoContext = createContext<DemoContextValue>({
  isDemoMode: false,
  toggleDemoMode: () => {},
  enableDemoMode: () => {},
  disableDemoMode: () => {},
});

export function DemoProvider({ children }: { children: React.ReactNode }) {
  // Démarre TOUJOURS OFF → un vrai utilisateur voit ses données Supabase réelles.
  // Le mode démo n'est plus persisté comme « activé » entre deux lancements :
  // c'est une bascule de session (pour les présentations), pour éviter de rester
  // bloqué sur les données de démo (ex. "Sofia M.") après l'avoir testé une fois.
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Nettoie toute valeur "true" persistée par d'anciennes versions.
  useEffect(() => {
    AsyncStorage.removeItem(DEMO_KEY).catch(() => {});
  }, []);

  const enableDemoMode = useCallback(() => {
    setIsDemoMode(true);
  }, []);

  const disableDemoMode = useCallback(() => {
    setIsDemoMode(false);
  }, []);

  const toggleDemoMode = useCallback(() => {
    setIsDemoMode((prev) => !prev);
  }, []);

  return (
    <DemoContext.Provider value={{ isDemoMode, toggleDemoMode, enableDemoMode, disableDemoMode }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  return useContext(DemoContext);
}
