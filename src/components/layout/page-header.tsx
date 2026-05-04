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
    <div className="overflow-hidden rounded-[2rem] border border-white/18 bg-[linear-gradient(135deg,#102d41_0%,#134d67_55%,#148a7a_100%)] px-7 py-8 text-white shadow-[var(--shadow-strong)] xl:px-9 xl:py-9">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)] lg:items-end">
        <div className="relative min-w-0">
          <div className="absolute -left-12 -top-12 h-36 w-36 rounded-full bg-white/8 blur-3xl" />
          <div className="absolute right-8 top-2 h-24 w-24 rounded-full bg-[rgba(240,180,76,0.18)] blur-3xl" />
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">{eyebrow}</p>
        ) : null}
          <h1 className="mt-3 max-w-5xl text-3xl font-semibold tracking-[-0.04em] lg:text-[2.4rem] xl:text-[2.8rem]">
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
