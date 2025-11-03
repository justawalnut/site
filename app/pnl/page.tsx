import Link from "next/link";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subDays,
  addDays,
} from "date-fns";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CalendarDay = {
  date: Date;
  label: string;
  net: number | null;
  isCurrentMonth: boolean;
};

async function getPnlData(month: number, year: number) {
  const baseDate = new Date(year, month - 1, 1);
  const monthStart = startOfMonth(baseDate);
  const monthEnd = endOfMonth(baseDate);

  const fetchStart = subDays(monthStart, 7);
  const fetchEnd = addDays(monthEnd, 7);

  const pnlEntries = await prisma.dailyPnl.findMany({
    where: {
      d: {
        gte: fetchStart,
        lte: fetchEnd,
      },
    },
    include: {
      strategy: true,
    },
    orderBy: {
      d: "asc",
    },
  });

  const totalsByDate = pnlEntries.reduce<Record<string, number>>((acc, entry) => {
    const key = format(entry.d, "yyyy-MM-dd");
    acc[key] = (acc[key] ?? 0) + entry.netPnl;
    return acc;
  }, {});

  const groupedForTable = pnlEntries.reduce<
    Record<
      string,
      {
        date: string;
        entries: typeof pnlEntries;
      }
    >
  >((acc, entry) => {
    const key = format(entry.d, "yyyy-MM-dd");
    if (!acc[key]) {
      acc[key] = {
        date: key,
        entries: [],
      };
    }
    acc[key].entries.push(entry);
    return acc;
  }, {});

  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays: CalendarDay[] = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  }).map((date) => {
    const key = format(date, "yyyy-MM-dd");
    return {
      date,
      label: format(date, "d"),
      net: totalsByDate[key] ?? null,
      isCurrentMonth: isSameMonth(date, monthStart),
    };
  });

  const tableDays = Object.values(groupedForTable)
    .sort((a, b) => (a.date > b.date ? -1 : 1))
    .map((day) => ({
      date: day.date,
      entries: day.entries.sort((a, b) => a.strategy.name.localeCompare(b.strategy.name)),
    }));

  return {
    calendarDays,
    tableDays,
    monthLabel: format(monthStart, "LLLL yyyy"),
  };
}

type PnlSearchParams = {
  month?: string;
  year?: string;
  detailsPage?: string;
};

interface PnlPageProps {
  searchParams?: Promise<PnlSearchParams>;
}

const DAYS_PER_PAGE = 10;

export default async function PnlPage({ searchParams }: PnlPageProps) {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  const resolvedSearchParams = await searchParams;

  const selectedMonth = (() => {
    const value = Number(resolvedSearchParams?.month ?? currentMonth);
    return Number.isNaN(value) || value < 1 || value > 12 ? currentMonth : value;
  })();

  const selectedYear = (() => {
    const value = Number(resolvedSearchParams?.year ?? currentYear);
    return Number.isNaN(value) ? currentYear : value;
  })();

  const detailsPage = Math.max(1, Number(resolvedSearchParams?.detailsPage) || 1);

  const { calendarDays, tableDays, monthLabel } = await getPnlData(selectedMonth, selectedYear);
  const intensities = calendarDays
    .filter((day) => day.net !== null)
    .map((day) => Math.abs(day.net ?? 0));
  const maxAbsNet = Math.max(1, ...intensities);
  const hasAnyData = tableDays.length > 0;

  const totalDetailsPages = Math.ceil(tableDays.length / DAYS_PER_PAGE);
  const paginatedTableDays = tableDays.slice(
    (detailsPage - 1) * DAYS_PER_PAGE,
    detailsPage * DAYS_PER_PAGE
  );

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const yearOptions = Array.from({ length: 5 }, (_, index) => currentYear - index);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">PnL</h1>
        <p className="text-muted-foreground">
          Month-at-a-glance calendar with expandable daily drill-downs.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>{monthLabel} calendar</CardTitle>
            <form className="flex flex-wrap items-end gap-2 text-sm" method="get">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">Month</span>
                <select
                  name="month"
                  defaultValue={String(selectedMonth)}
                  className="rounded-md border border-border bg-background px-3 py-2"
                >
                  {monthNames.map((label, index) => (
                    <option key={label} value={index + 1}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">Year</span>
                <select
                  name="year"
                  defaultValue={String(selectedYear)}
                  className="rounded-md border border-border bg-background px-3 py-2"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>
              <Button type="submit" size="sm" className="h-9 px-3">
                Go
              </Button>
            </form>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasAnyData && (
            <div className="mb-4 rounded-lg border border-dashed border-border/60 bg-muted/20 p-6 text-center">
              <p className="text-sm font-medium text-muted-foreground">No PnL data for this month</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Data will appear once daily PnL is ingested via the API
              </p>
            </div>
          )}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase text-muted-foreground">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2 text-sm">
            {calendarDays.map((day) => {
              const intensity =
                day.net !== null ? Math.min(1, Math.abs(day.net) / maxAbsNet) : 0;
              const bg =
                day.net === null
                  ? "bg-muted/50 border-dashed"
                  : day.net >= 0
                    ? "bg-emerald-500/10 border-emerald-300/60 dark:bg-emerald-500/15"
                    : "bg-rose-500/10 border-rose-300/60 dark:bg-rose-500/15";
              const opacity =
                day.net === null ? 100 : Math.max(30, Math.round(intensity * 90));
              return (
                <div
                  key={day.date.toISOString()}
                  className={cn(
                    "flex h-24 flex-col justify-between rounded-md border p-2 transition",
                    bg,
                    !day.isCurrentMonth && "opacity-40"
                  )}
                  style={
                    day.net !== null
                      ? { boxShadow: `0 0 0 1px rgba(0,0,0,0.02)` }
                      : undefined
                  }
                >
                  <span className="text-xs font-semibold text-muted-foreground">
                    {day.label}
                  </span>
                  <div className="space-y-1">
                    {day.net !== null ? (
                      <>
                        <span
                          className={cn(
                            "block text-sm font-semibold",
                            day.net >= 0 ? "text-emerald-600" : "text-rose-600"
                          )}
                        >
                          {day.net >= 0 ? "+" : "−"}₹
                          {Math.abs(day.net).toLocaleString("en-IN", {
                            maximumFractionDigits: 0,
                          })}
                        </span>
                        <div
                          className="h-2 overflow-hidden rounded-full bg-transparent"
                          aria-hidden
                        >
                          <div
                            className={cn(
                              "h-full rounded-full",
                              day.net >= 0 ? "bg-emerald-500/70" : "bg-rose-500/70"
                            )}
                            style={{ width: `${opacity}%` }}
                          />
                        </div>
                      </>
                    ) : (
                      <span className="text-[0.65rem] text-muted-foreground">
                        No data
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Daily PnL details</CardTitle>
            {tableDays.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {tableDays.length} days with data
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <details className="group space-y-4 rounded-lg border border-dashed border-primary/40 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-primary">
              Expand daily breakdown
            </summary>
            <div className="space-y-6">
              {tableDays.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No PnL entries for this month yet.
                </p>
              ) : (
                <>
                  {paginatedTableDays.map((day) => (
                  <div key={day.date} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">
                        {new Date(day.date).toLocaleDateString("en-IN", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {day.entries.length} strategies
                      </span>
                    </div>
                    <div className="overflow-x-auto rounded-md border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                          <tr>
                            <th className="p-2 text-left">Strategy</th>
                            <th className="p-2 text-right">Gross</th>
                            <th className="p-2 text-right">Fees</th>
                            <th className="p-2 text-right">Net</th>
                            <th className="p-2 text-right">DD %</th>
                            <th className="p-2 text-right">Exposure</th>
                          </tr>
                        </thead>
                        <tbody>
                          {day.entries.map((entry) => (
                            <tr key={entry.id} className="border-t">
                              <td className="p-2 font-medium">{entry.strategy.name}</td>
                              <td className="p-2 text-right font-mono text-sm">
                                ₹{entry.grossPnl.toLocaleString("en-IN", {
                                  maximumFractionDigits: 0,
                                })}
                              </td>
                              <td className="p-2 text-right font-mono text-sm text-rose-500">
                                −₹{entry.fees.toFixed(0)}
                              </td>
                              <td
                                className={cn(
                                  "p-2 text-right font-mono text-sm font-semibold",
                                  entry.netPnl >= 0 ? "text-emerald-600" : "text-rose-600"
                                )}
                              >
                                {entry.netPnl >= 0 ? "+" : "−"}₹
                                {Math.abs(entry.netPnl).toLocaleString("en-IN", {
                                  maximumFractionDigits: 0,
                                })}
                              </td>
                              <td className="p-2 text-right font-mono text-sm text-amber-500">
                                {entry.dd?.toFixed(2)}%
                              </td>
                              <td className="p-2 text-right font-mono text-sm">
                                {((entry.exposure || 0) * 100).toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  ))}
                  {totalDetailsPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        disabled={detailsPage === 1}
                      >
                        {detailsPage === 1 ? (
                          <span className="cursor-not-allowed opacity-50">Previous</span>
                        ) : (
                          <Link href={`/pnl?month=${selectedMonth}&year=${selectedYear}&detailsPage=${detailsPage - 1}`}>
                            Previous
                          </Link>
                        )}
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {detailsPage} of {totalDetailsPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        disabled={detailsPage === totalDetailsPages}
                      >
                        {detailsPage === totalDetailsPages ? (
                          <span className="cursor-not-allowed opacity-50">Next</span>
                        ) : (
                          <Link href={`/pnl?month=${selectedMonth}&year=${selectedYear}&detailsPage=${detailsPage + 1}`}>
                            Next
                          </Link>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  );
}
