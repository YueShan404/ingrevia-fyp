import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { appApi } from "@/api/supabaseClient";
import { useI18n } from "@/lib/i18n";
import Layout from "@/components/Layout";
import FlipCard from "@/components/FlipCard";
import { PenSquare, Upload, Loader2, CheckCircle2, ArrowLeft, Sparkles, Heart } from "lucide-react";

export default function SubmitRecipe() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "", author: "", cuisine: "malay", description: "",
    ingredients: "", steps: "", zero_waste_tip: "",
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleImage = async (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
    try {
      const { file_url } = await appApi.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await appApi.entities.CommunityRecipe.create({
        title: form.title,
        author: form.author,
        cuisine: form.cuisine,
        image_url: imageUrl,
        description: form.description,
        ingredients: form.ingredients.split("\n").filter((l) => l.trim()),
        steps: form.steps.split("\n").filter((l) => l.trim()),
        zero_waste_tip: form.zero_waste_tip,
        status: "pending",
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
        <button onClick={() => { setSubmitted(false); setForm({ title: "", author: "", cuisine: "malay", description: "", ingredients: "", steps: "", zero_waste_tip: "" }); setImagePreview(null); setImageUrl(null); }}
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
            <label className="flex flex-col items-center justify-center h-40 rounded-2xl border-2 border-dashed border-border hover:border-[hsl(18,71%,42%)] cursor-pointer transition-colors overflow-hidden">
              {imagePreview ? (
                <img src={imagePreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-muted-foreground">
                  <Upload className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">{t("submit.upload_photo")}</p>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImage(e.target.files?.[0])} />
            </label>
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