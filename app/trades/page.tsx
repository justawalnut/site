import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TradeLogForm } from "@/components/trades/trade-log-form";

const TRADES_PER_PAGE = 50;

async function getTrades(page: number) {
  const skip = (page - 1) * TRADES_PER_PAGE;

  const [trades, totalCount] = await Promise.all([
    prisma.trade.findMany({
      include: {
        strategy: true,
      },
      orderBy: {
        ts: 'desc',
      },
      skip,
      take: TRADES_PER_PAGE,
    }),
    prisma.trade.count(),
  ]);

  return { trades, totalCount };
}

type TradesSearchParams = {
  page?: string;
};

interface TradesPageProps {
  searchParams?: Promise<TradesSearchParams>;
}

export default async function TradesPage({ searchParams }: TradesPageProps) {
  const resolvedSearchParams = await searchParams;
  const currentPage = Math.max(1, Number(resolvedSearchParams?.page) || 1);
  const { trades, totalCount } = await getTrades(currentPage);
  const totalPages = Math.ceil(totalCount / TRADES_PER_PAGE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trades</h1>
        <p className="text-muted-foreground">
          All trade executions with filters and context
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Recent Trades</CardTitle>
            {totalCount > 0 && (
              <p className="text-xs text-muted-foreground">
                Showing {((currentPage - 1) * TRADES_PER_PAGE) + 1}-{Math.min(currentPage * TRADES_PER_PAGE, totalCount)} of {totalCount} trades
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {trades.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-12 text-center">
              <p className="text-sm font-medium text-muted-foreground">No trades recorded yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Trades will appear here once they&apos;re ingested via the API
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Time (IST)</th>
                    <th className="text-left p-2">Strategy</th>
                    <th className="text-left p-2">Symbol</th>
                    <th className="text-left p-2">Side</th>
                    <th className="text-right p-2">Qty</th>
                    <th className="text-right p-2">Price</th>
                    <th className="text-right p-2">Fees</th>
                    <th className="text-left p-2">Venue</th>
                    <th className="text-left p-2">Tags</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade) => {
                    const tags = trade.tags ?? [];
                    return (
                      <tr key={trade.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-mono text-xs">
                          {new Date(trade.ts).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="p-2">
                          <Badge variant="outline">{trade.strategy.name}</Badge>
                        </td>
                        <td className="p-2 font-medium">{trade.symbol}</td>
                        <td className="p-2">
                          <Badge variant={trade.side === 'buy' ? 'default' : 'secondary'}>
                            {trade.side.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-2 text-right font-mono">{trade.qty}</td>
                        <td className="p-2 text-right font-mono">
                          {trade.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 text-right font-mono text-red-600">
                          {trade.fees.toFixed(2)}
                        </td>
                        <td className="p-2 text-muted-foreground text-xs">{trade.venue}</td>
                        <td className="p-2">
                          <div className="flex gap-1 flex-wrap">
                            {tags.map((tag: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
                disabled={currentPage === 1}
              >
                {currentPage === 1 ? (
                  <span className="cursor-not-allowed opacity-50">Previous</span>
                ) : (
                  <Link href={`/trades?page=${currentPage - 1}`}>Previous</Link>
                )}
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                asChild
                disabled={currentPage === totalPages}
              >
                {currentPage === totalPages ? (
                  <span className="cursor-not-allowed opacity-50">Next</span>
                ) : (
                  <Link href={`/trades?page=${currentPage + 1}`}>Next</Link>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily trade log</CardTitle>
          <CardDescription>
            Capture the pre-market plan and the post-market recap.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TradeLogForm />
        </CardContent>
      </Card>
    </div>
  );
}
