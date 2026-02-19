-- Enum types for question ingestion and cache audience targeting
CREATE TYPE "QuestionSource" AS ENUM ('TYPED', 'SUGGESTION');
CREATE TYPE "SuggestionAudienceType" AS ENUM ('USER', 'CLIENT');

-- Canonical question event stream used for personalization and analytics
CREATE TABLE "question_events" (
    "id" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "normalized_text" TEXT NOT NULL,
    "source" "QuestionSource" NOT NULL DEFAULT 'TYPED',
    "user_id" TEXT,
    "graph_session_id" TEXT,
    "anonymous_session_id" TEXT,
    "client_id" TEXT,
    "country" TEXT,
    "region" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_events_pkey" PRIMARY KEY ("id")
);

-- Cached suggestion sets served instantly on /explore
CREATE TABLE "suggestion_caches" (
    "id" TEXT NOT NULL,
    "audience_type" "SuggestionAudienceType" NOT NULL,
    "audience_key" TEXT NOT NULL,
    "user_id" TEXT,
    "suggestions" JSONB NOT NULL,
    "source" TEXT,
    "model" TEXT,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "next_refresh_at" TIMESTAMP(3) NOT NULL,
    "last_status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suggestion_caches_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "suggestion_caches_audience_type_audience_key_key"
ON "suggestion_caches"("audience_type", "audience_key");

CREATE INDEX "question_events_created_at_idx" ON "question_events"("created_at" DESC);
CREATE INDEX "question_events_user_id_created_at_idx" ON "question_events"("user_id", "created_at" DESC);
CREATE INDEX "question_events_client_id_created_at_idx" ON "question_events"("client_id", "created_at" DESC);
CREATE INDEX "question_events_graph_session_id_created_at_idx" ON "question_events"("graph_session_id", "created_at" DESC);
CREATE INDEX "question_events_anonymous_session_id_created_at_idx" ON "question_events"("anonymous_session_id", "created_at" DESC);
CREATE INDEX "question_events_normalized_text_idx" ON "question_events"("normalized_text");
CREATE INDEX "suggestion_caches_next_refresh_at_idx" ON "suggestion_caches"("next_refresh_at");
CREATE INDEX "suggestion_caches_user_id_updated_at_idx" ON "suggestion_caches"("user_id", "updated_at" DESC);

ALTER TABLE "question_events"
ADD CONSTRAINT "question_events_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "question_events"
ADD CONSTRAINT "question_events_graph_session_id_fkey"
FOREIGN KEY ("graph_session_id") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "question_events"
ADD CONSTRAINT "question_events_anonymous_session_id_fkey"
FOREIGN KEY ("anonymous_session_id") REFERENCES "anonymous_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "suggestion_caches"
ADD CONSTRAINT "suggestion_caches_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
