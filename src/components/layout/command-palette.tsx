"use client";

import { useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  FileText,
  Globe,
  History,
  LayoutDashboard,
  ListChecks,
  Search,
  Settings,
  Sparkles,
  UserRound,
  X
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export const commandItems = [
  { href: "/dashboard", label: "Open Dashboard", description: "Review ranked opportunities", icon: LayoutDashboard },
  { href: "/review-queue", label: "Review Queue", description: "Triage high-signal matches", icon: ListChecks },
  { href: "/sources", label: "Manage Sources", description: "Tune discovery inputs", icon: Globe },
  { href: "/discovery-runs", label: "Inspect Discovery Runs", description: "View import health and logs", icon: History },
  { href: "/applications", label: "Track Applications", description: "Monitor manual application progress", icon: BriefcaseBusiness },
  { href: "/profile", label: "Edit Career Profile", description: "Update targets and preferences", icon: UserRound },
  { href: "/resume", label: "Review Resume Intelligence", description: "Inspect parsed resume signals", icon: FileText },
  { href: "/settings", label: "Tune Matching Settings", description: "Adjust scoring preferences", icon: Settings }
] as const;

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return commandItems;
    }

    return commandItems.filter((item) =>
      `${item.label} ${item.description}`.toLowerCase().includes(normalized)
    );
  }, [query]);

  const closePalette = useCallback(() => {
    setQuery("");
    setActiveIndex(0);
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previous = document.activeElement as HTMLElement | null;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);

    return () => {
      window.clearTimeout(timer);
      previous?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (open) {
          closePalette();
        } else {
          onOpenChange(true);
        }
      }

      if (open && event.key === "Escape") {
        closePalette();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closePalette, onOpenChange, open]);

  if (!open) {
    return null;
  }

  function runCommand(href: string) {
    closePalette();
    router.push(href);
  }

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] bg-black/58 p-4 backdrop-blur-xl" role="dialog" aria-modal="true" aria-label="MatchIQ command center">
      <button className="absolute inset-0 cursor-default" aria-label="Close command center" onClick={closePalette} />
      <div className="motion-reveal-up relative mx-auto mt-[10vh] max-w-2xl overflow-hidden rounded-[1.5rem] border border-[var(--border-glow)] bg-[rgba(8,11,17,0.96)] shadow-[var(--shadow-strong)]">
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
          <Search className="size-5 text-[var(--accent-cyan)]" />
          <input
            ref={inputRef}
            className="min-h-12 flex-1 bg-transparent text-base text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
            placeholder="Type a command or search MatchIQ..."
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
              }

              if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((index) => Math.max(index - 1, 0));
              }

              if (event.key === "Enter" && results[activeIndex]) {
                event.preventDefault();
                runCommand(results[activeIndex].href);
              }
            }}
          />
          <button className="rounded-[var(--radius-md)] p-2 text-[var(--muted)] transition hover:bg-[var(--surface-muted)] hover:text-white" aria-label="Close command center" onClick={closePalette}>
            <X className="size-5" />
          </button>
        </div>

        <div className="max-h-[56vh] overflow-auto p-3">
          <div className="mb-2 flex items-center justify-between px-2 text-xs uppercase text-[var(--muted)]">
            <span>Commands</span>
            <span aria-live="polite">{results.length} results</span>
          </div>

          {results.length ? (
            <div className="grid gap-1">
              {results.map((item, index) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.href}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-[var(--radius-lg)] border px-3 py-3 text-left transition",
                      index === activeIndex
                        ? "border-[var(--border-glow)] bg-[image:var(--gradient-active)] text-white shadow-[var(--shadow-glow)]"
                        : "border-transparent text-[var(--muted-strong)] hover:border-[var(--border)] hover:bg-[var(--surface-muted)] hover:text-white"
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => runCommand(item.href)}
                  >
                    <span className="grid size-10 place-items-center rounded-[var(--radius-md)] bg-[var(--surface-muted)] text-[var(--accent-cyan)]">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{item.label}</span>
                      <span className="mt-1 block truncate text-xs text-[var(--muted)]">{item.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid place-items-center rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] px-6 py-10 text-center">
              <Sparkles className="size-8 text-[var(--accent-cyan)]" />
              <p className="mt-3 text-sm font-semibold text-[var(--foreground)]">No command found</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Try searching for dashboard, resume, sources, or applications.</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-3 text-xs text-[var(--muted)]">
          <span>Use arrows to navigate</span>
          <span>Enter to open / Esc to close</span>
        </div>
      </div>
    </div>
  );
}
