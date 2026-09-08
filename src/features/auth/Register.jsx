import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { appApi } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserPlus, Mail, Lock, Loader2, Check } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";
import { safeReturnTo } from "@/lib/authReturnTo";
import { useI18n } from "@/lib/i18n";

export default function Register() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const searchParams = new URLSearchParams(location.search);
  const initialEmail = searchParams.get("email") || "";
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [avoidIngredients, setAvoidIngredients] = useState([]);
  const authNotice = location.state?.authNotice;
  const returnTo = safeReturnTo();
  const destination = returnTo === "/" ? "/profile" : returnTo;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError(t("auth.passwords_no_match"));
      return;
    }
    setLoading(true);
    try {
      await appApi.auth.register({ email, password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || t("auth.registration_failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await appApi.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        appApi.auth.setToken(result.access_token);
      }
      setShowOnboarding(true);
    } catch (err) {
      setError(err.message || t("auth.invalid_code"));
    } finally {
      setLoading(false);
    }
  };

  const toggleAvoidIngredient = (key) => {
    setAvoidIngredients((items) =>
      items.includes(key) ? items.filter((item) => item !== key) : [...items, key]
    );
  };

  const finishOnboarding = () => {
    const payload = {
      avoidIngredients,
      completedAt: new Date().toISOString(),
    };
    localStorage.setItem("ingrevia_onboarding_preferences", JSON.stringify(payload));
    localStorage.setItem(`ingrevia_onboarding_preferences:${email.toLowerCase()}`, JSON.stringify(payload));
    navigate(destination, { replace: true });
  };

  const handleResend = async () => {
    setError("");
    try {
      await appApi.auth.resendOtp(email);
      toast({
        title: t("auth.code_sent"),
        description: t("auth.code_sent_body"),
      });
    } catch (err) {
      setError(err.message || t("auth.resend_failed"));
    }
  };

  const handleGoogle = () => {
    appApi.auth.loginWithProvider("google", destination);
  };

  if (showOtp) {
    return (
      <AuthLayout
        icon={Mail}
        title={t("auth.verify_title")}
        subtitle={t("auth.verify_subtitle").replace("{email}", email)}
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}
        <div className="flex justify-center mb-6">
          <InputOTP
            maxLength={6}
            value={otpCode}
            onChange={setOtpCode}
            autoFocus
            autoComplete="one-time-code"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button
          className="w-full h-12 font-medium"
          onClick={handleVerify}
          disabled={loading || otpCode.length < 6}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t("auth.verifying")}
            </>
          ) : (
            t("auth.verify")
          )}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-4">
          {t("auth.no_code")}{" "}
          <button onClick={handleResend} className="text-primary font-medium hover:underline">
            {t("auth.resend")}
          </button>
        </p>
        <OnboardingDialog
          avoidIngredients={avoidIngredients}
          onFinish={finishOnboarding}
          onSkip={finishOnboarding}
          onToggle={toggleAvoidIngredient}
          open={showOnboarding}
          t={t}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={UserPlus}
      title={t("auth.register_title")}
      subtitle={t("auth.register_subtitle")}
      footer={
        <>
          {t("auth.have_account")}{" "}
          <Link
            to={"/login" + (destination !== "/" ? "?returnTo=" + encodeURIComponent(destination) : "")}
            className="text-primary font-medium hover:underline"
          >
            {t("auth.login")}
          </Link>
        </>
      }
    >
      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium mb-6"
        onClick={handleGoogle}
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        {t("auth.enter_google")}
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">{t("common.or")}</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {authNotice && !error && (
        <div className="mb-4 p-3 rounded-lg bg-amber-50 text-amber-800 text-sm">
          {authNotice}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t("auth.email")}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t("auth.password")}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">{t("auth.confirm_password")}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t("auth.creating_account")}
            </>
          ) : (
            t("auth.create_account")
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}

const AVOID_OPTIONS = [
  { key: "alcohol", label: "Alcohol", emoji: "🍷" },
  { key: "caffeine", label: "Caffeine", emoji: "☕" },
  { key: "celery", label: "Celery", emoji: "🥬" },
  { key: "crustacean", label: "Crustacean", emoji: "🦐" },
  { key: "egg", label: "Egg", emoji: "🥚" },
  { key: "fish", label: "Fish", emoji: "🐟" },
  { key: "gluten", label: "Gluten", emoji: "🌾" },
  { key: "groundnut", label: "Groundnut", emoji: "🥜" },
  { key: "milk", label: "Milk", emoji: "🥛" },
  { key: "mollusc", label: "Mollusc", emoji: "🦪" },
  { key: "mustard", label: "Mustard", emoji: "🟡" },
  { key: "sesame", label: "Sesame", emoji: "⚪" },
  { key: "soybean", label: "Soybean", emoji: "🫘" },
  { key: "sulphites", label: "Sulphites", emoji: "🍇" },
  { key: "tree_nut", label: "Tree nut", emoji: "🌰" },
  { key: "wheat", label: "Wheat", emoji: "🌾" },
  { key: "lactose", label: "Lactose", emoji: "🥛" },
  { key: "yeast", label: "Yeast", emoji: "🍞" },
];

function OnboardingDialog({ avoidIngredients, onFinish, onSkip, onToggle, open, t }) {
  return (
    <Dialog open={open}>
      <DialogContent className="max-w-2xl rounded-3xl border-border/60 p-0">
        <div className="p-6 sm:p-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-1/2 rounded-full bg-primary" />
            </div>
            <button type="button" onClick={onSkip} className="text-sm font-bold text-primary hover:underline">
              {t("common.skip")}
            </button>
          </div>
          <DialogHeader className="text-center">
            <DialogTitle className="font-heading text-2xl sm:text-3xl">
              {t("onboarding.avoid_title")}
            </DialogTitle>
            <DialogDescription>
              {t("onboarding.avoid_subtitle")}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {AVOID_OPTIONS.map((item) => {
              const selected = avoidIngredients.includes(item.key);
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onToggle(item.key)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition ${
                    selected
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-secondary/70 text-foreground hover:bg-secondary"
                  }`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-background text-base shadow-sm">
                    {selected ? <Check className="h-4 w-4 text-primary" /> : item.emoji}
                  </span>
                  {item.label}
                </button>
              );
            })}
          </div>

          <Button type="button" onClick={onFinish} className="mt-8 h-12 w-full rounded-full font-bold">
            {t("common.next")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
