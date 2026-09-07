import React, { useState } from "react";
import Layout from "@/components/Layout";
import { appApi } from "@/api/supabaseClient";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/components/ui/use-toast";
import { HelpCircle, MessageSquareWarning, Send, Languages, Volume2, Contrast, Type, Keyboard, Image as ImageIcon } from "lucide-react";

const FAQ_KEYS = ["support.faq_scan", "support.faq_history", "support.faq_translate", "support.faq_accessibility"];

const FEATURE_KEYS = [
  { key: "support.feature_languages", icon: Languages },
  { key: "support.feature_tts", icon: Volume2 },
  { key: "support.feature_contrast", icon: Contrast },
  { key: "support.feature_text_size", icon: Type },
  { key: "support.feature_keyboard", icon: Keyboard },
  { key: "support.feature_alt", icon: ImageIcon },
];

export default function Support() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [form, setForm] = useState({ type: "feedback", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await appApi.feedback.create(form);
      setForm({ type: "feedback", subject: "", message: "" });
      toast({ title: t("support.sent"), description: t("support.sent_body") });
    } catch (error) {
      toast({
        title: t("support.failed"),
        description: error?.message || t("common.try_again"),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl brand-gradient text-white">
            <HelpCircle className="h-7 w-7" />
          </div>
          <h1 className="font-heading text-3xl font-extrabold">{t("support.title")}</h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">{t("support.subtitle")}</p>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURE_KEYS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.key} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold leading-relaxed">{t(item.key)}</p>
              </div>
            );
          })}
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-[28px] border border-border/60 bg-card p-5 shadow-sm sm:p-6">
            <h2 className="font-heading text-xl font-bold">{t("support.faq_title")}</h2>
            <div className="mt-4 space-y-3">
              {FAQ_KEYS.map((key) => (
                <details key={key} className="rounded-2xl border border-border/60 bg-background p-4">
                  <summary className="cursor-pointer text-sm font-bold">{t(`${key}_q`)}</summary>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`${key}_a`)}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-border/60 bg-card p-5 shadow-sm sm:p-6">
            <h2 className="flex items-center gap-2 font-heading text-xl font-bold">
              <MessageSquareWarning className="h-5 w-5 text-primary" />
              {t("support.report_title")}
            </h2>
            <form className="mt-4 space-y-4" onSubmit={submit}>
              <label className="block text-sm font-semibold">
                {t("support.type")}
                <select
                  value={form.type}
                  onChange={(event) => setForm({ ...form, type: event.target.value })}
                  className="mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm"
                >
                  <option value="feedback">{t("support.type_feedback")}</option>
                  <option value="issue">{t("support.type_issue")}</option>
                </select>
              </label>
              <label className="block text-sm font-semibold">
                {t("support.subject")}
                <input
                  value={form.subject}
                  onChange={(event) => setForm({ ...form, subject: event.target.value })}
                  maxLength={120}
                  required
                  className="mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm"
                />
              </label>
              <label className="block text-sm font-semibold">
                {t("support.message")}
                <textarea
                  value={form.message}
                  onChange={(event) => setForm({ ...form, message: event.target.value })}
                  maxLength={1000}
                  rows={6}
                  required
                  className="mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm"
                />
              </label>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
              >
                <Send className="h-4 w-4" /> {submitting ? t("support.sending") : t("support.send")}
              </button>
            </form>
          </section>
        </div>
      </div>
    </Layout>
  );
}
