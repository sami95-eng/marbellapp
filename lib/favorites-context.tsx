import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  };

  const saveFavorites = async (newFavorites: string[]) => {
    try {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    } catch (error) {
      console.error("Error saving favorites:", error);
    }
  };

  const isFavorite = useCallback(
    (venueId: string) => favorites.includes(venueId),
    [favorites]
  );

  const toggleFavorite = useCallback(
    (venueId: string) => {
      setFavorites((prev) => {
        const newFavorites = prev.includes(venueId)
          ? prev.filter((id) => id !== venueId)
          : [...prev, venueId];
        saveFavorites(newFavorites);
        return newFavorites;
      });
    },
    []
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
