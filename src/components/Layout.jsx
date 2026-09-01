import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/AuthContext";
import Logo from "@/components/Logo";
import LanguageSwitcher from "./LanguageSwitcher";
import AccessibilityPanel from "./AccessibilityPanel";
import { Menu, X, ScanLine, BookOpen, ChefHat, Home as HomeIcon, Heart, BarChart3, Users, CalendarDays, PenSquare, History, Shield, ChevronDown, UserCircle } from "lucide-react";

export default function Layout({ children }) {
  const { t, lang } = useI18n();
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [a11yOpen, setA11yOpen] = useState(false);
  const moreRef = useRef(null);

  useEffect(() => {
    setMoreOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const primaryLinks = [
    { to: "/", label: t("nav.home"), icon: HomeIcon },
    { to: "/encyclopedia", label: t("nav.encyclopedia"), icon: BookOpen },
    { to: "/kitchen", label: t("nav.kitchen"), icon: ChefHat },
    { to: "/community", label: t("nav.community"), icon: Users },
  ];
  const isAdmin = user?.role === "admin";
  const secondaryLinks = [
    { to: "/favorites", label: t("nav.favorites"), icon: Heart },
    { to: "/planner", label: t("nav.planner"), icon: CalendarDays },
    { to: "/submit", label: t("nav.submit"), icon: PenSquare },
    { to: "/history", label: t("nav.history"), icon: History },
    { to: "/dashboard", label: t("nav.dashboard"), icon: BarChart3 },
    ...(isAdmin ? [{ to: "/admin", label: t("nav.admin"), icon: Shield }] : []),
  ];
  const allLinks = [...primaryLinks, { to: "/scan", label: t("nav.scan"), icon: ScanLine }, ...secondaryLinks];

  const isActive = (path) => (path === "/" ? location.pathname === "/" : location.pathname.startsWith(path));

  return (
    <div className="relative min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-background">
      <div className="leaf-blob w-72 h-72 bg-[hsl(19,53%,55%)] -top-24 -right-24" />
      <div className="leaf-blob w-80 h-80 bg-[hsl(126,24%,44%)] top-[28rem] -left-44" style={{ animationDelay: "3s" }} />

      <header className="sticky top-0 z-50 w-full max-w-full bg-white/92 backdrop-blur-xl border-b border-border/60 shadow-sm">
        <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center justify-between min-h-16 sm:min-h-20 gap-2 sm:gap-4">
            <Link to="/" className="flex min-w-0 items-center shrink group">
              <Logo size={32} showTagline lang={lang} className="hidden sm:inline-flex" />
              <Logo size={34} showWordmark={false} lang={lang} className="sm:hidden" />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1.5">
              {primaryLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link key={link.to} to={link.to}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold transition-all ${
                      isActive(link.to)
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                        : "text-foreground/70 hover:bg-secondary hover:text-foreground"
                    }`}>
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
              {/* More dropdown */}
              <div className="relative" ref={moreRef}>
                <button onClick={() => setMoreOpen(!moreOpen)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    secondaryLinks.some((l) => isActive(l.to)) ? "bg-accent text-accent-foreground" : "text-foreground/70 hover:bg-secondary"
                  }`}>
                  {t("nav.more")} <ChevronDown className={`w-3.5 h-3.5 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
                </button>
                {moreOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 glass-card rounded-2xl shadow-xl border border-border/60 p-2 animate-float-up">
                    {secondaryLinks.map((link) => {
                      const Icon = link.icon;
                      return (
                        <Link key={link.to} to={link.to} onClick={() => setMoreOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                            isActive(link.to) ? "bg-secondary text-foreground font-semibold" : "text-foreground/70 hover:bg-secondary"
                          }`}>
                          <Icon className="w-4 h-4 text-primary" />
                          {link.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </nav>

            <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
              <Link
                to="/scan"
                className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg transition-all"
              >
                <ScanLine className="w-4 h-4" />
                {t("nav.scan")}
              </Link>
              <div className="hidden sm:flex items-center gap-2">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/profile"
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                        isActive("/profile")
                          ? "bg-secondary text-foreground"
                          : "text-foreground/75 hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <UserCircle className="w-4 h-4" />
                      {t("nav.profile")}
                    </Link>
                    <button
                      onClick={() => logout(false)}
                      className="px-4 py-2 rounded-full text-sm font-semibold text-foreground/75 hover:bg-secondary hover:text-foreground transition-colors"
                    >
                      {t("auth.logout")}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="px-4 py-2 rounded-full text-sm font-semibold text-foreground/75 hover:bg-secondary hover:text-foreground transition-colors"
                    >
                      {t("auth.login")}
                    </Link>
                    <Link
                      to="/register"
                      className="px-4 py-2 rounded-full text-sm font-semibold bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg transition-all"
                    >
                      {t("auth.register")}
                    </Link>
                  </>
                )}
              </div>
              <div className="hidden min-[380px]:block">
                <AccessibilityPanel open={a11yOpen} setOpen={setA11yOpen} />
              </div>
              <div className="hidden min-[430px]:block sm:block">
                <LanguageSwitcher />
              </div>
              <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded-full hover:bg-secondary transition-colors" aria-label="Menu">
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

      </header>

      {/* Mobile drawer — slides in from the left for a warm, 3D-feel */}
      <div
        onClick={() => setMobileOpen(false)}
        className={`lg:hidden fixed inset-0 z-40 bg-[hsl(17,37%,19%,0.55)] backdrop-blur-sm transition-opacity duration-300 ease-out ${
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!mobileOpen}
      />
      <aside
        className={`lg:hidden fixed top-0 left-0 z-50 h-full w-[min(20rem,88vw)] bg-card border-r border-border/60 shadow-[24px_0_60px_-20px_rgba(0,0,0,0.45)] transition-transform duration-300 ease-out will-change-transform ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!mobileOpen}
      >
        <div className="flex items-center justify-between p-4 border-b border-border/40 bg-secondary/30">
          <Logo size={32} lang={lang} />
          <button onClick={() => setMobileOpen(false)} className="p-2 rounded-full hover:bg-secondary transition-colors" aria-label={t("common.close")}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-4 flex flex-col gap-1 overflow-y-auto max-h-[calc(100%-4.25rem)]">
          <div className="mb-3 flex items-center justify-between rounded-2xl border border-border/60 bg-secondary/40 p-3">
            <span className="text-sm font-semibold text-foreground/80">{t("accessibility.title")}</span>
            <AccessibilityPanel open={a11yOpen} setOpen={setA11yOpen} />
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3 sm:hidden">
            {isAuthenticated ? (
              <>
                <Link to="/profile" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-2xl text-sm font-semibold bg-primary text-primary-foreground text-center">
                  {t("nav.profile")}
                </Link>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    logout(false);
                  }}
                  className="px-4 py-3 rounded-2xl text-sm font-semibold bg-secondary text-foreground"
                >
                  {t("auth.logout")}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-2xl text-sm font-semibold bg-secondary text-center">
                  {t("auth.login")}
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-2xl text-sm font-semibold bg-primary text-primary-foreground text-center">
                  {t("auth.register")}
                </Link>
              </>
            )}
          </div>
          {allLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-colors ${
                  isActive(link.to) ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" : "text-foreground/80 hover:bg-secondary"
                }`}>
                <Icon className="w-5 h-5" /> {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 relative z-10 w-full max-w-full overflow-x-hidden">{children}</main>

      <footer className="relative z-10 w-full max-w-full overflow-x-hidden forest-gradient text-white mt-12">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Logo size={40} showTagline lang={lang} />
              </div>
              <p className="text-white/70 text-sm">{t("footer.made_for")}</p>
              <p className="text-[hsl(40,33%,88%)] text-xs font-semibold tracking-widest mt-3">{t("footer.tagline")}</p>
            </div>
            <div>
              <h4 className="font-heading font-bold mb-3 text-sm tracking-wide uppercase text-white/90">{t("nav.scan")} • {t("nav.encyclopedia")}</h4>
              <div className="flex flex-col gap-2 text-sm text-white/70">
                {primaryLinks.map((l) => (
                  <Link key={l.to} to={l.to} className="hover:text-primary transition-colors w-fit">{l.label}</Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-heading font-bold mb-3 text-sm tracking-wide uppercase text-white/90">{t("nav.more")}</h4>
              <div className="flex flex-col gap-2 text-sm text-white/70">
                {secondaryLinks.map((l) => (
                  <Link key={l.to} to={l.to} className="hover:text-primary transition-colors w-fit">{l.label}</Link>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-white/15 mt-8 pt-6 text-center text-xs text-white/50">
            {t("footer.rights")} - SDG 2 - SDG 3 - SDG 4 - SDG 12
          </div>
        </div>
      </footer>
    </div>
  );
}
