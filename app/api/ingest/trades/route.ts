import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Validation schema
const MAX_TRADES_PER_REQUEST =
  Number(process.env.INGEST_MAX_TRADES ?? 500) || 500;

const tradeSchema = z.object({
  ext_trade_id: z.string(),
  ts: z.string().datetime(),
  symbol: z.string(),
  side: z.enum(['buy', 'sell']),
  qty: z.number().positive(),
  price: z.number().positive(),
  fees: z.number().default(0),
  venue: z.string().optional(),
  tags: z
    .array(z.string().trim().min(1))
    .max(16, "Trades support up to 16 tags")
    .default([]),
});

const requestSchema = z.object({
  strategy: z.string(),
  trades: z
    .array(tradeSchema)
    .min(1, "Provide at least one trade")
    .max(MAX_TRADES_PER_REQUEST, "Batch exceeds configured trade limit"),
});

class IngestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

const STRATEGY_WHITELIST = new Set(
  (process.env.INGEST_STRATEGY_WHITELIST ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
);

const WHITELIST_ENABLED = STRATEGY_WHITELIST.size > 0;

function ensureStrategyAllowed(strategy: string) {
  if (!WHITELIST_ENABLED) return;
  if (STRATEGY_WHITELIST.has(strategy)) return;
  throw new IngestError(
    `Strategy "${strategy}" is not whitelisted for ingestion`,
    403
  );
}

async function ensureStrategy(
  tx: Prisma.TransactionClient,
  strategyName: string
) {
  const existing = await tx.strategy.findUnique({
    where: { name: strategyName },
  });

  if (existing) {
    ensureStrategyAllowed(strategyName);
    return existing;
  }

  ensureStrategyAllowed(strategyName);

  return tx.strategy.create({
    data: { name: strategyName, status: "r_and_d" },
  });
}

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

    const inserted = await prisma.$transaction(
      async (tx) => {
        const strategyRecord = await ensureStrategy(tx, strategy);

        const createdTrades = await Promise.all(
          trades.map((trade) =>
            tx.trade.upsert({
              where: { extTradeId: trade.ext_trade_id },
              create: {
                strategyId: strategyRecord.id,
                ts: new Date(trade.ts),
                symbol: trade.symbol,
                side: trade.side,
                qty: trade.qty,
                price: trade.price,
                fees: trade.fees,
                venue: trade.venue ?? null,
                tags: trade.tags,
                extTradeId: trade.ext_trade_id,
              },
              update: {
                ts: new Date(trade.ts),
                symbol: trade.symbol,
                side: trade.side,
                qty: trade.qty,
                price: trade.price,
                fees: trade.fees,
                venue: trade.venue ?? null,
                tags: trade.tags,
              },
            })
          )
        );

        return createdTrades.length;
      },
      { timeout: 30_000 }
    );

    return NextResponse.json({
      ok: true,
      inserted,
    });
  } catch (error) {
    console.error('Trade ingestion error:', error);

    if (error instanceof IngestError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

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
