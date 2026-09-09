import React from "react";
import { Link } from "react-router-dom";
import { useI18n, localized } from "@/lib/i18n";
import { CheckCircle2, AlertTriangle, ArrowRight, BookOpen, ChefHat, Sparkles, Target } from "lucide-react";

const NUT_CHIPS = [
  { key: "calories", label: "kcal", unit: "" },
  { key: "protein", labelKey: "nutrition.protein", unit: "g" },
  { key: "carbs", labelKey: "nutrition.carbs", unit: "g" },
  { key: "fiber", labelKey: "nutrition.fiber", unit: "g" },
  { key: "fat", labelKey: "nutrition.fat", unit: "g" },
];
function confidenceTone(confidence = 0) {
  if (confidence >= 75) return { labelKey: "scanner.confidence_high", text: "text-emerald-700", bar: "bg-emerald-500" };
  if (confidence >= 45) return { labelKey: "scanner.confidence_medium", text: "text-amber-700", bar: "bg-amber-500" };
  return { labelKey: "scanner.confidence_low", text: "text-red-600", bar: "bg-red-500" };
}

function ConfidenceMeter({ confidence = 0, t }) {
  const rounded = Math.max(0, Math.min(100, Math.round(Number(confidence) || 0)));
  const tone = confidenceTone(rounded);
  return (
    <div className="rounded-2xl border border-border/60 bg-background/80 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground">
          <Target className="h-3.5 w-3.5 text-primary" /> {t("scanner.confidence_label")}
        </span>
        <span className={`text-sm font-extrabold ${tone.text}`}>{rounded}% - {t(tone.labelKey)}</span>
      </div>
      <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
        <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${rounded}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{t("scanner.confidence_hint")}</p>
    </div>
  );
}
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
    <div className="mt-6 glass-card rounded-2xl sm:rounded-3xl border border-border/50 p-4 sm:p-6 animate-float-up overflow-hidden">
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
              <div className="mt-3 max-w-sm">
                <ConfidenceMeter confidence={result.confidence} t={t} />
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
              <div className="grid grid-cols-2 min-[420px]:grid-cols-3 sm:grid-cols-5 gap-2">
                {NUT_CHIPS.map((n) => {
                  const v = ing[n.key];
                  if (v == null) return null;
                  return (
                    <div key={n.key} className="text-center px-2 py-2 rounded-xl bg-secondary/60 border border-border/40">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{n.labelKey ? t(n.labelKey) : n.label}</p>
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
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-amber-950">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-heading text-lg font-bold">{result?.ingredient_name || t("scanner.not_matched")}</p>
              <p className="mt-1 text-sm font-semibold text-primary">{t("scanner.detected_not_catalogue")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("scanner.unmatched_hint")}</p>
            </div>
          </div>

          <ConfidenceMeter confidence={result?.confidence} t={t} />

          {(result?.detected_category || result?.common_names?.length > 0) && (
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase text-muted-foreground">{t("scanner.detected_labels")}</h4>
              <div className="flex flex-wrap gap-2">
                {result.detected_category && (
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
                    {result.detected_category}
                  </span>
                )}
                {result.common_names?.slice(0, 5).map((name) => (
                  <span key={name} className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result?.suggestions?.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase text-muted-foreground">{t("scanner.possible_matches")}</h4>
              <div className="flex flex-wrap gap-2">
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}
