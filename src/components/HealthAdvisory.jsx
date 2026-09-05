import React from "react";
import { useI18n } from "@/lib/i18n";
import { analyzeAdvisory } from "@/lib/healthAdvisory";
import { Candy, Droplet, Wheat, Beef, Leaf, Scale, Info, AlertCircle, ShieldCheck } from "lucide-react";

const ICONS = { candy: Candy, salt: Droplet, droplet: Droplet, wheat: Wheat, beef: Beef, leaf: Leaf, scale: Scale };

export default function HealthAdvisory({ nutrition }) {
  const { t } = useI18n();
  const alerts = analyzeAdvisory(nutrition);
  const source = nutrition?.source || "MyFCD / USDA FoodData Central";

  const levelStyles = {
    caution: { bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800", icon: "text-amber-500", iconBg: "bg-amber-100 dark:bg-amber-900" },
    positive: { bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800", icon: "text-emerald-600", iconBg: "bg-emerald-100 dark:bg-emerald-900" },
    info: { bg: "bg-sky-50 dark:bg-sky-950/30", border: "border-sky-200 dark:border-sky-800", icon: "text-sky-600", iconBg: "bg-sky-100 dark:bg-sky-900" },
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-[hsl(126,24%,44%)]" />
        <h3 className="font-heading font-bold text-lg">{t("health_advisory.title")}</h3>
      </div>

      {alerts.map((alert, i) => {
        const style = levelStyles[alert.level] || levelStyles.info;
        const Icon = ICONS[alert.icon] || Info;
        const msgKey = `${alert.key}_msg`;
        return (
          <div key={i} className={`flex items-start gap-3 p-4 rounded-2xl border ${style.bg} ${style.border}`}>
            <div className={`shrink-0 w-9 h-9 rounded-xl ${style.iconBg} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${style.icon}`} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm mb-1">{t(`health_advisory.${alert.key}`)}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{t(`health_advisory.${msgKey}`)}</p>
              {alert.value != null && (
                <p className="mt-2 text-xs font-semibold text-foreground/70">
                  {alert.value}{alert.unit} per 100g · threshold {alert.threshold}{alert.unit}
                </p>
              )}
            </div>
          </div>
        );
      })}

      <div className="rounded-xl border border-border/60 bg-background p-3 text-xs text-muted-foreground">
        {t("health_advisory.source_prefix")}: {source}. {t("health_advisory.source_note")}
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/60 border border-border/50">
        <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">{t("health_advisory.disclaimer")}</p>
      </div>
    </div>
  );
}
