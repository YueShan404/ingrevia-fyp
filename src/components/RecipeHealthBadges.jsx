import React from "react";
import { useI18n } from "@/lib/i18n";
import { computeRecipeHealthBadges } from "@/lib/recipeHealth";
import { Sparkles, Droplets, Droplet } from "lucide-react";

/**
 * Small row of health-friendly badge chips for low-sugar / low-sodium /
 * low-fat. Computes badges from the recipe's linked ingredient nutrition
 * data plus any explicit nutrient_tags. Renders nothing when no flag applies.
 */
export default function RecipeHealthBadges({ recipe, ingredients = [] }) {
  const { t } = useI18n();
  const badges = computeRecipeHealthBadges(recipe, ingredients);

  const items = [];
  if (badges.lowSugar) {
    items.push({
      key: "low_sugar",
      Icon: Sparkles,
      label: t("recipe_health.low_sugar"),
      classes: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    });
  }
  if (badges.lowSodium) {
    items.push({
      key: "low_sodium",
      Icon: Droplets,
      label: t("recipe_health.low_sodium"),
      classes: "bg-sky-50 text-sky-700 border-sky-200/60",
    });
  }
  if (badges.lowFat) {
    items.push({
      key: "low_fat",
      Icon: Droplet,
      label: t("recipe_health.low_fat"),
      classes: "bg-amber-50 text-amber-700 border-amber-200/60",
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mb-2">
      {items.map((it) => {
        const Icon = it.Icon;
        return (
          <span
            key={it.key}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${it.classes}`}
          >
            <Icon className="w-2.5 h-2.5" />
            {it.label}
          </span>
        );
      })}
    </div>
  );
}