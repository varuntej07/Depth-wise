# Depthwise

Depthwise is an AI-powered visual knowledge graph explorer. You start with one question and the app turns it into an interactive tree of connected explanations. Each node branches into deeper follow-up ideas — categorized by intent (why, how, example, compare) — so you can explore a topic layer by layer instead of reading a linear wall of text.

## What the app does

- Turns any question into a visual knowledge graph
- Lets users click any node to explore deeper, choosing their own direction
- Branches are typed: why, how, what-if, example, compare — not generic follow-ups
- Passes the full exploration path to Claude so answers get more specific as you go deeper
- Saves exploration history for signed-in users
- Supports anonymous sessions with automatic migration to authenticated accounts
- Allows public sharing of graphs at `/share/[sessionId]`
- Shows community knowledge maps on a public dashboard
- Enforces subscription-based usage limits (explorations, depth, saved graphs)
- Tracks usage events, token costs, and session analytics

## How it works

1. User enters a question in the explore page.
2. `POST /api/session/create` checks usage limits, calls Claude to generate a root answer plus 3–5 typed branches, creates the session and all nodes/edges in Postgres.
3. The frontend stores nodes and edges in a Zustand store and renders them on a React Flow canvas.
4. User clicks a branch node → `POST /api/explore` runs with the full path context, generates the next layer, appends nodes and edges.
5. Signed-in users revisit saved sessions from the sidebar; anonymous sessions migrate on sign-in.
6. Signed-in users can toggle a graph public and share it.

## Subscription tiers

| Plan    | Explorations/month | Max depth | Saved graphs |
|---------|--------------------|-----------|--------------|
| FREE    | 10                 | 5         | 3            |
| STARTER | 100                | 10        | Unlimited    |
| PRO     | Unlimited          | 15        | Unlimited    |

Usage resets monthly. Limits are enforced server-side on every explore call.

## Main parts of the codebase

**Pages**
- `src/app/page.tsx` — landing page with 3D animated graph demo
- `src/app/explore/page.tsx` — main exploration workspace
- `src/app/share/[sessionId]/page.tsx` — read-only public graph view
- `src/app/dashboard/page.tsx` — public community knowledge maps
- `src/app/pricing/page.tsx` — plan comparison and subscription UI
- `src/app/account/page.tsx` — user settings and usage stats

**Core components**
- `src/components/KnowledgeCanvas.tsx` — React Flow canvas, handles layout and interaction
- `src/components/KnowledgeNode.tsx` — individual node card with depth-based styling
- `src/components/SearchBar.tsx` — triggers new session creation
- `src/components/Sidebar.tsx` — session history and navigation
- `src/components/ShareButton.tsx` / `ShareModal.tsx` — public sharing controls
- `src/components/UsageIndicator.tsx` — real-time monthly exploration usage
- `src/components/SubscriptionModal.tsx` — upsell UI when limits are reached
- `src/components/SkeletonNode.tsx` — loading state while branches generate

**State**
- `src/store/graphStore.ts` — Zustand store for nodes, edges, session metadata, focus mode

**API routes**
- `src/app/api/session/create/route.ts` — creates session, calls Claude, inserts nodes/edges
- `src/app/api/explore/route.ts` — expands a node with deeper branches
- `src/app/api/session/[id]/share/route.ts` — toggles public sharing
- `src/app/api/share/[sessionId]/route.ts` — returns public graph data
- `src/app/api/usage/route.ts` — returns current user usage stats
- `src/app/api/webhooks/razorpay/route.ts` — handles subscription lifecycle events

**Lib**
- `src/lib/claude.ts` — Anthropic SDK integration, prompt construction, branch generation
- `src/lib/subscription-config.ts` — plan definitions, tier feature matrix
- `src/lib/subscription-server.ts` — usage checks, monthly reset logic
- `src/lib/layout.ts` / `node-layout.ts` — graph positioning with collision detection
- `src/lib/graph-normalization.ts` — validates and loads graph structure from API
- `src/lib/usage-tracking.ts` — PostHog event recording
- `src/lib/auth.ts` — NextAuth v5 configuration

**Database**
- `prisma/schema.prisma` — full schema

## Tech stack

- Next.js 16 (React 19, TypeScript, Turbopack)
- Tailwind CSS v4
- Prisma 6 + PostgreSQL
- NextAuth v5 with Google OAuth
- Zustand v5
- React Flow (`@xyflow/react` v12)
- Framer Motion v12
- Anthropic Claude API (claude-haiku-4-5 default)
- PostHog analytics
- Razorpay payments

## Data model

Two parallel session types:

- `GraphSession`, `Node`, `Edge`, `ConversationHistory` — for signed-in users
- `AnonymousSession`, `AnonymousNode`, `AnonymousEdge`, `AnonymousConversationHistory` — for anonymous users

Signed-in users have subscription fields on `User`: tier, status, exploration count, reset timestamp, Razorpay IDs.

Analytics tables: `UsageEvent` (token costs, latency, geolocation), `QuestionEvent` (query logging), `SuggestionCache` (cached AI suggestions).

## Local setup

### Prerequisites

- Node.js 20+
- PostgreSQL
- Anthropic API key
- Google OAuth credentials

### Environment variables

```env
DATABASE_URL=
ANTHROPIC_API_KEY=
AUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Optional:

```env
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
POSTHOG_KEY=
POSTHOG_HOST=
```

### Install and run

```bash
npm install
npx prisma migrate dev
npm run dev
```

Open `http://localhost:3000`.

## Notes

- The pricing page uses a placeholder interest dialog; live checkout via Razorpay is not yet active.
- Public sharing requires a signed-in session. Anonymous sessions cannot be shared.
- The dashboard surfaces public graphs only, not private user sessions.
- Anonymous sessions migrate automatically to the user's account on sign-in.
- IP addresses are hashed before storage; geolocation is used only for analytics.

## License

Private and proprietary.
