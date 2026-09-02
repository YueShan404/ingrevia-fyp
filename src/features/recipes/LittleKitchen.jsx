import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { appApi } from "@/api/supabaseClient";
import { useI18n } from "@/lib/i18n";
import Layout from "@/components/Layout";
import RecipeAccordion from "@/components/RecipeAccordion";
import IngreviaLoader from "@/components/IngreviaLoader";
import { ChefHat, Clock } from "lucide-react";

export default function LittleKitchen() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const ingredientFilter = searchParams.get("ingredient");
  const [recipes, setRecipes] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cuisine, setCuisine] = useState("all");
  const [quickOnly, setQuickOnly] = useState(false);

  useEffect(() => {
    Promise.all([
      appApi.entities.Recipe.list(),
      appApi.entities.Ingredient.list(),
    ]).then(([recs, ings]) => {
      setRecipes(recs || []);
      setIngredients(ings || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const cuisines = ["all", "malay", "chinese", "indian"];

  const filtered = useMemo(() => {
    return recipes.filter((r) => {
      const matchCuisine = cuisine === "all" || r.cuisine === cuisine;
      const totalTime = (r.prep_time || 0) + (r.cook_time || 0);
      const matchQuick = !quickOnly || totalTime < 30;
      const matchIngredient = !ingredientFilter ||
        (r.ingredient_tags || []).some((tag) => tag.toLowerCase() === ingredientFilter.toLowerCase());
      return matchCuisine && matchQuick && matchIngredient;
    });
  }, [recipes, cuisine, quickOnly, ingredientFilter]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl brand-gradient items-center justify-center mb-3">
            <ChefHat className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-heading font-extrabold text-3xl mb-2">{t("kitchen.title")}</h1>
          <p className="text-muted-foreground">{t("kitchen.subtitle")}</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {cuisines.map((c) => (
            <button key={c} onClick={() => setCuisine(c)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                cuisine === c ? "bg-[hsl(18,71%,42%)] text-white shadow-md" : "bg-secondary text-foreground/70 hover:bg-secondary/70"
              }`}>
              {c === "all" ? t("kitchen.filter_all") : t(`kitchen.cuisines.${c}`)}
            </button>
          ))}
          <button onClick={() => setQuickOnly(!quickOnly)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
              quickOnly ? "bg-[hsl(126,24%,44%)] text-white shadow-md" : "bg-secondary text-foreground/70 hover:bg-secondary/70"
            }`}>
            <Clock className="w-4 h-4" /> {t("kitchen.filter_time")}
          </button>
        </div>

        {loading ? (
          <IngreviaLoader compact message={t("loading.recipes")} />
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">{t("common.no_results")}</p>
        ) : (
          <RecipeAccordion recipes={filtered} ingredients={ingredients} />
        )}
      </div>
    </Layout>
  );
}
