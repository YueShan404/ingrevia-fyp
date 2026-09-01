import React from "react";
import { Link } from "react-router-dom";
import { useI18n, localized } from "@/lib/i18n";
import { useCommunityFavorites } from "@/lib/favorites";
import { Image } from "@/components/ui/image";
import RecipeShareButton from "@/components/RecipeShareButton";
import { Clock, Bookmark } from "lucide-react";

/**
 * Horizontal editorial menu card for the Community page.
 * Shows: recipe number, food image, title, cuisine badge, description,
 * contributor, cook time, and a bookmark button.
 */
export default function CommunityRecipeCard({ recipe, index = 0 }) {
  const { t, lang } = useI18n();
  const { isFavorite, toggleFavorite } = useCommunityFavorites();
  const fav = isFavorite(recipe.id);
  const title = localized(recipe, "title", lang);
  const description = localized(recipe, "description", lang);

  // Approx cook time (community recipes don't carry numeric times)
  const cookTime = recipe.cook_time ?? recipe.prep_time ?? null;
  const number = String((index ?? 0) + 1).padStart(2, "0");

  return (
    <Link
      to={`/community/${recipe.id}`}
      className="group block animate-slide-up"
      style={{ animationDelay: `${Math.min(index * 70, 700)}ms` }}
    >
      <article className="relative flex flex-col sm:flex-row bg-card rounded-3xl border border-border/70 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        {/* Number badge */}
        <span className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 inline-flex items-center justify-center w-9 h-9 rounded-full bg-secondary/90 text-primary font-heading font-extrabold text-sm backdrop-blur-sm border border-border">
          {number}
        </span>

        {/* Image */}
        <div className="relative w-full sm:w-44 h-40 sm:h-auto sm:min-h-[180px] shrink-0 overflow-hidden bg-secondary">
          {recipe.image_url ? (
            <Image src={recipe.image_url} fittingType="fill" className="w-full h-full group-hover:scale-105 transition-transform duration-500" alt={title} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Clock className="w-10 h-10 text-muted-foreground/40" />
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 p-5 sm:p-6 flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-secondary text-primary mb-2">
                {t(`kitchen.cuisines.${recipe.cuisine}`) || recipe.cuisine}
              </span>
              <h3 className="font-heading font-bold text-lg sm:text-xl text-foreground group-hover:text-primary transition-colors leading-snug">
                {title}
              </h3>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <RecipeShareButton recipe={recipe} sharePath={`/community/${recipe.id}`}
                className="w-10 h-10 rounded-full bg-muted text-muted-foreground hover:text-primary flex items-center justify-center" />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleFavorite(recipe.id);
                }}
                aria-label={fav ? t("community.bookmark_remove") : t("community.bookmark_add")}
                className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
                  fav ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:text-primary"
                }`}
              >
                <Bookmark className={`w-5 h-5 ${fav ? "fill-primary" : ""}`} />
              </button>
            </div>
          </div>

          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mt-2">{description}</p>
          )}

          <div className="editorial-divider my-3" />

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground mt-auto">
            <span className="flex items-center gap-1.5">
              <span className="font-semibold text-foreground/80">{recipe.author}</span>
            </span>
            {cookTime != null && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" /> {cookTime} {t("common.minutes")}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Bookmark className={`w-3.5 h-3.5 ${fav ? "fill-primary text-primary" : "text-muted-foreground"}`} />
              {fav ? t("community.bookmarked") : t("community.bookmark_short")}
            </span>
            {recipe.status && recipe.status !== "approved" && (
              <span className="px-2 py-0.5 rounded-full bg-secondary text-primary/80 font-semibold">
                {t(`community.status_${recipe.status}`)}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
