import React from "react";
import { Link } from "react-router-dom";
import { useI18n, localized } from "@/lib/i18n";
import { Image } from "@/components/ui/image";
import { Search } from "lucide-react";

export default function IngredientCard({ ingredient }) {
  const { lang, t } = useI18n();
  const name = localized(ingredient, "name", lang);
  const desc = localized(ingredient, "description", lang);

  return (
    <Link
      to={`/ingredient/${ingredient.id}`}
      className="group glass-card rounded-3xl overflow-hidden border border-border/60 hover:shadow-xl hover:shadow-primary/15 hover:-translate-y-1 transition-all duration-300"
    >
      <div className="relative h-44 overflow-hidden">
        {ingredient.image_url ? (
          <Image src={ingredient.image_url} fittingType="fill" className="w-full h-full group-hover:scale-110 transition-transform duration-500" alt={name} />
        ) : (
          <div className="w-full h-full brand-gradient flex items-center justify-center">
            <Search className="w-10 h-10 text-primary-foreground/60" />
          </div>
        )}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-white/90 text-primary backdrop-blur-sm">
          {t(`encyclopedia.categories.${ingredient.category}`)}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-heading font-bold text-base mb-1 group-hover:text-primary transition-colors">{name}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{desc}</p>
        {ingredient.calories != null && (
          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
            <span className="font-semibold text-primary">{ingredient.calories} kcal</span>
            <span>·</span>
            <span>{ingredient.protein || 0}g protein</span>
          </div>
        )}
      </div>
    </Link>
  );
}