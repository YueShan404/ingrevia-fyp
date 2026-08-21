import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useI18n, localized } from "@/lib/i18n";
import { CalendarDays, Sparkles, ChevronRight } from "lucide-react";

export default function SeasonalHighlight({ ingredients, recipes }) {
  const { lang, t } = useI18n();
  const currentMonth = new Date().getMonth() + 1; // 1-12

  const seasonal = useMemo(() => {
    if (!ingredients) return [];
    return ingredients.filter((ing) => {
      const months = ing.season_months || [];
      if (!months.length) return true; // year-round
      return months.includes(currentMonth);
    });
  }, [ingredients, currentMonth]);

  const matchingRecipes = useMemo(() => {
    if (!recipes || !seasonal.length) return [];
    const seasonalNames = new Set(seasonal.map((i) => i.name.toLowerCase()));
    return recipes.filter((r) =>
      (r.ingredient_tags || []).some((tag) => seasonalNames.has(tag.toLowerCase()))
    ).slice(0, 6);
  }, [recipes, seasonal]);

  if (!seasonal.length) return null;

  const monthName = new Date(2000, currentMonth - 1, 1).toLocaleDateString(lang === "zh" ? "zh-CN" : lang === "bm" ? "ms-MY" : lang === "ta" ? "ta-IN" : "en-US", { month: "long" });

  return (
    <section className="relative">
      <div className="flex items-center gap-2 mb-1">
        <CalendarDays className="w-5 h-5 text-[hsl(126,24%,44%)]" />
        <h2 className="font-heading font-bold text-xl">{t("home.seasonal_title")}</h2>
        <span className="text-sm text-muted-foreground">· {monthName}</span>
      </div>
      <p className="text-sm text-muted-foreground mb-4">{t("home.seasonal_subtitle")}</p>

      {/* Ingredient chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {seasonal.map((ing) => (
          <Link key={ing.id} to={`/ingredient/${ing.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium bg-[hsl(18,71%,42%,0.12)] text-[hsl(126,24%,22%)] hover:bg-[hsl(18,71%,42%,0.22)] transition-colors border border-[hsl(18,71%,42%,0.2)]">
            <Sparkles className="w-3.5 h-3.5" />
            {localized(ing, "name", lang)}
          </Link>
        ))}
      </div>

      {/* Matching recipes */}
      {matchingRecipes.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {matchingRecipes.map((recipe) => (
            <Link key={recipe.id} to={`/recipe/${recipe.id}`}
              className="group flex items-center gap-3 p-3 glass-card rounded-2xl border border-border/50 hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-secondary">
                {recipe.image_url ? (
                  <img src={recipe.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full brand-gradient" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{localized(recipe, "title", lang)}</p>
                <p className="text-xs text-muted-foreground">{t(`kitchen.cuisines.${recipe.cuisine}`)}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-[hsl(126,24%,44%)] group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}