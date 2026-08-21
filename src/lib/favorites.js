import { useState, useEffect, useCallback } from "react";

const FAV_KEY = "ingrevia_favorites";
const COMMUNITY_FAV_KEY = "ingrevia_community_favorites";
const ZW_KEY = "ingrevia_zerowaste_applied";

export function useFavorites() {
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(FAV_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const isFavorite = useCallback((id) => favorites.includes(id), [favorites]);

  const toggleFavorite = useCallback((id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  }, []);

  return { favorites, isFavorite, toggleFavorite };
}

export function useCommunityFavorites() {
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem(COMMUNITY_FAV_KEY)) || []; }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(COMMUNITY_FAV_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const isFavorite = useCallback((id) => favorites.includes(id), [favorites]);

  const toggleFavorite = useCallback((id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  }, []);

  return { favorites, isFavorite, toggleFavorite };
}

export function useZeroWaste() {
  const [appliedTips, setAppliedTips] = useState(() => {
    try { return JSON.parse(localStorage.getItem(ZW_KEY)) || []; }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(ZW_KEY, JSON.stringify(appliedTips));
  }, [appliedTips]);

  const isApplied = useCallback((recipeId) => appliedTips.includes(recipeId), [appliedTips]);

  const toggleApplied = useCallback((recipeId) => {
    setAppliedTips((prev) =>
      prev.includes(recipeId) ? prev.filter((r) => r !== recipeId) : [...prev, recipeId]
    );
  }, []);

  return { appliedTips, isApplied, toggleApplied };
}