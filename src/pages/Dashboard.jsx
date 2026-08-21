import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { appApi } from "@/api/supabaseClient";
import { useI18n, localized } from "@/lib/i18n";
import { useFavorites, useZeroWaste } from "@/lib/favorites";
import Layout from "@/components/Layout";
import { BarChart3, Recycle, ChefHat, TrendingUp, Check, Loader2 } from "lucide-react";

export default function Dashboard() {
  const { t, lang } = useI18n();
  const { favorites } = useFavorites();
  const { appliedTips, isApplied, toggleApplied } = useZeroWaste();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    appApi.entities.Recipe.list().then((data) => {
      setRecipes(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const savedRecipes = recipes.filter((r) => favorites.includes(r.id));
  const appliedCount = savedRecipes.filter((r) => appliedTips.includes(r.id)).length;
  const totalWithTips = savedRecipes.filter((r) => {
    const tip = localized(r, "zero_waste_tip", lang);
    return tip && tip.trim();
  }).length;
  const progress = totalWithTips > 0 ? Math.round((appliedCount / totalWithTips) * 100) : 0;
  const ecoScore = Math.min(100, appliedCount * 15);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl brand-gradient items-center justify-center mb-3">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-heading font-extrabold text-3xl mb-2">{t("dashboard.title")}</h1>
          <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard icon={Recycle} value={appliedCount} label={t("dashboard.tips_applied")} color="emerald" />
          <StatCard icon={ChefHat} value={savedRecipes.length} label={t("dashboard.recipes_saved")} color="leaf" />
          <StatCard icon={TrendingUp} value={ecoScore} label={t("dashboard.eco_score")} color="forest" />
        </div>

        {/* Progress bar */}
        {totalWithTips > 0 && (
          <div className="glass-card rounded-3xl border border-border/50 p-6 mb-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">{progress}% {t("dashboard.progress")}</p>
              <p className="text-sm text-muted-foreground">{appliedCount}/{totalWithTips}</p>
            </div>
            <div className="h-3 rounded-full bg-secondary overflow-hidden">
              <div className="h-full brand-gradient rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Encouragement */}
        <div className="forest-gradient rounded-3xl p-6 text-center text-white mb-8">
          <p className="text-lg font-heading font-bold mb-1">🌱 {t("dashboard.encouragement")}</p>
        </div>

        {/* Saved recipes list */}
        <h2 className="font-heading font-bold text-lg mb-4">{t("dashboard.your_recipes")}</h2>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[hsl(126,24%,44%)]" /></div>
        ) : savedRecipes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-3">{t("dashboard.no_saved")}</p>
            <Link to="/kitchen" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full brand-gradient text-white font-medium text-sm">
              <ChefHat className="w-4 h-4" /> {t("nav.kitchen")}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {savedRecipes.map((r) => {
              const tip = localized(r, "zero_waste_tip", lang);
              const applied = isApplied(r.id);
              return (
                <div key={r.id} className="glass-card rounded-2xl border border-border/50 p-4 flex items-center gap-4">
                  {r.image_url && <img src={r.image_url} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <Link to={`/recipe/${r.id}`} className="font-semibold text-sm hover:text-[hsl(126,24%,28%)] block truncate">
                      {localized(r, "title", lang)}
                    </Link>
                    {tip ? (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">🌱 {tip}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground/50 mt-0.5">—</p>
                    )}
                  </div>
                  {tip && (
                    <button onClick={() => toggleApplied(r.id)}
                      className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all ${
                        applied ? "bg-[hsl(126,24%,44%)] text-white" : "bg-secondary text-foreground hover:bg-secondary/70"
                      }`}>
                      {applied ? <><Check className="w-3.5 h-3.5" /> ✓</> : t("dashboard.mark_applied")}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

function StatCard({ icon: Icon, value, label, color }) {
  const colors = {
    emerald: "bg-emerald-100 dark:bg-emerald-900 text-emerald-600",
    leaf: "bg-[hsl(18,71%,42%,0.15)] text-[hsl(126,24%,28%)]",
    forest: "bg-[hsl(17,37%,19%,0.1)] text-[hsl(17,37%,35%)]",
  };
  return (
    <div className="glass-card rounded-2xl border border-border/50 p-4 text-center">
      <div className={`w-10 h-10 rounded-xl mx-auto flex items-center justify-center mb-2 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="font-heading font-extrabold text-2xl">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}