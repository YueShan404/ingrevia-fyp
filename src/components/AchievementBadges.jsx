import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { badgeImage } from "@/lib/achievements";
import { Award, Lock } from "lucide-react";

export default function AchievementBadges({ badges = [], limit, publicView = false, t }) {
  const [open, setOpen] = useState(false);
  const visibleBadges = publicView ? badges.filter((badge) => badge.unlocked) : badges;
  const shown = limit ? visibleBadges.slice(0, limit) : visibleBadges;
  const remaining = limit ? Math.max(0, visibleBadges.length - limit) : 0;

  return (
    <section className="rounded-[24px] border border-border/60 bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-xl font-bold">{t("badges.title")}</h2>
        </div>
        {remaining > 0 && (
          <button type="button" onClick={() => setOpen(true)} className="rounded-full bg-secondary px-4 py-2 text-sm font-bold text-foreground hover:bg-secondary/70">
            {t("badges.view_more")}
          </button>
        )}
      </div>

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-secondary/40 p-6 text-center text-sm text-muted-foreground">
          {t("badges.none_public")}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {shown.map((badge) => <BadgeCard key={badge.id} badge={badge} publicView={publicView} t={t} />)}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle>{t("badges.title")}</DialogTitle>
            <DialogDescription>{t("badges.subtitle")}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {visibleBadges.map((badge) => <BadgeCard key={badge.id} badge={badge} publicView={publicView} t={t} />)}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function BadgeCard({ badge, publicView, t }) {
  const locked = !badge.unlocked && !publicView;

  return (
    <article className={`rounded-2xl border p-3 text-center transition ${badge.unlocked ? rarityClass(badge.rarity) : "border-border bg-secondary/50 text-muted-foreground"}`}>
      <div className="relative mx-auto h-16 w-16">
        <img src={badgeImage(badge.id)} alt={badge.name} className={`h-full w-full object-contain ${locked ? "grayscale opacity-35" : ""}`} />
        {locked && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/45">
            <Lock className="h-5 w-5" />
          </span>
        )}
      </div>
      <h3 className="mt-2 text-sm font-extrabold leading-tight">{badge.name}</h3>
      <p className="mt-1 min-h-8 text-xs leading-snug text-muted-foreground">{badge.description}</p>
      {!publicView && (
        <>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-background">
            <div className="h-full rounded-full bg-primary" style={{ width: `${badge.progress}%` }} />
          </div>
          <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
            {badge.value}/{badge.target} · {badge.requirement}
          </p>
        </>
      )}
      {badge.unlocked && (
        <p className="mt-2 text-[11px] font-bold text-primary">
          {t("badges.earned")}
        </p>
      )}
    </article>
  );
}

function rarityClass(rarity) {
  if (rarity === "master") return "border-yellow-400 bg-yellow-50 shadow-sm shadow-yellow-200/70";
  if (rarity === "gold") return "border-yellow-300 bg-yellow-50";
  if (rarity === "silver") return "border-slate-300 bg-slate-50";
  return "border-orange-200 bg-orange-50";
}
