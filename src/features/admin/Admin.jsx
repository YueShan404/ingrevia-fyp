import React, { useEffect, useState, useRef } from "react";
import { appApi } from "@/api/supabaseClient";
import { useI18n, localized } from "@/lib/i18n";
import { useAuth } from "@/lib/AuthContext";
import Layout from "@/components/Layout";
import IngreviaLoader from "@/components/IngreviaLoader";
import { useToast } from "@/components/ui/use-toast";
import { Shield, Trash2, Check, X, BookOpen, ChefHat, Users, Upload, Languages } from "lucide-react";

export default function Admin() {
  const { t, lang } = useI18n();
  const [tab, setTab] = useState("ingredients");
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [community, setCommunity] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const bulkFileRef = useRef(null);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [translatingRecipeId, setTranslatingRecipeId] = useState(null);
  const [bulkTranslating, setBulkTranslating] = useState(false);
  const [bulkTranslateProgress, setBulkTranslateProgress] = useState({ done: 0, total: 0 });

  const loadAll = () => {
    Promise.all([
      appApi.entities.Ingredient.list().catch(() => []),
      appApi.entities.Recipe.list().catch(() => []),
      appApi.entities.CommunityRecipe.list("-created_date").catch(() => []),
    ]).then(([ings, recs, comm]) => {
      setIngredients(ings || []);
      setRecipes(recs || []);
      setCommunity(comm || []);
      setLoading(false);
    });
  };

  useEffect(() => { loadAll(); }, []);

  const handleBulkUpload = async (file) => {
    if (!file) return;
    setBulkImporting(true);
    try {
      const { file_url } = await appApi.integrations.Core.UploadFile({ file });
      const resp = await appApi.functions.invoke("bulkImportIngredients", { file_url });
      const data = resp?.data || {};
      toast({
        title: t("admin.bulk_import"),
        description: (t("admin.bulk_import_success") || "").replace("{count}", String(data.imported ?? 0)),
      });
      loadAll();
    } catch (err) {
      const errDetails = err?.response?.data?.error || err?.message || "Unknown error";
      toast({
        title: t("admin.bulk_import_error"),
        description: errDetails,
        variant: "destructive",
      });
    }
    setBulkImporting(false);
    if (bulkFileRef.current) bulkFileRef.current.value = "";
  };

  const deleteIngredient = async (id) => {
    if (!confirm(t("admin.confirm_delete"))) return;
    await appApi.entities.Ingredient.delete(id);
    loadAll();
  };
  const deleteRecipe = async (id) => {
    if (!confirm(t("admin.confirm_delete"))) return;
    await appApi.entities.Recipe.delete(id);
    loadAll();
  };

  const recipeHasMissingTranslations = (recipe) => {
    const translatedTextFields = [
      "title_bm", "title_zh", "title_ta",
      "description_bm", "description_zh", "description_ta",
      "zero_waste_tip_bm", "zero_waste_tip_zh", "zero_waste_tip_ta",
    ];
    const translatedListFields = [
      "ingredients_bm", "ingredients_zh", "ingredients_ta",
      "steps_bm", "steps_zh", "steps_ta",
    ];

    return translatedTextFields.some((field) => recipe[field] == null || String(recipe[field]).trim() === "") ||
      translatedListFields.some((field) => !Array.isArray(recipe[field]) || recipe[field].length === 0);
  };

  const translateRecipeRecord = async (recipe) => {
    const resp = await appApi.functions.invoke("translateRecipeContent", {
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients || [],
      steps: recipe.steps || [],
      zero_waste_tip: recipe.zero_waste_tip,
    });
    const translated = resp?.data || {};

    await appApi.entities.Recipe.update(recipe.id, {
      title_bm: translated.bm?.title || recipe.title_bm,
      title_zh: translated.zh?.title || recipe.title_zh,
      title_ta: translated.ta?.title || recipe.title_ta,
      description_bm: translated.bm?.description || recipe.description_bm,
      description_zh: translated.zh?.description || recipe.description_zh,
      description_ta: translated.ta?.description || recipe.description_ta,
      ingredients_bm: translated.bm?.ingredients || recipe.ingredients_bm || [],
      ingredients_zh: translated.zh?.ingredients || recipe.ingredients_zh || [],
      ingredients_ta: translated.ta?.ingredients || recipe.ingredients_ta || [],
      steps_bm: translated.bm?.steps || recipe.steps_bm || [],
      steps_zh: translated.zh?.steps || recipe.steps_zh || [],
      steps_ta: translated.ta?.steps || recipe.steps_ta || [],
      zero_waste_tip_bm: translated.bm?.zero_waste_tip || recipe.zero_waste_tip_bm,
      zero_waste_tip_zh: translated.zh?.zero_waste_tip || recipe.zero_waste_tip_zh,
      zero_waste_tip_ta: translated.ta?.zero_waste_tip || recipe.zero_waste_tip_ta,
    });
  };

  const translateRecipe = async (recipe) => {
    setTranslatingRecipeId(recipe.id);
    try {
      await translateRecipeRecord(recipe);
      toast({ title: t("admin.translate_recipe"), description: t("admin.translate_recipe_success") });
      loadAll();
    } catch (err) {
      toast({
        title: t("admin.translate_recipe_error"),
        description: err?.message || "Translation failed",
        variant: "destructive",
      });
    } finally {
      setTranslatingRecipeId(null);
    }
  };

  const translateMissingRecipes = async () => {
    const targets = recipes.filter(recipeHasMissingTranslations);
    if (targets.length === 0) {
      toast({ title: t("admin.translate_all_recipes"), description: t("admin.translate_all_none") });
      return;
    }

    setBulkTranslating(true);
    setBulkTranslateProgress({ done: 0, total: targets.length });
    let translatedCount = 0;

    try {
      for (const recipe of targets) {
        setTranslatingRecipeId(recipe.id);
        await translateRecipeRecord(recipe);
        translatedCount += 1;
        setBulkTranslateProgress({ done: translatedCount, total: targets.length });
      }
      toast({
        title: t("admin.translate_all_recipes"),
        description: (t("admin.translate_all_success") || "").replace("{count}", String(translatedCount)),
      });
      loadAll();
    } catch (err) {
      toast({
        title: t("admin.translate_recipe_error"),
        description: err?.message || "Translation failed",
        variant: "destructive",
      });
      loadAll();
    } finally {
      setBulkTranslating(false);
      setTranslatingRecipeId(null);
      setBulkTranslateProgress({ done: 0, total: 0 });
    }
  };
  const approveCommunity = async (id) => {
    await appApi.entities.CommunityRecipe.update(id, { status: "approved" });
    loadAll();
  };
  const rejectCommunity = async (id) => {
    await appApi.entities.CommunityRecipe.update(id, { status: "rejected" });
    loadAll();
  };
  const deleteCommunity = async (id) => {
    if (!confirm(t("admin.confirm_delete"))) return;
    await appApi.entities.CommunityRecipe.delete(id);
    loadAll();
  };

  const tabs = [
    { key: "ingredients", label: t("admin.tab_ingredients"), icon: BookOpen, count: ingredients.length },
    { key: "recipes", label: t("admin.tab_recipes"), icon: ChefHat, count: recipes.length },
    { key: "community", label: t("admin.tab_community"), icon: Users, count: community.filter((c) => c.status === "pending").length },
  ];

  if (user?.role !== "admin") {
    return (
      <Layout>
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-16 text-center">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-destructive/10 items-center justify-center mb-4">
            <Shield className="w-7 h-7 text-destructive" />
          </div>
          <h1 className="font-heading font-extrabold text-2xl mb-2">{t("admin.access_denied")}</h1>
          <p className="text-muted-foreground">{t("admin.access_denied_body")}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl forest-gradient items-center justify-center mb-3">
            <Shield className="w-7 h-7 text-[hsl(18,71%,42%)]" />
          </div>
          <h1 className="font-heading font-extrabold text-3xl mb-2">{t("admin.title")}</h1>
          <p className="text-muted-foreground">{t("admin.subtitle")}</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-6">
          {tabs.map((tb) => {
            const Icon = tb.icon;
            return (
              <button key={tb.key} onClick={() => setTab(tb.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                  tab === tb.key ? "bg-[hsl(18,71%,42%)] text-white shadow-md" : "bg-secondary text-foreground/70 hover:bg-secondary/70"
                }`}>
                <Icon className="w-4 h-4" /> {tb.label}
                {tb.count > 0 && <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${tab === tb.key ? "bg-white/25" : "bg-muted"}`}>{tb.count}</span>}
              </button>
            );
          })}
        </div>

        {loading ? (
          <IngreviaLoader compact message={t("loading.admin")} />
        ) : tab === "ingredients" ? (
          <>
            <div className="flex flex-col items-end gap-1.5 mb-4">
              <input ref={bulkFileRef} type="file" accept=".csv,.xlsx,.xls,.json" className="hidden"
                onChange={(e) => handleBulkUpload(e.target.files?.[0])} />
              <button
                onClick={() => bulkFileRef.current?.click()}
                disabled={bulkImporting}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[hsl(18,71%,42%)] text-white text-sm font-semibold shadow-md hover:scale-105 transition-transform disabled:opacity-60"
              >
                <Upload className="w-4 h-4" /> {bulkImporting ? t("admin.bulk_import_progress") : t("admin.bulk_import")}
              </button>
              <p className="text-xs text-muted-foreground max-w-md text-right">{t("admin.bulk_import_hint")}</p>
            </div>
            <AdminList items={ingredients} onDelete={deleteIngredient}
              render={(item) => ({
                title: localized(item, "name", lang),
                subtitle: t(`encyclopedia.categories.${item.category}`),
                image: item.image_url,
              })} t={t} />
          </>
        ) : tab === "recipes" ? (
          <>
            <div className="mb-4 flex flex-col items-end gap-1.5">
              <button
                onClick={translateMissingRecipes}
                disabled={bulkTranslating || recipes.length === 0}
                className="inline-flex items-center gap-2 rounded-full bg-[hsl(18,71%,42%)] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-transform hover:scale-105 disabled:opacity-60"
              >
                <Languages className="w-4 h-4" />
                {bulkTranslating
                  ? (t("admin.translate_all_progress") || "").replace("{done}", String(bulkTranslateProgress.done)).replace("{total}", String(bulkTranslateProgress.total))
                  : t("admin.translate_all_recipes")}
              </button>
              <p className="max-w-md text-right text-xs text-muted-foreground">{t("admin.translate_all_hint")}</p>
            </div>
            <AdminList items={recipes} onDelete={deleteRecipe}
              render={(item) => ({
                title: localized(item, "title", lang),
                subtitle: t(`kitchen.cuisines.${item.cuisine}`),
                image: item.image_url,
                action: (
                  <button
                    onClick={() => translateRecipe(item)}
                    disabled={bulkTranslating || translatingRecipeId === item.id}
                    className="shrink-0 p-2 rounded-full bg-secondary text-primary hover:scale-110 transition-transform disabled:opacity-60"
                    aria-label={t("admin.translate_recipe")}
                    title={t("admin.translate_recipe")}
                  >
                    <Languages className="w-4 h-4" />
                  </button>
                ),
              })} t={t} />
          </>
        ) : (
          <div className="space-y-3">
            {community.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">{t("common.no_results")}</p>
            ) : community.map((item) => (
              <div key={item.id} className="glass-card rounded-2xl border border-border/50 p-4 flex items-center gap-4">
                {item.image_url && <img src={item.image_url} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{t("community.by")} {item.author} · {t(`kitchen.cuisines.${item.cuisine}`) || item.cuisine}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    item.status === "pending" ? "bg-amber-100 text-amber-700" :
                    item.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                    "bg-red-100 text-red-700"
                  }`}>{t(`community.status_${item.status}`)}</span>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => approveCommunity(item.id)} className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 hover:scale-110 transition-transform">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => rejectCommunity(item.id)} className="p-2 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-600 hover:scale-110 transition-transform">
                    <X className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteCommunity(item.id)} className="p-2 rounded-full bg-red-100 dark:bg-red-900 text-red-600 hover:scale-110 transition-transform">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function AdminList({ items, onDelete, render, t }) {
  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">{t("common.no_results")}</p>
      ) : items.map((item) => {
        const r = render(item);
        return (
          <div key={item.id} className="glass-card rounded-2xl border border-border/50 p-4 flex items-center gap-4">
            {r.image && <img src={r.image} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{r.title}</p>
              <p className="text-xs text-muted-foreground">{r.subtitle}</p>
            </div>
            <button onClick={() => onDelete(item.id)} className="shrink-0 p-2 rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 hover:scale-110 transition-transform">
              <Trash2 className="w-4 h-4" />
            </button>
            {r.action}
          </div>
        );
      })}
    </div>
  );
}
