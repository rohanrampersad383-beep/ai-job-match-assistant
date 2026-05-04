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
        <aside className="glass-panel sticky top-4 self-start overflow-hidden rounded-[2rem] border border-white/55 p-5 shadow-[var(--shadow-strong)]">
          <div className="rounded-[1.6rem] bg-[linear-gradient(160deg,#12384d_0%,#175978_58%,#148a7a_100%)] px-5 py-6 text-white shadow-[var(--shadow-strong)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/72">
              Job Match Assistant
            </p>
            <p className="mt-4 text-xl font-semibold tracking-[-0.02em]">{userName}</p>
            <p className="mt-2 text-sm leading-6 text-white/80">
              Discovery-first workflow. Manual apply only. Legal sourcing only.
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
                    "group flex items-center gap-3 rounded-[1rem] border px-4 py-3.5 text-sm font-medium transition",
                    active
                      ? "border-transparent bg-[linear-gradient(135deg,#12384d_0%,#175978_100%)] text-white shadow-[var(--shadow-soft)]"
                      : "border-transparent text-[var(--secondary)] hover:border-white/60 hover:bg-white/92 hover:text-[var(--foreground-strong)]"
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex size-9 items-center justify-center rounded-xl transition",
                      active
                        ? "bg-white/14 text-white"
                        : "bg-[var(--muted-surface)] text-[var(--secondary)] group-hover:bg-[var(--secondary)]/10"
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {active ? <span className="size-2 rounded-full bg-white/80" /> : null}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 rounded-[1.35rem] border border-[rgba(20,138,122,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(239,248,246,0.88)_100%)] px-4 py-4 text-sm leading-6 text-[var(--muted-strong)]">
            Tip: use the review queue after discovery runs to triage new Trinidad and Tobago and remote-friendly roles quickly.
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
