import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { appApi } from "@/api/supabaseClient";
import { useI18n } from "@/lib/i18n";
import Layout from "@/components/Layout";
import FlipCard from "@/components/FlipCard";
import { PenSquare, Upload, Loader2, CheckCircle2, ArrowLeft, Sparkles, Heart } from "lucide-react";

const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const TAG_OPTIONS = ["herb", "vegetable", "fruit", "spice", "seafood", "grain", "legume", "other"];

export default function SubmitRecipe() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "", author: "", cuisine: "malay", description: "",
    ingredients: "", steps: "", zero_waste_tip: "",
    spice_level: "medium", prep_time: "", cook_time: "", servings: "2",
  });
  const [mainTags, setMainTags] = useState([]);
  const [images, setImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleImages = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    if (images.length + files.length > MAX_IMAGES) {
      alert((t("submit.image_limit") || "Please upload 1 to 5 images.").replace("{max}", MAX_IMAGES));
      return;
    }
    const invalid = files.find((file) => !ALLOWED_IMAGE_TYPES.includes(file.type) || file.size > MAX_IMAGE_BYTES);
    if (invalid) {
      alert(t("submit.image_rules") || "Images must be JPG, PNG, or WebP and 2MB or smaller.");
      return;
    }
    setUploadingImages(true);
    try {
      const uploaded = await Promise.all(files.map(async (file) => {
        const preview = URL.createObjectURL(file);
        const { file_url } = await appApi.integrations.Core.UploadFile({ file });
        return { preview, url: file_url, name: file.name };
      }));
      setImages((current) => [...current, ...uploaded]);
    } catch (err) {
      alert("Image upload failed: " + (err.message || "Please try again."));
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index) => {
    setImages((current) => current.filter((_, i) => i !== index));
  };

  const toggleTag = (tag) => {
    setMainTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length < 1) {
      alert(t("submit.image_required") || "Please upload at least one recipe image.");
      return;
    }
    setSubmitting(true);
    try {
      const ingredients = form.ingredients.split("\n").map((l) => l.trim()).filter(Boolean);
      const steps = form.steps.split("\n").map((l) => l.trim()).filter(Boolean);
      const recipeText = {
        title: form.title,
        description: form.description,
        ingredients,
        steps,
        zero_waste_tip: form.zero_waste_tip,
      };
      let autoTranslations = {};

      try {
        const resp = await appApi.functions.invoke("translateRecipeContent", recipeText);
        const translated = resp?.data || {};
        autoTranslations = {
          title_bm: translated.bm?.title,
          title_zh: translated.zh?.title,
          title_ta: translated.ta?.title,
          description_bm: translated.bm?.description,
          description_zh: translated.zh?.description,
          description_ta: translated.ta?.description,
          ingredients_bm: translated.bm?.ingredients || [],
          ingredients_zh: translated.zh?.ingredients || [],
          ingredients_ta: translated.ta?.ingredients || [],
          steps_bm: translated.bm?.steps || [],
          steps_zh: translated.zh?.steps || [],
          steps_ta: translated.ta?.steps || [],
          zero_waste_tip_bm: translated.bm?.zero_waste_tip,
          zero_waste_tip_zh: translated.zh?.zero_waste_tip,
          zero_waste_tip_ta: translated.ta?.zero_waste_tip,
        };
      } catch (translationError) {
        console.warn("Recipe auto-translation failed; saving original recipe only.", translationError);
      }

      await appApi.entities.CommunityRecipe.create({
        title: form.title,
        author: form.author,
        cuisine: form.cuisine,
        image_url: images[0]?.url,
        image_urls: images.map((image) => image.url),
        description: form.description,
        ingredients,
        steps,
        main_ingredient_tags: mainTags,
        spice_level: form.spice_level,
        prep_time: Number(form.prep_time) || null,
        cook_time: Number(form.cook_time) || null,
        servings: Number(form.servings) || 2,
        zero_waste_tip: form.zero_waste_tip,
        status: "pending",
        ...autoTranslations,
      });
      setSubmitted(true);
    } catch (err) {
      alert("Error: " + (err.message || "Failed to submit"));
    }
    setSubmitting(false);
  };

  const flipFront = () => (
    <div className="h-full glass-card rounded-3xl border border-border/50 p-8 flex flex-col items-center justify-center text-center">
      <div className="w-20 h-20 rounded-full brand-gradient flex items-center justify-center mb-5 shadow-lg shadow-[hsl(18,71%,42%,0.3)]">
        <CheckCircle2 className="w-10 h-10 text-white" />
      </div>
      <h2 className="font-heading font-extrabold text-2xl mb-2">{t("submit.success_title")}</h2>
      <p className="text-muted-foreground text-sm max-w-xs mb-4">{t("submit.success_body")}</p>
      <div className="flex items-center gap-1.5 text-xs text-[hsl(126,24%,28%)] animate-pulse">
        <Sparkles className="w-3.5 h-3.5" /> {t("submit.success_flip")}
      </div>
    </div>
  );

  const flipBack = () => (
    <div className="h-full forest-gradient rounded-3xl p-8 flex flex-col items-center justify-center text-center text-white">
      <div className="w-20 h-20 rounded-full bg-white/15 flex items-center justify-center mb-5">
        <Heart className="w-10 h-10 text-[hsl(18,71%,42%)]" />
      </div>
      <h2 className="font-heading font-extrabold text-2xl mb-2">Ingrevia 🌱</h2>
      <p className="text-white/70 text-sm mb-6 max-w-xs">{t("submit.success_body")}</p>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        <button onClick={() => navigate("/community")}
          className="px-5 py-2.5 rounded-full brand-gradient text-white font-semibold text-sm">{t("submit.view_community")}</button>
        <button onClick={() => { setSubmitted(false); setForm({ title: "", author: "", cuisine: "malay", description: "", ingredients: "", steps: "", zero_waste_tip: "", spice_level: "medium", prep_time: "", cook_time: "", servings: "2" }); setImages([]); setMainTags([]); }}
          className="px-5 py-2.5 rounded-full bg-white/15 text-white font-semibold text-sm hover:bg-white/25 transition-colors">{t("submit.share_another")}</button>
      </div>
    </div>
  );

  if (submitted) {
    return (
      <Layout>
        <div className="max-w-md mx-auto px-4 py-12">
          <FlipCard front={flipFront} back={flipBack} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/community" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> {t("nav.community")}
        </Link>
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl brand-gradient items-center justify-center mb-3">
            <PenSquare className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-heading font-extrabold text-3xl mb-2">{t("submit.title")}</h1>
          <p className="text-muted-foreground">{t("submit.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-3xl border border-border/50 p-6 space-y-5">
          {/* Photo */}
          <div>
            <label className="block text-sm font-semibold mb-2">{t("submit.photo")}</label>
            <label className="flex flex-col items-center justify-center min-h-40 rounded-2xl border-2 border-dashed border-border hover:border-[hsl(18,71%,42%)] cursor-pointer transition-colors overflow-hidden p-4">
              <div className="text-center text-muted-foreground">
                <Upload className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm font-medium">{uploadingImages ? t("submit.uploading") : t("submit.upload_photo")}</p>
                <p className="text-xs mt-1">{t("submit.image_rules")}</p>
              </div>
              <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => handleImages(e.target.files)} />
            </label>
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-3">
                {images.map((image, index) => (
                  <div key={`${image.url}-${index}`} className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-secondary">
                    <img src={image.preview || image.url} alt="" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => removeImage(index)} className="absolute right-1.5 top-1.5 rounded-full bg-black/65 px-2 py-0.5 text-xs font-bold text-white">
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={t("submit.recipe_title")} required>
              <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[hsl(18,71%,42%)]" />
            </Field>
            <Field label={t("submit.author")} required>
              <input type="text" required value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[hsl(18,71%,42%)]" />
            </Field>
          </div>

          <Field label={t("submit.cuisine")} required>
            <select value={form.cuisine} onChange={(e) => setForm({ ...form, cuisine: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[hsl(18,71%,42%)]">
              <option value="malay">{t("kitchen.cuisines.malay")}</option>
              <option value="chinese">{t("kitchen.cuisines.chinese")}</option>
              <option value="indian">{t("kitchen.cuisines.indian")}</option>
              <option value="other">{t("common.other") || "Other"}</option>
            </select>
          </Field>

          <div className="grid sm:grid-cols-3 gap-4">
            <Field label={t("submit.prep_time")} required>
              <input type="number" min="0" required value={form.prep_time} onChange={(e) => setForm({ ...form, prep_time: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[hsl(18,71%,42%)]" />
            </Field>
            <Field label={t("submit.cook_time")} required>
              <input type="number" min="0" required value={form.cook_time} onChange={(e) => setForm({ ...form, cook_time: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[hsl(18,71%,42%)]" />
            </Field>
            <Field label={t("submit.servings")} required>
              <input type="number" min="1" required value={form.servings} onChange={(e) => setForm({ ...form, servings: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[hsl(18,71%,42%)]" />
            </Field>
          </div>

          <Field label={t("submit.spice_level")} required>
            <select value={form.spice_level} onChange={(e) => setForm({ ...form, spice_level: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[hsl(18,71%,42%)]">
              <option value="mild">{t("kitchen.spice.mild")}</option>
              <option value="medium">{t("kitchen.spice.medium")}</option>
              <option value="spicy">{t("kitchen.spice.spicy")}</option>
            </select>
          </Field>

          <Field label={t("submit.main_tags")}>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map((tag) => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)}
                  className={`rounded-full px-3 py-2 text-xs font-semibold transition-colors ${
                    mainTags.includes(tag) ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/75 hover:bg-secondary/70"
                  }`}>
                  {t(`encyclopedia.categories.${tag}`) || tag}
                </button>
              ))}
            </div>
          </Field>

          <Field label={t("submit.description")}>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[hsl(18,71%,42%)] resize-none" />
          </Field>

          <Field label={t("submit.ingredients")}>
            <textarea value={form.ingredients} onChange={(e) => setForm({ ...form, ingredients: e.target.value })} rows={4}
              placeholder="2 cups rice&#10;1 cup coconut milk&#10;..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[hsl(18,71%,42%)] resize-none" />
          </Field>

          <Field label={t("submit.steps")}>
            <textarea value={form.steps} onChange={(e) => setForm({ ...form, steps: e.target.value })} rows={4}
              placeholder="Wash and soak rice&#10;Cook with coconut milk&#10;..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[hsl(18,71%,42%)] resize-none" />
          </Field>

          <Field label={t("submit.zero_waste")}>
            <input type="text" value={form.zero_waste_tip} onChange={(e) => setForm({ ...form, zero_waste_tip: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[hsl(18,71%,42%)]" />
          </Field>

          <button type="submit" disabled={submitting}
            className="w-full py-3.5 rounded-full brand-gradient text-white font-semibold shadow-lg shadow-[hsl(18,71%,42%,0.3)] hover:scale-[1.02] transition-transform disabled:opacity-60 flex items-center justify-center gap-2">
            {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> {t("submit.submitting")}</> : t("submit.submit_btn")}
          </button>
        </form>
      </div>
    </Layout>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1.5">{label} {required && <span className="text-red-500">*</span>}</label>
      {children}
    </div>
  );
}
