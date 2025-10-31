# Trading Operations Dashboard

A **money-first, director-friendly** trading operations dashboard built with Next.js, Prisma, and shadcn/ui.

## Quick Start

```bash
# Install dependencies
npm install

# Setup database and seed data
npx prisma db push
npm run db:seed

# Start development server
npm run dev
```

Visit **http://localhost:3000**

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
- [x] Prisma ORM with SQLite (dev)
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
DATABASE_URL="file:./dev.db"

# Auth (optional for now)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Ingestion API
INGEST_TOKEN="dev-token-12345"

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
- **Database**: Prisma + SQLite (dev) / PostgreSQL (prod)
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
npm run db:push      # Push schema to DB
npm run db:seed      # Seed database
```

## Production Deployment (Vercel)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables:
   - `DATABASE_URL` → Supabase Postgres connection string
   - `NEXTAUTH_SECRET` → Generate with `openssl rand -base64 32`
   - `INGEST_TOKEN` → Long random string
   - `GITHUB_ID` + `GITHUB_SECRET` → OAuth app credentials
4. Deploy

## Notes for Production

- **Switch to PostgreSQL**: Update `prisma/schema.prisma` provider to `"postgresql"`
- **Enable Auth**: Uncomment Auth.js setup and protect routes
- **Rate Limiting**: Add on ingestion endpoints
- **Monitoring**: Setup Sentry / LogRocket
- **Backups**: Supabase auto-backup or manual pg_dump

---

Built with ❤️ for Mr. Walnut's trading ops team.
