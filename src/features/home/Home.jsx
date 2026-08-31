import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { appApi } from "@/api/supabaseClient";
import { useI18n } from "@/lib/i18n";
import Layout from "@/components/Layout";
import SeasonalHighlight from "@/components/SeasonalHighlight";
import RecipeCard from "@/components/RecipeCard";
import { ScanLine, BookOpen, ChefHat, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";

export default function Home() {
  const { t } = useI18n();
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      appApi.entities.Ingredient.list().catch(() => []),
      appApi.entities.Recipe.list().catch(() => []),
    ]).then(([ings, recs]) => {
      setIngredients(ings || []);
      setRecipes(recs || []);
      setLoading(false);
    });
  }, []);

  const featuredRecipes = recipes.slice(0, 3);

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 sm:px-8 lg:px-10 pt-9 sm:pt-12 pb-12 sm:pb-14">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex max-w-full items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-primary/12 border border-primary/20 mb-5 sm:mb-6 animate-float-up">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="truncate text-xs sm:text-sm font-medium text-primary">Ingrevia 食知途</span>
          </div>
          <h1 className="mx-auto max-w-[18rem] font-heading font-extrabold text-[2.35rem] sm:max-w-4xl sm:text-5xl lg:text-6xl leading-[1.08] sm:leading-[1.04] mb-5 animate-float-up" style={{ animationDelay: "0.1s" }}>
            <span className="text-gradient">{t("home.hero_title")}</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-7 sm:mb-8 animate-float-up" style={{ animationDelay: "0.2s" }}>
            {t("home.hero_subtitle")}
          </p>
          <div className="grid w-full max-w-sm grid-cols-1 items-center gap-3 mx-auto sm:flex sm:max-w-none sm:flex-wrap sm:justify-center animate-float-up" style={{ animationDelay: "0.3s" }}>
            <Link to="/scan" className="inline-flex min-h-12 items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-full brand-gradient text-primary-foreground font-semibold shadow-lg shadow-primary/35 hover:scale-105 transition-transform">
              <ScanLine className="w-5 h-5" /> {t("home.hero_cta_scan")}
            </Link>
            <Link to="/encyclopedia" className="inline-flex min-h-12 items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-full bg-secondary text-foreground font-semibold hover:bg-secondary/70 transition-colors">
              <BookOpen className="w-5 h-5" /> {t("home.hero_cta_browse")}
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-3 sm:gap-4 max-w-xl mx-auto mt-8 sm:mt-10 animate-float-up" style={{ animationDelay: "0.4s" }}>
            {[
              { val: "30", label: t("home.stat_ingredients") },
              { val: "60+", label: t("home.stat_recipes") },
              { val: "4", label: t("home.stat_languages") },
            ].map((s, i) => (
              <div key={i} className="glass-card rounded-2xl p-4 border border-border/60 min-h-20 sm:min-h-24 flex flex-col items-center justify-center">
                <p className="font-heading font-extrabold text-2xl text-primary">{s.val}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Seasonal Highlight */}
      <section className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
        {loading ? <div className="h-48 rounded-3xl shimmer" /> : <SeasonalHighlight ingredients={ingredients} recipes={recipes} />}
      </section>

      {/* Featured Recipes */}
      {featuredRecipes.length > 0 && (
        <section className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading font-bold text-xl flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-accent" /> {t("nav.kitchen")}
            </h2>
            <Link to="/kitchen" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
              {t("common.view")} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredRecipes.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        </section>
      )}

      {/* Features */}
      <section className="px-4 sm:px-6 py-10 sm:py-12 max-w-7xl mx-auto">
        <h2 className="font-heading font-bold text-2xl text-center mb-8 text-primary">{t("home.features_title")}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: ScanLine, t: t("home.feature_scan_t"), d: t("home.feature_scan_d"), to: "/scan" },
            { icon: BookOpen, t: t("home.feature_enc_t"), d: t("home.feature_enc_d"), to: "/encyclopedia" },
            { icon: ChefHat, t: t("home.feature_kitchen_t"), d: t("home.feature_kitchen_d"), to: "/kitchen" },
            { icon: ShieldCheck, t: t("home.feature_advisory_t"), d: t("home.feature_advisory_d"), to: "/encyclopedia" },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <Link key={i} to={f.to} className="group glass-card rounded-3xl p-6 border border-border/60 hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="w-12 h-12 rounded-2xl brand-gradient flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-heading font-bold text-base mb-2">{f.t}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.d}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* SDGs */}
      <section className="px-4 sm:px-6 py-10 sm:py-12 max-w-7xl mx-auto">
        <div className="forest-gradient rounded-2xl sm:rounded-3xl p-5 sm:p-12 text-white">
          <h2 className="font-heading font-bold text-2xl mb-8 text-center">{t("home.sgd_title")}</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { num: "3", t: t("home.sgd_3"), d: t("home.sgd_3_d") },
              { num: "4", t: t("home.sgd_4"), d: t("home.sgd_4_d") },
              { num: "12", t: t("home.sgd_12"), d: t("home.sgd_12_d") },
            ].map((s) => (
              <div key={s.num} className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm border border-white/15">
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center font-heading font-extrabold text-xl text-primary-foreground mb-3">
                  {s.num}
                </div>
                <h3 className="font-heading font-bold text-base mb-1.5">{s.t}</h3>
                <p className="text-sm text-white/70 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
