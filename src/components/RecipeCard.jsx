import React from "react";
import { Link } from "react-router-dom";
import { useI18n, localized } from "@/lib/i18n";
import { useFavorites } from "@/lib/favorites";
import { Image } from "@/components/ui/image";
import { Heart, Clock, ChefHat, Flame } from "lucide-react";
import RecipeShareButton from "@/components/RecipeShareButton";
import RecipeHealthBadges from "@/components/RecipeHealthBadges";

export default function RecipeCard({ recipe, ingredients = [] }) {
  const { lang, t } = useI18n();
  const { isFavorite, toggleFavorite } = useFavorites();
  const title = localized(recipe, "title", lang);
  const desc = localized(recipe, "description", lang);
  const fav = isFavorite(recipe.id);
  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);

  return (
    <div className="group glass-card rounded-3xl overflow-hidden border border-border/50 hover:shadow-xl hover:shadow-[hsl(18,71%,42%,0.15)] hover:-translate-y-1 transition-all duration-300 relative">
      <Link to={`/recipe/${recipe.id}`}>
        <div className="relative h-48 overflow-hidden">
          {recipe.image_url ? (
            <Image src={recipe.image_url} fittingType="fill" className="w-full h-full group-hover:scale-110 transition-transform duration-500" alt={title} />
          ) : (
            <div className="w-full h-full forest-gradient flex items-center justify-center">
              <ChefHat className="w-12 h-12 text-white/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-white/90 text-[hsl(126,24%,24%)] backdrop-blur-sm">
            {t(`kitchen.cuisines.${recipe.cuisine}`)}
          </div>
          {recipe.spice_level && recipe.spice_level !== "mild" && (
            <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-bold bg-red-500/90 text-white flex items-center gap-0.5">
              <Flame className="w-3 h-3" /> {t(`kitchen.spice.${recipe.spice_level}`)}
            </div>
          )}
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="font-heading font-bold text-lg text-white drop-shadow-lg leading-tight">{title}</h3>
          </div>
        </div>
      </Link>
      <div className="absolute top-3 right-3 z-10 flex gap-2 items-center">
        <RecipeShareButton recipe={recipe}
          className="w-9 h-9 rounded-full glass-card flex items-center justify-center text-white hover:text-primary" />
        <button onClick={() => toggleFavorite(recipe.id)}
          className="w-9 h-9 rounded-full glass-card flex items-center justify-center hover:scale-110 transition-transform">
          <Heart className={`w-4 h-4 transition-colors ${fav ? "fill-red-500 text-red-500" : "text-white"}`} />
        </button>
      </div>
      <div className="p-4">
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3">{desc}</p>
        <RecipeHealthBadges recipe={recipe} ingredients={ingredients} />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {totalTime} {t("common.minutes")}</span>
          <span className="flex items-center gap-1"><ChefHat className="w-3.5 h-3.5" /> {recipe.servings} {t("common.servings")}</span>
        </div>
      </div>
    </div>
  );
}