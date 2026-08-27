import React, { useEffect, useState } from "react";
import { appApi } from "@/api/supabaseClient";
import { useI18n, localized } from "@/lib/i18n";
import { useFavorites } from "@/lib/favorites";
import Layout from "@/components/Layout";
import { CalendarDays, Trash2, ChefHat, Loader2, GripVertical } from "lucide-react";

const PLAN_KEY = "ingrevia_meal_plan";

export default function MealPlanner() {
  const { t, lang } = useI18n();
  const { favorites } = useFavorites();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PLAN_KEY)) || {}; } catch { return {}; }
  });
  const [dragRecipe, setDragRecipe] = useState(null);

  useEffect(() => {
    appApi.entities.Recipe.list().then((data) => {
      setRecipes(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { localStorage.setItem(PLAN_KEY, JSON.stringify(plan)); }, [plan]);

  const favRecipes = recipes.filter((r) => favorites.includes(r.id));
  const days = t("planner.days");

  const getRecipe = (id) => recipes.find((r) => r.id === id);

  const handleDrop = (day) => {
    if (dragRecipe) {
      setPlan({ ...plan, [day]: dragRecipe });
      setDragRecipe(null);
    }
  };

  const clearDay = (day) => {
    const newPlan = { ...plan };
    delete newPlan[day];
    setPlan(newPlan);
  };

  const clearAll = () => {
    if (confirm(t("planner.clear_all") + "?")) setPlan({});
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl brand-gradient items-center justify-center mb-3">
            <CalendarDays className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-heading font-extrabold text-3xl mb-2">{t("planner.title")}</h1>
          <p className="text-muted-foreground">{t("planner.subtitle")}</p>
          <p className="text-xs text-[hsl(126,24%,28%)] mt-2">✓ {t("planner.saved")}</p>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          {/* Favorites tray */}
          <div className="glass-card rounded-3xl border border-border/50 p-4 h-fit lg:sticky lg:top-24">
            <h2 className="font-heading font-bold text-sm mb-3 flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-[hsl(126,24%,44%)]" /> {t("planner.tray")}
            </h2>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[hsl(126,24%,44%)]" /></div>
            ) : favRecipes.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4">{t("planner.tray_empty")}</p>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {favRecipes.map((r) => (
                  <div key={r.id} draggable
                    onDragStart={() => setDragRecipe(r.id)}
                    onDragEnd={() => setDragRecipe(null)}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary hover:bg-secondary/70 cursor-grab active:cursor-grabbing transition-colors">
                    <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                    {r.image_url && <img src={r.image_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />}
                    <span className="text-xs font-medium truncate flex-1">{localized(r, "title", lang)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 7-day calendar */}
          <div className="space-y-3">
            <div className="flex justify-end">
              <button onClick={clearAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> {t("planner.clear_all")}
              </button>
            </div>
            {days.map((day, i) => {
              const recipeId = plan[i];
              const recipe = recipeId ? getRecipe(recipeId) : null;
              return (
                <div key={i}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(i)}
                  className={`glass-card rounded-2xl border-2 border-dashed p-4 transition-colors min-h-[80px] ${
                    dragRecipe ? "border-[hsl(18,71%,42%)] bg-[hsl(18,71%,42%,0.05)]" : "border-border/50"
                  }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-heading font-bold text-sm">{day}</h3>
                    {recipe && (
                      <button onClick={() => clearDay(i)} className="p-1 rounded-full hover:bg-secondary">
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                  {recipe ? (
                    <div className="flex items-center gap-3">
                      {recipe.image_url && <img src={recipe.image_url} alt="" className="w-12 h-12 rounded-xl object-cover" />}
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{localized(recipe, "title", lang)}</p>
                        <p className="text-xs text-muted-foreground">{t(`kitchen.cuisines.${recipe.cuisine}`)}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground/60 py-2">—</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}