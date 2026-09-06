import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { appApi } from "@/api/supabaseClient";
import { useI18n, localized } from "@/lib/i18n";
import Layout from "@/components/Layout";
import IngreviaLoader from "@/components/IngreviaLoader";
import { History as HistoryIcon, Trash2, ArrowRight, ScanLine, Bookmark, Heart, MessageCircle } from "lucide-react";

export default function ScanHistoryPage() {
  const { t, lang } = useI18n();
  const [activity, setActivity] = useState({ scans: [], saved: [], liked: [], commented: [] });
  const [section, setSection] = useState("scans");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    appApi.activity.listMine()
      .then((data) => setActivity(data))
      .catch(() => setActivity({ scans: [], saved: [], liked: [], commented: [] }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const sections = useMemo(() => [
    { key: "scans", label: t("history.section_scans"), icon: ScanLine, count: activity.scans.length },
    { key: "saved", label: t("history.section_saved"), icon: Bookmark, count: activity.saved.length },
    { key: "liked", label: t("history.section_liked"), icon: Heart, count: activity.liked.length },
    { key: "commented", label: t("history.section_commented"), icon: MessageCircle, count: activity.commented.length },
  ], [activity, t]);

  const clearScans = async () => {
    if (!confirm(t("history.clear") + "?")) return;
    for (const item of activity.scans) {
      await appApi.entities.ScanHistory.delete(item.id).catch(() => {});
    }
    load();
  };

  const activeItems = activity[section] || [];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex w-14 h-14 rounded-2xl brand-gradient items-center justify-center mb-3">
              <HistoryIcon className="w-7 h-7 text-white" />
            </div>
            <h1 className="font-heading font-extrabold text-3xl mb-1">{t("history.title")}</h1>
            <p className="text-muted-foreground">{t("history.subtitle")}</p>
          </div>
          {section === "scans" && activity.scans.length > 0 && (
            <button onClick={clearScans}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors">
              <Trash2 className="w-4 h-4" /> {t("history.clear")}
            </button>
          )}
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {sections.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setSection(item.key)}
                className={`rounded-2xl border p-3 text-left transition-colors ${
                  section === item.key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-secondary/60"
                }`}
              >
                <Icon className="mb-2 h-4 w-4" />
                <p className="text-sm font-bold">{item.label}</p>
                <p className="text-xs opacity-80">{item.count}</p>
              </button>
            );
          })}
        </div>

        {loading ? (
          <IngreviaLoader compact message={t("loading.history")} />
        ) : activeItems.length === 0 ? (
          <EmptyState label={t(`history.empty_${section}`) || t("history.empty")} />
        ) : section === "scans" ? (
          <div className="space-y-3">
            {activity.scans.map((item) => (
              <ScanItem key={item.id} item={item} t={t} />
            ))}
          </div>
        ) : section === "saved" ? (
          <div className="space-y-3">
            {activity.saved.map((item) => (
              <RecipeActivityItem key={item.id} item={item} type={item.recipe_type} t={t} lang={lang} />
            ))}
          </div>
        ) : section === "liked" ? (
          <div className="space-y-3">
            {activity.liked.map((item) => (
              <RecipeActivityItem key={item.id} item={item} type="community_recipe" t={t} lang={lang} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {activity.commented.map((item) => (
              <CommentActivityItem key={item.id} item={item} t={t} lang={lang} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function EmptyState({ label }) {
  return (
    <div className="text-center py-20">
      <div className="w-20 h-20 mx-auto rounded-full bg-secondary flex items-center justify-center mb-4">
        <HistoryIcon className="w-10 h-10 text-muted-foreground/40" />
      </div>
      <p className="text-muted-foreground">{label}</p>
    </div>
  );
}

function ScanItem({ item, t }) {
  return (
    <div className="flex items-center gap-4 glass-card rounded-2xl border border-border/50 p-3 hover:shadow-md transition-all">
      {item.image_url ? (
        <img src={item.image_url} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
      ) : (
        <div className="w-16 h-16 rounded-xl bg-secondary shrink-0 flex items-center justify-center">
          <ScanLine className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{item.ingredient_name}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden max-w-[120px]">
            <div className="h-full brand-gradient rounded-full" style={{ width: `${item.confidence || 0}%` }} />
          </div>
          <span className="text-xs text-muted-foreground">{item.confidence || 0}%</span>
          <span className={`text-xs font-medium ${item.matched ? "text-emerald-600" : "text-amber-600"}`}>
            {item.matched ? t("profile.matched") : t("profile.unmatched")}
          </span>
        </div>
      </div>
      {item.ingredient_id && (
        <Link to={`/ingredient/${item.ingredient_id}`} className="shrink-0 p-2 rounded-full hover:bg-secondary transition-colors">
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </Link>
      )}
    </div>
  );
}

function RecipeActivityItem({ item, type, t, lang }) {
  const recipe = item.recipe || item.recipes || item.community_recipes;
  if (!recipe) return null;
  const to = type === "recipe" ? `/recipe/${recipe.id}` : `/community/${recipe.id}`;
  const title = localized(recipe, "title", lang) || recipe.title;

  return (
    <Link to={to} className="flex items-center gap-4 glass-card rounded-2xl border border-border/50 p-3 hover:shadow-md transition-all">
      {recipe.image_url ? (
        <img src={recipe.image_url} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
      ) : (
        <div className="w-14 h-14 rounded-xl bg-secondary shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{new Date(item.created_date).toLocaleString()}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground" />
    </Link>
  );
}

function CommentActivityItem({ item, t, lang }) {
  const recipe = item.community_recipes;
  if (!recipe) return null;
  const title = localized(recipe, "title", lang) || recipe.title;

  return (
    <Link to={`/community/${recipe.id}`} className="block glass-card rounded-2xl border border-border/50 p-4 hover:shadow-md transition-all">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="truncate text-sm font-semibold">{title}</p>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </div>
      <p className="line-clamp-2 text-sm text-muted-foreground">{item.body}</p>
      <p className="mt-2 text-xs text-muted-foreground">{t("history.commented_on")} {new Date(item.created_date).toLocaleString()}</p>
    </Link>
  );
}
