-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'STARTER', 'PRO');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'PAST_DUE', 'INCOMPLETE');

-- AlterTable
ALTER TABLE "users"
ADD COLUMN "subscription_tier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
ADD COLUMN "subscription_status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "subscription_id" TEXT,
ADD COLUMN "customer_id" TEXT,
ADD COLUMN "explorations_used" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "explorations_reset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "anonymous_sessions" (
    "id" TEXT NOT NULL,
    "root_query" TEXT NOT NULL,
    "title" TEXT,
    "node_count" INTEGER NOT NULL DEFAULT 0,
    "max_depth" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "anonymous_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anonymous_nodes" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "summary" TEXT,
    "depth" INTEGER NOT NULL,
    "position_x" DOUBLE PRECISION NOT NULL,
    "position_y" DOUBLE PRECISION NOT NULL,
    "explored" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anonymous_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anonymous_edges" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "animated" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "anonymous_edges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anonymous_conversation_history" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "node_id" TEXT,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anonymous_conversation_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "anonymous_sessions_created_at_idx" ON "anonymous_sessions"("created_at" DESC);

-- CreateIndex
CREATE INDEX "anonymous_nodes_session_id_idx" ON "anonymous_nodes"("session_id");

-- CreateIndex
CREATE INDEX "anonymous_nodes_parent_id_idx" ON "anonymous_nodes"("parent_id");

-- CreateIndex
CREATE INDEX "anonymous_nodes_session_id_depth_idx" ON "anonymous_nodes"("session_id", "depth");

-- CreateIndex
CREATE INDEX "anonymous_edges_session_id_idx" ON "anonymous_edges"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "anonymous_edges_source_id_target_id_key" ON "anonymous_edges"("source_id", "target_id");

-- CreateIndex
CREATE INDEX "anonymous_conversation_history_session_id_created_at_idx" ON "anonymous_conversation_history"("session_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_subscription_id_key" ON "users"("subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_customer_id_key" ON "users"("customer_id");

-- AddForeignKey
ALTER TABLE "anonymous_nodes" ADD CONSTRAINT "anonymous_nodes_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "anonymous_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anonymous_nodes" ADD CONSTRAINT "anonymous_nodes_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "anonymous_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anonymous_edges" ADD CONSTRAINT "anonymous_edges_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "anonymous_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anonymous_edges" ADD CONSTRAINT "anonymous_edges_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "anonymous_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anonymous_edges" ADD CONSTRAINT "anonymous_edges_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "anonymous_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anonymous_conversation_history" ADD CONSTRAINT "anonymous_conversation_history_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "anonymous_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
