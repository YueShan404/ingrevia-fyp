import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { appApi } from "@/api/supabaseClient";
import { useI18n, localized } from "@/lib/i18n";
import { useFavorites, useZeroWaste } from "@/lib/favorites";
import Layout from "@/components/Layout";
import SpeakButton from "@/components/SpeakButton";
import IngreviaLoader from "@/components/IngreviaLoader";
import { ArrowLeft, Clock, ChefHat, Users, Heart, Recycle, Check, Flame } from "lucide-react";

export default function RecipeDetail() {
  const { id } = useParams();
  const { t, lang } = useI18n();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isApplied, toggleApplied } = useZeroWaste();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [servings, setServings] = useState(2);

  useEffect(() => {
    appApi.entities.Recipe.get(id).then((data) => {
      setRecipe(data);
      setServings(data?.servings || 2);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

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

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <Link to="/kitchen" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> {t("nav.kitchen")}
        </Link>

        {/* Hero */}
        <div className="glass-card rounded-3xl overflow-hidden border border-border/50 mb-6">
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
              <button onClick={() => toggleFavorite(recipe.id)}
                className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-110 ${fav ? "bg-red-50 dark:bg-red-950/30" : "bg-secondary"}`}>
                <Heart className={`w-5 h-5 ${fav ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
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

        {/* Servings calculator */}
        <div className="glass-card rounded-3xl border border-border/50 p-5 mb-6">
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
        <div className="glass-card rounded-3xl border border-border/50 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-lg">{t("common.ingredients")}</h2>
            <SpeakButton text={ingredients.join(". ")} />
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

        {/* Steps */}
        <div className="glass-card rounded-3xl border border-border/50 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-lg">{t("common.steps")}</h2>
            <SpeakButton text={steps.join(". ")} />
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
          <div className="glass-card rounded-3xl border border-[hsl(18,71%,42%,0.25)] bg-[hsl(18,71%,42%,0.05)] p-5 mb-6">
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
