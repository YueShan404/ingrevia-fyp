// Health-Aware Nutritional Advisory — rule-based engine
// Educational notices based on documented thresholds (per 100g).
// NOT medical advice. Describes measurable nutrient characteristics only.

export const ADVISORY_THRESHOLDS = {
  high_sugar: 10,      // g per 100g — "higher sugar"
  high_sodium: 400,    // mg per 100g — "higher sodium"
  high_satfat: 5,      // g per 100g — "higher saturated fat"
  good_fiber: 3,       // g per 100g — "good source of fiber"
  good_protein: 10,    // g per 100g — "good source of protein"
  low_sugar: 2.5,      // g per 100g — "lower sugar"
  low_sodium: 120,     // mg per 100g — "lower sodium"
  low_satfat: 1.5,     // g per 100g — "lower saturated fat"
};

export function analyzeAdvisory(nutrition) {
  if (!nutrition) return [];
  const alerts = [];
  const n = {
    sugar: Number(nutrition.sugar) || 0,
    sodium: Number(nutrition.sodium) || 0,
    saturated_fat: Number(nutrition.saturated_fat) || 0,
    fiber: Number(nutrition.fiber) || 0,
    protein: Number(nutrition.protein) || 0,
  };

  // Higher-risk characteristics first (educational, not medical)
  if (n.sugar >= ADVISORY_THRESHOLDS.high_sugar) {
    alerts.push({ key: "high_sugar", level: "caution", icon: "candy" });
  }
  if (n.sodium >= ADVISORY_THRESHOLDS.high_sodium) {
    alerts.push({ key: "high_sodium", level: "caution", icon: "salt" });
  }
  if (n.saturated_fat >= ADVISORY_THRESHOLDS.high_satfat) {
    alerts.push({ key: "high_satfat", level: "caution", icon: "droplet" });
  }

  // Positive characteristics
  if (n.fiber >= ADVISORY_THRESHOLDS.good_fiber) {
    alerts.push({ key: "good_fiber", level: "positive", icon: "wheat" });
  }
  if (n.protein >= ADVISORY_THRESHOLDS.good_protein) {
    alerts.push({ key: "good_protein", level: "positive", icon: "beef" });
  }

  // Lower characteristics (informational)
  if (n.sugar > 0 && n.sugar <= ADVISORY_THRESHOLDS.low_sugar) {
    alerts.push({ key: "low_sugar", level: "info", icon: "leaf" });
  }
  if (n.sodium > 0 && n.sodium <= ADVISORY_THRESHOLDS.low_sodium) {
    alerts.push({ key: "low_sodium", level: "info", icon: "leaf" });
  }
  if (n.saturated_fat > 0 && n.saturated_fat <= ADVISORY_THRESHOLDS.low_satfat) {
    alerts.push({ key: "low_satfat", level: "info", icon: "leaf" });
  }

  if (alerts.length === 0) {
    alerts.push({ key: "neutral", level: "info", icon: "scale" });
  }

  return alerts;
}

export const NUTRITION_FIELDS = [
  { key: "calories", unit: "kcal", label_en: "Calories" },
  { key: "protein", unit: "g", label_en: "Protein" },
  { key: "carbs", unit: "g", label_en: "Carbohydrates" },
  { key: "sugar", unit: "g", label_en: "Sugar" },
  { key: "fiber", unit: "g", label_en: "Fiber" },
  { key: "fat", unit: "g", label_en: "Total Fat" },
  { key: "saturated_fat", unit: "g", label_en: "Saturated Fat" },
  { key: "sodium", unit: "mg", label_en: "Sodium" },
  { key: "potassium", unit: "mg", label_en: "Potassium" },
];