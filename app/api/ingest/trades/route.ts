import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Validation schema
const tradeSchema = z.object({
  ext_trade_id: z.string(),
  ts: z.string().datetime(),
  symbol: z.string(),
  side: z.enum(['buy', 'sell']),
  qty: z.number().positive(),
  price: z.number().positive(),
  fees: z.number().default(0),
  venue: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

const requestSchema = z.object({
  strategy: z.string(),
  trades: z.array(tradeSchema),
});

// Simple auth check
function verifyIngestToken(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  const expectedToken = process.env.INGEST_TOKEN;

  if (!authHeader || !expectedToken) {
    return false;
  }

  const token = authHeader.replace('Bearer ', '');
  return token === expectedToken;
}

export async function POST(req: NextRequest) {
  try {
    // Verify auth
    if (!verifyIngestToken(req)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { strategy, trades } = requestSchema.parse(body);

    // Upsert strategy
    const strategyRecord = await prisma.strategy.upsert({
      where: { name: strategy },
      create: { name: strategy, status: 'r_and_d' },
      update: {},
    });

    // Create trades
    const createdTrades = [];
    for (const trade of trades) {
      const created = await prisma.trade.upsert({
        where: { extTradeId: trade.ext_trade_id },
        create: {
          strategyId: strategyRecord.id,
          ts: new Date(trade.ts),
          symbol: trade.symbol,
          side: trade.side,
          qty: trade.qty,
          price: trade.price,
          fees: trade.fees,
          venue: trade.venue || null,
          tags: JSON.stringify(trade.tags),
          extTradeId: trade.ext_trade_id,
        },
        update: {
          ts: new Date(trade.ts),
          symbol: trade.symbol,
          side: trade.side,
          qty: trade.qty,
          price: trade.price,
          fees: trade.fees,
          venue: trade.venue || null,
          tags: JSON.stringify(trade.tags),
        },
      });
      createdTrades.push(created);
    }

    return NextResponse.json({
      ok: true,
      inserted: createdTrades.length,
    });
  } catch (error) {
    console.error('Trade ingestion error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
