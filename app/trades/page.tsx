import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TradeLogForm } from "@/components/trades/trade-log-form";

async function getTrades() {
  const trades = await prisma.trade.findMany({
    include: {
      strategy: true,
    },
    orderBy: {
      ts: 'desc',
    },
    take: 50,
  });

  return trades;
}

export default async function TradesPage() {
  const trades = await getTrades();

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
          <CardTitle>Recent Trades</CardTitle>
        </CardHeader>
        <CardContent>
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
                  const tags = trade.tags ? JSON.parse(trade.tags) : [];
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
