import React, { useState } from "react";
import { useI18n, localized } from "@/lib/i18n";
import { Share2 } from "lucide-react";

/**
 * Share button for recipe cards. Uses the native Web Share API on mobile
 * (which surfaces installed apps such as Instagram / TikTok in the share
 * sheet), and falls back to copying the link to the clipboard on desktop.
 */
export default function RecipeShareButton({ recipe, sharePath, label, className = "" }) {
  const { t, lang } = useI18n();
  const [justCopied, setJustCopied] = useState(false);

  const title = localized(recipe, "title", lang);
  const urlPath = sharePath || `/recipe/${recipe.id}`;
  const absoluteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${urlPath}`
      : urlPath;
  const shareTitle = `${title} — Ingrevia 食知途`;
  const shareText = `Try this Malaysian recipe: ${title}. Found via Ingrevia 食知途.`;

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: absoluteUrl });
        return;
      } catch (err) {
        if (err && err.name === "AbortError") return;
        // fall through to clipboard
      }
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(absoluteUrl);
        setJustCopied(true);
        setTimeout(() => setJustCopied(false), 2200);
      }
    } catch (err) {
      // no-op
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={t("common.share")}
      title={t("common.share")}
      className={`relative inline-flex items-center justify-center transition-transform hover:scale-110 ${className}`}
    >
      <Share2 className="w-4 h-4" />
      {label && <span className="ml-1.5 text-sm font-medium">{label}</span>}
      {justCopied && (
        <span className="absolute top-full right-0 mt-1.5 px-2.5 py-1 rounded-lg bg-foreground text-background text-[10px] font-semibold whitespace-nowrap shadow-lg animate-float-up pointer-events-none">
          {t("common.share_copied")}
        </span>
      )}
    </button>
  );
}