import React, { useEffect, useState, useMemo } from "react";
import { appApi } from "@/api/supabaseClient";
import { useI18n } from "@/lib/i18n";
import Layout from "@/components/Layout";
import IngredientCard from "@/components/IngredientCard";
import { BookOpen, Search, Loader2 } from "lucide-react";

export default function Encyclopedia() {
  const { t } = useI18n();
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    setLoadError("");
    appApi.entities.Ingredient.list().then((data) => {
      setIngredients(data || []);
      setLoading(false);
    }).catch((error) => {
      console.error("Failed to load ingredients:", error);
      setLoadError(error?.message || "Unable to load ingredient data.");
      setLoading(false);
    });
  }, []);

  const categories = ["all", "herb", "vegetable", "fruit", "spice", "seafood", "grain", "legume", "other"];

  const filtered = useMemo(() => {
    return ingredients.filter((ing) => {
      const matchCat = category === "all" || ing.category === category;
      const q = search.toLowerCase();
      const matchSearch = !q ||
        ing.name?.toLowerCase().includes(q) ||
        ing.name_bm?.toLowerCase().includes(q) ||
        ing.name_zh?.includes(search) ||
        ing.name_ta?.includes(search);
      return matchCat && matchSearch;
    });
  }, [ingredients, search, category]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl brand-gradient items-center justify-center mb-3">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-heading font-extrabold text-3xl mb-2">{t("encyclopedia.title")}</h1>
          <p className="text-muted-foreground">{t("encyclopedia.subtitle")}</p>
        </div>

        {/* Search */}
        <div className="relative max-w-xl mx-auto mb-6">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={t("encyclopedia.search_placeholder")}
            className="w-full px-4 py-3 pl-11 rounded-full border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[hsl(18,71%,42%)]" />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                category === cat
                  ? "bg-[hsl(18,71%,42%)] text-white shadow-md"
                  : "bg-secondary text-foreground/70 hover:bg-secondary/70"
              }`}>
              {cat === "all" ? t("encyclopedia.filter_all") : t(`encyclopedia.categories.${cat}`)}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[hsl(126,24%,44%)]" /></div>
        ) : loadError ? (
          <div className="max-w-xl mx-auto text-center rounded-2xl border border-destructive/20 bg-destructive/10 px-5 py-4 text-sm text-destructive">
            {loadError}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">{t("common.no_results")}</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((ing) => <IngredientCard key={ing.id} ingredient={ing} />)}
          </div>
        )}
      </div>
    </Layout>
  );
}
