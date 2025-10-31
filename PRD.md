# Product Requirements Document (PRD)
## Trading Operations Dashboard

**Version:** 1.0
**Date:** 2025-10-31
**Status:** DRAFT — Awaiting Approval
**Owner:** Mr. Walnut

---

## Executive Summary

### The Problem
Directors currently lack visibility into engineering work, leading to unproductive "are you doing anything?" conversations. There's no clear framework for evaluating when a trading strategy is ready for production, and no centralized view of PnL, risk, and operational status.

### The Solution
A **director-friendly, money-first dashboard** that provides:
1. **Daily PnL visibility** with strategy attribution and risk metrics
2. **Structured collaboration** between 2 engineers and 2 directors via notes/reviews
3. **Production-readiness framework** with objective 0-100 scoring
4. **One-click decision interface** for promote/pause/kill actions with audit trail

### Strategic Outcome
Shift the conversation from **"what are you working on?"** to **"which project should we ship this week?"**

---

## Goals & Success Criteria

### Primary Goals
1. **Transparency:** Directors see real-time PnL, attribution, risk, and drawdown
2. **Accountability:** Clear ownership (who decided what, when, why) via audit logs
3. **Velocity:** Reduce time from strategy completion to production decision from weeks → days
4. **Risk Management:** Every live strategy has documented risk controls and exposure limits

### Success Metrics (30 days post-launch)
- [ ] 100% of director decisions logged with rationale
- [ ] Zero ambiguity on which strategies are live vs. staging vs. R&D
- [ ] Daily engineer summaries completed by market close (16:00 IST) ≥90% of days
- [ ] Average time to promotion decision: <3 days for Readiness ≥70
- [ ] Directors can answer "what's our biggest risk today?" in <10 seconds

---

## User Personas

### Persona 1: Director (2 users)
**Needs:**
- See money first: PnL, attribution, risk, drawdown
- Make informed go/no-go decisions on promotions
- Understand what's blocking each project from shipping
- Trust that engineers are executing systematically

**Pain Points:**
- Can't tell if strategies are profitable or bleeding
- No clear "definition of done" for production readiness
- Decisions based on tribal knowledge, not data

**Key Flows:**
- Daily: Check Home KPIs → read engineer summary → flag concerns
- Weekly: Review staging projects → promote/pause/kill based on readiness

---

### Persona 2: Engineer (2 users)
**Needs:**
- Push trade/PnL data from Raspberry Pi without manual entry
- Document context (why a trade happened, what broke, what changed)
- Track project readiness systematically (not ad-hoc checklists)
- Get unblocked on promotion decisions quickly

**Pain Points:**
- Directors don't understand technical constraints
- Repeating the same updates in Slack/meetings
- No shared source of truth for "is X ready?"

**Key Flows:**
- Daily: Automated data push → annotate anomalies → complete summary
- Per-project: Update readiness dimensions → request promotion → get feedback

---

## Product Architecture

### Three-Bucket Mental Model
```
┌─────────────────────────────────────────────────────────┐
│  MONEY NOW (Live)        │  MONEY NEXT (Staging)  │  R&D │
│  Green badge ≥70         │  Amber badge 40-69     │  Red │
│  Directors can scale     │  Directors can promote │  N/A │
│  Risk capital allocated  │  Paper trading         │ Exp  │
└─────────────────────────────────────────────────────────┘
```

Every strategy/project sits in **exactly one bucket** based on:
- **Live:** Readiness ≥70, director-approved, real capital
- **Staging:** Readiness 40-69, passing backtests, simulated fills
- **R&D:** Readiness <40, experimental, no risk exposure

---

## Core Features

### F1: Home Dashboard (Money-First KPIs)

**Description:**
Single-glance view of operational health focused on PnL and risk.

**Requirements:**
- **KPI Cards (top row):**
  - Today's Net PnL (₹ + % of NAV)
  - Strategy Attribution (top 5 contributors, bar chart)
  - Open Risk (current notional / max allowed, gauge)
  - Max Drawdown (30-day rolling, %)
  - Active Flags (count of anomalies/alerts)

- **Decision Tray (directors only):**
  - Per-strategy controls: Promote | Pause | Kill | Adjust Risk
  - Click opens modal: enter rationale (required, min 20 chars)
  - Submit logs decision + updates strategy status + audit entry

- **Engineer Daily Summary (required):**
  - 3-line text area: "What changed | What broke | What's next"
  - Must be completed by 16:00 IST
  - Red banner if missing; email to both directors at 16:30 IST

**Acceptance Criteria:**
- [ ] All KPIs load in <2s with real or seeded data
- [ ] Decision Tray visible only to directors
- [ ] Rationale modal enforces min length, logs to `decisions` table
- [ ] Engineer summary persists and displays on Home next day

---

### F2: Trades Table & Ingestion

**Description:**
Centralized log of all executions with context and filters.

**Requirements:**
- **Table Columns:**
  Timestamp (IST) | Strategy | Symbol | Side | Qty | Price | Fees | Venue | Tags | Notes

- **Filters:**
  - Date range picker (default: last 7 days)
  - Strategy multi-select
  - Symbol search
  - Side (Buy/Sell/All)
  - Tags (multi-select chips)

- **Upload CSV:**
  - Drag-drop or file picker
  - Maps columns: `timestamp, symbol, side, qty, price, fees, venue, tags`
  - Validates: required fields, side∈{buy,sell}, numeric qty/price
  - Duplicates rejected via `ext_trade_id` uniqueness

- **API Ingestion (Raspberry Pi):**
  - `POST /api/ingest/trades` with JSON payload
  - Idempotent upserts via `ext_trade_id`
  - Returns `{ok: true, inserted: N}`

- **Notes Panel (sticky right):**
  - "Notes for [selected date]" → shows all `notes` where `scope=day` + `scope_ref=YYYY-MM-DD`
  - Click trade row → opens detail modal with trade-specific notes thread

**Acceptance Criteria:**
- [ ] CSV upload with 100 rows completes in <5s
- [ ] Duplicate trades (same `ext_trade_id`) don't create new rows
- [ ] Filters persist in URL query params (shareable links)
- [ ] Notes panel shows role chips (Engineer/Director)

---

### F3: PnL Visualization

**Description:**
Time-series and attribution charts for performance analysis.

**Requirements:**
- **Line Chart (Net PnL):**
  - X-axis: Date (daily buckets, IST timezone)
  - Y-axis: Cumulative Net PnL (₹)
  - Toggle: Cumulative / Daily bars
  - Strategy filters (multi-select, default: All)

- **Attribution Bar Chart:**
  - Per-strategy Net PnL for selected date range
  - Click bar → drills into strategy detail page

- **Metrics Table (below charts):**
  - Strategy | Gross PnL | Fees | Net PnL | DD% | Exposure | Sharpe (if available)

- **Data Source:**
  - `daily_pnl` table (upserted via `/api/ingest/daily-pnl`)
  - Nightly rollup job recomputes 7/30-day stats

**Acceptance Criteria:**
- [ ] Chart loads 90 days of data in <3s
- [ ] Tooltips show gross/fees/net breakdown on hover
- [ ] Date range picker updates chart without full page reload
- [ ] Export CSV button downloads filtered data

---

### F4: Projects & Readiness Matrix

**Description:**
Every project has a **Production-Readiness Score (0-100)** and visual badge.

**Scoring Dimensions (weights sum to 100):**
| Dimension               | Weight | What It Measures                                      |
|-------------------------|--------|-------------------------------------------------------|
| Risk Controls           | 25%    | Hard stops, ATR sizing, max daily loss, circuit break|
| Live-Sim Parity         | 20%    | Slippage/fees modeled, latency gaps, param match     |
| Data Integrity          | 15%    | Corp actions, survivorship, timezones, outliers      |
| Backtest Rigor          | 15%    | Walk-forward, OOS split, regime checks, stress tests |
| Code & Runbook          | 15%    | Unit tests, reproducible env, incident runbook       |
| Operational Footprint   | 10%    | Monitoring, logging, pager, deploy script            |

**Score Calculation:**
`Total = Σ(dimension_score × weight)`

**Badge Logic:**
- 0–39: **Red** — "R&D"
- 40–69: **Amber** — "Staging"
- 70–84: **Green** — "Shipable"
- 85–100: **Dark Green** — "Ship Now"

**Requirements:**
- **Grid View:**
  - Card per project: Badge | Name | One-liner status | Last updated
  - Links: GitHub repo, latest backtest, runbook
  - Click card → detail page

- **Detail Page:**
  - Radar chart (6 dimensions)
  - Per-dimension score editor (directors + engineers)
  - "What's missing to hit next badge?" auto-generated checklist
  - History timeline (who changed what score when)

- **Promotion Gate (enforced in Decision Tray):**
  - Readiness ≥70 required
  - No red TODOs in runbook
  - Last backtest <7 days old
  - Live-sim parity ≥70

**Acceptance Criteria:**
- [ ] Badge color/label matches score thresholds
- [ ] Editing a dimension recalculates total and writes `audit_log`
- [ ] Promote button disabled if gate criteria unmet, tooltip explains why
- [ ] Radar chart renders correctly on mobile

---

### F5: Notes & Collaboration

**Description:**
Threaded comments scoped to days, strategies, or individual trades.

**Requirements:**
- **Scopes:**
  - `day`: "Daily summary for 2025-10-30"
  - `strategy`: "Notes on HV-E2 strategy"
  - `trade`: "Why did we buy BTCUSDT at 10:24?"

- **UI:**
  - Role chip next to author name (Engineer/Director)
  - Timestamp in IST
  - Full-text search (Postgres `tsvector`)
  - Filter by scope/author/date range

- **Daily Summary (special scope):**
  - One `scope=day` note required per trading day
  - Engineers must complete by 16:00 IST
  - Template: "What changed | What broke | What's next"

**Acceptance Criteria:**
- [ ] Search for "latency" returns relevant notes with highlights
- [ ] Notes on Home/Trades pages auto-scope to current context
- [ ] Missing daily summary triggers red banner on Home

---

### F6: Decisions & Audit Log

**Description:**
Immutable record of all director actions and state changes.

**Requirements:**
- **Decision Types:**
  - `promote`: Move strategy from staging → live
  - `pause`: Temporarily disable live strategy
  - `kill`: Permanently archive strategy
  - `adjust-risk`: Change allocation/exposure limit

- **Logged Fields:**
  - `decided_by` (user_id)
  - `strategy_id`
  - `action`
  - `rationale` (required, min 20 chars)
  - `created_at` (auto, IST)

- **Side Effects:**
  - Update `strategies.status`
  - Append to `audit_log` with before/after state
  - Send email to both engineers + both directors

- **Audit Log (append-only):**
  - `(ts, actor_id, entity, entity_id, action, before_json, after_json)`
  - Queryable via `/api/audit?entity=strategy&entity_id=...`

**Acceptance Criteria:**
- [ ] Decision without rationale is rejected (client + server validation)
- [ ] Audit log entry created atomically with status change
- [ ] Directors can view full history timeline per strategy

---

## Technical Specifications

### Tech Stack

| Layer            | Technology                     | Rationale                                      |
|------------------|--------------------------------|------------------------------------------------|
| Frontend         | Next.js 14 (App Router)        | SSR, API routes, Vercel deployment             |
| Styling          | TailwindCSS + shadcn/ui        | Fast UI dev, accessible components             |
| Auth             | Auth.js (NextAuth) + GitHub    | OAuth out-of-box, easy role mapping            |
| Database         | Supabase Postgres              | Generous free tier, realtime, storage          |
| ORM              | Prisma                         | Type-safe queries, migrations, schema clarity  |
| Charts           | Recharts                       | Lightweight, React-native, good defaults       |
| Tables           | TanStack Table                 | Powerful filtering/sorting, headless           |
| API Ingestion    | Python 3 (Raspberry Pi)        | Existing infra, simple HTTP client             |
| Jobs/Cron        | Vercel Cron                    | Native platform support, no extra infra        |
| CI/CD            | GitHub Actions + Vercel        | Auto-deploy on merge, preview on PR            |

---

### Data Model (Prisma Schema)

```prisma
// Core entities
model Role {
  id    Int    @id @default(autoincrement())
  name  String @unique // "engineer" | "director"
  users User[]
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  displayName  String?
  roleId       Int
  role         Role     @relation(fields: [roleId], references: [id])
  notes        Note[]
  decisions    Decision[]
  auditEntries AuditLog[]
}

model Strategy {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  status      String   @default("r_and_d") // "live"|"staging"|"r_and_d"|"paused"
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  trades      Trade[]
  dailyPnl    DailyPnl[]
  projects    Project[]
  notes       Note[]
  decisions   Decision[]
}

model Project {
  id                  String   @id @default(uuid())
  strategyId          String
  strategy            Strategy @relation(fields: [strategyId], references: [id])
  repoUrl             String?
  lastBacktestUrl     String?
  runbookUrl          String?
  readinessScore      Int      @default(0) // 0-100
  readinessBreakdown  Json?    // {risk:n, parity:n, data:n, backtest:n, code:n, ops:n}
  notes               String?
  lastUpdated         DateTime @default(now()) @updatedAt
}

model Trade {
  id           BigInt   @id @default(autoincrement())
  ts           DateTime
  strategyId   String
  strategy     Strategy @relation(fields: [strategyId], references: [id])
  symbol       String
  side         String   // "buy" | "sell"
  qty          Decimal
  price        Decimal
  fees         Decimal  @default(0)
  venue        String?
  tags         String[] @default([])
  extTradeId   String   @unique // idempotency key

  @@index([ts])
  @@index([strategyId])
}

model DailyPnl {
  id         BigInt   @id @default(autoincrement())
  d          DateTime @db.Date
  strategyId String
  strategy   Strategy @relation(fields: [strategyId], references: [id])
  grossPnl   Decimal
  fees       Decimal  @default(0)
  netPnl     Decimal  // computed: grossPnl - fees
  dd         Decimal? // drawdown %
  exposure   Decimal? // notional or % NAV

  @@unique([d, strategyId])
  @@index([d])
}

model Note {
  id        BigInt   @id @default(autoincrement())
  createdAt DateTime @default(now())
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  scope     String   // "day" | "strategy" | "trade"
  scopeRef  String   // date string, strategy_id, or trade_id
  content   String   @db.Text

  strategyId String?
  strategy   Strategy? @relation(fields: [strategyId], references: [id])
}

model Decision {
  id         BigInt   @id @default(autoincrement())
  createdAt  DateTime @default(now())
  decidedBy  String
  decider    User     @relation(fields: [decidedBy], references: [id])
  strategyId String
  strategy   Strategy @relation(fields: [strategyId], references: [id])
  action     String   // "promote"|"pause"|"kill"|"adjust-risk"
  rationale  String   @db.Text
}

model AuditLog {
  id        BigInt   @id @default(autoincrement())
  ts        DateTime @default(now())
  actorId   String
  actor     User     @relation(fields: [actorId], references: [id])
  entity    String   // "strategy" | "project" | "decision"
  entityId  String
  action    String   // "create" | "update" | "delete" | "promote" | etc.
  before    Json?
  after     Json?
}
```

---

### API Contracts

#### Ingestion Endpoints (Raspberry Pi → Dashboard)

**POST /api/ingest/trades**
```json
{
  "strategy": "HV-E2",
  "trades": [
    {
      "ext_trade_id": "delta-2025-10-31-00001",
      "ts": "2025-10-31T10:15:00+05:30",
      "symbol": "BTCUSDT",
      "side": "buy",
      "qty": 0.5,
      "price": 71000.0,
      "fees": 1.5,
      "venue": "binance",
      "tags": ["breakout", "ATR2x"]
    }
  ]
}
```
**Response:** `200 {ok: true, inserted: 1}`
**Auth:** `Authorization: Bearer <INGEST_TOKEN>`

---

**POST /api/ingest/daily-pnl**
```json
{
  "d": "2025-10-31",
  "strategy": "HV-E2",
  "gross_pnl": 12500.0,
  "fees": 280.0,
  "dd": -2.3,
  "exposure": 0.38
}
```
**Response:** `200 {ok: true}`
**Auth:** `Authorization: Bearer <INGEST_TOKEN>`

---

#### Dashboard Endpoints

**POST /api/notes**
```json
{
  "scope": "day",
  "scope_ref": "2025-10-31",
  "content": "Latency spike 11:05-11:12 IST; rerouted to backup."
}
```
**Response:** `201 {id: "123", created_at: "..."}`
**Auth:** NextAuth session (engineer or director)

---

**POST /api/decisions**
```json
{
  "strategy_id": "abc-123",
  "action": "promote",
  "rationale": "Readiness 85, live-sim parity 92%, passing all gates."
}
```
**Response:** `201 {id: "456", updated_status: "live"}`
**Auth:** NextAuth session (directors only)
**Side Effects:** Updates `strategies.status`, logs `audit_log`, sends email

---

**POST /api/projects/{id}/readiness**
```json
{
  "risk": 85,
  "parity": 92,
  "data": 78,
  "backtest": 80,
  "code": 75,
  "ops": 70
}
```
**Response:** `200 {total: 81, badge: "Green"}`
**Auth:** NextAuth session (engineer or director)
**Side Effects:** Recalculates score, updates `readiness_breakdown`, logs audit

---

### Security & RBAC

| Action                     | Engineer | Director | Enforcement                          |
|----------------------------|----------|----------|--------------------------------------|
| View Home/Trades/PnL       | ✓        | ✓        | NextAuth session required            |
| Upload CSV                 | ✓        | ✓        | NextAuth session required            |
| Create/view notes          | ✓        | ✓        | NextAuth session required            |
| Edit readiness scores      | ✓        | ✓        | NextAuth session required            |
| Make decisions (promote/pause/kill) | ✗ | ✓   | Server-side role check (directors only) |
| View Decision Tray         | ✗        | ✓        | Client-side conditional render       |
| API ingestion (`/api/ingest/*`) | N/A | N/A  | Bearer token (env var `INGEST_TOKEN`) |

**Defense in Depth:**
- Client-side: Conditional UI rendering based on `session.user.role`
- Server-side: API routes check `session?.user?.role === 'director'` before mutations
- Database: Audit log captures actor for all state changes
- Secrets: `INGEST_TOKEN` stored in Vercel env vars, rotatable

---

### Timezone & Daily Buckets

**All times in Asia/Kolkata (IST, UTC+5:30):**
- Trade timestamps stored as `TIMESTAMPTZ` in UTC, displayed in IST
- Daily PnL bucketed by `d::date` in IST (e.g., market close 15:30 IST → bucket is that calendar day)
- Cron jobs scheduled in IST (e.g., "0 0 * * *" = midnight IST)
- UI date pickers default to IST, server converts to UTC for storage

**Rationale:** Aligns with Indian market hours (09:15-15:30 IST).

---

## User Flows

### Flow 1: Director Morning Review
1. Director logs in (GitHub OAuth)
2. Lands on **Home**
3. Sees Today's Net PnL: **₹+18,500** (+1.2% NAV)
4. Attribution chart: HV-E2 contributed ₹12,000; Arb-1 contributed ₹6,500
5. Checks **Engineer Daily Summary** from yesterday: "Latency spike resolved; rebalanced position sizing."
6. Scrolls to **Decision Tray** → sees HV-E2 status="staging", readiness=85 (Dark Green badge)
7. Clicks **Promote** → modal: "Rationale: Passing all gates, 30-day Sharpe 2.1, live-sim parity 92%."
8. Submits → strategy moves to "live", audit logged, engineers notified

---

### Flow 2: Engineer End-of-Day
1. Engineer's Pi cron pushes trades at 16:00 IST via `/api/ingest/trades`
2. Engineer opens **Trades** page → filters to "Today" + "HV-E2"
3. Sees 42 trades, Net PnL ₹12,000
4. Clicks "Daily Summary" panel → enters:
   ```
   What changed: Increased position size 0.3→0.5 BTC per signal
   What broke: Nothing
   What's next: Monitor over-weekend risk, consider tighter stops
   ```
5. Saves → green checkmark on Home
6. Navigates to **Projects** → HV-E2 card → clicks "Edit Readiness"
7. Updates "Live-Sim Parity" 88→92 (backtested with latest slippage model)
8. Score recalculates 82→85, badge turns Dark Green ("Ship Now")

---

### Flow 3: Raspberry Pi Automated Ingestion
1. Cron triggers `/home/pi/trading/push_trades.py` every 5 minutes
2. Script reads `/var/log/trades/hv_e2_trades.csv` (appended by trading engine)
3. Parses rows, constructs JSON payload
4. `POST https://dashboard.vercel.app/api/ingest/trades` with `Authorization: Bearer <token>`
5. Server upserts trades (idempotent via `ext_trade_id`)
6. Script logs success, sleeps until next cron
7. At 23:59 IST, `/home/pi/trading/push_pnl.py` triggers:
   - Computes daily gross/net PnL from trade log
   - `POST /api/ingest/daily-pnl`
   - Dashboard PnL chart updates next morning

---

## Non-Functional Requirements

### Performance
- **Page Load:** <2s for Home, <3s for Trades/PnL (90 days data)
- **CSV Upload:** 500 rows in <5s
- **API Latency:** p95 <500ms for ingestion endpoints

### Scalability
- **Data Volume:** 10,000 trades/month, 100 projects (initial scale)
- **Concurrent Users:** 4 active users (can handle 50 with current stack)

### Reliability
- **Uptime:** 99.5% (Vercel SLA)
- **Data Integrity:** Idempotent ingestion, unique constraints, transactional writes
- **Backup:** Supabase auto-backup (daily, 7-day retention)

### Security
- **Auth:** OAuth 2.0 (GitHub), session cookies (httpOnly, secure, sameSite)
- **Secrets:** Env vars in Vercel, no hardcoded tokens
- **Input Validation:** Zod schemas on all API endpoints (server-side)
- **Rate Limiting:** 100 req/min per IP on ingestion endpoints

### Observability
- **Logging:** Vercel logs + Supabase logs
- **Monitoring:** `/api/healthz` endpoint, uptime check via Vercel
- **Alerts:** Email to directors if daily summary missing by 16:30 IST

---

## Timeline & Milestones

### Phase 0: Scaffold (Day 1)
- [ ] Initialize Next.js project with App Router
- [ ] Setup Supabase Postgres + Prisma schema
- [ ] Configure Auth.js with GitHub OAuth
- [ ] Seed database: 2 roles, 4 users, 3 strategies, sample trades/PnL
- [ ] Deploy to Vercel (preview environment)

**Deliverable:** Working auth + seeded data visible in dev

---

### Phase 1: Ingestion & Core Tables (Day 2)
- [ ] Implement `/api/ingest/trades` and `/api/ingest/daily-pnl`
- [ ] Build **Trades** page with filters, CSV upload
- [ ] Build **PnL** page with line chart + attribution bar
- [ ] Write Pi ingestion scripts (`push_trades.py`, `push_pnl.py`)

**Deliverable:** End-to-end data flow from Pi → Dashboard → Charts

---

### Phase 2: Projects & Readiness (Day 3)
- [ ] Build **Projects** grid with badges
- [ ] Implement readiness score calculator (6 dimensions → 0-100)
- [ ] Build detail page with radar chart + score editor
- [ ] Add promotion gate validation

**Deliverable:** Projects page with working readiness scoring

---

### Phase 3: Decisions & Home KPIs (Day 4)
- [ ] Build **Home** dashboard with KPI cards
- [ ] Implement Decision Tray (promote/pause/kill modals)
- [ ] Add `/api/decisions` endpoint with audit logging
- [ ] Build **Notes** page with search + daily summary enforcement

**Deliverable:** Directors can make decisions; engineers can log summaries

---

### Phase 4: Polish & CI/E2E (Day 5)
- [ ] Write unit tests (readiness calc, RBAC guards, validators)
- [ ] Write E2E tests (login, Home KPIs, decision flow)
- [ ] Setup GitHub Actions CI (lint, typecheck, test)
- [ ] Create DEMO.md with screenshots

**Deliverable:** Production-ready app with passing CI, deployed to Vercel

---

## Risks & Mitigations

| Risk                                      | Impact | Mitigation                                           |
|-------------------------------------------|--------|------------------------------------------------------|
| Supabase free tier limits exceeded        | High   | Monitor usage; plan upgrade at 80% quota             |
| Pi network connectivity issues            | Medium | Retry logic with exponential backoff; manual CSV upload |
| Directors don't adopt (keep using Slack)  | High   | Weekly demo; enforce "no decision without audit log" |
| Readiness scoring too subjective          | Medium | Document rubric with examples; calibrate in Week 1   |
| GitHub OAuth blocked by firewall          | Low    | Add email magic link fallback                        |
| Timezone bugs (IST vs UTC)                | Medium | Comprehensive tests; always display timezone in UI   |

---

## Open Questions (Need Decisions)

1. **Email Notifications:**
   Should we send emails for:
   - [ ] Daily summary missing (directors only)?
   - [ ] Decision made (all 4 users)?
   - [ ] Readiness score crosses threshold (engineers only)?
   **Recommendation:** Start with directors-only for missing summaries; add more later.

2. **Promotion Approval Workflow:**
   Does promotion require:
   - [ ] **One director** to approve (faster)
   - [ ] **Both directors** to approve (safer)
   **Recommendation:** Start with one-director approval; add "request second approval" button later.

3. **Backtest Artifact Storage:**
   Where do we store backtest CSVs/PDFs?
   - [ ] Supabase Storage (simpler, in-platform)
   - [ ] GitHub repo (version-controlled)
   **Recommendation:** Supabase Storage for MVP; link to GitHub commit SHA.

4. **Real-time vs Polling:**
   Should Home KPIs update in real-time (websockets) or on page refresh?
   - [ ] Real-time (Supabase Realtime, complex)
   - [ ] Polling (simple, sufficient for 4 users)
   **Recommendation:** Polling every 30s for MVP.

5. **Pi Failure Handling:**
   If Pi ingestion fails for >1 hour, should we:
   - [ ] Auto-email engineers
   - [ ] Show red banner on Home
   - [ ] Both
   **Recommendation:** Both (banner + email after 2 failed attempts).

---

## Success Checklist (Acceptance Criteria)

**Must-Have (MVP):**
- [ ] All 4 users can log in via GitHub OAuth
- [ ] Home shows today's Net PnL, attribution, risk, DD with real/seeded data
- [ ] Directors can promote/pause/kill from Decision Tray with logged rationale
- [ ] Engineers can upload CSV or push via API (Pi script works)
- [ ] Trades page filters by date/strategy/symbol
- [ ] PnL page shows 90-day line chart + attribution bars
- [ ] Projects page shows readiness badges (color-coded 0-100)
- [ ] Notes page supports day/strategy/trade scopes with search
- [ ] Daily summary required by 16:00 IST; missing → red banner
- [ ] All decisions and readiness edits logged to `audit_log`
- [ ] App deployed to Vercel, CI passes (lint + typecheck + tests)

**Nice-to-Have (Post-MVP):**
- [ ] Email notifications for missing summaries
- [ ] Two-director approval workflow
- [ ] Real-time KPI updates (websockets)
- [ ] Mobile-responsive UI (works on tablets)
- [ ] Export all data to CSV (admin feature)
- [ ] Slack integration (post decision summaries to #trading channel)

---

## Appendix: Example Seeded Data

### Strategies
| ID    | Name   | Status    | Description                          |
|-------|--------|-----------|--------------------------------------|
| s1    | HV-E2  | staging   | High-volatility momentum breakout    |
| s2    | Arb-1  | live      | CEX-DEX arbitrage                    |
| s3    | ML-Exp | r_and_d   | LSTM price prediction (experimental) |

### Projects (Readiness Breakdown)
**HV-E2:**
```json
{
  "risk": 85,
  "parity": 88,
  "data": 75,
  "backtest": 80,
  "code": 78,
  "ops": 72
}
```
**Total:** 81 → Green badge ("Shipable")

**Arb-1:**
```json
{
  "risk": 95,
  "parity": 90,
  "data": 85,
  "backtest": 88,
  "code": 82,
  "ops": 80
}
```
**Total:** 88 → Dark Green badge ("Ship Now")

**ML-Exp:**
```json
{
  "risk": 30,
  "parity": 20,
  "data": 50,
  "backtest": 40,
  "code": 35,
  "ops": 25
}
```
**Total:** 33 → Red badge ("R&D")

---

## Approval Sign-Off

**Prepared by:** Claude
**Reviewed by:** Mr. Walnut
**Status:** ⏳ Awaiting Approval

**Next Steps on Approval:**
1. Initialize Next.js project + Prisma + Supabase
2. Begin Phase 0 (scaffold + seed data)
3. Daily standups via this chat (progress updates + blockers)

---

**Questions? Concerns? Changes?**
Please review and provide feedback. I'll adjust the PRD before starting implementation.
