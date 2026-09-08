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
  Bell,
  CalendarDays,
  ChefHat,
  Edit3,
  HelpCircle,
  History,
  Loader2,
  LogOut,
  ScanLine,
  Share2,
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
  const [activeTab, setActiveTab] = useState("overview");
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

  const displayName = user?.full_name || user?.email || t("profile.default_user");
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "I";
  const savedCount = recipes.filter((recipe) => favorites.includes(recipe.id)).length;
  const roleLabel = user?.role === "admin" ? "Admin" : "User";
  const isAdmin = user?.role === "admin";
  const remaining = formatCooldownRemaining(cooldown.nextChangeDate, now);
  const profileUrl = user?.public_user_id ? `${window.location.origin}/u/${user.public_user_id}` : "";

  const handleAvatar = async (file) => {
    if (!file || cooldown.locked) return;
    setSaving(true);
    try {
      const { file_url } = await appApi.integrations.Core.UploadFile({ file });
      setAvatarUrl(file_url);
    } catch (err) {
      try {
        const fallbackUrl = await resizeAvatarToDataUrl(file);
        setAvatarUrl(fallbackUrl);
        alert(t("profile.image_ready_local"));
      } catch {
        alert(`${t("profile.image_upload_failed")}: ${err.message || t("common.try_again")}`);
      }
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
      alert(isAdmin ? t("profile.update_success_admin") : t("profile.update_success_user"));
    } catch (err) {
      alert(err.message || t("profile.update_failed"));
    } finally {
      setSaving(false);
    }
  };

  const shareProfile = async () => {
    if (!profileUrl) return;
    const shareData = {
      title: `${displayName} on Ingrevia`,
      text: t("profile.share_text").replace("{name}", displayName),
      url: profileUrl,
    };

    try {
      if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard?.writeText(profileUrl);
      alert(t("profile.link_copied"));
    } catch (error) {
      if (error?.name !== "AbortError") {
        await navigator.clipboard?.writeText(profileUrl);
        alert(t("profile.link_copied"));
      }
    }
  };

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="overflow-hidden rounded-[28px] border border-border/60 bg-card shadow-sm">
          <div className="relative h-28 overflow-hidden bg-[linear-gradient(135deg,rgba(91,44,111,0.16),rgba(216,129,102,0.18),rgba(42,125,83,0.14))] sm:h-36">
            <div className="absolute inset-x-0 bottom-0 h-px bg-border/60" />
          </div>
          <div className="px-5 pb-5 sm:px-7 sm:pb-7">
            <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="h-28 w-28 shrink-0 rounded-[30px] object-cover shadow-lg shadow-primary/15 ring-4 ring-card" />
                ) : (
                  <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-[30px] brand-gradient text-4xl font-black text-white shadow-lg shadow-primary/15 ring-4 ring-card">
                    {initials}
                  </div>
                )}
                <div className="min-w-0 pb-1">
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-background/90 px-3 py-1 text-xs font-bold text-primary shadow-sm">
                    <Sparkles className="h-3.5 w-3.5" />
                    {t("profile.account")}
                  </div>
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <h1 className="min-w-0 truncate font-heading text-3xl font-extrabold text-foreground sm:text-4xl">{displayName}</h1>
                    <button type="button" onClick={() => setEditOpen(true)} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" aria-label={t("profile.edit_public")} title={t("profile.edit_public")}>
                      <Edit3 className="h-4 w-4" />
                    </button>
                    {profileUrl && (
                      <button type="button" onClick={shareProfile} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm hover:bg-secondary/70" aria-label={t("profile.share_public")} title={t("profile.share_public")}>
                        <Share2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <p className="mt-1 truncate text-sm font-medium text-muted-foreground">{user?.email}</p>
                  {user?.public_user_id && <p className="mt-1 truncate text-xs font-bold text-primary">@{user.public_user_id}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:min-w-[420px] sm:gap-3">
                <ProfileStat label={t("profile.recent_scans")} value={scanHistory.length} icon={History} />
                <ProfileStat label={t("profile.saved_recipes")} value={savedCount} icon={ChefHat} />
                <ProfileStat label={t("profile.account_role")} value={roleLabel} icon={Shield} />
              </div>
            </div>

            <div className="mt-6 flex gap-2 overflow-x-auto rounded-2xl bg-secondary/60 p-1">
              <ProfileTab active={activeTab === "overview"} icon={Sparkles} label={t("profile.tab_overview")} onClick={() => setActiveTab("overview")} />
              <ProfileTab active={activeTab === "activity"} icon={History} label={t("profile.tab_activity")} onClick={() => setActiveTab("activity")} />
              <ProfileTab active={activeTab === "saved"} icon={ChefHat} label={t("profile.tab_saved")} onClick={() => setActiveTab("saved")} />
              <ProfileTab active={activeTab === "support"} icon={HelpCircle} label={t("nav.support")} onClick={() => setActiveTab("support")} />
            </div>
          </div>
        </section>

        <ProfileEditDialog
          avatarUrl={avatarUrl}
          cooldown={cooldown}
          displayName={displayName}
          editOpen={editOpen}
          handleAvatar={handleAvatar}
          isAdmin={isAdmin}
          name={name}
          remaining={remaining}
          saveProfile={saveProfile}
          saving={saving}
          setEditOpen={setEditOpen}
          setName={setName}
          t={t}
        />

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-6">
            <section className="rounded-[24px] border border-border/60 bg-card p-5 shadow-sm sm:p-6">
              <h2 className="font-heading text-xl font-bold">{t("profile.public_profile")}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {isAdmin ? t("profile.public_desc_admin") : t("profile.public_desc_user")}
              </p>
              <p className={`mt-4 rounded-2xl border p-3 text-sm font-medium ${cooldown.locked ? "border-amber-200 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
                {cooldown.locked ? t("profile.edit_remaining").replace("{time}", remaining) : isAdmin ? t("profile.available_admin") : t("profile.available_user")}
              </p>
            </section>

            <section className="rounded-[24px] border border-border/60 bg-card p-5 shadow-sm sm:p-6">
              <h2 className="font-heading text-xl font-bold">{t("profile.quick_tools")}</h2>
              <div className="mt-4 grid gap-3">
                <QuickAction icon={ScanLine} title={t("profile.scan_title")} description={t("profile.scan_desc")} to="/scan" primary />
                <QuickAction icon={CalendarDays} title={t("profile.planner_title")} description={t("profile.planner_desc")} to="/planner" />
                {user?.role === "admin" && <QuickAction icon={Shield} title={t("profile.admin_title")} description={t("profile.admin_desc")} to="/admin" />}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            {activeTab === "overview" && (
              <section className="grid gap-3 sm:grid-cols-2">
                <QuickAction icon={History} title={t("profile.history_title")} description={t("profile.history_desc")} to="/history" />
                <QuickAction icon={ChefHat} title={t("profile.favorites_title")} description={t("profile.favorites_desc")} to="/favorites" />
                <QuickAction icon={BarChart3} title={t("profile.dashboard_title")} description={t("profile.dashboard_desc")} to="/dashboard" />
                <QuickAction icon={HelpCircle} title={t("profile.support_title")} description={t("profile.support_desc")} to="/support" />
              </section>
            )}

            {(activeTab === "overview" || activeTab === "activity") && <ActivityPanel loading={loading} scanHistory={scanHistory} t={t} />}

            {activeTab === "saved" && (
              <section className="rounded-[24px] border border-border/60 bg-card p-5 shadow-sm sm:p-6">
                <h2 className="font-heading text-xl font-bold">{t("profile.favorites_title")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("profile.favorites_desc")}</p>
                <Link to="/favorites" className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90">
                  <ChefHat className="h-4 w-4" /> {t("common.view")}
                </Link>
              </section>
            )}

            {activeTab === "support" && (
              <section className="rounded-[24px] border border-border/60 bg-card p-5 shadow-sm sm:p-6">
                <h2 className="font-heading text-xl font-bold">{t("profile.support_title")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("profile.support_desc")}</p>
                <Link to="/support" className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90">
                  <HelpCircle className="h-4 w-4" /> {t("common.view")}
                </Link>
              </section>
            )}

            <NotificationsPanel notifications={notifications} t={t} />
          </div>
        </section>

        <div className="mt-8 flex justify-center">
          <button onClick={() => logout(false)} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm hover:bg-secondary/60">
            <LogOut className="h-4 w-4" /> {t("auth.logout")}
          </button>
        </div>
      </div>
    </Layout>
  );
}

function ProfileEditDialog({ avatarUrl, cooldown, displayName, editOpen, handleAvatar, isAdmin, name, remaining, saveProfile, saving, setEditOpen, setName, t }) {
  return (
    <Dialog open={editOpen} onOpenChange={setEditOpen}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle>{t("profile.edit_public")}</DialogTitle>
          <DialogDescription>
            {cooldown.locked
              ? t("profile.next_change_in").replace("{time}", remaining)
              : isAdmin
                ? t("profile.dialog_desc_admin")
                : t("profile.dialog_desc_user")}
          </DialogDescription>
        </DialogHeader>
        {cooldown.locked && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800">
            {t("profile.next_change_on").replace("{date}", cooldown.nextChangeDate.toLocaleDateString())}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-[128px_1fr] sm:items-end">
          <label className={`group cursor-pointer text-center text-sm font-bold ${cooldown.locked ? "cursor-not-allowed opacity-60" : "text-primary"}`}>
            <span className="flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-dashed border-border bg-secondary/40">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <Upload className="h-7 w-7 text-muted-foreground" />
              )}
            </span>
            <span className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs text-foreground group-hover:bg-secondary/70">
              <Upload className="h-3.5 w-3.5" /> {t("profile.change_photo")}
            </span>
            <input type="file" accept="image/jpeg,image/png,image/webp" disabled={cooldown.locked || saving} className="hidden" onChange={(e) => handleAvatar(e.target.files?.[0])} />
          </label>
          <div className="space-y-3">
            <label className="block text-sm font-semibold">
              {t("profile.display_name")}
              <input value={name} disabled={cooldown.locked || saving} onChange={(e) => setName(e.target.value)} className="mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60" />
            </label>
            <button type="button" disabled={cooldown.locked || saving || !name.trim()} onClick={saveProfile} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} {t("profile.save_profile")}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ActivityPanel({ loading, scanHistory, t }) {
  return (
    <section className="rounded-[24px] border border-border/60 bg-card p-5 shadow-sm sm:p-6">
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
                <img src={item.image_url} alt={item.ingredient_name || ""} className="h-12 w-12 shrink-0 rounded-xl object-cover" />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary">
                  <ScanLine className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{item.ingredient_name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.matched ? t("profile.matched") : t("profile.unmatched")}
                  {item.confidence != null ? ` - ${Math.round(item.confidence)}%` : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function NotificationsPanel({ notifications, t }) {
  return (
    <section className="rounded-[24px] border border-border/60 bg-card p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-primary" />
        <h2 className="font-heading text-xl font-bold">{t("profile.notifications")}</h2>
      </div>
      <div className="mt-4 space-y-3">
        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-secondary/40 p-6 text-center text-sm text-muted-foreground">
            {t("profile.notifications_empty")}
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
  );
}

function resizeAvatarToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onerror = reject;
    reader.onload = () => {
      img.onload = () => {
        const size = 512;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas is unavailable."));
          return;
        }

        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        resolve(canvas.toDataURL("image/webp", 0.82));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
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
    <div className="min-w-0 rounded-2xl border border-border/60 bg-background/90 p-3 shadow-sm backdrop-blur sm:p-4">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <p className="truncate font-heading text-xl font-extrabold text-primary sm:text-2xl">{value}</p>
      <p className="mt-0.5 truncate text-[11px] font-semibold text-muted-foreground sm:text-xs">{label}</p>
    </div>
  );
}

function ProfileTab({ active, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors ${
        active ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

function QuickAction({ icon: Icon, title, description, to, primary = false }) {
  return (
    <Link
      to={to}
      className={`group min-h-[128px] rounded-[22px] border p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
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
