import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export const DASHBOARD_PUBLIC_GRAPHS_TAG = 'dashboard-public-graphs';
export const DASHBOARD_PUBLIC_GRAPHS_REVALIDATE_SECONDS = 60 * 60 * 24;

const DEFAULT_CARD_LIMIT = 48;
const MIN_CARD_LIMIT = 8;
const MAX_CARD_LIMIT = 80;
const DEFAULT_GRADIENT =
  'from-[var(--mint-accent-1)] via-[var(--mint-accent-2)] to-[var(--mint-accent-3)]';

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'how',
  'in',
  'into',
  'is',
  'it',
  'of',
  'on',
  'or',
  'that',
  'the',
  'their',
  'this',
  'to',
  'what',
  'when',
  'where',
  'which',
  'why',
  'with',
  'without',
]);

const CATEGORY_KEYWORDS: Array<{ category: string; keywords: string[] }> = [
  { category: 'Technology', keywords: ['ai', 'software', 'cloud', 'data', 'machine', 'robotics', 'platform'] },
  { category: 'Health', keywords: ['health', 'medical', 'care', 'disease', 'clinical', 'biotech'] },
  { category: 'Finance', keywords: ['finance', 'market', 'bank', 'capital', 'investment', 'economy', 'trading'] },
  { category: 'Climate', keywords: ['climate', 'emission', 'energy', 'sustainability', 'carbon', 'renewable'] },
  { category: 'Policy', keywords: ['policy', 'regulation', 'government', 'law', 'governance'] },
  { category: 'Education', keywords: ['education', 'learning', 'school', 'student', 'curriculum'] },
  { category: 'Operations', keywords: ['supply', 'logistics', 'operations', 'manufacturing', 'procurement'] },
  { category: 'Consumer', keywords: ['consumer', 'retail', 'brand', 'demand', 'customer'] },
];

export interface DashboardGraphCard {
  id: string;
  title: string;
  description: string;
  tags: string[];
  lastOpened: string;
  openedAt: number;
  category: string;
  depth: number;
  gradient: string;
  href: string;
}

export interface DashboardPublicGraphMetrics {
  publicGraphs: number;
  topicsCovered: number;
  avgInsightsPerGraph: number;
  weeklyGrowthPercent: number;
}

export interface DashboardPublicGraphsPayload {
  generatedAt: string;
  cards: DashboardGraphCard[];
  metrics: DashboardPublicGraphMetrics;
}

const clampLimit = (input: number | null | undefined): number => {
  if (!Number.isFinite(input)) {
    return DEFAULT_CARD_LIMIT;
  }
  const rounded = Math.floor(Number(input));
  return Math.max(MIN_CARD_LIMIT, Math.min(MAX_CARD_LIMIT, rounded));
};

const toTitleCase = (value: string): string =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => token[0].toUpperCase() + token.slice(1))
    .join(' ');

const truncateText = (value: string, maxChars: number): string => {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxChars) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
};

const formatRelativeTime = (date: Date, now = new Date()): string => {
  const diffMs = now.getTime() - date.getTime();
  if (diffMs <= 0) {
    return 'Just now';
  }

  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;
  const weekMs = 7 * dayMs;

  if (diffMs < hourMs) {
    const minutes = Math.max(1, Math.floor(diffMs / minuteMs));
    return `${minutes} min ago`;
  }
  if (diffMs < dayMs) {
    const hours = Math.floor(diffMs / hourMs);
    return `${hours}h ago`;
  }
  if (diffMs < weekMs) {
    const days = Math.floor(diffMs / dayMs);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  const weeks = Math.floor(diffMs / weekMs);
  return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
};

const deriveCategory = (source: string): string => {
  const normalized = source.toLowerCase();
  for (const { category, keywords } of CATEGORY_KEYWORDS) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      return category;
    }
  }
  return 'General';
};

const extractTags = (source: string, category: string): string[] => {
  const tokens = source
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));

  const dedupedTokens: string[] = [];
  for (const token of tokens) {
    if (!dedupedTokens.includes(token)) {
      dedupedTokens.push(token);
    }
    if (dedupedTokens.length >= 3) {
      break;
    }
  }

  const tags = [category, ...dedupedTokens.map(toTitleCase)].filter(Boolean);
  return Array.from(new Set(tags)).slice(0, 3);
};

const formatGrowth = (currentPeriod: number, previousPeriod: number): number => {
  if (previousPeriod <= 0) {
    return currentPeriod > 0 ? 100 : 0;
  }
  const growth = ((currentPeriod - previousPeriod) / previousPeriod) * 100;
  return Number(growth.toFixed(1));
};

const buildDashboardData = async (limit: number): Promise<DashboardPublicGraphsPayload> => {
  const safeLimit = clampLimit(limit);
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [
    publicSessionCount,
    avgNodeAggregate,
    currentWeekCount,
    previousWeekCount,
    sessions,
  ] = await Promise.all([
    prisma.graphSession.count({ where: { isPublic: true } }),
    prisma.graphSession.aggregate({
      where: { isPublic: true },
      _avg: { nodeCount: true },
    }),
    prisma.graphSession.count({
      where: {
        isPublic: true,
        createdAt: { gte: sevenDaysAgo },
      },
    }),
    prisma.graphSession.count({
      where: {
        isPublic: true,
        createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      },
    }),
    prisma.graphSession.findMany({
      where: { isPublic: true },
      select: {
        id: true,
        title: true,
        rootQuery: true,
        nodeCount: true,
        maxDepth: true,
        updatedAt: true,
        createdAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: safeLimit,
    }),
  ]);

  const sessionIds = sessions.map((session) => session.id);
  const rootNodes = sessionIds.length
    ? await prisma.node.findMany({
        where: {
          sessionId: { in: sessionIds },
          depth: 1,
        },
        select: {
          sessionId: true,
          title: true,
          summary: true,
          content: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      })
    : [];

  const rootNodeBySessionId = new Map<string, (typeof rootNodes)[number]>();
  for (const rootNode of rootNodes) {
    if (!rootNodeBySessionId.has(rootNode.sessionId)) {
      rootNodeBySessionId.set(rootNode.sessionId, rootNode);
    }
  }

  const cards: DashboardGraphCard[] = sessions.map((session) => {
    const rootNode = rootNodeBySessionId.get(session.id);
    const baseTitle = session.title || rootNode?.title || session.rootQuery;
    const title = truncateText(baseTitle || 'Untitled Graph', 68);
    const descriptionSource = rootNode?.summary || rootNode?.content || session.rootQuery || title;
    const description = truncateText(descriptionSource, 132);
    const category = deriveCategory(`${session.rootQuery} ${title}`);
    const tags = extractTags(`${session.rootQuery} ${description}`, category);
    const depth = Math.max(1, session.maxDepth || 1);

    return {
      id: session.id,
      title,
      description,
      tags,
      lastOpened: formatRelativeTime(session.updatedAt, now),
      openedAt: Math.floor(session.updatedAt.getTime() / 1000),
      category,
      depth,
      gradient: DEFAULT_GRADIENT,
      href: `/share/${session.id}`,
    };
  });

  const topicsCovered = new Set(cards.map((card) => card.category)).size;
  const avgInsightsPerGraph = Number((avgNodeAggregate._avg.nodeCount ?? 0).toFixed(1));
  const weeklyGrowthPercent = formatGrowth(currentWeekCount, previousWeekCount);

  return {
    generatedAt: now.toISOString(),
    cards,
    metrics: {
      publicGraphs: publicSessionCount,
      topicsCovered,
      avgInsightsPerGraph,
      weeklyGrowthPercent,
    },
  };
};

export async function getPublicGraphsDashboardData(limit?: number): Promise<DashboardPublicGraphsPayload> {
  const safeLimit = clampLimit(limit);
  const fetchCached = unstable_cache(
    async () => buildDashboardData(safeLimit),
    [DASHBOARD_PUBLIC_GRAPHS_TAG, `limit:${safeLimit}`],
    {
      revalidate: DASHBOARD_PUBLIC_GRAPHS_REVALIDATE_SECONDS,
      tags: [DASHBOARD_PUBLIC_GRAPHS_TAG],
    }
  );

  try {
    return await fetchCached();
  } catch (error) {
    logger.apiError('dashboard_public_graphs_cache_fetch', error, {
      limit: safeLimit,
    });
    return buildDashboardData(safeLimit);
  }
}
