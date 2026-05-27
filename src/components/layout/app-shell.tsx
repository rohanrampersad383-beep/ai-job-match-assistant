"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  ChevronRight,
  FileText,
  Globe,
  History,
  LayoutDashboard,
  ListChecks,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { PropsWithChildren, useMemo, useState } from "react";

import { MatchIQLogo } from "@/components/branding/matchiq-logo";
import { CommandPalette } from "@/components/layout/command-palette";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Command",
    items: [
      { href: "/dashboard", label: "Dashboard", hint: "Command center", icon: LayoutDashboard },
      { href: "/review-queue", label: "Review Queue", hint: "Triage signals", icon: ListChecks },
      { href: "/applications", label: "Applications", hint: "Pipeline", icon: BriefcaseBusiness }
    ]
  },
  {
    label: "Intelligence",
    items: [
      { href: "/sources", label: "Sources", hint: "Discovery inputs", icon: Globe },
      { href: "/discovery-runs", label: "Discovery Runs", hint: "Import health", icon: History },
      { href: "/resume", label: "Resume", hint: "Profile signals", icon: FileText }
    ]
  },
  {
    label: "Workspace",
    items: [
      { href: "/profile", label: "Profile", hint: "Career targets", icon: UserRound },
      { href: "/settings", label: "Settings", hint: "Scoring rules", icon: Settings }
    ]
  }
] as const;

const pageLabels = new Map(
  navGroups.flatMap((group) => group.items.map((item) => [item.href, item.label] as const))
);

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function resolvePageLabel(pathname: string) {
  const match = Array.from(pageLabels.keys())
    .sort((left, right) => right.length - left.length)
    .find((href) => pathname === href || pathname.startsWith(`${href}/`));

  return match ? pageLabels.get(match) ?? "Workspace" : "Workspace";
}

function SidebarNavigation({
  pathname,
  collapsed,
  onNavigate
}: {
  pathname: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav className="mt-6 flex flex-1 flex-col gap-5">
      {navGroups.map((group) => (
        <div key={group.label}>
          {!collapsed ? (
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase text-[var(--muted)]">{group.label}</p>
          ) : null}
          <div className="grid gap-1.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  onClick={onNavigate}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-[var(--radius-lg)] border px-3 py-3 text-sm font-medium transition",
                    collapsed && "justify-center px-2",
                    active
                      ? "border-[var(--border-glow)] bg-[image:var(--gradient-active)] text-white shadow-[var(--shadow-glow)]"
                      : "border-transparent text-[var(--secondary)] hover:border-[var(--border)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground-strong)]"
                  )}
                >
                  <span
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-[var(--radius-md)] transition",
                      active
                        ? "bg-white/14 text-white"
                        : "bg-[var(--surface-muted)] text-[var(--secondary)] group-hover:bg-[var(--primary)]/10 group-hover:text-white"
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  {!collapsed ? (
                    <>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{item.label}</span>
                        <span className="mt-0.5 block truncate text-xs font-normal text-[var(--muted)]">{item.hint}</span>
                      </span>
                      {active ? <span className="size-2 rounded-full bg-[var(--accent-cyan)] shadow-[var(--shadow-cyan)]" /> : null}
                    </>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function AppShell({
  children,
  userName
}: PropsWithChildren<{ userName: string }>) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const pageLabel = resolvePageLabel(pathname);
  const initials = useMemo(() => getInitials(userName), [userName]);

  return (
    <div className={cn("app-shell-grid min-h-screen", collapsed && "app-shell-grid-collapsed")}>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />

      <aside className={cn("app-sidebar hidden lg:flex", collapsed && "app-sidebar-collapsed")}>
        <div className="flex items-center justify-between gap-3">
          <Link href="/dashboard" aria-label="MatchIQ dashboard">
            <MatchIQLogo showText={!collapsed} markClassName={collapsed ? "size-9" : undefined} />
          </Link>
          <button
            className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-muted)] p-2 text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:text-white"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
        </div>

        <button
          className={cn(
            "mt-5 flex min-h-11 items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-muted)] px-3 text-left text-sm text-[var(--muted)] transition hover:border-[var(--border-glow)] hover:text-white",
            collapsed && "justify-center px-2"
          )}
          onClick={() => setCommandOpen(true)}
        >
          <Search className="size-4 shrink-0 text-[var(--accent-cyan)]" />
          {!collapsed ? (
            <>
              <span className="flex-1">Search commands</span>
              <kbd className="rounded-[var(--radius-sm)] border border-[var(--border)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--muted)]">Ctrl K</kbd>
            </>
          ) : null}
        </button>

        <SidebarNavigation pathname={pathname} collapsed={collapsed} />

        <div className={cn("mt-5 rounded-[1.2rem] border border-[var(--border)] bg-[var(--surface-muted)] p-4", collapsed && "p-2")}>
          {!collapsed ? (
            <>
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                <Sparkles className="size-4 text-[var(--accent-cyan)]" />
                Match signal
              </div>
              <p className="mt-2 text-xs leading-5 text-[var(--muted)]">Review queue is the fastest path to high-confidence decisions.</p>
            </>
          ) : (
            <Sparkles className="mx-auto size-4 text-[var(--accent-cyan)]" />
          )}
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[var(--z-overlay)] lg:hidden">
          <button className="absolute inset-0 bg-black/58 backdrop-blur-sm" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
          <aside className="motion-reveal-up app-sidebar app-sidebar-drawer flex w-[min(88vw,330px)] rounded-none border-y-0 border-l-0">
            <div className="flex items-center justify-between gap-3">
              <MatchIQLogo />
              <button className="rounded-[var(--radius-md)] p-2 text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-white" aria-label="Close navigation" onClick={() => setMobileOpen(false)}>
                <X className="size-5" />
              </button>
            </div>
            <button className="mt-5 flex min-h-11 items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-muted)] px-3 text-sm text-[var(--muted)]" onClick={() => setCommandOpen(true)}>
              <Search className="size-4 text-[var(--accent-cyan)]" />
              Search commands
            </button>
            <SidebarNavigation pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}

      <main className="min-w-0">
        <div className="sticky top-0 z-[var(--z-sticky)] border-b border-[var(--border)] bg-[rgba(7,10,17,0.72)] px-4 py-3 backdrop-blur-2xl lg:px-6">
          <div className="app-topbar">
            <div className="flex min-w-0 items-center gap-3">
              <button className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-muted)] p-2 text-[var(--muted)] transition hover:text-white lg:hidden" aria-label="Open navigation" onClick={() => setMobileOpen(true)}>
                <Menu className="size-5" />
              </button>
              <div className="min-w-0">
                <p className="text-xs uppercase text-[var(--muted)]">MatchIQ command center</p>
                <h1 className="truncate font-display text-xl font-semibold text-[var(--foreground-strong)] md:text-2xl">{pageLabel}</h1>
              </div>
            </div>

            <button className="hidden min-h-11 min-w-[280px] flex-1 items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-muted)] px-4 text-left text-sm text-[var(--muted)] transition hover:border-[var(--border-glow)] hover:text-white md:flex xl:max-w-xl" onClick={() => setCommandOpen(true)}>
              <Search className="size-4 text-[var(--accent-cyan)]" />
              <span className="flex-1">Search roles, sources, resumes, commands...</span>
              <kbd className="rounded-[var(--radius-sm)] border border-[var(--border)] px-2 py-1 font-mono text-[10px] text-[var(--muted)]">Ctrl K</kbd>
            </button>

            <div className="flex items-center gap-2">
              <button className="grid size-11 place-items-center rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:text-white" aria-label="Notifications">
                <Bell className="size-4" />
              </button>
              <details className="group relative">
                <summary className="flex list-none items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-muted)] p-1.5 pr-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--border-strong)]">
                  <span className="grid size-8 place-items-center rounded-[var(--radius-md)] bg-[image:var(--gradient-brand)] text-xs text-white">{initials}</span>
                  <ChevronDownIcon />
                </summary>
                <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-[1rem] border border-[var(--border)] bg-[rgba(8,11,17,0.96)] p-2 shadow-[var(--shadow-strong)]">
                  <div className="px-3 py-3">
                    <p className="font-semibold text-[var(--foreground-strong)]">{userName}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">Career intelligence workspace</p>
                  </div>
                  <Link className="flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--muted-strong)] transition hover:bg-[var(--surface-muted)] hover:text-white" href="/profile">
                    <UserRound className="size-4" />
                    Profile
                  </Link>
                  <Link className="flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--muted-strong)] transition hover:bg-[var(--surface-muted)] hover:text-white" href="/settings">
                    <Settings className="size-4" />
                    Settings
                  </Link>
                  <form action={signOutAction} className="mt-2 border-t border-[var(--border)] pt-2">
                    <Button className="w-full justify-start" size="sm" variant="ghost" type="submit">
                      Sign out
                    </Button>
                  </form>
                </div>
              </details>
            </div>
          </div>
        </div>

        <div key={pathname} className="motion-reveal-up min-w-0 p-4 lg:p-6">
          <div className="mx-auto max-w-[var(--container-page)] space-y-7">{children}</div>
        </div>
      </main>
    </div>
  );
}

function ChevronDownIcon() {
  return (
    <span className="grid size-6 place-items-center rounded-[var(--radius-sm)] text-[var(--muted)] transition group-open:rotate-90">
      <ChevronRight className="size-4" />
    </span>
  );
}
