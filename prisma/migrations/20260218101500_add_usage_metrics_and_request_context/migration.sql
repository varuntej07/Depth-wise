-- Add persistent account activity and aggregate usage fields
ALTER TABLE "users"
ADD COLUMN "last_login_at" TIMESTAMP(3),
ADD COLUMN "last_seen_at" TIMESTAMP(3),
ADD COLUMN "explorations_total" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "total_input_tokens" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "total_output_tokens" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "total_tokens_used" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "total_estimated_cost_usd" DECIMAL(12,6) NOT NULL DEFAULT 0;

-- Add request context fields for authenticated graph sessions
ALTER TABLE "sessions"
ADD COLUMN "client_id" TEXT,
ADD COLUMN "ip_address" TEXT,
ADD COLUMN "ip_hash" TEXT,
ADD COLUMN "country" TEXT,
ADD COLUMN "region" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "user_agent" TEXT;

-- Add request context fields and activity timestamp for anonymous sessions
ALTER TABLE "anonymous_sessions"
ADD COLUMN "client_id" TEXT,
ADD COLUMN "ip_hash" TEXT,
ADD COLUMN "country" TEXT,
ADD COLUMN "region" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Canonical backend telemetry table for product and cost analytics
CREATE TABLE "usage_events" (
    "id" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "user_id" TEXT,
    "graph_session_id" TEXT,
    "anonymous_session_id" TEXT,
    "request_id" TEXT,
    "client_id" TEXT,
    "route" TEXT,
    "success" BOOLEAN,
    "status_code" INTEGER,
    "latency_ms" DOUBLE PRECISION,
    "model" TEXT,
    "input_tokens" INTEGER NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,
    "total_tokens" INTEGER NOT NULL DEFAULT 0,
    "estimated_cost_usd" DECIMAL(12,6) NOT NULL DEFAULT 0,
    "ip_address" TEXT,
    "ip_hash" TEXT,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "users_last_login_at_idx" ON "users"("last_login_at" DESC);
CREATE INDEX "users_last_seen_at_idx" ON "users"("last_seen_at" DESC);
CREATE INDEX "sessions_client_id_idx" ON "sessions"("client_id");
CREATE INDEX "anonymous_sessions_client_id_idx" ON "anonymous_sessions"("client_id");
CREATE INDEX "usage_events_created_at_idx" ON "usage_events"("created_at" DESC);
CREATE INDEX "usage_events_event_name_created_at_idx" ON "usage_events"("event_name", "created_at" DESC);
CREATE INDEX "usage_events_user_id_created_at_idx" ON "usage_events"("user_id", "created_at" DESC);
CREATE INDEX "usage_events_graph_session_id_created_at_idx" ON "usage_events"("graph_session_id", "created_at" DESC);
CREATE INDEX "usage_events_anonymous_session_id_created_at_idx" ON "usage_events"("anonymous_session_id", "created_at" DESC);

ALTER TABLE "usage_events"
ADD CONSTRAINT "usage_events_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "usage_events"
ADD CONSTRAINT "usage_events_graph_session_id_fkey"
FOREIGN KEY ("graph_session_id") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "usage_events"
ADD CONSTRAINT "usage_events_anonymous_session_id_fkey"
FOREIGN KEY ("anonymous_session_id") REFERENCES "anonymous_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
