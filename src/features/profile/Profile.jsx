import React from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/lib/AuthContext";
import { useFavorites, useZeroWaste } from "@/lib/favorites";
import { BarChart3, ChefHat, Heart, History, LogOut, ScanLine, UserCircle } from "lucide-react";

export default function Profile() {
  const { user, logout } = useAuth();
  const { favorites } = useFavorites();
  const { appliedTips } = useZeroWaste();
  const displayName = user?.full_name || user?.name || user?.email || "Ingrevia user";
  const isAdmin = user?.email?.toLowerCase() === "shanyuew416@gmail.com";

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <section className="rounded-3xl border border-border/50 bg-card/80 p-6 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center">
              <UserCircle className="w-11 h-11 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-primary">{isAdmin ? "Admin Account" : "My Profile"}</p>
              <h1 className="font-heading font-extrabold text-3xl truncate">{displayName}</h1>
              <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
            </div>
            <button onClick={() => logout(false)} className="inline-flex items-center justify-center gap-2 rounded-full bg-secondary px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary/70">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <ProfileStat icon={Heart} label="Saved recipes" value={favorites.length} />
          <ProfileStat icon={BarChart3} label="Zero-waste tips applied" value={appliedTips.length} />
          <ProfileStat icon={UserCircle} label="Account type" value={isAdmin ? "Admin" : "User"} />
        </div>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ProfileLink to="/scan" icon={ScanLine} title="Scan Ingredient" desc="Upload or capture an ingredient image." />
          <ProfileLink to="/favorites" icon={Heart} title="Favorites" desc="View recipes you saved." />
          <ProfileLink to="/history" icon={History} title="Scan History" desc="Review your previous scans." />
          <ProfileLink to="/kitchen" icon={ChefHat} title="Little Kitchen" desc="Browse Malaysian recipes." />
        </section>
      </div>
    </Layout>
  );
}

function ProfileStat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/80 p-4">
      <Icon className="w-5 h-5 text-primary mb-3" />
      <p className="font-heading font-extrabold text-2xl">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function ProfileLink({ to, icon: Icon, title, desc }) {
  return (
    <Link to={to} className="rounded-2xl border border-border/50 bg-card/80 p-4 transition hover:border-primary/40 hover:shadow-md">
      <Icon className="w-5 h-5 text-primary mb-3" />
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{desc}</p>
    </Link>
  );
}
