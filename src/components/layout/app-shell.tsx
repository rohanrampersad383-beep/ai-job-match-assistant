"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  ChevronRight,
  DatabaseZap,
  FileText,
  Globe,
  History,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { PropsWithChildren, useEffect, useMemo, useRef, useState } from "react";

import { MatchIQLogo } from "@/components/branding/matchiq-logo";
import { CommandPalette } from "@/components/layout/command-palette";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

export const navGroups = [
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
      { href: "/discovered-jobs", label: "Discovered Jobs", hint: "Source results", icon: DatabaseZap },
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
                    "motion-sheen group relative flex items-center gap-3 overflow-hidden rounded-[var(--radius-lg)] border px-3 py-3 text-sm font-medium transition",
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
  const [activeTopbarMenu, setActiveTopbarMenu] = useState<"notifications" | "profile" | null>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const firstNotificationActionRef = useRef<HTMLAnchorElement>(null);
  const firstProfileActionRef = useRef<HTMLAnchorElement>(null);
  const pageLabel = resolvePageLabel(pathname);
  const initials = useMemo(() => getInitials(userName), [userName]);

  useEffect(() => {
    if (!activeTopbarMenu) {
      return;
    }

    const activeRef = activeTopbarMenu === "notifications" ? notificationsRef : profileRef;

    function onPointerDown(event: PointerEvent) {
      if (!activeRef.current?.contains(event.target as Node)) {
        setActiveTopbarMenu(null);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveTopbarMenu(null);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    const focusTarget =
      activeTopbarMenu === "notifications" ? firstNotificationActionRef.current : firstProfileActionRef.current;
    const focusTimer = window.setTimeout(() => focusTarget?.focus(), 0);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [activeTopbarMenu]);

  return (
    <div className={cn("app-shell-grid min-h-screen", collapsed && "app-shell-grid-collapsed")}>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />

      <aside className={cn("app-sidebar hidden lg:flex", collapsed && "app-sidebar-collapsed")}>
        <div className="flex items-center justify-between gap-3">
          <Link href="/dashboard" aria-label="MatchIQ dashboard">
            <MatchIQLogo showText={!collapsed} markClassName={collapsed ? "size-9" : undefined} />
          </Link>
          <button
          className="motion-press rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-muted)] p-2 text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:text-white"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
        </div>

        <button
          className={cn(
            "motion-sheen mt-5 flex min-h-11 items-center gap-3 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-muted)] px-3 text-left text-sm text-[var(--muted)] transition hover:border-[var(--border-glow)] hover:text-white",
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

        <div className={cn("motion-signal-surface mt-5 overflow-hidden rounded-[1.2rem] border border-[var(--border)] bg-[var(--surface-muted)] p-4", collapsed && "p-2")}>
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
          <aside className="motion-command-panel app-sidebar app-sidebar-drawer flex w-[min(88vw,330px)] rounded-none border-y-0 border-l-0">
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
              <button className="motion-press rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-muted)] p-2 text-[var(--muted)] transition hover:text-white lg:hidden" aria-label="Open navigation" onClick={() => setMobileOpen(true)}>
                <Menu className="size-5" />
              </button>
              <div className="min-w-0">
                <p className="text-xs uppercase text-[var(--muted)]">MatchIQ command center</p>
                <h1 className="truncate font-display text-xl font-semibold text-[var(--foreground-strong)] md:text-2xl">{pageLabel}</h1>
              </div>
            </div>

            <button className="motion-sheen hidden min-h-11 min-w-[280px] flex-1 items-center gap-3 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-muted)] px-4 text-left text-sm text-[var(--muted)] transition hover:border-[var(--border-glow)] hover:text-white md:flex xl:max-w-xl" onClick={() => setCommandOpen(true)}>
              <Search className="size-4 text-[var(--accent-cyan)]" />
              <span className="flex-1">Search roles, sources, resumes, commands...</span>
              <kbd className="rounded-[var(--radius-sm)] border border-[var(--border)] px-2 py-1 font-mono text-[10px] text-[var(--muted)]">Ctrl K</kbd>
            </button>

            <div className="flex items-center gap-2">
              <div ref={notificationsRef} className="relative">
                <button
                  aria-expanded={activeTopbarMenu === "notifications"}
                  aria-haspopup="dialog"
                  aria-label="Notifications"
                  className="motion-press grid size-11 place-items-center rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                  onClick={() =>
                    setActiveTopbarMenu((current) => (current === "notifications" ? null : "notifications"))
                  }
                  type="button"
                >
                  <Bell className="size-4" />
                </button>
                {activeTopbarMenu === "notifications" ? (
                  <div
                    className="fixed right-4 top-[4.75rem] z-[calc(var(--z-modal)+10)] w-[min(23rem,calc(100vw-2rem))] overflow-hidden rounded-[1.15rem] border border-[var(--border-glow)] bg-[rgba(8,11,18,0.98)] p-2 shadow-[0_24px_80px_rgba(0,0,0,0.48),var(--shadow-glow)] backdrop-blur-2xl lg:right-6"
                    role="dialog"
                    aria-label="Notifications"
                  >
                    <div className="border-b border-[var(--border)] px-3 py-3">
                      <p className="text-sm font-semibold text-[var(--foreground-strong)]">Notifications</p>
                      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                        No urgent alerts right now. Discovery and review signals will appear here.
                      </p>
                    </div>
                    <div className="grid gap-2 p-2">
                      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-muted)] p-3">
                        <p className="text-sm font-semibold text-[var(--foreground)]">All clear</p>
                        <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                          MatchIQ will surface source failures, high-confidence roles, and application reminders in this panel.
                        </p>
                      </div>
                      <Link
                        ref={firstNotificationActionRef}
                        className="flex items-center justify-between rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--muted-strong)] transition hover:bg-[var(--surface-muted)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                        href="/review-queue"
                        onClick={() => setActiveTopbarMenu(null)}
                      >
                        Review opportunity queue
                        <ChevronRight className="size-4" />
                      </Link>
                      <Link
                        className="flex items-center justify-between rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--muted-strong)] transition hover:bg-[var(--surface-muted)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                        href="/discovery-runs"
                        onClick={() => setActiveTopbarMenu(null)}
                      >
                        View discovery health
                        <ChevronRight className="size-4" />
                      </Link>
                    </div>
                  </div>
                ) : null}
              </div>

              <div ref={profileRef} className="relative">
                <button
                  aria-expanded={activeTopbarMenu === "profile"}
                  aria-haspopup="menu"
                  className="motion-press flex items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-muted)] p-1.5 pr-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                  onClick={() => setActiveTopbarMenu((current) => (current === "profile" ? null : "profile"))}
                  type="button"
                >
                  <span className="grid size-8 place-items-center rounded-[var(--radius-md)] bg-[image:var(--gradient-brand)] text-xs text-white">{initials}</span>
                  <span className={cn("grid size-6 place-items-center rounded-[var(--radius-sm)] text-[var(--muted)] transition", activeTopbarMenu === "profile" && "rotate-90")}>
                    <ChevronRight className="size-4" />
                  </span>
                </button>
                {activeTopbarMenu === "profile" ? (
                  <div
                    className="fixed right-4 top-[4.75rem] z-[calc(var(--z-modal)+10)] w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-[1.15rem] border border-[var(--border-glow)] bg-[rgba(8,11,18,0.98)] p-2 shadow-[0_24px_80px_rgba(0,0,0,0.48),var(--shadow-glow)] backdrop-blur-2xl lg:right-6"
                    role="menu"
                    aria-label="Account menu"
                  >
                    <div className="px-3 py-3">
                      <p className="font-semibold text-[var(--foreground-strong)]">{userName}</p>
                      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Current MatchIQ career intelligence workspace</p>
                    </div>
                    <Link
                      ref={firstProfileActionRef}
                      className="flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--muted-strong)] transition hover:bg-[var(--surface-muted)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                      href="/profile"
                      onClick={() => setActiveTopbarMenu(null)}
                      role="menuitem"
                    >
                      <UserRound className="size-4" />
                      View profile
                    </Link>
                    <Link
                      className="flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--muted-strong)] transition hover:bg-[var(--surface-muted)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                      href="/settings"
                      onClick={() => setActiveTopbarMenu(null)}
                      role="menuitem"
                    >
                      <Settings className="size-4" />
                      Settings
                    </Link>
                    <form action={signOutAction} className="mt-2 border-t border-[var(--border)] pt-2">
                      <Button className="w-full justify-start gap-2" size="sm" variant="ghost" type="submit">
                        <LogOut className="size-4" />
                        Sign out
                      </Button>
                    </form>
                  </div>
                ) : null}
              </div>
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
