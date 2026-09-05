import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import IngreviaLoader from "@/components/IngreviaLoader";
import { appApi } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { useFavorites } from "@/lib/favorites";
import { useI18n } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BarChart3,
  CalendarDays,
  ChefHat,
  Copy,
  Edit3,
  History,
  Loader2,
  ScanLine,
  Shield,
  Sparkles,
  Upload,
} from "lucide-react";

export default function Profile() {
  const { user, logout, checkUserAuth } = useAuth();
  const { t } = useI18n();
  const { favorites } = useFavorites();
  const [scanHistory, setScanHistory] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [name, setName] = useState(user?.full_name || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const cooldown = appApi.profiles.getCooldown(user);

  useEffect(() => {
    Promise.all([
      appApi.scanHistory.listRecent(30, 5).catch(() => []),
      appApi.entities.Recipe.list().catch(() => []),
      appApi.social.listNotifications(5).catch(() => []),
    ]).then(([history, recipeRows, notificationRows]) => {
      setScanHistory(history || []);
      setRecipes(recipeRows || []);
      setNotifications(notificationRows || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setName(user?.full_name || "");
    setAvatarUrl(user?.avatar_url || "");
  }, [user?.full_name, user?.avatar_url]);

  useEffect(() => {
    if (!cooldown.locked) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, [cooldown.locked]);

  const displayName = user?.full_name || user?.email || "Ingrevia user";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "I";
  const savedCount = recipes.filter((recipe) => favorites.includes(recipe.id)).length;
  const roleLabel = user?.role === "admin" ? "Admin" : "User";
  const remaining = formatCooldownRemaining(cooldown.nextChangeDate, now);
  const profileUrl = user?.public_user_id ? `${window.location.origin}/u/${user.public_user_id}` : "";

  const handleAvatar = async (file) => {
    if (!file || cooldown.locked) return;
    setSaving(true);
    try {
      const { file_url } = await appApi.integrations.Core.UploadFile({ file });
      setAvatarUrl(file_url);
    } catch (err) {
      alert("Profile image upload failed: " + (err.message || "Please try again."));
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await appApi.profiles.updateOwnProfile({ full_name: name, avatar_url: avatarUrl });
      await checkUserAuth();
      setEditOpen(false);
      alert("Profile updated. You can change it again after 7 days.");
    } catch (err) {
      alert(err.message || "Profile update failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="overflow-hidden rounded-[28px] border border-border/60 bg-card shadow-sm">
          <div className="relative grid gap-6 overflow-hidden p-5 sm:p-7 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(120deg,rgba(99,54,180,0.12),rgba(214,61,140,0.09),rgba(255,134,31,0.14))]" />
            <div className="relative flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-20 w-20 shrink-0 rounded-[24px] object-cover shadow-lg shadow-primary/20 ring-4 ring-background" />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] brand-gradient text-2xl font-black text-white shadow-lg shadow-primary/20 ring-4 ring-background">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-background/80 px-3 py-1 text-xs font-bold text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t("profile.account")}
                </div>
                <h1 className="truncate font-heading text-3xl font-extrabold text-foreground sm:text-4xl">{displayName}</h1>
                <p className="mt-1 truncate text-sm font-medium text-muted-foreground">{user?.email}</p>
                {user?.public_user_id && (
                  <p className="mt-1 truncate text-xs font-bold text-primary">@{user.public_user_id}</p>
                )}
              </div>
            </div>

            <div className="relative grid grid-cols-3 gap-2 sm:gap-3">
              <ProfileStat label={t("profile.recent_scans")} value={scanHistory.length} icon={History} />
              <ProfileStat label={t("profile.saved_recipes")} value={savedCount} icon={ChefHat} />
              <ProfileStat label={t("profile.account_role")} value={roleLabel} icon={Shield} />
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-border/60 bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-xl font-bold">Public Profile</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Change your profile picture and name once every 7 days.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {profileUrl && (
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(profileUrl)}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-bold text-foreground hover:bg-secondary/60"
                >
                  <Copy className="h-4 w-4" /> Copy link
                </button>
              )}
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"
              >
                <Edit3 className="h-4 w-4" /> Edit
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-20 w-20 shrink-0 rounded-3xl object-cover" />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-secondary text-xl font-black text-primary">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-muted-foreground">Display name</p>
              <p className="truncate font-heading text-2xl font-extrabold text-foreground">{displayName}</p>
              <p className={`mt-2 text-sm font-medium ${cooldown.locked ? "text-amber-700" : "text-emerald-700"}`}>
                {cooldown.locked
                  ? `You can edit again in ${remaining}.`
                  : "Profile changes are available now."}
              </p>
            </div>
          </div>

          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent className="max-w-md rounded-3xl">
              <DialogHeader>
                <DialogTitle>Edit public profile</DialogTitle>
                <DialogDescription>
                  {cooldown.locked
                    ? `Next profile change available in ${remaining}.`
                    : "Update your display name or profile picture."}
                </DialogDescription>
              </DialogHeader>
              {cooldown.locked && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800">
                  Next profile change available on {cooldown.nextChangeDate.toLocaleDateString()}.
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-[112px_1fr] sm:items-end">
                <label className={`flex aspect-square cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-secondary/40 text-center text-sm font-bold text-muted-foreground ${cooldown.locked ? "cursor-not-allowed opacity-60" : "hover:border-primary hover:text-primary"}`}>
                  {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full rounded-3xl object-cover" /> : <Upload className="mb-2 h-6 w-6" />}
                  {!avatarUrl && "Upload"}
                  <input type="file" accept="image/jpeg,image/png,image/webp" disabled={cooldown.locked || saving} className="hidden" onChange={(e) => handleAvatar(e.target.files?.[0])} />
                </label>
                <div className="space-y-3">
                  <label className="block text-sm font-semibold">
                    Display name
                    <input
                      value={name}
                      disabled={cooldown.locked || saving}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={cooldown.locked || saving || !name.trim()}
                    onClick={saveProfile}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save profile
                  </button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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

        <section className="mt-6 rounded-[28px] border border-border/60 bg-card p-5 shadow-sm sm:p-6">
          <h2 className="font-heading text-xl font-bold">Notifications</h2>
          <div className="mt-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-secondary/40 p-6 text-center text-sm text-muted-foreground">
                No follower notifications yet.
              </div>
            ) : (
              notifications.map((notification) => (
                <Link key={notification.id} to={notification.recipe_id ? `/community/${notification.recipe_id}` : "/community"} className="block rounded-2xl border border-border/60 bg-background p-3 text-sm hover:border-primary/30">
                  <span className="font-semibold">{notification.message}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{new Date(notification.created_date).toLocaleString()}</span>
                </Link>
              ))
            )}
          </div>
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

function formatCooldownRemaining(nextChangeDate, now) {
  if (!nextChangeDate) return "0 minutes";
  const totalMinutes = Math.max(0, Math.ceil((nextChangeDate.getTime() - now) / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days} day${days === 1 ? "" : "s"} ${hours} hour${hours === 1 ? "" : "s"}`;
  if (hours > 0) return `${hours} hour${hours === 1 ? "" : "s"} ${minutes} minute${minutes === 1 ? "" : "s"}`;
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
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
