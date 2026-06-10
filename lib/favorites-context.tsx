import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/hooks/use-auth";
import { getFavorites, addFavorite, removeFavorite } from "@/lib/favorites-service";

const FAVORITES_KEY = "@marbella_favorites";

interface FavoritesContextType {
  favorites: string[];
  isFavorite: (venueId: string) => boolean;
  toggleFavorite: (venueId: string) => void;
  favoritesCount: number;
}

const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  isFavorite: () => false,
  toggleFavorite: () => {},
  favoritesCount: 0,
});

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);

  // Charge les favoris : depuis Supabase si connecté, sinon AsyncStorage (local).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (user?.id) {
          const remote = await getFavorites(user.id);
          if (!cancelled) setFavorites(remote);
        } else {
          const stored = await AsyncStorage.getItem(FAVORITES_KEY);
          if (!cancelled) setFavorites(stored ? JSON.parse(stored) : []);
        }
      } catch (e) {
        console.warn("[favorites] load failed:", (e as Error)?.message);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const isFavorite = useCallback(
    (venueId: string) => favorites.includes(venueId),
    [favorites]
  );

  const toggleFavorite = useCallback(
    (venueId: string) => {
      setFavorites((prev) => {
        const isFav = prev.includes(venueId);
        const next = isFav ? prev.filter((id) => id !== venueId) : [...prev, venueId];

        // Persistance (optimiste) : Supabase si connecté, sinon AsyncStorage.
        if (user?.id) {
          const op = isFav ? removeFavorite(user.id, venueId) : addFavorite(user.id, venueId);
          op.catch((e) => console.warn("[favorites] sync failed:", e?.message));
        } else {
          AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next)).catch(() => {});
        }
        return next;
      });
    },
    [user?.id]
  );

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isFavorite,
        toggleFavorite,
        favoritesCount: favorites.length,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
