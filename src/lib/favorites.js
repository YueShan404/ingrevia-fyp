import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";

const FAV_KEY = "ingrevia_favorites";
const COMMUNITY_FAV_KEY = "ingrevia_community_favorites";
const ZW_KEY = "ingrevia_zerowaste_applied";

function readLocalFavorites(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch { return []; }
}

async function createBookmark({ userId, recipeId, recipeType }) {
  const { error } = await supabase
    .from("recipe_bookmarks")
    .insert({ user_id: userId, recipe_id: recipeId, recipe_type: recipeType });

  if (error && error.code !== "23505") throw error;
}

function useSyncedFavorites({ localKey, recipeType }) {
  const { user, isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState(() => {
    return readLocalFavorites(localKey);
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setFavorites(readLocalFavorites(localKey));
      return;
    }

    let cancelled = false;

    const syncFavorites = async () => {
      const localFavorites = readLocalFavorites(localKey);

      if (localFavorites.length > 0) {
        await Promise.all(
          localFavorites.map((recipeId) =>
            createBookmark({ userId: user.id, recipeId, recipeType })
          )
        );
      }

      const { data, error } = await supabase
        .from("recipe_bookmarks")
        .select("recipe_id")
        .eq("user_id", user.id)
        .eq("recipe_type", recipeType)
        .order("created_date", { ascending: false });

      if (!cancelled && !error) {
        const ids = (data || []).map((row) => row.recipe_id);
        setFavorites(ids);
        localStorage.setItem(localKey, JSON.stringify(ids));
      }
    };

    syncFavorites().catch((error) => {
      console.warn("Favorite sync failed; using local favorites.", error);
      if (!cancelled) setFavorites(readLocalFavorites(localKey));
    });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, localKey, recipeType, user?.id]);

  const isFavorite = useCallback((id) => favorites.includes(id), [favorites]);

  const toggleFavorite = useCallback(async (id) => {
    const wasFavorite = favorites.includes(id);
    const next = wasFavorite ? favorites.filter((f) => f !== id) : [id, ...favorites];

    setFavorites(next);
    localStorage.setItem(localKey, JSON.stringify(next));

    if (!isAuthenticated || !user?.id) return;

    try {
      if (wasFavorite) {
        await supabase
          .from("recipe_bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("recipe_id", id)
          .eq("recipe_type", recipeType);
      } else {
        await createBookmark({ userId: user.id, recipeId: id, recipeType });
      }
    } catch (error) {
      console.warn("Favorite update failed; reverting local state.", error);
      setFavorites(favorites);
      localStorage.setItem(localKey, JSON.stringify(favorites));
    }
  }, [favorites, isAuthenticated, localKey, recipeType, user?.id]);

  return { favorites, isFavorite, toggleFavorite };
}

export function useFavorites() {
  return useSyncedFavorites({ localKey: FAV_KEY, recipeType: "recipe" });
}

export function useCommunityFavorites() {
  return useSyncedFavorites({ localKey: COMMUNITY_FAV_KEY, recipeType: "community_recipe" });
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
