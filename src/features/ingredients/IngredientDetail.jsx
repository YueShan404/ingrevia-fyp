import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { appApi } from "@/api/supabaseClient";
import { useI18n, localized } from "@/lib/i18n";
import Layout from "@/components/Layout";
import HealthAdvisory from "@/components/HealthAdvisory";
import RecipeCard from "@/components/RecipeCard";
import SpeakButton from "@/components/SpeakButton";
import IngreviaLoader from "@/components/IngreviaLoader";
import { NUTRITION_FIELDS } from "@/lib/healthAdvisory";
import { ArrowLeft, BookOpen, Sparkles, ChefHat } from "lucide-react";

export default function IngredientDetail() {
  const { id } = useParams();
  const { t, lang } = useI18n();
  const [ingredient, setIngredient] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [allIngredients, setAllIngredients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      appApi.entities.Ingredient.get(id),
      appApi.entities.Recipe.list(),
      appApi.entities.Ingredient.list(),
    ]).then(([ing, recs, allIngs]) => {
      setIngredient(ing);
      setAllIngredients(allIngs || []);
      const matched = (recs || []).filter((r) =>
        (r.ingredient_tags || []).some((tag) => tag.toLowerCase() === (ing?.name || "").toLowerCase())
      );
      setRecipes(matched);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <Layout><IngreviaLoader compact message={t("loading.nutrition")} /></Layout>;
  if (!ingredient) return <Layout><div className="text-center py-20"><p className="text-muted-foreground">Not found</p><Link to="/encyclopedia" className="text-[hsl(126,24%,28%)] hover:underline mt-2 inline-block">← {t("nav.encyclopedia")}</Link></div></Layout>;

  const name = localized(ingredient, "name", lang);
  const desc = localized(ingredient, "description", lang);
  const uses = localized(ingredient, "culinary_uses", lang);
  const benefits = localized(ingredient, "benefits", lang);
  const localNames = [ingredient.name_bm, ingredient.name_zh, ingredient.name_ta].filter(Boolean);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <Link to="/encyclopedia" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> {t("nav.encyclopedia")}
        </Link>

        {/* Hero */}
        <div className="glass-card rounded-3xl overflow-hidden border border-border/50 mb-6">
          <div className="relative h-56">
            {ingredient.image_url ? (
              <img src={ingredient.image_url} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full brand-gradient" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <div className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-white/90 text-[hsl(126,24%,24%)] mb-2">
                {t(`encyclopedia.categories.${ingredient.category}`)}
              </div>
              <h1 className="font-heading font-extrabold text-3xl drop-shadow-lg">{name}</h1>
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-muted-foreground leading-relaxed flex-1">{desc}</p>
              <SpeakButton text={`${name}. ${desc}`} />
            </div>
            {localNames.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("ingredient_detail.local_names")}:</span>
                {localNames.map((n, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium bg-secondary">{n}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Nutrition + Advisory */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Nutrition facts */}
          <div className="glass-card rounded-3xl border border-border/50 p-5">
            <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[hsl(126,24%,44%)]" /> {t("common.nutrition")}
            </h2>
            <div className="space-y-2">
              {NUTRITION_FIELDS.map((f) => {
                const val = ingredient[f.key];
                if (val == null) return null;
                return (
                  <div key={f.key} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
                    <span className="text-sm text-muted-foreground">{f.label_en}</span>
                    <span className="text-sm font-semibold">{val} {f.unit}</span>
                  </div>
                );
              })}
            </div>
            {ingredient.source && (
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/40">
                {t("common.source")}: {ingredient.source}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">{t("common.per_100g")}</p>
          </div>

          {/* Health Advisory */}
          <div className="glass-card rounded-3xl border border-border/50 p-5">
            <HealthAdvisory nutrition={ingredient} />
          </div>
        </div>

        {/* Benefits & Uses */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {benefits && (
            <div className="glass-card rounded-3xl border border-border/50 p-5">
              <h2 className="font-heading font-bold text-lg mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[hsl(126,24%,44%)]" /> {t("common.benefits")}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{benefits}</p>
            </div>
          )}
          {uses && (
            <div className="glass-card rounded-3xl border border-border/50 p-5">
              <h2 className="font-heading font-bold text-lg mb-3 flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-[hsl(126,24%,44%)]" /> {t("common.culinary_uses")}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{uses}</p>
            </div>
          )}
        </div>

        {/* Fun facts */}
        {ingredient.fun_facts && (
          <div className="glass-card rounded-3xl border border-border/50 p-5 mb-6 bg-[hsl(18,71%,42%,0.05)]">
            <h2 className="font-heading font-bold text-lg mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[hsl(126,24%,44%)]" /> {t("common.fun_facts")}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{ingredient.fun_facts}</p>
          </div>
        )}

        {/* Advisory disclaimer */}
        <div className="glass-card rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-4 mb-8">
          <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">{t("ingredient_detail.advisory_disclaimer")}</p>
        </div>

        {/* Related recipes */}
        <h2 className="font-heading font-bold text-xl mb-4 flex items-center gap-2">
          <ChefHat className="w-5 h-5 text-[hsl(126,24%,44%)]" /> {t("ingredient_detail.recipes_with")}
        </h2>
        {recipes.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recipes.map((r) => <RecipeCard key={r.id} recipe={r} ingredients={allIngredients} />)}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">{t("ingredient_detail.no_recipes")}</p>
        )}
      </div>
    </Layout>
  );
}
