import type { CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Compass,
  Layers3,
  LineChart,
  MapPin,
  Radar,
  Route,
  SearchCheck,
  Sparkles,
  Target,
  TrendingUp,
  Zap
} from "lucide-react";

import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import { DiscoveryActionForm } from "@/components/discovery/discovery-action-form";
import { JobCard } from "@/components/jobs/job-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { runAllDiscoverySourcesFeedbackAction } from "@/lib/actions/discovery";
import { requireUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/data/dashboard";
import { clamp, cn, formatCurrency, formatDate, titleCase } from "@/lib/utils";
import type { DashboardFilters as DashboardFilterInput, ScoreReason } from "@/types";

type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
type DashboardJob = DashboardData["jobs"][number];

function asString(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

function asBoolean(value: string | string[] | undefined) {
  const normalized = asString(value);
  return normalized === "on" || normalized === "true" || normalized === "1";
}

function buildFilters(searchParams: Record<string, string | string[] | undefined>): DashboardFilterInput {
  const needsReviewOnly = asBoolean(searchParams.needsReviewOnly);

  return {
    query: asString(searchParams.query),
    view: needsReviewOnly
      ? "needs-review"
      : ((asString(searchParams.view) as DashboardFilterInput["view"]) ?? "all"),
    workMode: (asString(searchParams.workMode) as DashboardFilterInput["workMode"]) ?? "ALL",
    seniority: (asString(searchParams.seniority) as DashboardFilterInput["seniority"]) ?? "ALL",
    minMatch: searchParams.minMatch ? Number(asString(searchParams.minMatch)) : undefined,
    sourceId: asString(searchParams.sourceId) || undefined,
    recentDays: searchParams.recentDays ? Number(asString(searchParams.recentDays)) : undefined,
    discoveredOnly: asBoolean(searchParams.discoveredOnly),
    trinidadOnly: asBoolean(searchParams.trinidadOnly),
    remoteFriendlyOnly: asBoolean(searchParams.remoteFriendlyOnly),
    page: searchParams.page ? Number(asString(searchParams.page)) : 1
  };
}

function buildPageHref(filters: DashboardFilterInput, page: number) {
  const params = new URLSearchParams();

  if (filters.query) params.set("query", filters.query);
  if (filters.view && filters.view !== "all") params.set("view", filters.view);
  if (filters.workMode && filters.workMode !== "ALL") params.set("workMode", filters.workMode);
  if (filters.seniority && filters.seniority !== "ALL") params.set("seniority", filters.seniority);
  if (typeof filters.minMatch === "number") params.set("minMatch", String(filters.minMatch));
  if (filters.sourceId) params.set("sourceId", filters.sourceId);
  if (typeof filters.recentDays === "number") params.set("recentDays", String(filters.recentDays));
  if (filters.discoveredOnly) params.set("discoveredOnly", "1");
  if (filters.trinidadOnly) params.set("trinidadOnly", "1");
  if (filters.remoteFriendlyOnly) params.set("remoteFriendlyOnly", "1");
  params.set("page", String(page));

  return `/dashboard?${params.toString()}`;
}

function getGreeting(name: string) {
  const firstName = name.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return `${greeting}, ${firstName}`;
}

function getMatch(job: DashboardJob) {
  return job.matches[0];
}

function getReasons(job: DashboardJob): ScoreReason[] {
  const reasons = getMatch(job)?.reasons;
  return Array.isArray(reasons) ? (reasons as ScoreReason[]) : [];
}

function getScoreValues(jobs: DashboardJob[], data: DashboardData) {
  const scores = jobs.map((job) => getMatch(job)?.matchPercent ?? 0).filter((score) => score > 0);
  const best = scores.length ? Math.max(...scores) : data.stats?.jobMatches[0]?.matchPercent ?? 0;
  const average = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : best;
  const remoteLift = data.summary.remoteJobs > 0 ? 8 : 0;
  const highMatchLift = data.summary.highMatchJobs > 0 ? 10 : 0;

  return {
    score: clamp(best || average || 72),
    average: clamp(average || best || 68),
    breakdown: [
      { label: "Skills", value: clamp((best || 64) + highMatchLift) },
      { label: "Experience", value: clamp((average || 62) + 6) },
      { label: "Location fit", value: clamp(data.summary.trinidadJobs ? 84 : 66) },
      { label: "Remote readiness", value: clamp(data.summary.remoteJobs ? 91 : 64 + remoteLift) },
      { label: "Growth potential", value: clamp((best || 68) + 4) },
      { label: "Compensation fit", value: clamp(jobs.some((job) => job.salaryMin || job.salaryMax) ? 82 : 58) }
    ]
  };
}

function getStatusCounts(data: DashboardData) {
  return new Map(data.applicationStatusCounts.map((item) => [item.status, item._count._all]));
}

function getSkillSignals(jobs: DashboardJob[], data: DashboardData) {
  const latestResume = data.user?.resumes[0]?.extractedData;
  const preferences = data.user?.preferences;
  const matchedSkills = jobs.flatMap((job) => getMatch(job)?.matchedSkills ?? []);
  const missingSkills = jobs.flatMap((job) => getMatch(job)?.missingSkills ?? []);
  const demandSkills = jobs.flatMap((job) => [...job.requiredSkills, ...job.preferredSkills]);

  const strengths = uniqueStrings([
    ...(preferences?.topSkills ?? []),
    ...(latestResume?.technicalSkills ?? []),
    ...matchedSkills
  ]).slice(0, 6);

  const gaps = uniqueStrings(missingSkills.length ? missingSkills : demandSkills).slice(0, 5);
  const demand = uniqueStrings(demandSkills).filter((skill) => !strengths.includes(skill)).slice(0, 5);

  return {
    strengths: strengths.length ? strengths : ["Profile targeting", "Application focus", "Role analysis"],
    gaps: gaps.length ? gaps : ["Cloud deployment keywords", "AI tooling evidence", "Portfolio proof points"],
    demand: demand.length ? demand : ["React", "SQL", "Automation", "Cloud", "Analytics"]
  };
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function formatSalary(job: DashboardJob) {
  if (!job.salaryMin && !job.salaryMax) {
    return "Salary not listed";
  }

  return `${formatCurrency(job.salaryMin, job.salaryCurrency ?? "USD")} - ${formatCurrency(job.salaryMax, job.salaryCurrency ?? "USD")}`;
}

function radarPoints(values: number[]) {
  const center = 50;
  const radius = 34;
  return values
    .map((value, index) => {
      const angle = (Math.PI * 2 * index) / values.length - Math.PI / 2;
      const scaled = (clamp(value) / 100) * radius;
      return `${center + Math.cos(angle) * scaled},${center + Math.sin(angle) * scaled}`;
    })
    .join(" ");
}

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const filters = buildFilters(params);
  const data = await getDashboardData(user.id, filters);
  const jobs = [...data.jobs].sort(
    (left, right) => (getMatch(right)?.matchPercent ?? 0) - (getMatch(left)?.matchPercent ?? 0)
  );
  const scoreValues = getScoreValues(jobs, data);
  const topMatches = jobs.slice(0, 3);
  const skills = getSkillSignals(jobs, data);
  const statusCounts = getStatusCounts(data);
  const interviewing = statusCounts.get("INTERVIEWING") ?? 0;
  const offers = (statusCounts.get("OFFER") ?? 0) + (statusCounts.get("ARCHIVED") ?? 0);
  const pipeline = [
    { label: "Discovered", value: data.summary.newJobs || data.total, icon: SearchCheck, tone: "text-[var(--accent-cyan)]" },
    { label: "Shortlisted", value: data.stats?._count.savedJobs ?? 0, icon: Target, tone: "text-[var(--primary-soft)]" },
    { label: "Applied", value: data.stats?._count.applications ?? 0, icon: BriefcaseBusiness, tone: "text-[var(--success)]" },
    { label: "Interviewing", value: interviewing, icon: Route, tone: "text-[var(--warning)]" },
    { label: "Offer / closed", value: offers, icon: CheckCircle2, tone: "text-[var(--accent)]" }
  ];
  const primaryInsight = topMatches[0]
    ? `Your strongest active match is ${topMatches[0].title} at ${topMatches[0].company}, currently scoring ${getMatch(topMatches[0])?.matchPercent ?? 0}%.`
    : "Run discovery or import opportunities to activate your career intelligence feed.";
  const reviewCopy = data.summary.needsReview
    ? `${data.summary.needsReview} opportunities need review before the queue is clean.`
    : "Your review queue is clear. New discovery runs will surface fresh fit signals here.";

  return (
    <div className="motion-stagger space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(390px,0.85fr)]">
        <Card className="relative min-h-[360px] overflow-hidden border-[var(--border-glow)] bg-[radial-gradient(circle_at_82%_8%,rgba(139,92,246,0.22),transparent_32%),radial-gradient(circle_at_18%_18%,rgba(34,211,238,0.13),transparent_30%),rgba(10,15,24,0.9)] p-6 md:p-8">
          <div className="absolute right-8 top-8 hidden size-44 rounded-full border border-[var(--primary)]/20 bg-[var(--primary)]/8 blur-2xl md:block" />
          <div className="relative z-10 grid h-full gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="flex min-w-0 flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-semibold uppercase text-[var(--accent-cyan)]">
                  <BrainCircuit className="size-4" />
                  Career intelligence live
                </div>
                <h1 className="mt-5 max-w-3xl font-display text-4xl font-semibold leading-tight text-[var(--foreground-strong)] md:text-5xl">
                  {getGreeting(user.fullName)}
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted-strong)] md:text-lg">
                  {data.summary.highMatchJobs
                    ? `${data.summary.highMatchJobs} high-fit opportunities are ready for review, with ${data.summary.remoteJobs} remote-friendly signals in the current intelligence set.`
                    : `MatchIQ is monitoring ${data.total} ranked opportunities and prioritizing the roles most aligned with your profile.`}
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <DiscoveryActionForm
                  action={runAllDiscoverySourcesFeedbackAction}
                  className="min-w-[220px]"
                  label="Run discovery now"
                  pendingLabel="Running discovery..."
                />
                <Link
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-white/18 bg-white/8 px-4.5 py-2.5 text-sm font-semibold text-[var(--foreground)] shadow-sm transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-strong)]"
                  href="/review-queue"
                >
                  Review queue
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>

            <div className="relative flex min-h-[240px] items-center justify-center">
              <div className="absolute inset-3 rounded-full border border-[var(--primary)]/14" />
              <div className="absolute inset-10 rounded-full border border-[var(--accent)]/20" />
              <div className="motion-float relative grid size-48 place-items-center rounded-full border border-[var(--border-glow)] bg-[radial-gradient(circle_at_50%_30%,rgba(34,211,238,0.22),rgba(47,107,255,0.16)_42%,rgba(8,11,17,0.92)_72%)] shadow-[var(--shadow-glow)]">
                <Sparkles className="absolute left-7 top-8 size-5 text-[var(--accent-cyan)]" />
                <p className="text-center">
                  <span className="block text-xs font-semibold uppercase text-[var(--muted)]">Best fit</span>
                  <span className="mt-2 block font-display text-6xl font-semibold text-white">{scoreValues.score}</span>
                  <span className="block text-sm text-[var(--primary-soft)]">Match score</span>
                </p>
              </div>
            </div>
          </div>
        </Card>

        <MatchScoreModule scoreValues={scoreValues} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-6">
          <StatsOverview data={data} />
          <TopMatches jobs={topMatches} />
        </div>

        <div className="space-y-6">
          <AIInsightPanel primaryInsight={primaryInsight} reviewCopy={reviewCopy} skills={skills} />
          <ActivityFeed data={data} jobs={jobs} skills={skills} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <PipelinePanel pipeline={pipeline} />
        <SkillIntelligence skills={skills} />
      </section>

      <DashboardFilters
        defaults={{
          query: filters.query,
          view: filters.view,
          workMode: filters.workMode,
          seniority: filters.seniority,
          minMatch: filters.minMatch,
          sourceId: filters.sourceId,
          recentDays: filters.recentDays,
          discoveredOnly: filters.discoveredOnly,
          trinidadOnly: filters.trinidadOnly,
          remoteFriendlyOnly: filters.remoteFriendlyOnly
        }}
        sources={data.sources}
      />

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase text-[var(--muted)]">Ranking engine</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-[var(--foreground-strong)]">All ranked opportunities</h2>
          </div>
          <p className="text-sm text-[var(--muted)]">{data.total} total matches in this view</p>
        </div>

        {jobs.length ? (
          <div className="grid gap-5 2xl:grid-cols-2">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <EmptyState
            description="Run discovery from the Sources page or keep manual import as a fallback to populate the ranking engine."
            title="No jobs match the current filter"
          />
        )}
      </section>

      <div className="flex flex-col gap-4 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] px-5 py-4 text-sm text-[var(--secondary)] sm:flex-row sm:items-center sm:justify-between">
        <span>
          Page {data.page} of {data.totalPages}
        </span>
        <div className="flex gap-3">
          {data.page > 1 ? (
            <Link
              className="inline-flex items-center justify-center rounded-full border border-[var(--border)] px-4 py-2 font-medium hover:bg-[var(--surface-raised)]"
              href={buildPageHref(filters, data.page - 1)}
            >
              Previous
            </Link>
          ) : null}
          {data.page < data.totalPages ? (
            <Link
              className="inline-flex items-center justify-center rounded-full border border-[var(--border)] px-4 py-2 font-medium hover:bg-[var(--surface-raised)]"
              href={buildPageHref(filters, data.page + 1)}
            >
              Next
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function StatsOverview({ data }: { data: DashboardData }) {
  const items = [
    { label: "New jobs", value: data.summary.newJobs, hint: "Last 7 days", icon: BriefcaseBusiness },
    { label: "High match", value: data.summary.highMatchJobs, hint: "80% fit or above", icon: Target },
    { label: "Remote fit", value: data.summary.remoteJobs, hint: "Remote-ready roles", icon: Compass },
    { label: "Needs review", value: data.summary.needsReview, hint: "Awaiting decision", icon: Clock3 }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label} className="interactive-card relative overflow-hidden border-[var(--border)] bg-[rgba(13,19,30,0.82)] p-5">
            <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,transparent,var(--accent-cyan),var(--primary),transparent)] opacity-60" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase text-[var(--muted)]">{item.label}</p>
                <p className="mt-2 font-display text-4xl font-semibold text-white">{item.value}</p>
                <p className="mt-2 text-sm text-[var(--muted-strong)]">{item.hint}</p>
              </div>
              <span className="grid size-11 place-items-center rounded-[var(--radius-lg)] bg-[var(--primary)]/12 text-[var(--accent-cyan)]">
                <Icon className="size-5" />
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function MatchScoreModule({ scoreValues }: { scoreValues: ReturnType<typeof getScoreValues> }) {
  const ringStyle = {
    "--match-score-angle": `${scoreValues.score * 3.6}deg`
  } as CSSProperties;
  const radarValues = scoreValues.breakdown.map((item) => item.value);

  return (
    <Card className="relative overflow-hidden border-[var(--border)] bg-[rgba(11,16,24,0.9)] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-[var(--muted)]">Match score system</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-white">Compatibility radar</h2>
        </div>
        <Badge variant="discovery">AI weighted</Badge>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
        <div className="grid place-items-center">
          <div
            className="relative grid size-44 place-items-center rounded-full"
            style={ringStyle}
          >
            <div className="absolute inset-0 rounded-full bg-[conic-gradient(var(--accent-cyan)_0deg,var(--primary)_var(--match-score-angle),rgba(255,255,255,0.08)_var(--match-score-angle),rgba(255,255,255,0.08)_360deg)]" />
            <div className="absolute inset-3 rounded-full bg-[var(--background-elevated)] shadow-[inset_0_0_42px_rgba(47,107,255,0.18)]" />
            <div className="relative text-center">
              <span className="block font-display text-5xl font-semibold text-white">{scoreValues.score}</span>
              <span className="text-xs font-semibold uppercase text-[var(--muted)]">Top score</span>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <svg className="h-40 w-full overflow-visible" viewBox="0 0 100 100" role="img" aria-label="Compatibility radar chart">
            <polygon points="50,14 81,32 81,68 50,86 19,68 19,32" fill="rgba(47,107,255,0.06)" stroke="rgba(234,240,255,0.1)" />
            <polygon points="50,24 72,37 72,63 50,76 28,63 28,37" fill="none" stroke="rgba(234,240,255,0.08)" />
            <polygon points={radarPoints(radarValues)} fill="rgba(47,107,255,0.34)" stroke="rgba(34,211,238,0.85)" strokeWidth="1.4" />
            {radarValues.map((value, index) => {
              const angle = (Math.PI * 2 * index) / radarValues.length - Math.PI / 2;
              const x = 50 + Math.cos(angle) * 38;
              const y = 50 + Math.sin(angle) * 38;
              return <circle key={index} cx={x} cy={y} fill="var(--accent-cyan)" r="1.4" />;
            })}
          </svg>

          <div className="grid gap-3">
            {scoreValues.breakdown.map((item) => (
              <div key={item.label}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-semibold text-[var(--muted-strong)]">{item.label}</span>
                  <span className="text-[var(--foreground)]">{item.value}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/8">
                  <div className="h-full rounded-full bg-[image:var(--gradient-brand)]" style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function TopMatches({ jobs }: { jobs: DashboardJob[] }) {
  return (
    <Card className="border-[var(--border)] bg-[rgba(11,16,24,0.86)] p-5 md:p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-[var(--muted)]">Top matches</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-white">Best opportunities for you</h2>
        </div>
        <Link className="text-sm font-semibold text-[var(--accent-cyan)] hover:text-white" href="/review-queue">
          See queue
        </Link>
      </div>

      {jobs.length ? (
        <div className="grid gap-3">
          {jobs.map((job) => {
            const match = getMatch(job);
            const reason = getReasons(job)[0]?.label ?? "Strong fit across your current career signals.";
            return (
              <article key={job.id} className="interactive-card rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap gap-2">
                      <Badge variant="matchMedium">{match?.matchPercent ?? 0}% match</Badge>
                      <Badge variant="neutral">{job.workMode ? titleCase(job.workMode) : "Work mode TBD"}</Badge>
                      <Badge variant="neutral">{formatSalary(job)}</Badge>
                    </div>
                    <h3 className="truncate text-lg font-semibold text-white">
                      <Link href={`/jobs/${job.id}`} className="hover:text-[var(--accent-cyan)]">
                        {job.title}
                      </Link>
                    </h3>
                    <p className="mt-1 text-sm text-[var(--muted-strong)]">{job.company}</p>
                    <p className="mt-2 flex items-center gap-2 text-xs text-[var(--muted)]">
                      <MapPin className="size-3.5" />
                      {job.location}
                    </p>
                  </div>
                  <div className="max-w-xl lg:text-right">
                    <p className="text-sm leading-6 text-[var(--muted-strong)]">{reason}</p>
                    <div className="mt-3 flex flex-wrap gap-2 lg:justify-end">
                      <Link className="rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] hover:border-[var(--border-glow)]" href={`/jobs/${job.id}`}>
                        Inspect match
                      </Link>
                      <a className="rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] hover:border-[var(--border-glow)]" href={job.applicationUrl} rel="noreferrer" target="_blank">
                        Open role
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[1.25rem] border border-dashed border-[var(--border)] p-8 text-center">
          <Radar className="mx-auto size-9 text-[var(--accent-cyan)]" />
          <p className="mt-3 font-semibold text-white">No ranked matches yet</p>
          <p className="mt-2 text-sm text-[var(--muted)]">Run discovery to fill the command center with fit-ranked roles.</p>
        </div>
      )}
    </Card>
  );
}

function AIInsightPanel({
  primaryInsight,
  reviewCopy,
  skills
}: {
  primaryInsight: string;
  reviewCopy: string;
  skills: ReturnType<typeof getSkillSignals>;
}) {
  const insights = [
    primaryInsight,
    reviewCopy,
    `${skills.gaps[0]} is the clearest keyword gap to improve match confidence.`
  ];

  return (
    <Card className="relative overflow-hidden border-[var(--border-glow)] bg-[radial-gradient(circle_at_100%_0%,rgba(139,92,246,0.22),transparent_34%),rgba(13,19,30,0.86)] p-6">
      <div className="absolute right-5 top-5 grid size-14 place-items-center rounded-full border border-[var(--accent-cyan)]/24 bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] shadow-[var(--shadow-cyan)]">
        <BrainCircuit className="size-6" />
      </div>
      <p className="text-sm font-semibold uppercase text-[var(--muted)]">AI insight</p>
      <h2 className="mt-2 max-w-[16rem] font-display text-2xl font-semibold text-white">Career signal readout</h2>
      <div className="mt-6 grid gap-3">
        {insights.map((insight, index) => (
          <div key={insight} className="rounded-[1rem] border border-[var(--border)] bg-black/16 p-4">
            <div className="flex gap-3">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[var(--primary)]/14 text-xs font-semibold text-[var(--accent-cyan)]">
                {index + 1}
              </span>
              <p className="text-sm leading-6 text-[var(--muted-strong)]">{insight}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PipelinePanel({
  pipeline
}: {
  pipeline: Array<{ label: string; value: number; icon: typeof SearchCheck; tone: string }>;
}) {
  const max = Math.max(...pipeline.map((stage) => stage.value), 1);

  return (
    <Card className="border-[var(--border)] bg-[rgba(11,16,24,0.86)] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-[var(--muted)]">Opportunity pipeline</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-white">From signal to decision</h2>
        </div>
        <Layers3 className="size-5 text-[var(--accent-cyan)]" />
      </div>

      <div className="mt-6 grid gap-3">
        {pipeline.map((stage) => {
          const Icon = stage.icon;
          const width = Math.max((stage.value / max) * 100, stage.value > 0 ? 12 : 4);
          return (
            <div key={stage.label} className="rounded-[1rem] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={cn("grid size-9 place-items-center rounded-[var(--radius-md)] bg-white/6", stage.tone)}>
                    <Icon className="size-4" />
                  </span>
                  <span className="font-semibold text-[var(--foreground)]">{stage.label}</span>
                </div>
                <span className="font-display text-2xl font-semibold text-white">{stage.value}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/8">
                <div className="h-full rounded-full bg-[image:var(--gradient-brand)]" style={{ width: `${width}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function SkillIntelligence({ skills }: { skills: ReturnType<typeof getSkillSignals> }) {
  return (
    <Card className="border-[var(--border)] bg-[rgba(11,16,24,0.86)] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-[var(--muted)]">Skill gap intelligence</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-white">Profile leverage map</h2>
        </div>
        <LineChart className="size-5 text-[var(--accent-cyan)]" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <SkillColumn title="Strengths" icon={Zap} items={skills.strengths} tone="success" />
        <SkillColumn title="Gaps" icon={Target} items={skills.gaps} tone="warning" />
        <SkillColumn title="Demand" icon={TrendingUp} items={skills.demand} tone="info" />
      </div>
    </Card>
  );
}

function SkillColumn({
  title,
  icon: Icon,
  items,
  tone
}: {
  title: string;
  icon: typeof Zap;
  items: string[];
  tone: "success" | "warning" | "info";
}) {
  const toneClass = {
    success: "text-[var(--success)] bg-[var(--success)]/10",
    warning: "text-[var(--warning)] bg-[var(--warning)]/10",
    info: "text-[var(--accent-cyan)] bg-[var(--accent-cyan)]/10"
  }[tone];

  return (
    <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
      <div className="mb-4 flex items-center gap-3">
        <span className={cn("grid size-9 place-items-center rounded-[var(--radius-md)]", toneClass)}>
          <Icon className="size-4" />
        </span>
        <h3 className="font-semibold text-white">{title}</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full border border-[var(--border)] bg-black/12 px-3 py-1.5 text-xs font-semibold text-[var(--muted-strong)]">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function ActivityFeed({ data, jobs, skills }: { data: DashboardData; jobs: DashboardJob[]; skills: ReturnType<typeof getSkillSignals> }) {
  const latestJob = jobs[0];
  const items = [
    {
      icon: SearchCheck,
      title: `${data.summary.newJobs} new opportunities discovered`,
      detail: "Discovery is feeding the ranking engine with fresh roles.",
      time: "Now"
    },
    {
      icon: BarChart3,
      title: latestJob ? `${latestJob.title} is leading the current shortlist` : "Ranking engine awaiting matches",
      detail: latestJob ? `${getMatch(latestJob)?.matchPercent ?? 0}% match at ${latestJob.company}.` : "Run discovery to generate ranked recommendations.",
      time: latestJob?.discoveredAt ? formatDate(latestJob.discoveredAt) : "Pending"
    },
    {
      icon: Sparkles,
      title: `${skills.gaps[0]} flagged as an improvement target`,
      detail: "Adding stronger evidence for this signal may improve future scoring.",
      time: "Insight"
    }
  ];

  return (
    <Card className="border-[var(--border)] bg-[rgba(11,16,24,0.86)] p-6">
      <p className="text-sm font-semibold uppercase text-[var(--muted)]">Recommendation feed</p>
      <div className="mt-5 grid gap-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="flex gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[var(--primary)]/12 text-[var(--accent-cyan)]">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 border-b border-[var(--border)] pb-4 last:border-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-white">{item.title}</p>
                  <span className="rounded-full bg-white/6 px-2 py-1 text-[10px] font-semibold uppercase text-[var(--muted)]">{item.time}</span>
                </div>
                <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">{item.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
