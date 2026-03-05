# Depthwise

Depthwise is an AI-powered knowledge graph explorer.

You start with one question, and the app turns it into a visual tree of connected explanations. Each node can branch into deeper follow-up ideas, so you can explore a topic layer by layer instead of reading everything in a linear way.

## What the app does

- Turns a question into a graph of explanations
- Lets users explore deeper from any node
- Saves exploration history for signed-in users
- Supports anonymous sessions for quick trial use
- Allows public sharing of signed-in graphs
- Shows public graphs on a dashboard
- Tracks usage limits by subscription tier

## How it works

1. The user enters a question in the explore page.
2. `POST /api/session/create` creates a session and asks Claude to generate the root answer plus initial branches.
3. The frontend stores nodes and edges in a Zustand store and renders them with React Flow.
4. When the user explores a node, `POST /api/explore` generates the next layer.
5. Signed-in users can revisit saved sessions from the sidebar.
6. Signed-in users can make a graph public and share it at `/share/[sessionId]`.

Anonymous users can start exploring without signing in, but deeper exploration is limited. If they sign in later, the app can migrate the anonymous session.

## Main parts of the codebase

- `src/app/page.tsx`: landing page
- `src/app/explore/page.tsx`: main exploration workspace
- `src/components/SearchBar.tsx`: starts a new exploration
- `src/components/KnowledgeCanvas.tsx`: graph canvas built with React Flow
- `src/components/Sidebar.tsx`: chat/session history
- `src/components/ShareButton.tsx` and `src/components/ShareModal.tsx`: public sharing UI
- `src/store/graphStore.ts`: client-side graph state with Zustand
- `src/app/api/session/create/route.ts`: creates a new graph session
- `src/app/api/explore/route.ts`: expands a node with deeper branches
- `src/app/api/session/[id]/share/route.ts`: toggles public sharing
- `src/app/api/share/[sessionId]/route.ts`: returns public graph data
- `prisma/schema.prisma`: database schema

## Tech stack

- Next.js 16
- React 19
- TypeScript
- Prisma + PostgreSQL
- NextAuth with Google sign-in
- Zustand
- React Flow (`@xyflow/react`)
- Anthropic Claude API
- PostHog analytics

## Data model

The app stores two session types:

- `GraphSession`, `Node`, `Edge` for signed-in users
- `AnonymousSession`, `AnonymousNode`, `AnonymousEdge` for anonymous users

Signed-in users also have subscription and usage fields on the `User` model.

## Local setup

### Prerequisites

- Node.js 20+
- PostgreSQL
- Anthropic API key
- Google OAuth credentials for sign-in

### Environment variables

At minimum, set these:

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

- The pricing and subscription backend exists, but the current pricing page uses a placeholder interest dialog instead of a live checkout flow.
- Public sharing is available for signed-in sessions. Anonymous sessions cannot be shared.
- The dashboard surfaces public graphs, not private user sessions.

## License

Private and proprietary.
