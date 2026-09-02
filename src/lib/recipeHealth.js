/**
 * Derive health-friendly badges ("Low Sugar / Low Sodium / Low Fat") for a
 * recipe, based on the actual nutrition data of the ingredients it uses.
 *
 * Thresholds are taken per 100g of each linked ingredient and averaged across
 * the matched ingredients. A recipe's explicit `nutrient_tags` (lower_sugar /
 * lower_sodium) always set the corresponding flag, so manual annotations win
 * even when data is missing.
 *
 * Threshold source (background):
 *   - Sugar       ≤ 5 g/100g      — "low sugar" claim used by FSA UK / EU
 *   - Sodium      ≤ 120 mg/100g   — "low sodium" FDA
 *   - Sat. fat    ≤ 1.5 g/100g    — "low in saturated fat" NHMRC / EU
 *
 * Thresholds are intentionally educational, not medical.
 */
export function computeRecipeHealthBadges(recipe, ingredients = []) {
  const tags = (recipe && recipe.nutrient_tags) || [];
  const badges = {
    lowSugar: tags.includes("lower_sugar"),
    lowSodium: tags.includes("lower_sodium"),
    lowFat: false,
  };

  const tagNames = ((recipe && recipe.ingredient_tags) || []).map((t) =>
    (t || "").toLowerCase().trim()
  );
  const linked = (ingredients || []).filter((i) =>
    tagNames.includes((i.name || "").toLowerCase().trim())
  );
  if (linked.length === 0) return badges;

  const avg = (field) => {
    const vals = linked
      .map((i) => i[field])
      .filter((v) => typeof v === "number" && !Number.isNaN(v));
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };

  const avgSugar = avg("sugar");
  const avgSodium = avg("sodium");
  const avgSatFat = avg("saturated_fat");

  if (avgSugar != null && avgSugar <= 5) badges.lowSugar = true;
  if (avgSodium != null && avgSodium <= 120) badges.lowSodium = true;
  if (avgSatFat != null && avgSatFat <= 1.5) badges.lowFat = true;

  return badges;
}

function linkedIngredientsForRecipe(recipe, ingredients = []) {
  const tagNames = ((recipe && recipe.ingredient_tags) || []).map((t) =>
    (t || "").toLowerCase().trim()
  );

  return (ingredients || []).filter((ingredient) =>
    tagNames.includes((ingredient.name || "").toLowerCase().trim())
  );
}

function averageNumber(items, field) {
  const values = items
    .map((item) => item[field])
    .filter((value) => typeof value === "number" && !Number.isNaN(value));

  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

export function computeRecipeNutritionSummary(recipe, ingredients = []) {
  const linked = linkedIngredientsForRecipe(recipe, ingredients);
  if (!linked.length) return null;

  return {
    calories: averageNumber(linked, "calories"),
    protein: averageNumber(linked, "protein"),
    carbs: averageNumber(linked, "carbs"),
    sugar: averageNumber(linked, "sugar"),
    fiber: averageNumber(linked, "fiber"),
    fat: averageNumber(linked, "fat"),
    sodium: averageNumber(linked, "sodium"),
  };
}

export function computeRecipeSuitability(recipe, ingredients = []) {
  const nutrition = computeRecipeNutritionSummary(recipe, ingredients);
  const tags = recipe?.nutrient_tags || [];
  const ingredientTags = (recipe?.ingredient_tags || []).map((tag) => tag.toLowerCase());
  const items = [];

  if (tags.includes("high_protein") || (nutrition?.protein != null && nutrition.protein >= 10)) {
    items.push({ key: "active", status: "good" });
  }

  if (tags.includes("high_fiber") || (nutrition?.fiber != null && nutrition.fiber >= 3)) {
    items.push({ key: "digestive", status: "good" });
  }

  if (tags.includes("lower_sugar") || (nutrition?.sugar != null && nutrition.sugar <= 5)) {
    items.push({ key: "sugar", status: "good" });
  } else if (nutrition?.sugar != null && nutrition.sugar >= 12) {
    items.push({ key: "sugar_watch", status: "caution" });
  }

  if (tags.includes("lower_sodium") || (nutrition?.sodium != null && nutrition.sodium <= 120)) {
    items.push({ key: "sodium", status: "good" });
  } else if (nutrition?.sodium != null && nutrition.sodium >= 400) {
    items.push({ key: "sodium_watch", status: "caution" });
  }

  if (ingredientTags.some((tag) => ["seafood", "shrimp", "prawn", "fish"].includes(tag))) {
    items.push({ key: "seafood_allergy", status: "caution" });
  }

  if (!ingredientTags.some((tag) => ["seafood", "chicken", "beef", "pork", "meat", "fish"].includes(tag))) {
    items.push({ key: "plant_based", status: "good" });
  }

  if (!items.length) {
    items.push({ key: "general", status: "neutral" });
  }

  return items;
}
