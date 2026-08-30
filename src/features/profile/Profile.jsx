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
  UserCircle,
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
  const savedCount = recipes.filter((recipe) => favorites.includes(recipe.id)).length;
  const roleLabel = user?.role === "admin" ? "Admin" : "User";
  const statusLabel = user?.status === "active" ? "Active" : user?.status || "Active";

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <section className="glass-card overflow-hidden rounded-3xl border border-border/50">
          <div className="forest-gradient p-6 text-white sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/14 ring-1 ring-white/20">
                  <UserCircle className="h-9 w-9" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold uppercase tracking-wide text-white/65">{t("profile.account")}</p>
                  <h1 className="truncate font-heading text-2xl font-extrabold sm:text-3xl">{displayName}</h1>
                  <p className="mt-1 truncate text-sm text-white/70">{user?.email}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white/14 px-3 py-1.5 text-xs font-bold ring-1 ring-white/20">{roleLabel}</span>
                <span className="rounded-full bg-white/14 px-3 py-1.5 text-xs font-bold ring-1 ring-white/20">{statusLabel}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
            <ProfileStat label={t("profile.recent_scans")} value={scanHistory.length} icon={History} />
            <ProfileStat label={t("profile.saved_recipes")} value={savedCount} icon={ChefHat} />
            <ProfileStat label={t("profile.account_role")} value={roleLabel} icon={Shield} />
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <QuickAction icon={ScanLine} title={t("profile.scan_title")} description={t("profile.scan_desc")} to="/scan" primary />
          <QuickAction icon={History} title={t("profile.history_title")} description={t("profile.history_desc")} to="/history" />
          <QuickAction icon={ChefHat} title={t("profile.favorites_title")} description={t("profile.favorites_desc")} to="/favorites" />
          <QuickAction icon={CalendarDays} title={t("profile.planner_title")} description={t("profile.planner_desc")} to="/planner" />
          <QuickAction icon={BarChart3} title={t("profile.dashboard_title")} description={t("profile.dashboard_desc")} to="/dashboard" />
          {user?.role === "admin" && (
            <QuickAction icon={Shield} title={t("profile.admin_title")} description={t("profile.admin_desc")} to="/admin" />
          )}
        </section>

        <section className="mt-8 glass-card rounded-3xl border border-border/50 p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="font-heading text-lg font-bold">{t("profile.latest_activity")}</h2>
            <Link to="/history" className="text-sm font-semibold text-primary hover:underline">{t("common.view")}</Link>
          </div>

          {loading ? (
            <IngreviaLoader compact message={t("loading.history")} />
          ) : scanHistory.length === 0 ? (
            <div className="rounded-2xl bg-secondary/60 p-5 text-center text-sm text-muted-foreground">
              {t("profile.no_activity")}
            </div>
          ) : (
            <div className="space-y-3">
              {scanHistory.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-border/50 bg-background/70 p-3">
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
            className="rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary/70"
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
    <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <p className="font-heading text-2xl font-extrabold text-primary">{value}</p>
      <p className="mt-1 text-xs font-semibold text-muted-foreground">{label}</p>
    </div>
  );
}

function QuickAction({ icon: Icon, title, description, to, primary = false }) {
  return (
    <Link
      to={to}
      className={`group rounded-3xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
        primary
          ? "border-primary/30 bg-primary text-primary-foreground shadow-md shadow-primary/15"
          : "glass-card border-border/50"
      }`}
    >
      <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${primary ? "bg-white/16" : "bg-secondary text-primary"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-heading text-lg font-bold">{title}</h3>
      <p className={`mt-1 text-sm leading-relaxed ${primary ? "text-primary-foreground/78" : "text-muted-foreground"}`}>{description}</p>
    </Link>
  );
}
