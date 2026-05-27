import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  CloudUpload,
  Compass,
  FileText,
  Filter,
  ListChecks,
  Radar,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  Workflow,
  Zap
} from "lucide-react";

import { MatchIQLogo } from "@/components/branding/matchiq-logo";
import { AIVisualization } from "@/components/marketing/ai-visualization";
import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { brand } from "@/lib/brand";

const navItems = [
  { href: "#intelligence", label: "Intelligence" },
  { href: "#workflow", label: "Workflow" },
  { href: "#preview", label: "Preview" },
  { href: "#trust", label: "Trust" }
];

const features = [
  {
    icon: Target,
    title: "AI job matching",
    description: "Rank opportunities by role fit, experience overlap, seniority, and trajectory instead of keyword noise."
  },
  {
    icon: Compass,
    title: "Career intelligence",
    description: "See the signals behind each recommendation so every next move feels deliberate."
  },
  {
    icon: BarChart3,
    title: "Opportunity ranking",
    description: "Prioritize high-leverage roles with fit scores, confidence bands, and decision-ready context."
  },
  {
    icon: FileText,
    title: "Resume compatibility",
    description: "Compare your profile against role requirements and reveal the gaps worth closing."
  },
  {
    icon: Filter,
    title: "Remote-first filtering",
    description: "Surface remote-friendly, region-aware roles without burying your shortlist in irrelevant listings."
  },
  {
    icon: ListChecks,
    title: "Application tracking",
    description: "Keep saved, reviewed, applied, and follow-up states connected to the intelligence layer."
  }
];

const workflow = [
  {
    icon: CloudUpload,
    title: "Upload your profile",
    description: "Bring resume data, preferences, targets, and constraints into one structured workspace."
  },
  {
    icon: Sparkles,
    title: "AI analyzes signals",
    description: "MatchIQ reads skills, seniority, location, remote fit, salary, and career direction together."
  },
  {
    icon: Radar,
    title: "Roles are ranked",
    description: "Each opportunity receives a transparent score with the reason it belongs in your shortlist."
  },
  {
    icon: Send,
    title: "Move with recommendations",
    description: "Act on clear next steps while keeping application submission manual and intentional."
  }
];

const trustItems = [
  "Built for fit over application spam",
  "Remote-first and region-aware by design",
  "Human-controlled application workflow",
  "Transparent reasoning behind every score"
];

export default function HomePage() {
  return (
    <main className="overflow-hidden">
      <header className="motion-ambient-surface sticky top-0 z-[var(--z-sticky)] overflow-hidden border-b border-[var(--border)] bg-[rgba(7,10,17,0.72)] backdrop-blur-2xl">
        <div className="container-shell flex min-h-20 items-center justify-between gap-6">
          <Link href="/" aria-label={`${brand.name} home`}>
            <MatchIQLogo markClassName="size-8 sm:size-10" textClassName="text-lg sm:text-xl" />
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-[var(--muted-strong)] md:flex">
            {navItems.map((item) => (
              <a key={item.href} className="transition hover:text-[var(--foreground-strong)]" href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link className="hidden text-sm font-semibold text-[var(--muted-strong)] transition hover:text-white sm:inline-flex" href="/sign-in">
              Sign in
            </Link>
            <Link
              className="motion-press motion-sheen inline-flex min-h-10 items-center justify-center overflow-hidden rounded-[var(--radius-control)] border border-[var(--primary)] bg-[image:var(--gradient-brand)] px-3.5 py-2 text-sm font-semibold text-[var(--primary-foreground)] shadow-[var(--shadow-glow)] transition hover:border-[var(--accent-cyan)]"
              href="/sign-up"
            >
              Start
            </Link>
          </div>
        </div>
      </header>

      <section className="relative">
        <div className="absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(circle_at_50%_0%,rgba(47,107,255,0.26),transparent_42%)]" />
        <div className="container-shell relative grid min-h-[760px] items-center gap-12 py-16 sm:min-h-[820px] lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
          <div className="motion-stagger max-w-4xl">
            <Badge variant="discovery">AI-powered career intelligence</Badge>
            <h1 className="mt-7 max-w-4xl font-display text-5xl font-semibold leading-[0.98] text-[var(--foreground-strong)] sm:text-6xl lg:text-7xl">
              Your AI Career Intelligence System
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted-strong)]">
              MatchIQ turns job discovery into a ranked intelligence layer, helping you understand fit, spot skill gaps, and move toward better roles with confidence.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="motion-press motion-sheen inline-flex min-h-12 items-center justify-center gap-2 overflow-hidden rounded-[var(--radius-control)] border border-[var(--primary)] bg-[image:var(--gradient-brand)] px-6 py-3 text-sm font-semibold text-[var(--primary-foreground)] shadow-[var(--shadow-glow)] transition hover:border-[var(--accent-cyan)]"
                href="/sign-up"
              >
                Start Matching Smarter <ArrowRight className="size-4" />
              </Link>
              <a
                className="motion-press inline-flex min-h-12 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-raised)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] shadow-sm transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-strong)]"
                href="#preview"
              >
                View Intelligence Demo
              </a>
            </div>
            <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
              {[
                ["92", "Fit score clarity"],
                ["4x", "Faster shortlist"],
                ["0", "Auto-apply spam"]
              ].map(([value, label]) => (
                <div key={label} className="motion-depth rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <p className="font-display text-3xl font-semibold text-[var(--foreground-strong)]">{value}</p>
                  <p className="mt-1 text-xs uppercase text-[var(--muted)]">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <AIVisualization className="motion-depth-strong shadow-[var(--shadow-strong)]" />
        </div>
      </section>

      <section id="intelligence" className="section-container">
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
          <div>
            <Badge variant="info">Signal engine</Badge>
            <h2 className="mt-5 font-display text-4xl font-semibold leading-tight text-[var(--foreground-strong)] md:text-5xl">
              Career decisions need intelligence, not another job feed.
            </h2>
          </div>
          <p className="max-w-3xl text-lg leading-8 text-[var(--muted-strong)]">
            MatchIQ connects matching, resume compatibility, opportunity ranking, and application state into a single premium workspace built for focused career movement.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="interactive-card motion-glow-hover motion-signal-surface h-full p-5">
                <div className="grid size-11 place-items-center rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--primary)]/12 text-[var(--primary-soft)]">
                  <Icon className="size-5" />
                </div>
                <CardTitle className="mt-6">{feature.title}</CardTitle>
                <CardDescription className="mt-3">{feature.description}</CardDescription>
              </Card>
            );
          })}
        </div>
      </section>

      <section id="workflow" className="section-container">
        <div className="motion-ambient-surface overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(16,23,34,0.72),rgba(8,11,17,0.88))] p-6 shadow-[var(--shadow-soft)] md:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <Badge variant="discovery">How it works</Badge>
              <h2 className="mt-5 font-display text-4xl font-semibold leading-tight text-[var(--foreground-strong)] md:text-5xl">
                From profile to priority list in four clear moves.
              </h2>
            </div>
            <p className="text-lg leading-8 text-[var(--muted-strong)]">
              The workflow stays concise: bring your career data in, let the intelligence layer analyze the signals, then review ranked opportunities with recommendations you can actually use.
            </p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-4">
            {workflow.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="interactive-card motion-depth relative overflow-hidden rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface)] p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="grid size-11 place-items-center rounded-[var(--radius-lg)] bg-[image:var(--gradient-brand)] text-white">
                      <Icon className="size-5" />
                    </div>
                    <span className="font-mono text-sm text-[var(--muted)]">0{index + 1}</span>
                  </div>
                  <h3 className="mt-6 text-lg font-semibold text-[var(--foreground-strong)]">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted-strong)]">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="preview" className="section-container">
        <div className="mb-10 grid gap-6 lg:grid-cols-[0.72fr_1fr] lg:items-end">
          <div>
            <Badge variant="info">Product preview</Badge>
            <h2 className="mt-5 font-display text-4xl font-semibold leading-tight text-[var(--foreground-strong)] md:text-5xl">
              A premium analytics layer for your career pipeline.
            </h2>
          </div>
          <p className="text-lg leading-8 text-[var(--muted-strong)]">
            This is not a dashboard rebuild. It is a landing-page preview of the MatchIQ product experience: compatibility trends, ranking systems, skill gaps, recommendation feeds, and opportunity momentum.
          </p>
        </div>
        <DashboardPreview />
      </section>

      <section id="trust" className="section-container">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-center">
          <div>
            <Badge variant="success">Built for intentional careers</Badge>
            <h2 className="mt-5 font-display text-4xl font-semibold leading-tight text-[var(--foreground-strong)] md:text-5xl">
              Find roles worth your attention before you spend energy applying.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted-strong)]">
              MatchIQ is designed for modern candidates who want intelligent matching, remote-aware discovery, transparent fit reasoning, and a manual-apply workflow that avoids low-quality automation.
            </p>
          </div>
          <div className="grid gap-3">
            {trustItems.map((item) => (
              <div key={item} className="interactive-card motion-depth flex items-center gap-3 rounded-[1.15rem] border border-[var(--border)] bg-[var(--surface)] p-4">
                <CheckCircle2 className="size-5 shrink-0 text-[var(--success)]" />
                <span className="font-medium text-[var(--foreground)]">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-container pt-0">
        <div className="motion-ambient-surface motion-depth-strong relative overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-glow)] bg-[radial-gradient(circle_at_50%_0%,rgba(47,107,255,0.26),transparent_36%),linear-gradient(180deg,rgba(16,23,34,0.92),rgba(8,11,17,0.96))] p-8 text-center shadow-[var(--shadow-strong)] md:p-14">
          <div className="mx-auto grid size-16 place-items-center rounded-[1.25rem] bg-[image:var(--gradient-brand)] text-white shadow-[var(--shadow-glow)]">
            <Zap className="size-7" />
          </div>
          <h2 className="mx-auto mt-7 max-w-3xl font-display text-4xl font-semibold leading-tight text-[var(--foreground-strong)] md:text-6xl">
            Discover better opportunities with intelligence built in.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[var(--muted-strong)]">
            Start with a focused MatchIQ workspace and turn career discovery into a signal-rich system.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              className="motion-press motion-sheen inline-flex min-h-12 items-center justify-center gap-2 overflow-hidden rounded-[var(--radius-control)] border border-[var(--primary)] bg-[image:var(--gradient-brand)] px-6 py-3 text-sm font-semibold text-[var(--primary-foreground)] shadow-[var(--shadow-glow)] transition hover:border-[var(--accent-cyan)]"
              href="/sign-up"
            >
              Explore MatchIQ <ArrowRight className="size-4" />
            </Link>
            <Link
              className="motion-press inline-flex min-h-12 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-raised)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-strong)]"
              href="/sign-in"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--border)] py-8">
        <div className="container-shell flex flex-col gap-4 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
          <MatchIQLogo markClassName="size-8" textClassName="text-lg" />
          <div className="flex flex-wrap gap-4">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="size-4" />
              Manual-apply friendly
            </span>
            <span className="inline-flex items-center gap-2">
              <BriefcaseBusiness className="size-4" />
              Built for better fit
            </span>
            <span className="inline-flex items-center gap-2">
              <UserRound className="size-4" />
              Human-controlled
            </span>
            <span className="inline-flex items-center gap-2">
              <Workflow className="size-4" />
              Signal-first workflow
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
