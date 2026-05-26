import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="glass-panel overflow-hidden rounded-[var(--radius-panel)] border-[var(--border)] bg-[image:var(--gradient-brand-soft)] px-7 py-8 text-white shadow-[var(--shadow-strong)] xl:px-9 xl:py-9">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)] lg:items-end">
        <div className="relative min-w-0">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase text-white/64">{eyebrow}</p>
          ) : null}
          <h1 className="mt-3 max-w-5xl font-display text-3xl font-semibold lg:text-[2.4rem] xl:text-[2.8rem]">
            {title}
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-white/84 lg:text-[15px] xl:text-base">{description}</p>
        </div>
        {actions ? (
          <div className={cn("flex flex-wrap items-start gap-3 lg:justify-end lg:self-center")}>{actions}</div>
        ) : null}
      </div>
    </div>
  );
}
