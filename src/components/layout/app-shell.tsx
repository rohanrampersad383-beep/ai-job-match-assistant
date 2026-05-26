"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  FileText,
  Globe,
  History,
  LayoutDashboard,
  ListChecks,
  Settings,
  UserRound
} from "lucide-react";
import { PropsWithChildren } from "react";

import { MatchIQLogo } from "@/components/branding/matchiq-logo";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/review-queue", label: "Review Queue", icon: ListChecks },
  { href: "/sources", label: "Sources", icon: Globe },
  { href: "/discovery-runs", label: "Discovery Runs", icon: History },
  { href: "/applications", label: "Applications", icon: BriefcaseBusiness },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/resume", label: "Resume", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function AppShell({
  children,
  userName
}: PropsWithChildren<{ userName: string }>) {
  const pathname = usePathname();

  return (
    <div className="container-shell py-4 lg:py-6">
      <div className="grid gap-6 xl:grid-cols-[310px_minmax(0,1fr)] 2xl:gap-7">
        <aside className="glass-panel sticky top-4 self-start overflow-hidden rounded-[var(--radius-panel)] p-5 shadow-[var(--shadow-strong)]">
          <div className="rounded-[1.25rem] border border-white/10 bg-[image:var(--gradient-brand-soft)] px-5 py-6 text-white shadow-[var(--shadow-glow)]">
            <MatchIQLogo />
            <p className="mt-5 text-xl font-semibold">{userName}</p>
            <p className="mt-2 text-sm leading-6 text-white/72">
              Career intelligence workspace for ranked opportunities, fit signals, and human-controlled applications.
            </p>
          </div>

          <nav className="mt-6 flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-[var(--radius-lg)] border px-4 py-3.5 text-sm font-medium transition",
                    active
                      ? "border-[var(--border-glow)] bg-[image:var(--gradient-active)] text-white shadow-[var(--shadow-glow)]"
                      : "border-transparent text-[var(--secondary)] hover:border-[var(--border)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground-strong)]"
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex size-9 items-center justify-center rounded-xl transition",
                      active
                        ? "bg-white/14 text-white"
                        : "bg-[var(--surface-muted)] text-[var(--secondary)] group-hover:bg-[var(--primary)]/10 group-hover:text-white"
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {active ? <span className="size-2 rounded-full bg-[var(--surface)]" /> : null}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-4 text-sm leading-6 text-[var(--muted-strong)]">
            Tip: use the review queue after discovery runs to triage high-signal opportunities quickly.
          </div>

          <form action={signOutAction} className="mt-6">
            <Button className="w-full" size="lg" variant="secondary" type="submit">
              Sign out
            </Button>
          </form>
        </aside>

        <div className="min-w-0 space-y-7">{children}</div>
      </div>
    </div>
  );
}
