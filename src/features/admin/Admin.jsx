import React, { useEffect, useMemo, useRef, useState } from "react";
import { appApi } from "@/api/supabaseClient";
import { useI18n, localized } from "@/lib/i18n";
import Layout from "@/components/Layout";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  Check,
  ChefHat,
  Database,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Shield,
  Sparkles,
  Trash2,
  Upload,
  Users,
  X,
  Megaphone,
} from "lucide-react";

const TARGET_INGREDIENTS = 30;
const TARGET_RECIPES = 60;

export default function Admin() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const ingredientFileRef = useRef(null);
  const recipeFileRef = useRef(null);
  const announcementImageRef = useRef(null);
  const [tab, setTab] = useState("overview");
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [community, setCommunity] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementForm, setAnnouncementForm] = useState({ title: "", body: "", category: "Update", image_url: "", is_published: true });
  const [loading, setLoading] = useState(true);
  const [bulkImporting, setBulkImporting] = useState("");

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      appApi.entities.Ingredient.list().catch(() => []),
      appApi.entities.Recipe.list().catch(() => []),
      appApi.entities.CommunityRecipe.list("-created_date").catch(() => []),
      appApi.entities.Announcement.list("-created_date").catch(() => []),
    ]).then(([ings, recs, comm, anns]) => {
      setIngredients(ings || []);
      setRecipes(recs || []);
      setCommunity(comm || []);
      setAnnouncements(anns || []);
      setLoading(false);
    });
  };

  useEffect(() => { loadAll(); }, []);

  const stats = useMemo(() => {
    const pending = community.filter((item) => item.status === "pending").length;
    const withNutrition = ingredients.filter((item) =>
      ["calories", "protein", "carbs", "sugar", "fiber", "fat", "sodium"].some((field) => item[field] != null)
    ).length;
    const withRecipeLinks = ingredients.filter((ingredient) =>
      recipes.some((recipe) =>
        (recipe.ingredient_tags || []).some((tag) => tag.toLowerCase() === ingredient.name?.toLowerCase())
      )
    ).length;
    return { pending, withNutrition, withRecipeLinks };
  }, [community, ingredients, recipes]);

  const handleBulkUpload = async (file, type) => {
    if (!file) return;
    setBulkImporting(type);
    try {
      const { bucket, file_path, file_url } = await appApi.integrations.Core.UploadFile({ file });
      const functionName = type === "ingredients" ? "bulkImportIngredients" : "bulkImportRecipes";
      const resp = await appApi.functions.invoke(functionName, { bucket, file_path, file_url });
      const data = resp?.data || {};
      toast({
        title: type === "ingredients" ? "Ingredients imported" : "Recipes imported",
        description: `Imported ${data.imported ?? 0} records.`,
      });
      loadAll();
    } catch (err) {
      toast({
        title: "Import failed",
        description: err?.response?.data?.error || err?.message || "Unknown error",
        variant: "destructive",
      });
    }
    setBulkImporting("");
    if (ingredientFileRef.current) ingredientFileRef.current.value = "";
    if (recipeFileRef.current) recipeFileRef.current.value = "";
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

  const uploadAnnouncementImage = async (file) => {
    if (!file) return;
    const { file_url } = await appApi.integrations.Core.UploadAnnouncementImage({ file });
    setAnnouncementForm((current) => ({ ...current, image_url: file_url }));
  };

  const createAnnouncement = async (event) => {
    event.preventDefault();
    if (!announcementForm.title.trim() || !announcementForm.body.trim()) return;
    await appApi.entities.Announcement.create({
      ...announcementForm,
      title: announcementForm.title.trim(),
      body: announcementForm.body.trim(),
      category: announcementForm.category.trim() || "Update",
    });
    setAnnouncementForm({ title: "", body: "", category: "Update", image_url: "", is_published: true });
    if (announcementImageRef.current) announcementImageRef.current.value = "";
    loadAll();
  };

  const toggleAnnouncement = async (item) => {
    await appApi.entities.Announcement.update(item.id, { is_published: !item.is_published });
    loadAll();
  };

  const deleteAnnouncement = async (id) => {
    if (!confirm(t("admin.confirm_delete"))) return;
    await appApi.entities.Announcement.delete(id);
    loadAll();
  };

  const tabs = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "ingredients", label: t("admin.tab_ingredients"), icon: BookOpen, count: ingredients.length },
    { key: "recipes", label: t("admin.tab_recipes"), icon: ChefHat, count: recipes.length },
    { key: "community", label: t("admin.tab_community"), icon: Users, count: stats.pending },
    { key: "announcements", label: "Announcements", icon: Megaphone, count: announcements.length },
    { key: "integrations", label: "Integrations", icon: Sparkles },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary mb-3">
              <Shield className="w-3.5 h-3.5" />
              shanyuew416@gmail.com
            </div>
            <h1 className="font-heading font-extrabold text-3xl mb-2">Admin Control Panel</h1>
            <p className="text-muted-foreground max-w-2xl">
              Manage datasets, Malaysian recipes, announcements, community submissions, and scanner integrations.
            </p>
          </div>
          <button
            onClick={loadAll}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-secondary px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary/70 disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <MetricCard icon={BookOpen} label="Curated ingredients" value={`${ingredients.length}/${TARGET_INGREDIENTS}`} tone={ingredients.length >= TARGET_INGREDIENTS ? "good" : "warn"} />
          <MetricCard icon={ChefHat} label="Recipe catalogue" value={`${recipes.length}/${TARGET_RECIPES}`} tone={recipes.length >= TARGET_RECIPES ? "good" : "warn"} />
          <MetricCard icon={Database} label="Nutrition coverage" value={`${stats.withNutrition}/${ingredients.length || TARGET_INGREDIENTS}`} tone={stats.withNutrition >= TARGET_INGREDIENTS ? "good" : "warn"} />
          <MetricCard icon={Users} label="Pending community" value={stats.pending} tone={stats.pending ? "warn" : "good"} />
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
                  tab === item.key ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" : "bg-secondary text-foreground/70 hover:bg-secondary/70"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
                {item.count != null && <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">{item.count}</span>}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : tab === "overview" ? (
          <Overview
            stats={stats}
            ingredients={ingredients}
            recipes={recipes}
            community={community}
            onIngredientImport={() => ingredientFileRef.current?.click()}
            onRecipeImport={() => recipeFileRef.current?.click()}
            bulkImporting={bulkImporting}
          />
        ) : tab === "ingredients" ? (
          <ContentPanel
            title="Ingredient dataset"
            description="These records power encyclopedia search, AI scan matching, health advisory values, and recipe linking."
            actionLabel={bulkImporting === "ingredients" ? "Importing..." : "Import ingredients"}
            onAction={() => ingredientFileRef.current?.click()}
            disabled={!!bulkImporting}
          >
            <AdminList
              items={ingredients}
              onDelete={deleteIngredient}
              render={(item) => ({
                title: localized(item, "name", lang),
                subtitle: `${t(`encyclopedia.categories.${item.category}`)} · ${item.source || "No source"}`,
                image: item.image_url,
                meta: item.calories != null ? `${item.calories} kcal / 100g` : "Nutrition missing",
              })}
              t={t}
            />
          </ContentPanel>
        ) : tab === "recipes" ? (
          <ContentPanel
            title="Recipe catalogue"
            description="Recipes should use ingredient tags that exactly match the curated ingredient names."
            actionLabel={bulkImporting === "recipes" ? "Importing..." : "Import recipes"}
            onAction={() => recipeFileRef.current?.click()}
            disabled={!!bulkImporting}
          >
            <AdminList
              items={recipes}
              onDelete={deleteRecipe}
              render={(item) => ({
                title: localized(item, "title", lang),
                subtitle: `${t(`kitchen.cuisines.${item.cuisine}`)} · ${(item.ingredient_tags || []).length} linked ingredients`,
                image: item.image_url,
                meta: `${(item.prep_time || 0) + (item.cook_time || 0)} min · ${item.spice_level || "mild"}`,
              })}
              t={t}
            />
          </ContentPanel>
        ) : tab === "community" ? (
          <CommunityModeration
            community={community}
            approveCommunity={approveCommunity}
            rejectCommunity={rejectCommunity}
            deleteCommunity={deleteCommunity}
            t={t}
          />
        ) : tab === "announcements" ? (
          <AnnouncementManager
            announcements={announcements}
            form={announcementForm}
            setForm={setAnnouncementForm}
            imageRef={announcementImageRef}
            onImageUpload={uploadAnnouncementImage}
            onSubmit={createAnnouncement}
            onToggle={toggleAnnouncement}
            onDelete={deleteAnnouncement}
          />
        ) : (
          <Integrations />
        )}

        <input ref={ingredientFileRef} type="file" accept=".csv,.xlsx,.xls,.json" className="hidden" onChange={(e) => handleBulkUpload(e.target.files?.[0], "ingredients")} />
        <input ref={recipeFileRef} type="file" accept=".csv,.xlsx,.xls,.json" className="hidden" onChange={(e) => handleBulkUpload(e.target.files?.[0], "recipes")} />
      </div>
    </Layout>
  );
}

function MetricCard({ icon: Icon, label, value, tone }) {
  const styles = tone === "good" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200";
  return (
    <div className="glass-card rounded-2xl border border-border/50 p-4">
      <div className={`inline-flex w-10 h-10 rounded-xl items-center justify-center border ${styles}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="mt-3 text-2xl font-heading font-extrabold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Overview({ stats, ingredients, recipes, community, onIngredientImport, onRecipeImport, bulkImporting }) {
  const pending = community.filter((item) => item.status === "pending").slice(0, 4);
  const missingNutrition = ingredients.filter((item) => item.calories == null).slice(0, 5);
  const weakLinks = ingredients.filter((ingredient) =>
    !recipes.some((recipe) => (recipe.ingredient_tags || []).some((tag) => tag.toLowerCase() === ingredient.name?.toLowerCase()))
  ).slice(0, 5);

  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="glass-card rounded-3xl border border-border/50 p-5">
        <h2 className="font-heading font-bold text-lg mb-4">Admin workflow</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <QuickAction icon={FileSpreadsheet} title="Import 30 ingredients" desc="CSV for scan matching and nutrition display." onClick={onIngredientImport} disabled={!!bulkImporting} />
          <QuickAction icon={ChefHat} title="Import 60 recipes" desc="Malaysian recipe catalogue with linked tags." onClick={onRecipeImport} disabled={!!bulkImporting} />
          <QuickAction icon={Users} title="Review submissions" desc={`${stats.pending} community recipe waiting.`} disabled />
          <QuickAction icon={Sparkles} title="Check integrations" desc="OpenAI Vision and USDA nutrition functions." disabled />
        </div>
      </section>

      <section className="glass-card rounded-3xl border border-border/50 p-5">
        <h2 className="font-heading font-bold text-lg mb-4">Dataset checks</h2>
        <ChecklistItem ok={ingredients.length >= TARGET_INGREDIENTS} text="30 curated ingredients imported" />
        <ChecklistItem ok={recipes.length >= TARGET_RECIPES} text="60 Malaysian recipes imported" />
        <ChecklistItem ok={stats.withNutrition >= TARGET_INGREDIENTS} text="Ingredient nutrition coverage complete" />
        <ChecklistItem ok={stats.withRecipeLinks >= TARGET_INGREDIENTS} text="Every ingredient has recipe links" />
      </section>

      <IssueList title="Pending submissions" items={pending.map((item) => `${item.title} by ${item.author}`)} empty="No pending community recipes." />
      <IssueList title="Missing nutrition" items={missingNutrition.map((item) => item.name)} empty="All visible ingredients have nutrition values." />
      <IssueList title="Ingredients without recipe links" items={weakLinks.map((item) => item.name)} empty="All visible ingredients are linked to recipes." />
    </div>
  );
}

function QuickAction({ icon: Icon, title, desc, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} className="text-left rounded-2xl border border-border/50 bg-background/70 p-4 transition hover:border-primary/40 hover:shadow-md disabled:opacity-60">
      <Icon className="w-5 h-5 text-primary mb-3" />
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{desc}</p>
    </button>
  );
}

function ChecklistItem({ ok, text }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-background/70 px-3 py-2.5 mb-2">
      {ok ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-amber-600" />}
      <span className="text-sm">{text}</span>
    </div>
  );
}

function IssueList({ title, items, empty }) {
  return (
    <section className="glass-card rounded-3xl border border-border/50 p-5">
      <h2 className="font-heading font-bold text-lg mb-3">{title}</h2>
      {items.length ? (
        <div className="space-y-2">
          {items.map((item) => <p key={item} className="rounded-xl bg-secondary/60 px-3 py-2 text-sm">{item}</p>)}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{empty}</p>
      )}
    </section>
  );
}

function ContentPanel({ title, description, actionLabel, onAction, disabled, children }) {
  return (
    <section>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-4">
        <div>
          <h2 className="font-heading font-bold text-xl">{title}</h2>
          <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>
        </div>
        <button onClick={onAction} disabled={disabled} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 disabled:opacity-60">
          <Upload className="w-4 h-4" />
          {actionLabel}
        </button>
      </div>
      {children}
    </section>
  );
}

function CommunityModeration({ community, approveCommunity, rejectCommunity, deleteCommunity, t }) {
  return (
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
            <button onClick={() => approveCommunity(item.id)} className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 hover:scale-110 transition-transform" aria-label="Approve recipe">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => rejectCommunity(item.id)} className="p-2 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-600 hover:scale-110 transition-transform" aria-label="Reject recipe">
              <X className="w-4 h-4" />
            </button>
            <button onClick={() => deleteCommunity(item.id)} className="p-2 rounded-full bg-red-100 dark:bg-red-900 text-red-600 hover:scale-110 transition-transform" aria-label="Delete recipe">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function AnnouncementManager({ announcements, form, setForm, imageRef, onImageUpload, onSubmit, onToggle, onDelete }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <form onSubmit={onSubmit} className="rounded-3xl border border-border/50 bg-card/85 p-5 shadow-sm">
        <h2 className="font-heading font-bold text-xl mb-1">Create announcement</h2>
        <p className="text-sm text-muted-foreground mb-5">Post updates that users can read from the Announcements page.</p>

        <label className="block text-sm font-semibold mb-2">Title</label>
        <input
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          className="mb-4 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="New scanner update"
        />

        <label className="block text-sm font-semibold mb-2">Category</label>
        <input
          value={form.category}
          onChange={(event) => setForm({ ...form, category: event.target.value })}
          className="mb-4 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Update"
        />

        <label className="block text-sm font-semibold mb-2">Message</label>
        <textarea
          value={form.body}
          onChange={(event) => setForm({ ...form, body: event.target.value })}
          rows={6}
          className="mb-4 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Tell users what changed..."
        />

        <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={(event) => onImageUpload(event.target.files?.[0])} />
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => imageRef.current?.click()} className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2.5 text-sm font-semibold hover:bg-secondary/70">
            <Upload className="w-4 h-4" />
            Upload picture
          </button>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_published} onChange={(event) => setForm({ ...form, is_published: event.target.checked })} />
            Published
          </label>
        </div>

        {form.image_url && <img src={form.image_url} alt="" className="mb-4 h-36 w-full rounded-2xl object-cover" />}

        <button type="submit" className="w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20">
          Publish announcement
        </button>
      </form>

      <section className="space-y-3">
        {announcements.length === 0 ? (
          <p className="rounded-3xl border border-border/50 bg-card/80 p-8 text-center text-muted-foreground">No announcements yet.</p>
        ) : announcements.map((item) => (
          <article key={item.id} className="rounded-3xl border border-border/50 bg-card/85 p-4 shadow-sm">
            <div className="flex gap-4">
              {item.image_url && <img src={item.image_url} alt="" className="h-20 w-24 rounded-2xl object-cover shrink-0" />}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-1">
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary">{item.category || "Update"}</span>
                  <span>{item.is_published ? "Published" : "Draft"}</span>
                </div>
                <h3 className="font-heading font-bold truncate">{item.title}</h3>
                <p className="line-clamp-2 text-sm text-muted-foreground mt-1">{item.body}</p>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => onToggle(item)} className="rounded-full bg-secondary px-3 py-2 text-xs font-semibold hover:bg-secondary/70">
                {item.is_published ? "Unpublish" : "Publish"}
              </button>
              <button onClick={() => onDelete(item.id)} className="rounded-full bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100">
                Delete
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function Integrations() {
  const integrations = [
    { name: "OpenAI Vision", fn: "recognizeIngredient", purpose: "Ingredient recognition from uploaded scanner images.", secret: "OPENAI_API_KEY" },
    { name: "USDA FoodData Central", fn: "lookupFoodNutrition", purpose: "Live nutrition lookup for ingredient records.", secret: "USDA_FDC_API_KEY" },
    { name: "Supabase Storage", fn: "ingrevia-uploads", purpose: "Stores scanner images and dataset import files.", secret: "VITE_SUPABASE_STORAGE_BUCKET" },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {integrations.map((item) => (
        <div key={item.name} className="glass-card rounded-3xl border border-border/50 p-5">
          <Sparkles className="w-6 h-6 text-primary mb-4" />
          <h2 className="font-heading font-bold text-lg">{item.name}</h2>
          <p className="text-sm text-muted-foreground mt-2 min-h-12">{item.purpose}</p>
          <div className="mt-4 space-y-2 text-xs">
            <p className="rounded-xl bg-secondary/60 px-3 py-2"><span className="font-semibold">Function:</span> {item.fn}</p>
            <p className="rounded-xl bg-secondary/60 px-3 py-2"><span className="font-semibold">Secret:</span> {item.secret}</p>
          </div>
        </div>
      ))}
    </div>
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
              {r.meta && <p className="text-[11px] text-muted-foreground/80 mt-1">{r.meta}</p>}
            </div>
            <button onClick={() => onDelete(item.id)} className="shrink-0 p-2 rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 hover:scale-110 transition-transform" aria-label="Delete record">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
