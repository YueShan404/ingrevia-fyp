import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { appApi } from "@/api/supabaseClient";
import { useI18n } from "@/lib/i18n";
import Layout from "@/components/Layout";
import CommunityRecipeCard from "@/components/CommunityRecipeCard";
import IngreviaLoader from "@/components/IngreviaLoader";
import { Users, Search, PenSquare, Heart } from "lucide-react";

export default function Community() {
  const { t } = useI18n();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cuisine, setCuisine] = useState("all");

  useEffect(() => {
    appApi.entities.CommunityRecipe
      .list("-created_date", 200)
      .then((data) => {
        setRecipes(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const cuisines = ["all", "malay", "chinese", "indian", "other"];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return recipes.filter((r) => {
      const matchCuisine = cuisine === "all" || r.cuisine === cuisine;
      const matchSearch =
        !q ||
        r.title?.toLowerCase().includes(q) ||
        r.author?.toLowerCase().includes(q) ||
        r.cuisine?.toLowerCase().includes(q) ||
        (r.ingredients || []).some((i) => i.toLowerCase().includes(q));
      return matchCuisine && matchSearch;
    });
  }, [recipes, search, cuisine]);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <header className="text-center mb-8 animate-float-up">
          <div className="inline-flex w-14 h-14 rounded-2xl brand-gradient items-center justify-center mb-3 shadow-lg shadow-primary/30">
            <Users className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-primary mb-2">{t("community.title")}</h1>
          <p className="text-muted-foreground">{t("community.subtitle")}</p>
        </header>

        {/* Search */}
        <div className="relative max-w-xl mx-auto mb-4 animate-float-up" style={{ animationDelay: "0.05s" }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("community.search_placeholder")}
            className="w-full px-4 py-3 pl-11 rounded-full border border-border bg-card focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        </div>

        {/* Cuisine filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8 animate-float-up" style={{ animationDelay: "0.1s" }}>
          {cuisines.map((c) => (
            <button
              key={c}
              onClick={() => setCuisine(c)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                cuisine === c
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "bg-secondary text-foreground/70 hover:bg-secondary/70"
              }`}
            >
              {c === "all" ? (
                t("common.all")
              ) : c === "other" ? (
                t("common.other") || t("kitchen.cuisines.other") || c
              ) : (
                t(`kitchen.cuisines.${c}`) || c
              )}
            </button>
          ))}
        </div>

        {/* Share CTA */}
        <div className="flex justify-center mb-8 animate-float-up" style={{ animationDelay: "0.15s" }}>
          <Link
            to="/submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent/10 text-accent border border-accent/25 hover:bg-accent/20 transition-colors text-sm font-semibold"
          >
            <PenSquare className="w-4 h-4" /> {t("nav.submit")}
          </Link>
        </div>

        {/* Menu list */}
        {loading ? (
          <IngreviaLoader compact message={t("loading.community")} />
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">{t("community.empty")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((r, i) => (
              <CommunityRecipeCard key={r.id} recipe={r} index={i} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
