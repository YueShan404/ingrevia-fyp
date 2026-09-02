import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { appApi } from "@/api/supabaseClient";
import { useI18n } from "@/lib/i18n";
import Layout from "@/components/Layout";
import IngreviaLoader from "@/components/IngreviaLoader";
import { History as HistoryIcon, Trash2, ArrowRight } from "lucide-react";

export default function ScanHistoryPage() {
  const { t } = useI18n();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    appApi.scanHistory.listRecent(30, 50).then((data) => {
      setHistory(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const clearHistory = async () => {
    if (!confirm(t("history.clear") + "?")) return;
    for (const item of history) {
      await appApi.entities.ScanHistory.delete(item.id).catch(() => {});
    }
    load();
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex w-14 h-14 rounded-2xl brand-gradient items-center justify-center mb-3">
              <HistoryIcon className="w-7 h-7 text-white" />
            </div>
            <h1 className="font-heading font-extrabold text-3xl mb-1">{t("history.title")}</h1>
            <p className="text-muted-foreground">{t("history.subtitle")}</p>
          </div>
          {history.length > 0 && (
            <button onClick={clearHistory}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors">
              <Trash2 className="w-4 h-4" /> {t("history.clear")}
            </button>
          )}
        </div>

        {loading ? (
          <IngreviaLoader compact message={t("loading.history")} />
        ) : history.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto rounded-full bg-secondary flex items-center justify-center mb-4">
              <HistoryIcon className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground">{t("history.empty")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.id} className="flex items-center gap-4 glass-card rounded-2xl border border-border/50 p-3 hover:shadow-md transition-all">
                {item.image_url ? (
                  <img src={item.image_url} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-secondary shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{item.ingredient_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden max-w-[120px]">
                      <div className="h-full brand-gradient rounded-full" style={{ width: `${item.confidence || 0}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{item.confidence || 0}%</span>
                    {item.matched && <span className="text-xs text-[hsl(126,24%,28%)] font-medium">✓</span>}
                  </div>
                </div>
                {item.ingredient_id && (
                  <Link to={`/ingredient/${item.ingredient_id}`}
                    className="shrink-0 p-2 rounded-full hover:bg-secondary transition-colors">
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
