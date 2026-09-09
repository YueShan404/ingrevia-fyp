import React, { useEffect, useMemo, useState, useRef } from "react";
import { appApi } from "@/api/supabaseClient";
import { useI18n, localized } from "@/lib/i18n";
import { useAuth } from "@/lib/AuthContext";
import Layout from "@/components/Layout";
import IngreviaLoader from "@/components/IngreviaLoader";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Shield, Trash2, Check, X, BookOpen, ChefHat, Users, Upload, Languages, UserX, ShieldCheck, MessageSquareWarning, Search, Eye, Pencil, Save, Bell, Plus, MessageCircle, Send, PenSquare } from "lucide-react";
import { badgeImage, mergeBadgeDefinitions } from "@/lib/achievements";

export default function Admin() {
  const { t, lang } = useI18n();
  const [tab, setTab] = useState("ingredients");
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [community, setCommunity] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [customBadges, setCustomBadges] = useState([]);
  const [announcement, setAnnouncement] = useState({ title: "", message: "", image_url: "" });
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);
  const [uploadingAnnouncementImage, setUploadingAnnouncementImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const bulkFileRef = useRef(null);
  const announcementFileRef = useRef(null);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [translatingRecipeId, setTranslatingRecipeId] = useState(null);
  const [bulkTranslating, setBulkTranslating] = useState(false);
  const [bulkTranslateProgress, setBulkTranslateProgress] = useState({ done: 0, total: 0 });
  const [search, setSearch] = useState("");
  const [detailItem, setDetailItem] = useState(null);
  const [detailType, setDetailType] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [savingItem, setSavingItem] = useState(false);

  const filteredIngredients = useMemo(() => filterAdminItems(ingredients, search, ["name", "name_bm", "name_zh", "name_ta", "category"]), [ingredients, search]);
  const filteredRecipes = useMemo(() => filterAdminItems(recipes, search, ["title", "title_bm", "title_zh", "title_ta", "cuisine", "description"]), [recipes, search]);
  const adminBadges = useMemo(() => mergeBadgeDefinitions(customBadges), [customBadges]);

  const loadAll = () => {
    Promise.all([
      appApi.entities.Ingredient.list().catch(() => []),
      appApi.entities.Recipe.list().catch(() => []),
      appApi.entities.CommunityRecipe.list("-created_date").catch(() => []),
      appApi.profiles.listForAdmin().catch(() => []),
      appApi.feedback.listForAdmin().catch(() => []),
      appApi.badges.list().catch(() => []),
    ]).then(([ings, recs, comm, users, reports, badgeRows]) => {
      setIngredients(ings || []);
      setRecipes(recs || []);
      setCommunity(comm || []);
      setProfiles(users || []);
      setFeedback(reports || []);
      setCustomBadges(badgeRows || []);
      setLoading(false);
    });
  };

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { setSearch(""); }, [tab]);

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

  const openDetails = (type, item) => {
    setDetailType(type);
    setDetailItem(item);
    setEditingItem(null);
  };

  const startEdit = (type, item) => {
    setDetailType(type);
    setDetailItem(item);
    setEditingItem(createEditDraft(type, item));
  };

  const saveEdit = async () => {
    if (!editingItem || !detailType || !detailItem) return;
    setSavingItem(true);
    try {
      if (detailType === "badge") {
        await appApi.badges.save(normalizeEditDraft(detailType, editingItem));
      } else {
        const api = detailType === "ingredient" ? appApi.entities.Ingredient : appApi.entities.Recipe;
        await api.update(detailItem.id, normalizeEditDraft(detailType, editingItem));
      }
      toast({ title: t("admin.edit_saved") });
      setEditingItem(null);
      setDetailItem(null);
      setDetailType(null);
      loadAll();
    } catch (err) {
      toast({
        title: t("admin.edit_failed"),
        description: err?.message || t("common.try_again"),
        variant: "destructive",
      });
    } finally {
      setSavingItem(false);
    }
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

  const deleteBadge = async (id) => {
    if (!confirm(t("admin.confirm_delete"))) return;
    await appApi.badges.delete(id);
    loadAll();
  };

  const uploadAnnouncementImage = async (file) => {
    if (!file) return;
    setUploadingAnnouncementImage(true);
    try {
      const { file_url } = await appApi.integrations.Core.UploadFile({ file });
      setAnnouncement((current) => ({ ...current, image_url: file_url }));
    } catch (error) {
      toast({ title: t("admin.upload_photo_failed"), description: error?.message || t("common.try_again"), variant: "destructive" });
    } finally {
      setUploadingAnnouncementImage(false);
      if (announcementFileRef.current) announcementFileRef.current.value = "";
    }
  };
  const setUserStatus = async (id, status) => {
    try {
      await appApi.profiles.setStatus(id, status);
      loadAll();
    } catch (err) {
      toast({
        title: t("admin.user_status_failed"),
        description: err?.message || t("common.try_again"),
        variant: "destructive",
      });
    }
  };

  const sendAnnouncement = async (event) => {
    event.preventDefault();
    if (!announcement.title.trim() || !announcement.message.trim()) return;
    setSendingAnnouncement(true);
    try {
      await appApi.social.notifyUsers({
        userIds: profiles.filter((profile) => profile.status !== "blocked").map((profile) => profile.id),
        actorUserId: user?.id,
        type: "announcement",
        title: announcement.title.trim(),
        message: announcement.message.trim(),
        image_url: announcement.image_url.trim(),
      });
      toast({ title: t("admin.announcement_sent") });
      setAnnouncement({ title: "", message: "", image_url: "" });
    } catch (err) {
      toast({ title: t("admin.announcement_title"), description: err?.message || t("common.try_again"), variant: "destructive" });
    } finally {
      setSendingAnnouncement(false);
    }
  };
  const setFeedbackStatus = async (id, status) => {
    await appApi.feedback.setStatus(id, status);
    loadAll();
  };

  const tabs = [
    { key: "ingredients", label: t("admin.tab_ingredients"), icon: BookOpen, count: ingredients.length },
    { key: "recipes", label: t("admin.tab_recipes"), icon: ChefHat, count: recipes.length },
    { key: "community", label: t("admin.tab_community"), icon: Users, count: community.filter((c) => c.status === "pending").length },
    { key: "users", label: t("admin.tab_users"), icon: ShieldCheck, count: profiles.filter((p) => p.status === "blocked").length },
    { key: "feedback", label: t("admin.tab_feedback"), icon: MessageSquareWarning, count: feedback.filter((item) => item.status === "open").length },
    { key: "badges", label: t("admin.tab_badges"), icon: Shield, count: adminBadges.length },
    { key: "announcements", label: t("admin.tab_announcements"), icon: Bell, count: 0 },
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

        {["ingredients", "recipes", "badges"].includes(tab) && (
          <div className="mx-auto mb-5 max-w-2xl">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={tab === "ingredients" ? t("admin.search_ingredients") : tab === "recipes" ? t("admin.search_recipes") : t("admin.search_badges")}
                className="h-12 w-full rounded-full border border-border bg-card pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
          </div>
        )}

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
            <AdminList items={filteredIngredients} onDelete={deleteIngredient} onDetails={(item) => openDetails("ingredient", item)} onEdit={(item) => startEdit("ingredient", item)}
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
            <AdminList items={filteredRecipes} onDelete={deleteRecipe} onDetails={(item) => openDetails("recipe", item)} onEdit={(item) => startEdit("recipe", item)}
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
        ) : tab === "announcements" ? (
          <form onSubmit={sendAnnouncement} className="mx-auto max-w-3xl glass-card rounded-3xl border border-border/50 p-5 space-y-4">
            <div>
              <h2 className="font-heading text-xl font-bold">{t("admin.announcement_title")}</h2>
              <p className="text-sm text-muted-foreground">{t("admin.announcement_body")}</p>
            </div>
            <input value={announcement.title} onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })} required maxLength={120} placeholder={t("admin.announcement_subject")} className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
            <textarea value={announcement.message} onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })} required maxLength={1000} placeholder={t("admin.announcement_body")} className="min-h-32 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <input value={announcement.image_url} onChange={(e) => setAnnouncement({ ...announcement, image_url: e.target.value })} placeholder={t("admin.announcement_image")} className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              <input ref={announcementFileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => uploadAnnouncementImage(e.target.files?.[0])} />
              <button type="button" disabled={uploadingAnnouncementImage} onClick={() => announcementFileRef.current?.click()} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-secondary px-4 text-sm font-bold text-foreground disabled:opacity-60">
                <Upload className="h-4 w-4" /> {uploadingAnnouncementImage ? t("admin.uploading_photo") : t("admin.upload_photo")}
              </button>
            </div>
            {announcement.image_url && <img src={announcement.image_url} alt="" className="h-40 w-full rounded-2xl object-cover" />}
            <button disabled={sendingAnnouncement} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60">
              <Send className="h-4 w-4" /> {sendingAnnouncement ? t("support.sending") : t("admin.announcement_title")}
            </button>
          </form>
        ) : tab === "community" ? (
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
                  <button onClick={() => approveCommunity(item)} className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 hover:scale-110 transition-transform">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => rejectCommunity(item)} className="p-2 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-600 hover:scale-110 transition-transform">
                    <X className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteCommunity(item.id)} className="p-2 rounded-full bg-red-100 dark:bg-red-900 text-red-600 hover:scale-110 transition-transform">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : tab === "users" ? (
          <div className="space-y-3">
            {profiles.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">{t("common.no_results")}</p>
            ) : profiles.map((profile) => (
              <div key={profile.id} className="glass-card rounded-2xl border border-border/50 p-4 flex items-center gap-4">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-secondary shrink-0 flex items-center justify-center">
                    <Users className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{profile.full_name || profile.email}</p>
                  <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-foreground/70">{profile.role}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      profile.status === "blocked" || profile.status === "profile_blocked" ? "bg-red-100 text-red-700" : profile.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}>{profile.status}</span>
                  </div>
                </div>
                {profile.id !== user?.id && (
                  profile.status === "blocked" ? (
                    <button
                      type="button"
                      onClick={() => setUserStatus(profile.id, "active")}
                      className="shrink-0 p-2 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 hover:scale-110 transition-transform"
                      title={t("admin.activate_user")}
                      aria-label={t("admin.activate_user")}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <button type="button" onClick={() => setUserStatus(profile.id, "comment_restricted")} className="shrink-0 p-2 rounded-full bg-amber-100 text-amber-700 hover:scale-110 transition-transform" title={t("admin.restrict_comments")} aria-label={t("admin.restrict_comments")}><MessageCircle className="w-4 h-4" /></button>
                      <button type="button" onClick={() => setUserStatus(profile.id, "submit_restricted")} className="shrink-0 p-2 rounded-full bg-amber-100 text-amber-700 hover:scale-110 transition-transform" title={t("admin.restrict_submit")} aria-label={t("admin.restrict_submit")}><PenSquare className="w-4 h-4" /></button>
                      <button type="button" onClick={() => setUserStatus(profile.id, "profile_blocked")} className="shrink-0 p-2 rounded-full bg-red-100 text-red-600 hover:scale-110 transition-transform" title={t("admin.block_profile")} aria-label={t("admin.block_profile")}><Shield className="w-4 h-4" /></button>
                      <button type="button" onClick={() => setUserStatus(profile.id, "blocked")} className="shrink-0 p-2 rounded-full bg-red-100 dark:bg-red-900 text-red-600 hover:scale-110 transition-transform" title={t("admin.block_user")} aria-label={t("admin.block_user")}><UserX className="w-4 h-4" /></button>
                    </div>
                  )
                )}
              </div>
            ))}
          </div>
        ) : tab === "badges" ? (
          <>
            <div className="mb-4 flex justify-end">
              <button onClick={() => startEdit("badge", createEditDraft("badge", {}))} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">
                <Plus className="h-4 w-4" /> {t("admin.add_badge")}
              </button>
            </div>
            <AdminBadgeList badges={filterAdminItems(adminBadges, search, ["name", "description", "requirement", "rarity", "metric"])} t={t} onDetails={(item) => openDetails("badge", item)} onEdit={(item) => startEdit("badge", item)} onDelete={deleteBadge} />
          </>
        ) : (
          <div className="space-y-3">
            {feedback.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">{t("common.no_results")}</p>
            ) : feedback.map((item) => (
              <div key={item.id} className="glass-card rounded-2xl border border-border/50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        item.type === "issue" ? "bg-red-100 text-red-700" : "bg-secondary text-primary"
                      }`}>{item.type}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        item.status === "resolved" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}>{item.status}</span>
                    </div>
                    <p className="font-semibold text-sm">{item.subject}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{item.message}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {item.profiles?.full_name || item.profiles?.email || t("profile.default_user")} · {new Date(item.created_date).toLocaleString()}
                    </p>
                    {item.page_url && (
                      <a href={item.page_url} target="_blank" rel="noreferrer" className="mt-1 block truncate text-xs font-semibold text-primary hover:underline">
                        {item.page_url}
                      </a>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setFeedbackStatus(item.id, item.status === "resolved" ? "open" : "resolved")}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-bold text-foreground hover:bg-secondary/70"
                  >
                    {item.status === "resolved" ? t("admin.reopen") : t("admin.resolve")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <AdminDetailDialog
          detailItem={detailItem}
          detailType={detailType}
          editingItem={editingItem}
          onClose={() => { setDetailItem(null); setDetailType(null); setEditingItem(null); }}
          onEdit={() => startEdit(detailType, detailItem)}
          onSave={saveEdit}
          saving={savingItem}
          setEditingItem={setEditingItem}
          t={t}
          toast={toast}
        />
      </div>
    </Layout>
  );
}

function AdminList({ items, onDelete, onDetails, onEdit, render, t }) {
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
            <button onClick={() => onDetails(item)} className="shrink-0 p-2 rounded-full bg-secondary text-foreground hover:scale-110 transition-transform" aria-label={t("common.view")} title={t("common.view")}>
              <Eye className="w-4 h-4" />
            </button>
            <button onClick={() => onEdit(item)} className="shrink-0 p-2 rounded-full bg-secondary text-primary hover:scale-110 transition-transform" aria-label={t("admin.edit")} title={t("admin.edit")}>
              <Pencil className="w-4 h-4" />
            </button>
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

function filterAdminItems(items, query, fields) {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) =>
    fields.some((field) => String(item[field] || "").toLowerCase().includes(q)) ||
    JSON.stringify(item.ingredient_tags || []).toLowerCase().includes(q)
  );
}

function AdminBadgeList({ badges, t, onDetails, onEdit, onDelete }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {badges.length === 0 ? (
        <p className="text-center text-muted-foreground py-12 sm:col-span-2">{t("common.no_results")}</p>
      ) : badges.map((badge) => (
        <article key={badge.id} className="glass-card rounded-2xl border border-border/50 p-4">
          <div className="flex items-start gap-4">
            <img src={badge.image_url || badgeImage(badge.id)} alt={badge.name} className="h-16 w-16 shrink-0 object-contain" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-heading text-base font-bold">{badge.name}</h3>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase text-primary">{badge.rarity}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{badge.description}</p>
              <p className="mt-2 text-xs font-semibold text-foreground">{badge.requirement}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("admin.badge_metric")}: {badge.metric} / {badge.target}</p>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => onDetails?.(badge)} className="rounded-full bg-secondary p-2 text-foreground"><Eye className="h-4 w-4" /></button>
                <button type="button" onClick={() => onEdit?.(badge)} className="rounded-full bg-secondary p-2 text-primary"><Pencil className="h-4 w-4" /></button>
                {badge.is_custom && <button type="button" onClick={() => onDelete?.(badge.id)} className="rounded-full bg-red-50 p-2 text-red-600"><Trash2 className="h-4 w-4" /></button>}
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function createEditDraft(type, item) {
  if (type === "badge") {
    return {
      id: item.id || "",
      name: item.name || "",
      description: item.description || "",
      requirement: item.requirement || "",
      metric: item.metric || "scanCount",
      target: item.target ?? 1,
      rarity: item.rarity || "bronze",
      image_url: item.image_url || "",
      is_custom: item.is_custom !== false,
    };
  }

  if (type === "badge") {
    return {
      ...draft,
      id: draft.id || `custom-${String(draft.name || "badge").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || Date.now()}`,
      target: numberOrNull(draft.target) || 1,
      is_custom: draft.is_custom !== false,
    };
  }

  if (type === "ingredient") {
    return {
      name: item.name || "",
      category: item.category || "",
      image_url: item.image_url || "",
      calories: item.calories ?? "",
      protein: item.protein ?? "",
      carbs: item.carbs ?? "",
      fiber: item.fiber ?? "",
      fat: item.fat ?? "",
      sodium: item.sodium ?? "",
    };
  }

  return {
    title: item.title || "",
    cuisine: item.cuisine || "",
    image_url: item.image_url || "",
    description: item.description || "",
    prep_time: item.prep_time ?? "",
    cook_time: item.cook_time ?? "",
    servings: item.servings ?? "",
    ingredient_tags: Array.isArray(item.ingredient_tags) ? item.ingredient_tags.join(", ") : "",
  };
}

function normalizeEditDraft(type, draft) {
  const numberOrNull = (value) => value === "" || value == null ? null : Number(value);

  if (type === "ingredient") {
    return {
      ...draft,
      calories: numberOrNull(draft.calories),
      protein: numberOrNull(draft.protein),
      carbs: numberOrNull(draft.carbs),
      fiber: numberOrNull(draft.fiber),
      fat: numberOrNull(draft.fat),
      sodium: numberOrNull(draft.sodium),
    };
  }

  return {
    ...draft,
    prep_time: numberOrNull(draft.prep_time),
    cook_time: numberOrNull(draft.cook_time),
    servings: numberOrNull(draft.servings),
    ingredient_tags: draft.ingredient_tags.split(",").map((tag) => tag.trim()).filter(Boolean),
  };
}

function AdminDetailDialog({ detailItem, detailType, editingItem, onClose, onEdit, onSave, saving, setEditingItem, t, toast }) {
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  if (!detailItem || !detailType) return null;
  const isEditing = Boolean(editingItem);
  const fields = detailType === "badge"
    ? ["id", "name", "description", "requirement", "metric", "target", "rarity", "image_url"]
    : detailType === "ingredient"
      ? ["name", "category", "image_url", "calories", "protein", "carbs", "fiber", "fat", "sodium"]
      : ["title", "cuisine", "image_url", "description", "prep_time", "cook_time", "servings", "ingredient_tags"];

  return (
    <Dialog open={Boolean(detailItem)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? t("admin.edit") : t("admin.details")}</DialogTitle>
          <DialogDescription>{detailType === "badge" ? t("admin.badge_record") : detailType === "ingredient" ? t("admin.ingredient_record") : t("admin.recipe_record")}</DialogDescription>
        </DialogHeader>

        {(detailItem.image_url || (detailType === "badge" && badgeImage(detailItem.id))) && (
          <img src={detailItem.image_url || badgeImage(detailItem.id)} alt="" className="h-48 w-full rounded-2xl object-contain bg-secondary/40" />
        )}

        {isEditing && (
          <label className="block rounded-2xl border border-dashed border-border bg-secondary/40 p-4 text-center">
            <Upload className="mx-auto h-5 w-5 text-primary" />
            <span className="mt-1 block text-sm font-bold">{uploadingPhoto ? t("admin.uploading_photo") : t("admin.upload_photo")}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{t("admin.upload_photo_hint")}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={uploadingPhoto}
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setUploadingPhoto(true);
                try {
                  const { file_url } = await appApi.integrations.Core.UploadFile({ file });
                  setEditingItem({ ...editingItem, image_url: file_url });
                } catch (error) {
                  toast?.({ title: t("admin.upload_photo_failed"), description: error?.message || t("common.try_again"), variant: "destructive" });
                } finally {
                  setUploadingPhoto(false);
                  event.target.value = "";
                }
              }}
            />
          </label>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {fields.map((field) => (
            <label key={field} className={field === "description" || field === "image_url" || field === "ingredient_tags" ? "sm:col-span-2" : ""}>
              <span className="text-xs font-bold uppercase text-muted-foreground">{field.replaceAll("_", " ")}</span>
              {isEditing ? (
                field === "description" ? (
                  <textarea value={editingItem[field] || ""} onChange={(event) => setEditingItem({ ...editingItem, [field]: event.target.value })} className="mt-1 min-h-24 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                ) : (
                  <input value={editingItem[field] ?? ""} onChange={(event) => setEditingItem({ ...editingItem, [field]: event.target.value })} className="mt-1 h-10 w-full rounded-full border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
                )
              ) : (
                <p className="mt-1 rounded-2xl bg-secondary/60 px-3 py-2 text-sm text-foreground">
                  {Array.isArray(detailItem[field]) ? detailItem[field].join(", ") : String(detailItem[field] ?? "-")}
                </p>
              )}
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          {isEditing ? (
            <button onClick={onSave} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60">
              <Save className="h-4 w-4" /> {saving ? t("admin.saving") : t("admin.save_changes")}
            </button>
          ) : (
            <button onClick={onEdit} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
              <Pencil className="h-4 w-4" /> {t("admin.edit")}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
