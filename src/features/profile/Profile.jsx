import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import IngreviaLoader from "@/components/IngreviaLoader";
import { appApi } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { useFavorites } from "@/lib/favorites";
import { useI18n } from "@/lib/i18n";
import {
  BarChart3,
  CalendarDays,
  ChefHat,
  History,
  ScanLine,
  Shield,
  Sparkles,
} from "lucide-react";

export default function Profile() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const { favorites } = useFavorites();
  const [scanHistory, setScanHistory] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      appApi.entities.ScanHistory.list("-created_date", 5).catch(() => []),
      appApi.entities.Recipe.list().catch(() => []),
    ]).then(([history, recipeRows]) => {
      setScanHistory(history || []);
      setRecipes(recipeRows || []);
      setLoading(false);
    });
  }, []);

  const displayName = user?.full_name || user?.email || "Ingrevia user";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "I";
  const savedCount = recipes.filter((recipe) => favorites.includes(recipe.id)).length;
  const roleLabel = user?.role === "admin" ? "Admin" : "User";

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="overflow-hidden rounded-[28px] border border-border/60 bg-card shadow-sm">
          <div className="relative grid gap-6 overflow-hidden p-5 sm:p-7 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(120deg,rgba(99,54,180,0.12),rgba(214,61,140,0.09),rgba(255,134,31,0.14))]" />
            <div className="relative flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] brand-gradient text-2xl font-black text-white shadow-lg shadow-primary/20 ring-4 ring-background">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-background/80 px-3 py-1 text-xs font-bold text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t("profile.account")}
                </div>
                <h1 className="truncate font-heading text-3xl font-extrabold text-foreground sm:text-4xl">{displayName}</h1>
                <p className="mt-1 truncate text-sm font-medium text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <div className="relative grid grid-cols-3 gap-2 sm:gap-3">
              <ProfileStat label={t("profile.recent_scans")} value={scanHistory.length} icon={History} />
              <ProfileStat label={t("profile.saved_recipes")} value={savedCount} icon={ChefHat} />
              <ProfileStat label={t("profile.account_role")} value={roleLabel} icon={Shield} />
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction icon={ScanLine} title={t("profile.scan_title")} description={t("profile.scan_desc")} to="/scan" primary />
          <QuickAction icon={History} title={t("profile.history_title")} description={t("profile.history_desc")} to="/history" />
          <QuickAction icon={ChefHat} title={t("profile.favorites_title")} description={t("profile.favorites_desc")} to="/favorites" />
          <QuickAction icon={CalendarDays} title={t("profile.planner_title")} description={t("profile.planner_desc")} to="/planner" />
          <QuickAction icon={BarChart3} title={t("profile.dashboard_title")} description={t("profile.dashboard_desc")} to="/dashboard" />
          {user?.role === "admin" && (
            <QuickAction icon={Shield} title={t("profile.admin_title")} description={t("profile.admin_desc")} to="/admin" />
          )}
        </section>

        <section className="mt-6 rounded-[28px] border border-border/60 bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-heading text-xl font-bold">{t("profile.latest_activity")}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{t("profile.history_desc")}</p>
            </div>
            <Link to="/history" className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary/70">{t("common.view")}</Link>
          </div>

          {loading ? (
            <IngreviaLoader compact message={t("loading.history")} />
          ) : scanHistory.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-secondary/40 p-7 text-center text-sm text-muted-foreground">
              {t("profile.no_activity")}
            </div>
          ) : (
            <div className="space-y-3">
              {scanHistory.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background p-3 transition-colors hover:border-primary/30">
                  {item.image_url ? (
                    <img src={item.image_url} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary">
                      <ScanLine className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{item.ingredient_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.matched ? t("profile.matched") : t("profile.unmatched")}
                      {item.confidence != null ? ` · ${Math.round(item.confidence)}%` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="mt-8 flex justify-center">
          <button
            onClick={() => logout(false)}
            className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm hover:bg-secondary/60"
          >
            {t("auth.logout")}
          </button>
        </div>
      </div>
    </Layout>
  );
}

function ProfileStat({ icon: Icon, label, value }) {
  return (
    <div className="min-w-0 rounded-2xl border border-border/60 bg-background/85 p-3 shadow-sm backdrop-blur sm:p-4">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <p className="truncate font-heading text-xl font-extrabold text-primary sm:text-2xl">{value}</p>
      <p className="mt-0.5 truncate text-[11px] font-semibold text-muted-foreground sm:text-xs">{label}</p>
    </div>
  );
}

function QuickAction({ icon: Icon, title, description, to, primary = false }) {
  return (
    <Link
      to={to}
      className={`group min-h-[150px] rounded-[24px] border p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
        primary
          ? "border-primary/20 bg-[linear-gradient(135deg,hsl(18,71%,42%),hsl(25,75%,48%))] text-primary-foreground shadow-md shadow-primary/15"
          : "border-border/60 bg-card shadow-sm"
      }`}
    >
      <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${primary ? "bg-white/16 text-white" : "bg-secondary text-primary"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-heading text-lg font-bold leading-tight">{title}</h3>
      <p className={`mt-2 text-sm leading-relaxed ${primary ? "text-primary-foreground/82" : "text-muted-foreground"}`}>{description}</p>
    </Link>
  );
}
