import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function getReadinessBadge(score: number) {
  if (score >= 85) return { label: "Ship Now", variant: "default" as const, color: "bg-green-700" };
  if (score >= 70) return { label: "Shipable", variant: "default" as const, color: "bg-green-600" };
  if (score >= 40) return { label: "Staging", variant: "secondary" as const, color: "bg-amber-500" };
  return { label: "R&D", variant: "destructive" as const, color: "bg-red-600" };
}

async function getProjects() {
  const projects = await prisma.project.findMany({
    include: {
      strategy: true,
    },
  });

  return projects;
}

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
        <p className="text-muted-foreground">
          Production-readiness matrix with 0-100 scoring
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => {
          const badge = getReadinessBadge(project.readinessScore);
          const breakdown = project.readinessBreakdown as any;

          return (
            <Card key={project.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{project.strategy.name}</CardTitle>
                    <CardDescription>{project.strategy.description}</CardDescription>
                  </div>
                  <Badge variant={badge.variant} className={badge.color}>
                    {project.readinessScore}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Readiness</span>
                      <span className="font-semibold">{badge.label}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${badge.color}`}
                        style={{ width: `${project.readinessScore}%` }}
                      />
                    </div>
                  </div>

                  {breakdown && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">Breakdown:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Risk:</span>
                          <span className="font-mono">{breakdown.risk}/100</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Parity:</span>
                          <span className="font-mono">{breakdown.parity}/100</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Data:</span>
                          <span className="font-mono">{breakdown.data}/100</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Backtest:</span>
                          <span className="font-mono">{breakdown.backtest}/100</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Code:</span>
                          <span className="font-mono">{breakdown.code}/100</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Ops:</span>
                          <span className="font-mono">{breakdown.ops}/100</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {project.notes && (
                    <p className="text-xs text-muted-foreground italic border-l-2 pl-2">
                      {project.notes}
                    </p>
                  )}

                  <div className="pt-2 border-t space-y-1">
                    {project.repoUrl && (
                      <a
                        href={project.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline block"
                      >
                        📁 Repository
                      </a>
                    )}
                    {project.lastBacktestUrl && (
                      <a
                        href={project.lastBacktestUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline block"
                      >
                        📊 Latest Backtest
                      </a>
                    )}
                    {project.runbookUrl && (
                      <a
                        href={project.runbookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline block"
                      >
                        📖 Runbook
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
