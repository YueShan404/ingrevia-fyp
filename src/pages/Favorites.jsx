import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { appApi } from "@/api/supabaseClient";
import { useI18n } from "@/lib/i18n";
import { useFavorites, useCommunityFavorites } from "@/lib/favorites";
import Layout from "@/components/Layout";
import RecipeCard from "@/components/RecipeCard";
import CommunityRecipeCard from "@/components/CommunityRecipeCard";
import { Heart, Bookmark, Loader2, Users } from "lucide-react";

export default function Favorites() {
  const { t } = useI18n();
  const { favorites } = useFavorites();
  const { favorites: communityFavs } = useCommunityFavorites();
  const [recipes, setRecipes] = useState([]);
  const [communityRecipes, setCommunityRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      appApi.entities.Recipe.list().catch(() => []),
      appApi.entities.CommunityRecipe.list("-created_date", 100).catch(() => []),
    ]).then(([recs, communityRecs]) => {
      setRecipes((recs || []).filter((r) => favorites.includes(r.id)));
      setCommunityRecipes((communityRecs || []).filter((r) => communityFavs.includes(r.id)));
      setLoading(false);
    });
  }, [favorites, communityFavs]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-8 animate-float-up">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-primary/12 items-center justify-center mb-3">
            <Heart className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-heading font-extrabold text-3xl mb-2 text-primary">{t("favorites.title")}</h1>
          <p className="text-muted-foreground">{t("favorites.subtitle")}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : recipes.length === 0 && communityRecipes.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto rounded-full bg-secondary flex items-center justify-center mb-4">
              <Heart className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground">{t("favorites.empty")}</p>
          </div>
        ) : (
          <>
            {/* Saved curated recipes */}
            {recipes.length > 0 && (
              <section className="mb-10">
                <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" /> {t("favorites.title")}
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {recipes.map((r) => (
                    <RecipeCard key={r.id} recipe={r} />
                  ))}
                </div>
              </section>
            )}

            {/* Bookmarked community recipes */}
            {communityRecipes.length > 0 && (
              <section>
                <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-accent" /> {t("favorites.community_bookmarks")}
                </h2>
                <div className="space-y-4 max-w-3xl">
                  {communityRecipes.map((r, i) => (
                    <CommunityRecipeCard key={r.id} recipe={r} index={i} />
                  ))}
                </div>
              </section>
            )}

            {recipes.length > 0 && communityRecipes.length === 0 && (
              <div className="mt-8 rounded-3xl bg-secondary/60 border border-border/60 p-6 text-center">
                <Bookmark className="w-7 h-7 text-accent mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t("favorites.community_hint")}</p>
                <Link
                  to="/community"
                  className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:scale-105 transition-transform"
                >
                  <Users className="w-4 h-4" /> {t("nav.community")}
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}