-- Generated via `prisma migrate diff --from-empty`
-- Sets up the PostgreSQL schema expected by the application.

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "strategies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'r_and_d',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strategies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "strategy_id" TEXT NOT NULL,
    "repo_url" TEXT,
    "last_backtest_url" TEXT,
    "runbook_url" TEXT,
    "readiness_score" INTEGER NOT NULL DEFAULT 0,
    "readiness_breakdown" JSONB,
    "notes" TEXT,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trades" (
    "id" SERIAL NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL,
    "strategy_id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "fees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "venue" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ext_trade_id" TEXT NOT NULL,

    CONSTRAINT "trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_pnl" (
    "id" SERIAL NOT NULL,
    "d" DATE NOT NULL,
    "strategy_id" TEXT NOT NULL,
    "gross_pnl" DOUBLE PRECISION NOT NULL,
    "fees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "net_pnl" DOUBLE PRECISION NOT NULL,
    "dd" DOUBLE PRECISION,
    "exposure" DOUBLE PRECISION,

    CONSTRAINT "daily_pnl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "author_id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "scope_ref" TEXT NOT NULL,
    "tag" TEXT,
    "attachment_url" TEXT,
    "content" TEXT NOT NULL,
    "strategy_id" TEXT,
    "parent_note_id" INTEGER,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decisions" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_by" TEXT NOT NULL,
    "strategy_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,

    CONSTRAINT "decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" SERIAL NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor_id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "strategies_name_key" ON "strategies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "trades_ext_trade_id_key" ON "trades"("ext_trade_id");

-- CreateIndex
CREATE INDEX "trades_ts_idx" ON "trades"("ts");

-- CreateIndex
CREATE INDEX "trades_strategy_id_idx" ON "trades"("strategy_id");

-- CreateIndex
CREATE INDEX "trades_strategy_id_ts_idx" ON "trades"("strategy_id", "ts");

-- CreateIndex
CREATE INDEX "daily_pnl_d_idx" ON "daily_pnl"("d");

-- CreateIndex
CREATE INDEX "daily_pnl_strategy_id_idx" ON "daily_pnl"("strategy_id");

-- CreateIndex
CREATE UNIQUE INDEX "daily_pnl_d_strategy_id_key" ON "daily_pnl"("d", "strategy_id");

-- CreateIndex
CREATE INDEX "notes_created_at_idx" ON "notes"("created_at");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "strategies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "strategies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_pnl" ADD CONSTRAINT "daily_pnl_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "strategies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "strategies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_parent_note_id_fkey" FOREIGN KEY ("parent_note_id") REFERENCES "notes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "strategies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Enforce a conservative upper bound on freeform tags so the array does not balloon.
ALTER TABLE "trades"
  ADD CONSTRAINT "trade_tags_length_check"
  CHECK (COALESCE(array_length("tags", 1), 0) <= 16);
