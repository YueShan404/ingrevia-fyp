import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { appApi } from "@/api/supabaseClient";
import { useI18n } from "@/lib/i18n";
import { useCommunityFavorites } from "@/lib/favorites";
import Layout from "@/components/Layout";
import SpeakButton from "@/components/SpeakButton";
import { Image } from "@/components/ui/image";
import { ArrowLeft, Clock, Bookmark, Recycle, ChefHat, Loader2, Sparkles } from "lucide-react";

export default function CommunityRecipeDetail() {
  const { id } = useParams();
  const { t, lang } = useI18n();
  const { isFavorite, toggleFavorite } = useCommunityFavorites();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    appApi.entities.CommunityRecipe
      .get(id)
      .then((data) => {
        setRecipe(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );

  if (!recipe)
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground mb-4">{t("community.not_found")}</p>
          <Link to="/community" className="inline-flex items-center gap-1.5 text-primary font-medium">
            <ArrowLeft className="w-4 h-4" /> {t("community.back")}
          </Link>
        </div>
      </Layout>
    );

  const fav = isFavorite(recipe.id);
  const ingredients = recipe.ingredients || [];
  const steps = recipe.steps || [];
  const cookTime = recipe.cook_time ?? recipe.prep_time ?? null;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <Link
          to="/community"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> {t("community.back")}
        </Link>

        {/* Hero */}
        <div className="glass-card rounded-3xl overflow-hidden border border-border/60 mb-6">
          <div className="relative h-56 sm:h-64">
            {recipe.image_url ? (
              <Image src={recipe.image_url} fittingType="fill" className="w-full h-full" alt={recipe.title} />
            ) : (
              <div className="w-full h-full brand-gradient" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-white/90 text-primary mb-2">
                {t(`kitchen.cuisines.${recipe.cuisine}`) || recipe.cuisine}
              </span>
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl drop-shadow-lg">{recipe.title}</h1>
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-muted-foreground leading-relaxed flex-1 text-sm">{recipe.description}</p>
              <button
                onClick={() => toggleFavorite(recipe.id)}
                aria-label={fav ? t("community.bookmark_remove") : t("community.bookmark_add")}
                className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
                  fav ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground hover:text-primary"
                }`}
              >
                <Bookmark className={`w-5 h-5 ${fav ? "fill-primary" : ""}`} />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ChefHat className="w-4 h-4 text-primary" /> {t("community.contributed_by")} <span className="font-semibold text-foreground/80">{recipe.author}</span>
              </span>
              {cookTime != null && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" /> {cookTime} {t("common.minutes")}
                </span>
              )}
              {recipe.status && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  recipe.status === "approved" ? "bg-accent/15 text-accent" : "bg-secondary text-primary"
                }`}>
                  {t(`community.status_${recipe.status}`)}
                </span>
              )}
            </div>
            {fav && (
              <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary font-medium">
                <Bookmark className="w-3.5 h-3.5 fill-primary" /> {t("community.bookmarked")}
              </div>
            )}
          </div>
        </div>

        {/* Ingredients */}
        {ingredients.length > 0 && (
          <div className="glass-card rounded-3xl border border-border/60 p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold text-lg text-primary">{t("common.ingredients")}</h2>
              <SpeakButton text={ingredients.join(". ")} />
            </div>
            <ul className="space-y-2.5">
              {ingredients.map((ing, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px] font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <span className="flex-1">{ing}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Steps */}
        {steps.length > 0 && (
          <div className="glass-card rounded-3xl border border-border/60 p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold text-lg text-primary">{t("common.steps")}</h2>
              <SpeakButton text={steps.join(". ")} />
            </div>
            <ol className="space-y-4">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 w-7 h-7 rounded-full brand-gradient text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed pt-1">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Zero-waste tip */}
        {recipe.zero_waste_tip && (
          <div className="glass-card rounded-3xl border border-accent/25 bg-accent/5 p-5 mb-6">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-11 h-11 rounded-2xl bg-accent/15 flex items-center justify-center">
                <Recycle className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1">
                <h2 className="font-heading font-bold text-base mb-1 text-accent">{t("recipe_detail.zero_waste_title")}</h2>
                <p className="text-xs text-muted-foreground mb-2">{t("recipe_detail.zero_waste_subtitle")}</p>
                <p className="text-sm leading-relaxed">{recipe.zero_waste_tip}</p>
              </div>
            </div>
          </div>
        )}

        {/* Share CTA */}
        <div className="rounded-3xl bg-secondary/60 border border-border/60 p-6 text-center">
          <Sparkles className="w-7 h-7 text-accent mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-3">{t("community.share_prompt")}</p>
          <Link
            to="/submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:scale-105 transition-transform"
          >
            <ChefHat className="w-4 h-4" /> {t("nav.submit")}
          </Link>
        </div>
      </div>
    </Layout>
  );
}
