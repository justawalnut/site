import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { fromZonedTime } from "date-fns-tz";
import { format } from "date-fns";

// Validation schema
const requestSchema = z.object({
  d: z.string(), // date string YYYY-MM-DD
  strategy: z.string(),
  gross_pnl: z.number(),
  fees: z.number().default(0),
  dd: z.number().optional(),
  exposure: z.number().optional(),
  tz: z.string().optional(),
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

const DEFAULT_INGEST_TIMEZONE = process.env.INGEST_TIMEZONE ?? "Asia/Kolkata";

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

function parseDeskDate(date: string, timezone: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new IngestError("Date must be provided as YYYY-MM-DD", 400);
  }

  const zonedMidday = fromZonedTime(`${date}T12:00:00`, timezone);
  const isoDay = format(zonedMidday, "yyyy-MM-dd");
  return new Date(`${isoDay}T00:00:00.000Z`);
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
    const { d, strategy, gross_pnl, fees, dd, exposure, tz } =
      requestSchema.parse(body);

    const timezone = tz ?? DEFAULT_INGEST_TIMEZONE;
    const date = parseDeskDate(d, timezone);

    const pnl = await prisma.$transaction(async (tx) => {
      const strategyRecord = await ensureStrategy(tx, strategy);

      return tx.dailyPnl.upsert({
        where: {
          d_strategyId: {
            d: date,
            strategyId: strategyRecord.id,
          },
        },
        create: {
          d: date,
          strategyId: strategyRecord.id,
          grossPnl: gross_pnl,
          fees: fees,
          netPnl: gross_pnl - fees,
          dd: dd ?? null,
          exposure: exposure ?? null,
        },
        update: {
          grossPnl: gross_pnl,
          fees: fees,
          netPnl: gross_pnl - fees,
          dd: dd ?? null,
          exposure: exposure ?? null,
        },
      });
    });

    return NextResponse.json({
      ok: true,
      pnl_id: pnl.id,
    });
  } catch (error) {
    console.error('PnL ingestion error:', error);

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
