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