export const BADGES = [
  {
    id: "first-discovery",
    name: "First Discovery",
    description: "Scan or identify the first ingredient.",
    requirement: "Scan 1 ingredient",
    metric: "scanCount",
    target: 1,
    rarity: "bronze",
  },
  {
    id: "ingredient-explorer",
    name: "Ingredient Explorer",
    description: "Identify 10 different ingredients.",
    requirement: "Identify 10 different ingredients",
    metric: "uniqueIngredients",
    target: 10,
    rarity: "silver",
  },
  {
    id: "ingredient-expert",
    name: "Ingredient Expert",
    description: "Identify all 30 catalogue ingredients.",
    requirement: "Identify 30 catalogue ingredients",
    metric: "uniqueIngredients",
    target: 30,
    rarity: "gold",
  },
  {
    id: "first-cook",
    name: "First Cook",
    description: "Complete the first recipe.",
    requirement: "Mark 1 zero-waste/cooking tip as applied",
    metric: "completedRecipes",
    target: 1,
    rarity: "bronze",
  },
  {
    id: "home-chef",
    name: "Home Chef",
    description: "Complete 10 recipes.",
    requirement: "Mark 10 recipes as completed",
    metric: "completedRecipes",
    target: 10,
    rarity: "silver",
  },
  {
    id: "recipe-collector",
    name: "Recipe Collector",
    description: "Save 10 recipes to favourites.",
    requirement: "Save 10 recipes",
    metric: "savedRecipes",
    target: 10,
    rarity: "silver",
  },
  {
    id: "health-aware-learner",
    name: "Health-Aware Learner",
    description: "View 10 health advisories.",
    requirement: "View 10 scanned ingredient health notes",
    metric: "healthViews",
    target: 10,
    rarity: "silver",
  },
  {
    id: "first-contributor",
    name: "First Contributor",
    description: "Submit the first community recipe.",
    requirement: "Submit 1 community recipe",
    metric: "submittedRecipes",
    target: 1,
    rarity: "bronze",
  },
  {
    id: "verified-contributor",
    name: "Verified Contributor",
    description: "Have the first community recipe approved.",
    requirement: "Have 1 community recipe approved",
    metric: "approvedRecipes",
    target: 1,
    rarity: "gold",
  },
  {
    id: "ingrevia-champion",
    name: "Ingrevia Champion",
    description: "Complete the main achievement collection.",
    requirement: "Unlock the 9 core badges above",
    metric: "coreBadges",
    target: 9,
    rarity: "master",
  },
];

export function badgeImage(id) {
  return `/badges/${id}.png`;
}

export function mergeBadgeDefinitions(customBadges = []) {
  const byId = new Map(BADGES.map((badge) => [badge.id, badge]));
  (customBadges || []).forEach((badge) => {
    if (!badge?.id) return;
    byId.set(badge.id, { ...byId.get(badge.id), ...badge });
  });
  return [...byId.values()];
}

export function buildAchievementStats({
  scanHistory = [],
  favorites = [],
  completedRecipes = [],
  communityRecipes = [],
} = {}) {
  const uniqueIngredients = new Set(
    scanHistory
      .filter((item) => item.matched !== false)
      .map((item) => String(item.ingredient_name || "").toLowerCase().trim())
      .filter(Boolean)
  );

  return {
    scanCount: scanHistory.length,
    uniqueIngredients: uniqueIngredients.size,
    completedRecipes: completedRecipes.length,
    savedRecipes: favorites.length,
    healthViews: scanHistory.filter((item) => item.matched !== false).length,
    submittedRecipes: communityRecipes.length,
    approvedRecipes: communityRecipes.filter((recipe) => recipe.status === "approved").length,
  };
}

export function computeBadges(stats, badgeDefinitions = BADGES) {
  let unlockedCore = 0;

  const evaluated = badgeDefinitions.filter((badge) => badge.id !== "ingrevia-champion").map((badge) => {
    const value = Math.min(Number(stats[badge.metric]) || 0, badge.target);
    const unlocked = value >= badge.target;
    if (unlocked) unlockedCore += 1;
    return {
      ...badge,
      value,
      progress: Math.round((value / badge.target) * 100),
      unlocked,
      earnedDate: unlocked ? new Date().toISOString() : null,
    };
  });

  const champion = badgeDefinitions.find((badge) => badge.id === "ingrevia-champion") || BADGES.find((badge) => badge.id === "ingrevia-champion");
  evaluated.push({
    ...champion,
    value: unlockedCore,
    progress: Math.round((unlockedCore / champion.target) * 100),
    unlocked: unlockedCore >= champion.target,
    earnedDate: unlockedCore >= champion.target ? new Date().toISOString() : null,
  });

  return evaluated;
}
