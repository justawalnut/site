import Link from "next/link";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, startOfDay, subDays } from "date-fns";

type StrategyMetricsRow = {
  strategy_id: string;
  name: string;
  status: string;
  description: string | null;
  net_pnl_today: number | null;
  dd_today: number | null;
  latest_exposure: number | null;
  readiness_score: number | null;
  project_notes: string | null;
  project_id: string | null;
  decisions_count: bigint | number | null;
};

type StrategySummary = {
  id: string;
  name: string;
  status: string;
  description: string | null;
  project?: {
    id: string;
    readinessScore: number;
    notes: string | null;
  };
};

type HomeData = {
  totalNetPnl: number;
  totalExposure: number;
  maxDD: number;
  strategyAttribution: Array<{ name: string; pnl: number; status: string }>;
  strategies: StrategySummary[];
  decisionsCount: number;
};

const getHomeData = unstable_cache(async (): Promise<HomeData> => {
  const today = startOfDay(new Date());
  const todayStr = format(today, "yyyy-MM-dd");
  const sevenDaysAgoStr = format(subDays(today, 7), "yyyy-MM-dd");

  const strategyMetrics = await prisma.$queryRaw<StrategyMetricsRow[]>`
    WITH todays AS (
      SELECT strategy_id, net_pnl, dd
      FROM daily_pnl
      WHERE d = ${todayStr}::date
    ),
    latest_exposure AS (
      SELECT DISTINCT ON (strategy_id)
        strategy_id,
        exposure
      FROM daily_pnl
      WHERE d >= ${sevenDaysAgoStr}::date
      ORDER BY strategy_id, d DESC
    )
    SELECT
      s.id AS strategy_id,
      s.name,
      s.status,
      s.description,
      t.net_pnl AS net_pnl_today,
      t.dd AS dd_today,
      le.exposure AS latest_exposure,
      lp.readiness_score,
      lp.notes AS project_notes,
      lp.id AS project_id,
      (SELECT COUNT(*)::bigint FROM decisions) AS decisions_count
    FROM strategies s
    LEFT JOIN todays t ON t.strategy_id = s.id
    LEFT JOIN latest_exposure le ON le.strategy_id = s.id
    LEFT JOIN LATERAL (
      SELECT p.id, p.readiness_score, p.notes
      FROM projects p
      WHERE p.strategy_id = s.id
      ORDER BY p.last_updated DESC
      LIMIT 1
    ) lp ON TRUE;
  `;

  const decisionsCount =
    strategyMetrics.length > 0
      ? Number(strategyMetrics[0].decisions_count ?? 0)
      : await prisma.decision.count();

  const totalNetPnl = strategyMetrics.reduce(
    (sum, row) => sum + (row.net_pnl_today ?? 0),
    0
  );

  const ddValues = strategyMetrics
    .map((row) => row.dd_today)
    .filter((value): value is number => value !== null);

  const maxDD = Math.min(...ddValues, 0);

  const totalExposure = strategyMetrics.reduce((sum, row) => {
    if (row.status === "live" && row.latest_exposure !== null) {
      return sum + row.latest_exposure;
    }
    return sum;
  }, 0);

  const strategyAttribution = strategyMetrics
    .filter((row) => row.net_pnl_today !== null)
    .map((row) => ({
      name: row.name,
      pnl: row.net_pnl_today ?? 0,
      status: row.status,
    }))
    .sort((a, b) => b.pnl - a.pnl);

  const strategies = strategyMetrics.map<StrategySummary>((row) => ({
    id: row.strategy_id,
    name: row.name,
    status: row.status,
    description: row.description,
    project: row.project_id
      ? {
          id: row.project_id,
          readinessScore: row.readiness_score ?? 0,
          notes: row.project_notes,
        }
      : undefined,
  }));

  return {
    totalNetPnl,
    totalExposure,
    maxDD,
    strategyAttribution,
    strategies,
    decisionsCount,
  };
}, ["dashboard-home"], {
  revalidate: 120,
  tags: ["dashboard-home"],
});

export const dynamic = 'force-dynamic';

export default async function Home() {
  const data = await getHomeData();
  const liveStrategies = data.strategies.filter((s) => s.status === "live");
  const stagingStrategies = data.strategies
    .filter((s) => s.status === "staging")
    .map((strategy) => ({
      id: strategy.id,
      name: strategy.name,
      readinessScore: strategy.project?.readinessScore ?? 0,
      notes: strategy.project?.notes ?? "",
      description: strategy.description ?? "",
    }))
    .sort((a, b) => b.readinessScore - a.readinessScore);
  const rAndDStrategies = data.strategies.filter(
    (s) => s.status === "r_and_d"
  );

  const openRiskPercent = Math.min(
    100,
    Math.max(0, Number((data.totalExposure * 100).toFixed(1)))
  );
  const positivePnL = data.totalNetPnl >= 0;
  const navContribution = ((data.totalNetPnl / 1_000_000) * 100).toFixed(2);
  const maxAbsAttribution = Math.max(
    1,
    ...data.strategyAttribution.map((item) => Math.abs(item.pnl))
  );

  const topStaging = stagingStrategies[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="border-none bg-gradient-to-r from-primary/15 via-primary/10 to-background shadow-lg shadow-primary/20">
          <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Money-first pulse</CardTitle>
              <CardDescription>
                Where the desk stands right now — capital, risk, and drawdown.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="w-fit">
              Focus: Convert staging → live
            </Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-primary/20 bg-background/70 p-4 shadow-sm">
                <span className="text-xs font-semibold uppercase text-muted-foreground">
                  Today&apos;s net PnL
                </span>
                <p
                  className={`mt-2 text-3xl font-semibold ${
                    positivePnL ? "text-emerald-500" : "text-rose-500"
                  }`}
                >
                  ₹{data.totalNetPnl.toLocaleString("en-IN", {
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {positivePnL ? "+" : ""}
                  {navContribution}% of NAV
                </p>
              </div>
              <div className="rounded-lg border border-primary/20 bg-background/70 p-4 shadow-sm">
                <span className="text-xs font-semibold uppercase text-muted-foreground">
                  Open risk
                </span>
                <p className="mt-2 text-3xl font-semibold">{openRiskPercent}%</p>
                <div className="mt-3 h-2 w-full rounded-full bg-primary/10">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${openRiskPercent}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  of maximum allocation
                </p>
              </div>
              <div className="rounded-lg border border-primary/20 bg-background/70 p-4 shadow-sm">
                <span className="text-xs font-semibold uppercase text-muted-foreground">
                  Max drawdown (30d)
                </span>
                <p className="mt-2 text-3xl font-semibold text-amber-500">
                  {data.maxDD.toFixed(2)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {data.maxDD >= -4 ? "Within guardrails" : "Review risk playbook"}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-primary/30 bg-background/60 p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Next decision on deck
                  </p>
                  {topStaging ? (
                    <>
                      <p className="mt-1 text-base font-semibold">
                        {topStaging.name} · readiness {topStaging.readinessScore}/100
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {topStaging.notes || "No blockers logged. Ready for director review."}
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Staging queue is clear. Shift focus to R&amp;D experiments ready for uplift.
                    </p>
                  )}
                </div>
                <Button variant="secondary" size="sm" asChild>
                  <Link href="/projects">Review readiness</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground">
              Today&apos;s net PnL
            </CardTitle>
            <CardDescription>
              Instant read on profit after fees
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                positivePnL ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              ₹{data.totalNetPnl.toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}
            </p>
            <p className="text-xs text-muted-foreground">
              {positivePnL ? "Up" : "Down"} {navContribution}% vs NAV
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground">
              Open risk
            </CardTitle>
            <CardDescription>Exposure vs approved ceiling</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{openRiskPercent}%</p>
            <div className="mt-3 h-2 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${openRiskPercent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Maintain &lt; 70% until directors scale capital.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground">
              Active strategies
            </CardTitle>
            <CardDescription>
              Live capital deployments on the desk
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{liveStrategies.length}</p>
            <p className="text-xs text-muted-foreground">
              {stagingStrategies.length} staging · {rAndDStrategies.length} R&amp;D
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground">
              Decision velocity
            </CardTitle>
            <CardDescription>
              Running count of audit-trail events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.decisionsCount}</p>
            <p className="text-xs text-muted-foreground">
              Goal: Directors log every call with rationale.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Today&apos;s attribution</CardTitle>
            <CardDescription>
              Who made or lost us money after fees.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.strategyAttribution.length > 0 ? (
              data.strategyAttribution.map((item) => {
                const contribution =
                  (Math.abs(item.pnl) / maxAbsAttribution) * 100 || 0;
                return (
                  <div key={item.name} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{item.name}</span>
                        <Badge
                          variant={item.status === "live" ? "default" : "secondary"}
                          className="text-xs capitalize"
                        >
                          {item.status}
                        </Badge>
                      </div>
                      <span
                        className={`font-mono text-sm ${
                          item.pnl >= 0 ? "text-emerald-500" : "text-rose-500"
                        }`}
                      >
                        {item.pnl >= 0 ? "+" : "−"}₹
                        {Math.abs(item.pnl).toLocaleString("en-IN", {
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className={`h-2 rounded-full ${
                          item.pnl >= 0 ? "bg-emerald-500" : "bg-rose-500"
                        }`}
                        style={{ width: `${contribution}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">
                No PnL data ingested for today. Check the Raspberry Pi feed.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Playbook checkpoints</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-lg border border-border/60 bg-background p-3">
              <p className="font-semibold text-foreground">PnL ingestion</p>
              <p>Ensure /api/ingest/daily-pnl ran in the last 24 hours.</p>
            </div>
            <div className="rounded-lg border border-border/60 bg-background p-3">
              <p className="font-semibold text-foreground">Decision log</p>
              <p>
                Directors record rationale &gt;= 20 chars when promoting or pausing
                strategies.
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-background p-3">
              <p className="font-semibold text-foreground">Runbook hygiene</p>
              <p>
                Review runbooks for staging strategies before Monday&apos;s capital call.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-emerald-600">
              Money now · live
            </CardTitle>
            <CardDescription>Capital deployed and scaling.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {liveStrategies.length > 0 ? (
              liveStrategies.map((strategy) => {
                const readiness = strategy.project?.readinessScore ?? 0;
                return (
                  <div
                    key={strategy.id}
                    className="rounded-md border border-emerald-200/60 bg-emerald-50/40 p-3 dark:border-emerald-500/40 dark:bg-emerald-500/10"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">
                        {strategy.name}
                      </span>
                      <Badge variant="default">{readiness}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {strategy.description ?? "No description provided."}
                    </p>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-emerald-200/70 dark:bg-emerald-500/30">
                      <div
                        className="h-full bg-emerald-500 dark:bg-emerald-400"
                        style={{ width: `${readiness}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">
                No live strategies yet. Promote a staging strategy when ready.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-amber-600">
              Money next · staging
            </CardTitle>
            <CardDescription>Almost ready — directors to review.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stagingStrategies.length > 0 ? (
              stagingStrategies.map((strategy) => (
                <div
                  key={strategy.id}
                  className="rounded-md border border-amber-200/60 bg-amber-50/40 p-3 dark:border-amber-500/40 dark:bg-amber-500/10"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      {strategy.name}
                    </span>
                    <Badge variant="secondary" className="bg-amber-500 text-white dark:bg-amber-400">
                      {strategy.readinessScore}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {strategy.notes || strategy.description || "No blockers logged."}
                  </p>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-amber-200/70 dark:bg-amber-500/30">
                    <div
                      className="h-full bg-amber-500 dark:bg-amber-400"
                      style={{ width: `${strategy.readinessScore}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Staging queue is empty. Evaluate R&amp;D candidates for promotion.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-rose-600">
              R&amp;D · exploration
            </CardTitle>
            <CardDescription>Experiments building the next pipeline.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {rAndDStrategies.length > 0 ? (
              rAndDStrategies.map((strategy) => {
                const readiness = strategy.project?.readinessScore ?? 0;
                return (
                  <div
                    key={strategy.id}
                    className="rounded-md border border-rose-200/60 bg-rose-50/40 p-3 dark:border-rose-500/40 dark:bg-rose-500/10"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">
                        {strategy.name}
                      </span>
                      <Badge variant="outline" className="border-rose-400 text-rose-600 dark:border-rose-400/60 dark:text-rose-300">
                        {readiness}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {strategy.description ?? "Experiment in discovery phase."}
                    </p>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-rose-200/60 dark:bg-rose-500/30">
                      <div
                        className="h-full bg-rose-400 dark:bg-rose-300"
                        style={{ width: `${readiness}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">
                No active R&amp;D threads. Spin up new research in the backlog.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
