import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { appApi } from "@/api/supabaseClient";
import { useI18n, localized } from "@/lib/i18n";
import { useFavorites, useZeroWaste } from "@/lib/favorites";
import { computeRecipeNutritionFacts, computeRecipeSuitability } from "@/lib/recipeHealth";
import Layout from "@/components/Layout";
import SpeakButton from "@/components/SpeakButton";
import IngreviaLoader from "@/components/IngreviaLoader";
import { ArrowLeft, Clock, ChefHat, Users, Heart, Recycle, Check, Flame, Activity, AlertTriangle, CalendarPlus, Share2 } from "lucide-react";

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isApplied, toggleApplied } = useZeroWaste();
  const [recipe, setRecipe] = useState(null);
  const [allIngredients, setAllIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [servings, setServings] = useState(2);
  const [preferences, setPreferences] = useState(null);

  useEffect(() => {
    Promise.all([
      appApi.entities.Recipe.get(id),
      appApi.entities.Ingredient.list().catch(() => []),
    ]).then(([data, ingredientRows]) => {
      setRecipe(data);
      setAllIngredients(ingredientRows || []);
      setServings(data?.servings || 2);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    try {
      setPreferences(JSON.parse(localStorage.getItem("ingrevia_onboarding_preferences")) || null);
    } catch {
      setPreferences(null);
    }
  }, []);

  if (loading) return <Layout><IngreviaLoader compact message={t("loading.recipe_detail")} /></Layout>;
  if (!recipe) return <Layout><div className="text-center py-20"><p className="text-muted-foreground">Not found</p></div></Layout>;

  const title = localized(recipe, "title", lang);
  const desc = localized(recipe, "description", lang);
  const ingredients = localized(recipe, "ingredients", lang) || recipe.ingredients || [];
  const steps = localized(recipe, "steps", lang) || recipe.steps || [];
  const zeroWaste = localized(recipe, "zero_waste_tip", lang);
  const fav = isFavorite(recipe.id);
  const applied = isApplied(recipe.id);
  const ratio = servings / (recipe.servings || 2);
  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);
  const nutrition = computeRecipeNutritionFacts(recipe, allIngredients);
  const suitability = computeRecipeSuitability(recipe, allIngredients);
  const avoidedMatches = findAvoidedIngredientMatches(recipe, ingredients, preferences?.avoidIngredients || []);
  const recipeSpeech = [
    title,
    desc,
    `${t("common.ingredients")}: ${ingredients.join(". ")}`,
    `${t("common.steps")}: ${steps.join(". ")}`,
    zeroWaste ? `${t("recipe_detail.zero_waste_title")}: ${zeroWaste}` : "",
  ].filter(Boolean).join(". ");

  // Try to parse numeric quantities from ingredients for scaling
  const scaleIngredient = (line) => {
    if (ratio === 1) return line;
    return line.replace(/^(\d+(?:\.\d+)?(?:\/\d+)?)\s*/, (match, num) => {
      if (num.includes("/")) {
        const [a, b] = num.split("/").map(Number);
        return `${((a / b) * ratio).toFixed(2).replace(/\.?0+$/, "")} `;
      }
      return `${(parseFloat(num) * ratio).toFixed(2).replace(/\.?0+$/, "")} `;
    });
  };

  const handlePlan = async () => {
    if (!fav) {
      await toggleFavorite(recipe.id);
    }
    navigate("/planner");
  };

  const shareRecipe = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title, text: desc, url }).catch(() => {});
      return;
    }
    await navigator.clipboard?.writeText(url);
    alert(t("common.share_copied"));
  };

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Link to="/kitchen" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> {t("nav.kitchen")}
        </Link>

        {/* Hero */}
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="glass-card overflow-hidden rounded-3xl border border-border/50">
          <div className="relative h-56">
            {recipe.image_url ? (
              <img src={recipe.image_url} alt={title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full forest-gradient" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute top-3 right-3 flex gap-2">
              {recipe.spice_level && recipe.spice_level !== "mild" && (
                <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-red-500/90 text-white flex items-center gap-0.5">
                  <Flame className="w-3 h-3" /> {t(`kitchen.spice.${recipe.spice_level}`)}
                </span>
              )}
            </div>
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-white/90 text-[hsl(126,24%,24%)] mb-2">
                {t(`kitchen.cuisines.${recipe.cuisine}`)}
              </span>
              <h1 className="font-heading font-extrabold text-3xl drop-shadow-lg">{title}</h1>
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-muted-foreground leading-relaxed flex-1">{desc}</p>
              <div className="flex shrink-0 items-center gap-2">
                <SpeakButton text={recipeSpeech} />
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={() => toggleFavorite(recipe.id)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${fav ? "bg-red-50 text-red-600" : "bg-secondary text-foreground hover:bg-secondary/70"}`}>
                <Heart className={`h-4 w-4 ${fav ? "fill-red-500 text-red-500" : ""}`} /> {fav ? t("recipe_detail.saved") : t("recipe_detail.save")}
              </button>
              <button onClick={handlePlan} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90">
                <CalendarPlus className="h-4 w-4" /> {t("recipe_detail.plan")}
              </button>
              <button onClick={shareRecipe} className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-bold text-foreground hover:bg-secondary/70">
                <Share2 className="h-4 w-4" /> {t("common.share")}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {totalTime} {t("common.minutes")}</span>
              <span className="flex items-center gap-1.5"><ChefHat className="w-4 h-4" /> {t("common.prep_time")}: {recipe.prep_time || 0} {t("common.minutes")}</span>
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {recipe.servings} {t("common.servings")}</span>
            </div>
            {/* Nutrient tags */}
            {recipe.nutrient_tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {recipe.nutrient_tags.map((tag) => (
                  <span key={tag} className="px-2.5 py-1 rounded-full text-xs font-medium bg-[hsl(18,71%,42%,0.12)] text-[hsl(126,24%,22%)]">
                    {t(`kitchen.tags.${tag}`)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-5">
        <div className="glass-card rounded-3xl border border-border/50 p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-heading font-bold text-lg">{t("recipe_detail.health_title")}</h2>
              <p className="text-xs text-muted-foreground">{t("recipe_detail.health_subtitle")}</p>
            </div>
            <Activity className="w-6 h-6 text-primary shrink-0" />
          </div>

          {nutrition ? (
            <NutritionFactsPanel nutrition={nutrition} t={t} />
          ) : (
            <p className="text-sm text-muted-foreground mb-4">{t("recipe_detail.nutrition_unavailable")}</p>
          )}

          <div className="flex flex-wrap gap-2">
            {suitability.map((item) => (
              <span
                key={item.key}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  item.status === "caution"
                    ? "bg-amber-100 text-amber-800"
                    : item.status === "good"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-secondary text-foreground/75"
                }`}
              >
                {item.status === "caution" && <AlertTriangle className="w-3.5 h-3.5" />}
                {t(`recipe_suitable.${item.key}`)}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{t("health_advisory.disclaimer")}</p>
        </div>

        {avoidedMatches.length > 0 && (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <h2 className="font-heading text-base font-bold">{t("recipe_detail.preference_alert")}</h2>
                <p className="mt-1 text-sm">{t("recipe_detail.preference_alert_body")}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {avoidedMatches.map((item) => (
                    <span key={item} className="rounded-full bg-background/80 px-3 py-1 text-xs font-bold text-amber-900">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        </aside>
        </div>

        {/* Servings calculator */}
        <div className="mt-6 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="glass-card rounded-3xl border border-border/50 p-5">
          <h2 className="font-heading font-bold text-lg mb-3">{t("recipe_detail.servings_calculator")}</h2>
          <div className="flex items-center gap-4">
            <button onClick={() => setServings(Math.max(1, servings - 1))}
              className="w-10 h-10 rounded-full bg-secondary text-xl font-bold hover:bg-secondary/70 transition-colors">−</button>
            <div className="text-center flex-1">
              <p className="font-heading font-extrabold text-3xl text-[hsl(126,24%,28%)]">{servings}</p>
              <p className="text-xs text-muted-foreground">{t("common.servings")}</p>
            </div>
            <button onClick={() => setServings(servings + 1)}
              className="w-10 h-10 rounded-full bg-secondary text-xl font-bold hover:bg-secondary/70 transition-colors">+</button>
          </div>
        </div>

        {/* Ingredients */}
        <div className="glass-card rounded-3xl border border-border/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-lg">{t("common.ingredients")}</h2>
            <SpeakButton text={`${t("common.ingredients")}: ${ingredients.join(". ")}`} />
          </div>
          <ul className="space-y-2.5">
            {ingredients.map((ing, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="shrink-0 w-5 h-5 rounded-full bg-[hsl(18,71%,42%,0.15)] flex items-center justify-center text-[10px] font-bold text-[hsl(126,24%,28%)] mt-0.5">{i + 1}</span>
                <span className="flex-1">{scaleIngredient(ing)}</span>
              </li>
            ))}
          </ul>
        </div>
        </div>

        {/* Steps */}
        <div className="glass-card mt-6 rounded-3xl border border-border/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-lg">{t("common.steps")}</h2>
            <SpeakButton text={`${t("common.steps")}: ${steps.join(". ")}`} />
          </div>
          <ol className="space-y-4">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="shrink-0 w-7 h-7 rounded-full brand-gradient text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <p className="text-sm leading-relaxed pt-1">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Zero-waste tip */}
        {zeroWaste && (
          <div className="glass-card mt-6 rounded-3xl border border-[hsl(18,71%,42%,0.25)] bg-[hsl(18,71%,42%,0.05)] p-5">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-11 h-11 rounded-2xl bg-[hsl(18,71%,42%,0.15)] flex items-center justify-center">
                <Recycle className="w-6 h-6 text-[hsl(126,24%,28%)]" />
              </div>
              <div className="flex-1">
                <h2 className="font-heading font-bold text-base mb-1">{t("recipe_detail.zero_waste_title")}</h2>
                <p className="text-xs text-muted-foreground mb-2">{t("recipe_detail.zero_waste_subtitle")}</p>
                <p className="text-sm leading-relaxed">{zeroWaste}</p>
                <button onClick={() => toggleApplied(recipe.id)}
                  className={`mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    applied
                      ? "bg-[hsl(126,24%,44%)] text-white"
                      : "bg-secondary text-foreground hover:bg-secondary/70"
                  }`}>
                  {applied ? <><Check className="w-4 h-4" /> {t("recipe_detail.applied_tip")}</> : t("recipe_detail.mark_applied")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

const NUTRIENT_ROWS = [
  ["carbs", "g"],
  ["fiber", "g"],
  ["sugar", "g"],
  ["protein", "g"],
  ["fat", "g"],
  ["saturated_fat", "g"],
  ["cholesterol", "mg"],
  ["sodium", "mg"],
  ["calcium", "mg"],
  ["iron", "mg"],
  ["potassium", "mg"],
];

function formatNutrient(value, unit) {
  if (value == null || Number.isNaN(value)) return "-";
  const rounded = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded}${unit}`;
}

function NutritionFactsPanel({ nutrition, t }) {
  const calories = nutrition.facts.calories?.perServing;

  return (
    <div className="mb-4 rounded-2xl border border-border/60 bg-background/70 p-4 sm:p-5">
      <div className="border-b border-border/70 pb-4">
        <h3 className="font-heading text-2xl font-extrabold">{t("recipe_detail.nutrition_facts")}</h3>
        <p className="mt-2 text-sm text-foreground">{t("recipe_detail.servings_per_recipe")}: {nutrition.servings}</p>
        <p className="text-sm text-foreground">
          {t("nutrition.calories")}: {calories != null ? Math.round(calories) : "-"}
        </p>
      </div>

      <div className="mt-3 text-right text-sm font-semibold">{t("recipe_detail.daily_value")}</div>
      <div className="mt-2 divide-y divide-border/70 border-y border-border/70">
        {NUTRIENT_ROWS.map(([field, unit]) => {
          const item = nutrition.facts[field];
          if (!item) return null;

          return (
            <div key={field} className="grid grid-cols-[1fr_auto] gap-3 py-2 text-sm">
              <p>
                <span className="font-bold">{t(`nutrition.${field}`)}:</span>{" "}
                {formatNutrient(item.perServing, unit)}
              </p>
              <p className="font-medium">{item.dailyValue != null ? `${item.dailyValue}%` : ""}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 space-y-3 text-xs leading-relaxed text-muted-foreground">
        <p>{t("recipe_detail.daily_value_note")}</p>
        <p>{t("recipe_detail.nutrition_estimate_note").replace("{count}", nutrition.sourceCount)}</p>
        <p>{t("recipe_detail.medical_note")}</p>
      </div>
    </div>
  );
}

const AVOID_KEYWORDS = {
  alcohol: ["alcohol", "wine", "beer", "liquor", "rum"],
  caffeine: ["caffeine", "coffee", "tea", "matcha"],
  celery: ["celery"],
  crustacean: ["crustacean", "prawn", "shrimp", "crab", "lobster"],
  egg: ["egg", "eggs"],
  fish: ["fish", "anchovy", "tuna", "salmon", "mackerel"],
  gluten: ["gluten", "wheat", "flour", "barley", "rye", "soy sauce"],
  groundnut: ["groundnut", "peanut", "peanuts"],
  milk: ["milk", "cream", "cheese", "butter", "yogurt"],
  mollusc: ["mollusc", "clam", "oyster", "mussel", "squid"],
  mustard: ["mustard"],
  sesame: ["sesame", "tahini"],
  soybean: ["soy", "soybean", "tofu", "tempeh", "soy sauce"],
  sulphites: ["sulphite", "sulfite", "dried fruit", "vinegar"],
  tree_nut: ["almond", "cashew", "walnut", "hazelnut", "pistachio", "pecan"],
  wheat: ["wheat", "flour", "noodle", "bread"],
  lactose: ["lactose", "milk", "cream", "cheese", "butter", "yogurt"],
  yeast: ["yeast", "bread"],
};

const AVOID_LABELS = {
  alcohol: "Alcohol",
  caffeine: "Caffeine",
  celery: "Celery",
  crustacean: "Crustacean",
  egg: "Egg",
  fish: "Fish",
  gluten: "Gluten",
  groundnut: "Groundnut",
  milk: "Milk",
  mollusc: "Mollusc",
  mustard: "Mustard",
  sesame: "Sesame",
  soybean: "Soybean",
  sulphites: "Sulphites",
  tree_nut: "Tree nut",
  wheat: "Wheat",
  lactose: "Lactose",
  yeast: "Yeast",
};

function findAvoidedIngredientMatches(recipe, ingredientLines = [], avoided = []) {
  if (!avoided.length) return [];

  const searchable = [
    ...(recipe?.ingredient_tags || []),
    ...(recipe?.nutrient_tags || []),
    ...(ingredientLines || []),
  ].join(" ").toLowerCase();

  return avoided
    .filter((key) => (AVOID_KEYWORDS[key] || [key]).some((word) => searchable.includes(word)))
    .map((key) => AVOID_LABELS[key] || key);
}
