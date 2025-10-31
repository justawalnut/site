import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Validation schema
const requestSchema = z.object({
  d: z.string(), // date string YYYY-MM-DD
  strategy: z.string(),
  gross_pnl: z.number(),
  fees: z.number().default(0),
  dd: z.number().optional(),
  exposure: z.number().optional(),
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
    const { d, strategy, gross_pnl, fees, dd, exposure } = requestSchema.parse(body);

    // Upsert strategy
    const strategyRecord = await prisma.strategy.upsert({
      where: { name: strategy },
      create: { name: strategy, status: 'r_and_d' },
      update: {},
    });

    // Parse date
    const date = new Date(d);

    // Upsert daily PnL
    const pnl = await prisma.dailyPnl.upsert({
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
        dd: dd || null,
        exposure: exposure || null,
      },
      update: {
        grossPnl: gross_pnl,
        fees: fees,
        netPnl: gross_pnl - fees,
        dd: dd || null,
        exposure: exposure || null,
      },
    });

    return NextResponse.json({
      ok: true,
      pnl_id: pnl.id,
    });
  } catch (error) {
    console.error('PnL ingestion error:', error);

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
