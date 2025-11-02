# Trading Operations Dashboard

A **money-first, director-friendly** trading operations dashboard built with Next.js, Prisma, and shadcn/ui.

## Quick Start

```bash
# Install dependencies
npm install

# Ensure DATABASE_URL points at your Postgres instance (e.g. Supabase)
# Run migrations and seed data
npx prisma migrate deploy
npm run db:seed

# Start development server
npm run dev
```

Visit **http://localhost:3000**

> **Heads-up:** The app targets PostgreSQL. For local development you can point `DATABASE_URL` at a Supabase instance (recommended) or any Postgres service. When deploying, provision the pooled connection string (`pgbouncer=true&connection_limit=1`) as `DATABASE_POOL_URL` so serverless functions reuse connections safely.

## Project Structure

```
/app
  /api
    /ingest
      /trades         # POST endpoint for trade ingestion
      /daily-pnl      # POST endpoint for PnL ingestion
    /healthz          # Health check endpoint
  /page.tsx           # Home dashboard (KPIs, attribution, 3-bucket view)
  /trades             # Trades table with filters
  /pnl                # PnL charts and attribution
  /projects           # Readiness matrix (0-100 scoring)
  /notes              # Collaboration notes

/components
  /ui                 # shadcn/ui components
  /navigation.tsx     # Main navigation

/lib
  /db.ts              # Prisma client
  /utils.ts           # Utility functions

/prisma
  /schema.prisma      # Database schema
  /seed.ts            # Seed data script
```

## Features Implemented

### ✅ Phase 0: Scaffold (COMPLETE)
- [x] Next.js 15 with App Router
- [x] TypeScript + Tailwind CSS
- [x] shadcn/ui component library
- [x] Prisma ORM with PostgreSQL
- [x] Seeded database with realistic data

### ✅ Core Pages (COMPLETE)
- [x] **Home**: KPI cards, strategy attribution, 3-bucket view, daily summary
- [x] **Trades**: Filterable table with strategy, symbol, side, qty, price, fees, tags
- [x] **PnL**: 30-day chart + detailed table with DD% and exposure
- [x] **Projects**: Readiness matrix with badges (0-100 scoring)
- [x] **Notes**: Threaded collaboration with role badges

### ✅ API Routes (COMPLETE)
- [x] `/api/ingest/trades` - Idempotent trade upsert
- [x] `/api/ingest/daily-pnl` - Daily PnL upsert
- [x] `/api/healthz` - Health check

### 🚧 TODO (Next Phase)
- [ ] Auth.js with GitHub OAuth
- [ ] Decision Tray for directors (promote/pause/kill)
- [ ] Notes creation UI
- [ ] Readiness score editor
- [ ] CSV upload for trades
- [ ] Raspberry Pi ingestion scripts

## Database Schema

### Key Models
- **User** + **Role** (engineer, director)
- **Strategy** (live, staging, r_and_d, paused)
- **Project** with readiness score (0-100) and breakdown
- **Trade** with idempotent `extTradeId`
- **DailyPnl** with net PnL, DD%, exposure
- **Note** (scoped to day/strategy/trade)
- **Decision** (promote/pause/kill with rationale)
- **AuditLog** (immutable change tracking)

## Production Readiness Scoring (0-100)

| Dimension               | Weight | Description                          |
|-------------------------|--------|--------------------------------------|
| Risk Controls           | 25%    | Hard stops, ATR sizing, circuit break|
| Live-Sim Parity         | 20%    | Slippage, latency, param match       |
| Data Integrity          | 15%    | Corp actions, survivorship, outliers |
| Backtest Rigor          | 15%    | Walk-forward, OOS, stress tests      |
| Code & Runbook          | 15%    | Tests, reproducible env, runbook     |
| Operational Footprint   | 10%    | Monitoring, logging, pager           |

**Badge Logic:**
- 0-39: **Red** (R&D)
- 40-69: **Amber** (Staging)
- 70-84: **Green** (Shipable)
- 85-100: **Dark Green** (Ship Now)

## API Usage

### Ingest Trades
```bash
curl -X POST http://localhost:3000/api/ingest/trades \
  -H "Authorization: Bearer dev-token-12345" \
  -H "Content-Type: application/json" \
  -d '{
    "strategy": "HV-E2",
    "trades": [{
      "ext_trade_id": "unique-id-001",
      "ts": "2025-10-31T10:15:00+05:30",
      "symbol": "BTCUSDT",
      "side": "buy",
      "qty": 0.5,
      "price": 71000,
      "fees": 1.5,
      "venue": "binance",
      "tags": ["breakout", "ATR2x"]
    }]
  }'
```

### Ingest Daily PnL
```bash
curl -X POST http://localhost:3000/api/ingest/daily-pnl \
  -H "Authorization: Bearer dev-token-12345" \
  -H "Content-Type: application/json" \
  -d '{
    "d": "2025-10-31",
    "strategy": "HV-E2",
    "gross_pnl": 12500,
    "fees": 280,
    "dd": -2.3,
    "exposure": 0.38
  }'
```

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
# Database
DATABASE_URL="postgresql://<user>:<password>@db.supabase.co:5432/postgres"            # Primary connection for migrations/scripts
DATABASE_POOL_URL="postgresql://<user>:<password>@db.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1"
# Optional: Prisma Accelerate endpoint
PRISMA_ACCELERATE_URL=""

# Prisma logging (set to 1 to enable query telemetry in development)
PRISMA_TELEMETRY="0"

# Auth (optional for now)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Ingestion API
INGEST_TOKEN="dev-token-12345"
INGEST_STRATEGY_WHITELIST="HV-E2,Arb-1"  # Leave blank to accept any strategy
INGEST_MAX_TRADES="500"
INGEST_TIMEZONE="Asia/Kolkata"           # Used to normalise daily PnL dates

# Notes attachments (Supabase Storage)
SUPABASE_URL="https://<project>.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="service-role-key"
NOTES_ATTACHMENT_BUCKET="note-attachments"
# Optional: tighten upload limit (defaults to 2_000_000 bytes)
NOTE_ATTACHMENT_MAX_BYTES="2000000"

# Timezone
TZ="Asia/Kolkata"
```

## Seeded Data

The seed script creates:
- **2 engineers** + **2 directors**
- **3 strategies**: HV-E2 (staging, 81/100), Arb-1 (live, 88/100), ML-Exp (R&D, 33/100)
- **30 days** of PnL data
- **4 sample trades** from today
- **2 notes** (including daily summary)
- **1 promotion decision**

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TailwindCSS
- **UI**: shadcn/ui (Radix UI primitives)
- **Database**: Prisma + PostgreSQL (Supabase)
- **Validation**: Zod
- **Auth**: Auth.js (NextAuth) - planned
- **Deployment**: Vercel (recommended)

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Lint code
npm run db:generate  # Generate Prisma client
npm run db:seed      # Seed database
npx prisma migrate deploy  # Apply pending migrations
```

## Production Deployment (Vercel)

1. Provision a Supabase project (Postgres + Storage) and create a public bucket for note attachments (e.g. `note-attachments`).
2. Push the repo to GitHub and import it into Vercel.
3. Configure environment variables (Vercel → Settings → Environment Variables):
   - Database & Prisma: `DATABASE_URL`, `DATABASE_POOL_URL`, optional `PRISMA_ACCELERATE_URL`, `PRISMA_TELEMETRY`.
   - Ingestion: `INGEST_TOKEN`, optional `INGEST_STRATEGY_WHITELIST`, `INGEST_MAX_TRADES`, `INGEST_TIMEZONE`.
   - Supabase Storage: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NOTES_ATTACHMENT_BUCKET`.
   - Auth (when enabled): `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, provider credentials.
4. Set the Vercel build command to run migrations before building, e.g. `npx prisma migrate deploy && npm run build`.
5. Trigger a deploy. The app will reuse the pooled connection string (`DATABASE_POOL_URL`) at runtime.

## Notes for Production

- **Run Supabase migrations**: Always run `npx prisma migrate deploy` during CI/CD so schema stays in sync.
- **Configure attachment bucket**: Make the bucket public (or grant signed URL access) and monitor storage usage; orphaned uploads can be cleared with Supabase’s storage tooling.
- **Enable ingestion guardrails**: Set a conservative `INGEST_STRATEGY_WHITELIST` in production to prevent rogue strategy creation.
- **Monitor Prisma telemetry**: Toggle `PRISMA_TELEMETRY=1` temporarily when diagnosing slow queries, then disable again.
- **Backups**: Rely on Supabase PITR or schedule `pg_dump` exports for additional safety.

---

Built with ❤️ for Mr. Walnut's trading ops team.
