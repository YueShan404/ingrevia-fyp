import React, { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { appApi } from "@/api/supabaseClient";
import { Loader2, Megaphone } from "lucide-react";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    appApi.entities.Announcement.list("-created_date")
      .then((data) => setAnnouncements((data || []).filter((item) => item.is_published !== false)))
      .catch(() => setAnnouncements([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-primary/10 items-center justify-center mb-3">
            <Megaphone className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-heading font-extrabold text-3xl mb-2">Announcements</h1>
          <p className="text-muted-foreground">Updates from the Ingrevia admin team.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : announcements.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">No announcements yet.</p>
        ) : (
          <div className="space-y-5">
            {announcements.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-3xl border border-border/50 bg-card/85 shadow-sm">
                {item.image_url && <img src={item.image_url} alt="" className="h-56 w-full object-cover" />}
                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary">{item.category || "Update"}</span>
                    <span>{new Date(item.created_date).toLocaleDateString()}</span>
                  </div>
                  <h2 className="font-heading font-bold text-xl">{item.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-2 whitespace-pre-line">{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
