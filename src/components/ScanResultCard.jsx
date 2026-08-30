import React from "react";
import { Link } from "react-router-dom";
import { useI18n, localized } from "@/lib/i18n";
import { CheckCircle2, AlertTriangle, ArrowRight, BookOpen, ChefHat, Sparkles } from "lucide-react";

const NUT_CHIPS = [
  { key: "calories", label: "kcal", unit: "" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "carbs", label: "Carbs", unit: "g" },
  { key: "fiber", label: "Fiber", unit: "g" },
  { key: "fat", label: "Fat", unit: "g" },
];

/**
 * Rich scan result panel.
 *  - When matched: full ingredient details (image, local names, description,
 *    quick nutrition, benefits) and direct links to recipes that use it.
 *  - When unmatched: a friendly low-confidence message.
 */
export default function ScanResultCard({ result, recipes = [] }) {
  const { t, lang } = useI18n();

  if (result?.error) {
    return (
      <div className="mt-6 glass-card rounded-3xl border border-red-200 p-6 text-center text-red-600">
        {result.description}
      </div>
    );
  }

  const ing = result?.matchedIngredient;
  const matchedRecipes = result?.matched && ing
    ? (recipes || []).filter((r) =>
        (r.ingredient_tags || []).some((tag) =>
          tag.toLowerCase() === (ing.name || "").toLowerCase()
        )
      )
    : [];

  return (
    <div className="mt-6 glass-card rounded-3xl border border-border/50 p-6 animate-float-up overflow-hidden">
      <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-[hsl(126,24%,44%)]" /> {t("scanner.result_title")}
      </h2>

      {result?.matched && ing ? (
        <>
          {/* Hero */}
          <div className="flex flex-col sm:flex-row gap-4 mb-5">
            <div className="w-full sm:w-32 h-32 rounded-2xl overflow-hidden shrink-0 brand-gradient flex items-center justify-center">
              {ing.image_url ? (
                <img src={ing.image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <ChefHat className="w-8 h-8 text-white/60" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-secondary text-primary mb-1.5">
                {t(`encyclopedia.categories.${ing.category}`)}
              </span>
              <h3 className="font-heading font-bold text-2xl">{localized(ing, "name", lang)}</h3>
              {[ing.name_bm, ing.name_zh, ing.name_ta].filter(Boolean).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[ing.name_bm, ing.name_zh, ing.name_ta].filter(Boolean).map((n, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-secondary text-muted-foreground">{n}</span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 mt-3 max-w-[200px]">
                <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full brand-gradient rounded-full" style={{ width: `${result.confidence}%` }} />
                </div>
                <span className="text-xs font-semibold text-[hsl(126,24%,28%)]">{result.confidence}% {t("scanner.confidence")}</span>
              </div>
            </div>
          </div>

          {/* What it is */}
          <p className="text-sm leading-relaxed mb-4">
            {localized(ing, "description", lang) || result.description || ""}
          </p>

          {/* Quick nutrition chips per 100g */}
          {NUT_CHIPS.some((n) => ing[n.key] != null) && (
            <div className="mb-5">
              <h4 className="font-heading font-bold text-sm mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[hsl(126,24%,44%)]" /> {t("common.nutrition")} · {t("common.per_100g")}
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {NUT_CHIPS.map((n) => {
                  const v = ing[n.key];
                  if (v == null) return null;
                  return (
                    <div key={n.key} className="text-center px-2 py-2 rounded-xl bg-secondary/60 border border-border/40">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{n.label}</p>
                      <p className="font-heading font-bold text-base">
                        {v}{n.unit && <span className="text-[10px] text-muted-foreground ml-0.5">{n.unit}</span>}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Benefits */}
          {localized(ing, "benefits", lang) && (
            <div className="mb-5">
              <h4 className="font-heading font-bold text-sm mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[hsl(126,24%,44%)]" /> {t("common.benefits")}
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{localized(ing, "benefits", lang)}</p>
            </div>
          )}

          {/* Direct recipe links */}
          {matchedRecipes.length > 0 ? (
            <div className="mb-5">
              <h4 className="font-heading font-bold text-base mb-3 flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-[hsl(126,24%,44%)]" /> {t("scanner.matched_recipes")}
              </h4>
              <div className="space-y-2.5">
                {matchedRecipes.slice(0, 3).map((r) => {
                  const totalTime = (r.prep_time || 0) + (r.cook_time || 0);
                  return (
                    <Link key={r.id} to={`/recipe/${r.id}`}
                      className="flex items-center gap-3 p-3 glass-card rounded-2xl border border-border/60 hover:shadow-md hover:border-primary/40 transition-all">
                      {r.image_url ? (
                        <img src={r.image_url} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                          <ChefHat className="w-5 h-5 text-muted-foreground/60" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{localized(r, "title", lang)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {t(`kitchen.cuisines.${r.cuisine}`)}{totalTime > 0 ? ` · ${totalTime} ${t("common.minutes")}` : ""} · {r.servings || 2} {t("common.servings")}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-primary shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mb-5">
              <p className="text-xs text-muted-foreground italic">{t("scanner.zero_recipes")}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-3 border-t border-border/40">
            <Link to={`/ingredient/${ing.id}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full brand-gradient text-white font-medium text-sm hover:scale-105 transition-transform">
              <BookOpen className="w-4 h-4" /> {t("scanner.view_full_details")}
            </Link>
            {matchedRecipes.length > 0 && (
              <Link to={`/kitchen?ingredient=${encodeURIComponent(ing.name)}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-secondary text-foreground font-medium text-sm hover:bg-secondary/70 transition-colors">
                <ChefHat className="w-4 h-4" /> {t("scanner.view_recipes")}
              </Link>
            )}
          </div>
        </>
      ) : (
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">{result?.ingredient_name ? result.ingredient_name : t("scanner.not_matched")}</p>
            <p className="text-sm text-muted-foreground mt-1">{result?.description}</p>
            {result?.confidence < 40 && result?.confidence > 0 && (
              <p className="text-xs text-amber-600 mt-2">{t("scanner.low_confidence")}</p>
            )}
            {result?.suggestions?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {result.suggestions.map((suggestion) => (
                  <Link
                    key={suggestion.id}
                    to={`/ingredient/${suggestion.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary/70"
                  >
                    {localized(suggestion, "name", lang)}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
