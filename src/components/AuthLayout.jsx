import React from "react";
import Logo from "@/components/Logo";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(99,54,180,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(18,113,56,0.10),transparent_30%),hsl(var(--background))] px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo size={40} showTagline />
        </div>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl brand-gradient mb-4 shadow-lg shadow-primary/20">
            <Icon className="w-7 h-7 text-primary-foreground" aria-hidden="true" />
          </div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
        </div>
        <div className="glass-card rounded-3xl shadow-sm border border-border/60 p-6 sm:p-8">
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}
