import { MatchIQLogo } from "@/components/branding/matchiq-logo";
import { Skeleton } from "@/components/ui/skeleton";

export function AppLoadingShell() {
  return (
    <div className="app-shell-grid min-h-screen">
      <aside className="app-sidebar hidden lg:flex">
        <MatchIQLogo />
        <div className="mt-8 grid w-full gap-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
      </aside>
      <main className="min-w-0 p-4 lg:p-6">
        <div className="app-topbar">
          <Skeleton className="h-11 flex-1 rounded-[var(--radius-lg)]" />
          <Skeleton className="size-11 rounded-full" />
        </div>
        <div className="motion-stagger mt-6 grid gap-5">
          <Skeleton className="h-36 rounded-[var(--radius-panel)]" />
          <div className="grid gap-5 xl:grid-cols-3">
            <Skeleton className="h-48 rounded-[var(--radius-panel)]" />
            <Skeleton className="h-48 rounded-[var(--radius-panel)]" />
            <Skeleton className="h-48 rounded-[var(--radius-panel)]" />
          </div>
          <Skeleton className="h-96 rounded-[var(--radius-panel)]" />
        </div>
      </main>
    </div>
  );
}
