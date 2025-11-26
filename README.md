# Knowledge Graph Explorer

A conversational knowledge exploration system that helps users build visual knowledge graphs by progressively exploring topics. Each answer branches into deeper layers, creating an interactive, zoomable map of interconnected concepts.

## 🎯 Vision

Transform how people learn and explore knowledge by creating dynamic, visual representations of their curiosity journey. Instead of traditional linear research, users can see connections between concepts and navigate their personalized learning path.

---

## 🏗️ Architecture & Data Flow

### System Overview

The Knowledge Graph Explorer follows a modern full-stack architecture with real-time state management, AI-powered content generation, and subscription-based usage limits.

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│  ┌──────────────┐  ┌──────────────----┐  ┌──────────────┐       │
│  │  SearchBar   │  │ KnowledgeCanvas  │  │  Sidebar     │       │
│  │  (Input)     │  │  (Visualization) │  │  (History)   │       │
│  └──────────────┘  └──────────────--- ┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Zustand State Store                          │
│  (graphStore.ts - Central State Management)                     │
│  • sessionId, nodes, edges, rootQuery, isPublic                 │
│  • Actions: addNodes, updateNode, loadSession, etc.             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       API Routes Layer                          │
│  /api/session/create  |  /api/explore    |  /api/sessions       │
│  /api/session/[id]    |  /api/user/usage                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              Database Layer (Prisma + PostgreSQL)               │
│              User → GraphSession → Node → Edge                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Component Architecture & Data Flow

### 1. Initial Search Flow

**Files Involved:**
- `src/components/SearchBar.tsx` (lines 33-243)
- `src/app/api/session/create/route.ts`
- `src/store/graphStore.ts`

**Flow:**

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User Input (SearchBar.tsx:33)                                │
│    User enters query: "How does quantum computing work?"        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Loading State (SearchBar.tsx:54-99)                          │
│    • clearGraph() - Clear existing graph                        │
│    • Show 4 skeleton nodes (1 root + 3 branches)                │
│    • Display loading animation                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. API Call (SearchBar.tsx:102)                                 │
│    POST /api/session/create                                     │
│    Body: { query: "How does quantum computing work?" }          │
│                                                                  │
│    Backend Process:                                             │
│    • Check subscription limits (explorationsUsed < limit)       │
│    • Check saved graphs limit (currentCount < maxGraphs)        │
│    • Create GraphSession in database                           │
│    • Call Claude API to generate root answer + branches         │
│    • Calculate layout positions (layout.ts)                     │
│    • Save Node and Edge records to database                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. State Update (SearchBar.tsx:154-210)                         │
│    • setSessionId(data.sessionId)                              │
│    • setRootQuery(query)                                        │
│    • addNodes([rootNode, ...branchNodes])                       │
│    • addEdges(edges)                                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. UI Render (KnowledgeCanvas.tsx)                              │
│    • React Flow visualizes nodes                                │
│    • Nodes positioned using LAYOUT_CONFIG                       │
│    • Edges drawn with Bezier curves                             │
│    • MiniMap shows overview (bottom-right, 120x80px)            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. Usage Update (SearchBar.tsx:221)                             │
│    • Emit 'refresh-usage' custom event                          │
│    • UsageIndicator fetches updated stats                       │
│    • Display: "1 / 10" explorations used                        │
└─────────────────────────────────────────────────────────────────┘
```

---

### 2. Node Exploration Flow

**Files Involved:**
- `src/components/KnowledgeNode.tsx` (lines 38-53)
- `src/components/KnowledgeCanvas.tsx` (lines 113-255)
- `src/app/api/explore/route.ts`

**Flow:**

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User Click (KnowledgeNode.tsx:38)                            │
│    User clicks "Explore Deeper" button on a node                │
│    → handleExplore() fires                                      │
│    → Dispatch 'explore-node' custom event                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Event Listener (KnowledgeCanvas.tsx:114)                     │
│    handleExploreNode(event) catches the event                   │
│    • Validate: not loading, not explored                        │
│    • updateNode(nodeId, { loading: true })                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Skeleton Preview (KnowledgeCanvas.tsx:125-152)               │
│    • Generate 3 skeleton nodes as children                      │
│    • Position using LAYOUT_CONFIG.level2Plus                    │
│    • Add skeleton edges with animated: true                     │
│    • addNodes(skeletonNodes), addEdges(skeletonEdges)           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. API Call (KnowledgeCanvas.tsx:156)                           │
│    POST /api/explore                                            │
│    Body: {                                                      │
│      sessionId: "abc123",                                       │
│      parentId: "node-xyz",                                      │
│      depth: 2                                                   │
│    }                                                            │
│                                                                  │
│    Backend Process:                                             │
│    • Check depth limit (depth + 1 <= maxDepth)                 │
│    • Fetch parent node content                                  │
│    • Call Claude API to generate 3 child branches              │
│    • Calculate positions relative to parent                     │
│    • Save new Node and Edge records                             │
│    • Return: { branches, edges, parentContent }                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Replace Skeletons (KnowledgeCanvas.tsx:190-236)              │
│    • removeNode() for each skeleton                             │
│    • updateNode(parent, { content: data.parentContent })        │
│    • addNodes(realBranchNodes)                                  │
│    • addEdges(realEdges)                                        │
│    • updateNode(parent, { loading: false, explored: true })     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. Visual Update                                                │
│    • React Flow re-renders with new nodes                       │
│    • Smooth entrance animations                                │
│    • Parent node shows "Explored" checkmark                     │
│    • New nodes ready for further exploration                    │
└─────────────────────────────────────────────────────────────────┘
```

---

### 3. Sharing & Collaboration Flow

**Files Involved:**
- `src/components/ShareButton.tsx` (top-right corner)
- `src/components/ShareModal.tsx`
- `src/app/api/session/[id]/share/route.ts`

**Flow:**

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User Action (ShareButton.tsx:46)                             │
│    User clicks Share button (fixed top-right, z-30)             │
│    → Opens ShareModal                                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Toggle Privacy (ShareModal.tsx)                              │
│    User toggles public/private switch                           │
│    POST /api/session/[id]/share                                 │
│    Body: { isPublic: true }                                     │
│                                                                  │
│    Backend:                                                     │
│    • Update GraphSession.isPublic = true                        │
│    • Return: { success, isPublic }                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. State Update (ShareModal.tsx)                                │
│    • setIsPublic(true) in Zustand store                         │
│    • Generate shareable link                                    │
│    • Display: https://app.com/share/[sessionId]                 │
│    • Show "Copy Link" button                                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Visual Feedback (ShareButton.tsx:65-67)                      │
│    • Button shows pulsing ring animation                        │
│    • Green indicator dot appears (top-right of button)          │
│    • Text changes to "Public Graph"                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Public Access                                                │
│    GET /api/share/[sessionId] (no auth required)                │
│    • Returns read-only graph data                               │
│    • Public viewer can pan/zoom                                │
│    • No exploration allowed (isReadOnly = true)                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 4. Session Management & History

**Files Involved:**
- `src/components/Sidebar.tsx` (left side, collapsible)
- `src/app/api/sessions/route.ts`
- `src/app/page.tsx` (lines 46-79)

**Flow:**

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Sidebar Display                                              │
│    • Desktop: Persistent left sidebar (64px → 280px)            │
│    • Mobile: Slide-in drawer                                    │
│    • Shows: New Chat, Chat History, Account Menu                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Fetch History (page.tsx:46)                                  │
│    GET /api/sessions                                            │
│    Returns: [                                                   │
│      {                                                          │
│        id: "abc123",                                            │
│        title: "How does quantum computing work?",               │
│        timestamp: "2025-01-15T10:30:00Z",                       │
│        isPinned: false                                          │
│      },                                                         │
│      ...                                                        │
│    ]                                                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Load Session (page.tsx:68)                                   │
│    User clicks a chat item in sidebar                           │
│    GET /api/session/[id]                                        │
│    Returns: {                                                   │
│      sessionId, rootQuery,                                      │
│      nodes: [...], edges: [...]                                 │
│    }                                                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Restore Graph (page.tsx:74)                                  │
│    loadSession(sessionId, rootQuery, nodes, edges)              │
│    • Store updates with full graph state                        │
│    • KnowledgeCanvas re-renders                                 │
│    • All nodes/edges restored                                   │
│    • User can continue exploration                              │
└─────────────────────────────────────────────────────────────────┘
```

---

### 5. Subscription & Usage Limits

**Files Involved:**
- `src/components/UsageIndicator.tsx` (header, right side)
- `src/lib/subscription-config.ts`
- `src/app/api/user/usage/route.ts`

**Subscription Tiers:**

```typescript
FREE Tier:
  ✓ 10 explorations/month
  ✓ Max depth: 5 levels
  ✓ 3 saved graphs
  ✓ Auto-reset: 30 days

STARTER Tier ($9.99/month):
  ✓ 100 explorations/month
  ✓ Max depth: 10 levels
  ✓ Unlimited saved graphs
  ✓ Auto-reset: 30 days

PRO Tier ($29.99/month):
  ✓ Unlimited explorations
  ✓ Max depth: 15 levels
  ✓ Unlimited saved graphs
  ✓ Priority support
```

**Usage Flow:**

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Real-Time Display (UsageIndicator.tsx:83)                    │
│    • Location: Header, right side (justify-end)                 │
│    • Shows: "5 / 10" with progress bar                          │
│    • Color-coded:                                               │
│      - Green (0-69%): Cyan to Blue gradient                     │
│      - Orange (70-89%): Yellow to Orange                        │
│      - Red (90-100%): Red to Orange                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Limit Enforcement (API routes)                               │
│    On /api/session/create:                                      │
│      if (explorationsUsed >= explorationsLimit)                 │
│        → Return 429 { code: 'LIMIT_REACHED' }                   │
│      if (savedGraphsCount >= maxGraphs)                         │
│        → Return 429 { code: 'SAVED_GRAPHS_LIMIT_REACHED' }      │
│                                                                  │
│    On /api/explore:                                             │
│      if (depth + 1 > maxDepth)                                  │
│        → Return 429 { code: 'DEPTH_LIMIT_REACHED' }             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Upgrade Prompt (SubscriptionModal.tsx)                       │
│    • Shows limit reason                                         │
│    • Displays tier comparison                                   │
│    • Links to /pricing page                                     │
│    • CTA: "Upgrade to continue"                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗃️ Database Schema & Relationships

**File:** `prisma/schema.prisma`

```
┌─────────────────────────────────────────────────────────────────┐
│                            User                                  │
│  • id (String, cuid)                                            │
│  • email (String, unique)                                       │
│  • subscriptionTier (FREE | STARTER | PRO)                      │
│  • explorationsUsed (Int)                                       │
│  • explorationsReset (DateTime) - Auto-reset after 30 days      │
│  • sessions (GraphSession[])                                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓ 1:N
┌─────────────────────────────────────────────────────────────────┐
│                        GraphSession                              │
│  • id (String, cuid)                                            │
│  • userId (String, nullable - for anonymous)                    │
│  • rootQuery (String)                                           │
│  • title (String)                                               │
│  • isPublic (Boolean) - For sharing                             │
│  • nodeCount (Int) - Cached count                               │
│  • maxDepth (Int) - Cached max depth                            │
│  • nodes (Node[])                                               │
│  • edges (Edge[])                                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓ 1:N
┌─────────────────────────────────────────────────────────────────┐
│                            Node                                  │
│  • id (String, cuid)                                            │
│  • sessionId (String)                                           │
│  • parentId (String, nullable) - Self-referencing               │
│  • title (String)                                               │
│  • content (Text)                                               │
│  • summary (String)                                             │
│  • depth (Int) - Level in hierarchy                             │
│  • positionX (Float) - React Flow X coordinate                  │
│  • positionY (Float) - React Flow Y coordinate                  │
│  • explored (Boolean) - Has children been generated?            │
│  • children (Node[]) - Self-referencing relation                │
└─────────────────────────────────────────────────────────────────┘
                              ↓ N:M (via Edges)
┌─────────────────────────────────────────────────────────────────┐
│                            Edge                                  │
│  • id (String, cuid)                                            │
│  • sessionId (String)                                           │
│  • sourceId (String) - Parent node                              │
│  • targetId (String) - Child node                               │
│  • animated (Boolean)                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Visual Components & Layout

### Node Visualization

**File:** `src/components/KnowledgeNode.tsx`

**Depth-Based Styling:**

```typescript
Depth 1 (Root):      border-cyan-500    shadow-cyan-500/30
Depth 2:             border-blue-500    shadow-blue-500/30
Depth 3:             border-violet-500  shadow-violet-500/30
Depth 4:             border-pink-500    shadow-pink-500/30
Depth 5+:            border-amber-500   shadow-amber-500/30
```

**Node Sizing (Responsive):**

```typescript
Root Node (depth 1):
  Mobile:   320px wide
  Tablet:   400px wide
  Desktop:  500px wide

Child Nodes (depth 2+):
  Mobile:   280px wide
  Tablet:   340px wide
  Desktop:  420px wide
```

**Node States:**

1. **Unexplored** - Shows "Explore Deeper" button
2. **Loading** - Spinner with depth color
3. **Explored** - Checkmark badge, no button
4. **Error** - Red border, "Retry" button

### Graph Layout

**File:** `src/lib/layout.ts`

```typescript
LAYOUT_CONFIG = {
  level1: {
    horizontalSpacing: 620px,  // Root's children spacing
    verticalSpacing: 420px,    // Root to children distance
  },
  level2Plus: {
    horizontalSpacing: 420px,  // Subsequent levels spacing
    verticalSpacing: 400px,    // Parent to children distance
  }
}
```

### UI Positioning

```
┌─────────────────────────────────────────────────────────────────┐
│ Header (h-16, flex justify-end)                                 │
│                              [UsageIndicator] [Upgrade Button]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  (Compact Search)                                               │
│  "How does quantum computing work?"                             │
│                          [ShareButton - top-20, right-6] ←──┐   │
│                                                              │   │
│                                                              │   │
│              Knowledge Graph Canvas                          │   │
│              (React Flow with XYFlow)                        │   │
│                                                              │   │
│                                                              │   │
│                                  [MiniMap - 120x80px] ←──────┘   │
│                                  (bottom-right)                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Custom Events System

The application uses custom DOM events for component communication:

```typescript
// Event: 'explore-node'
// Fired by: KnowledgeNode.tsx:51
// Listened by: KnowledgeCanvas.tsx:253
window.dispatchEvent(new CustomEvent('explore-node', {
  detail: { nodeId: 'abc123' }
}));

// Event: 'refresh-usage'
// Fired by: SearchBar.tsx:221
// Listened by: UsageIndicator.tsx:60
window.dispatchEvent(new CustomEvent('refresh-usage'));
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20 or higher
- npm or yarn package manager
- PostgreSQL database

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
# Create .env file with:
DATABASE_URL="your-postgresql-connection-string"
ANTHROPIC_API_KEY="your-anthropic-api-key"
```

3. Initialize database:
```bash
npx prisma migrate dev
```

4. Run development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Key File Directory

```
src/
├── app/
│   ├── page.tsx                      ← Main entry point
│   ├── api/
│   │   ├── session/create/route.ts   ← Create new session
│   │   ├── session/[id]/route.ts     ← Get session data
│   │   ├── session/[id]/share/route.ts ← Toggle public/private
│   │   ├── explore/route.ts          ← Explore node (generate children)
│   │   ├── sessions/route.ts         ← List user sessions
│   │   └── user/usage/route.ts       ← Get usage stats
│
├── components/
│   ├── SearchBar.tsx                 ← Query input & submission
│   ├── KnowledgeCanvas.tsx           ← React Flow canvas
│   ├── KnowledgeNode.tsx             ← Individual node card
│   ├── KnowledgeEdge.tsx             ← Bezier edge curves
│   ├── SkeletonNode.tsx              ← Loading placeholders
│   ├── UsageIndicator.tsx            ← Header usage display
│   ├── ShareButton.tsx               ← FAB share button (top-right)
│   ├── ShareModal.tsx                ← Public/private toggle
│   ├── Sidebar.tsx                   ← Chat history sidebar
│   └── NodeDetailModal.tsx           ← Full content modal
│
├── store/
│   └── graphStore.ts                 ← Zustand state management
│
├── lib/
│   ├── api-config.ts                 ← API endpoint constants
│   ├── layout.ts                     ← Node positioning config
│   └── subscription-config.ts        ← Tier limits & pricing
│
└── types/
    └── graph.ts                      ← TypeScript definitions
```

---

## 🎓 How It Works (User Journey)

1. **Ask a Question**: User enters query in SearchBar (centered on empty state)
2. **Generate Root Node**: AI creates initial answer with 3-4 exploration paths
3. **Explore Branches**: Click "Explore Deeper" to generate child nodes (3 branches each)
4. **Build Your Graph**: Continue exploring to create personalized knowledge map
5. **Navigate & Learn**: Pan, zoom, revisit concepts with visual connections
6. **Share & Collaborate**: Toggle public, share link, others view read-only

---

## 📊 Performance Optimizations

1. **Skeleton Loading** - Instant visual feedback during API calls
2. **React.memo()** - Memoized KnowledgeNode to prevent unnecessary re-renders
3. **Edge Caching** - Explored nodes return cached children from database
4. **Lazy Loading** - Sessions loaded on-demand from sidebar
5. **Transaction Batching** - Atomic DB operations for consistency
6. **MiniMap Optimization** - Hidden on mobile, small size (120x80px)

---

## 📄 License

This project is private and proprietary.

---

**Built with curiosity and AI** 🧠✨
