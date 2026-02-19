import type { Prisma, PrismaClient } from '@prisma/client';
import { SuggestionAudienceType } from '@prisma/client';
import { generateSuggestions, type GeneratedSuggestion, type GenerationUsage } from '@/lib/claude';
import { DEFAULT_SUGGESTIONS, type SuggestionItem } from '@/lib/suggestion-defaults';
import { sanitizeQuery } from '@/lib/utils';

const SUGGESTION_COUNT = 4;
const DEFAULT_REFRESH_HOURS = 12;
const PERSONAL_HISTORY_LIMIT = 30;
const TRENDING_LOOKBACK_DAYS = 14;
const TRENDING_LIMIT = 20;

const refreshHoursCandidate = Number(process.env.SUGGESTION_REFRESH_HOURS || DEFAULT_REFRESH_HOURS);
const refreshHours = Number.isFinite(refreshHoursCandidate) && refreshHoursCandidate > 0
  ? refreshHoursCandidate
  : DEFAULT_REFRESH_HOURS;

export const SUGGESTION_REFRESH_INTERVAL_MS = refreshHours * 60 * 60 * 1000;

export interface SuggestionAudience {
  audienceType: SuggestionAudienceType;
  audienceKey: string;
  userId: string | null;
}

export interface FreshSuggestionsResult {
  suggestions: SuggestionItem[];
  source: 'model' | 'heuristic' | 'default';
  usage?: GenerationUsage;
  personalCount: number;
  trendingCount: number;
}

function dedupeKey(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeSuggestionTitle(title: string): string | null {
  const result = sanitizeQuery(title, 120);
  if (!result.isValid) {
    return null;
  }

  let value = result.sanitized;
  if (value.length < 8) {
    return null;
  }

  if (!value.endsWith('?')) {
    value = `${value}?`;
  }

  return value;
}

function normalizeSuggestionDescription(description: string): string {
  return description
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);
}

function normalizeSuggestionItems(items: SuggestionItem[], count = SUGGESTION_COUNT): SuggestionItem[] {
  const dedupe = new Set<string>();
  const normalized: SuggestionItem[] = [];

  for (const item of items) {
    const title = normalizeSuggestionTitle(item.title);
    const description = normalizeSuggestionDescription(item.description || '');

    if (!title || !description) {
      continue;
    }

    const key = dedupeKey(title);
    if (dedupe.has(key)) {
      continue;
    }

    dedupe.add(key);
    normalized.push({ title, description });

    if (normalized.length >= count) {
      break;
    }
  }

  return normalized;
}

function mergeSuggestions(primary: SuggestionItem[], secondary: SuggestionItem[], count = SUGGESTION_COUNT): SuggestionItem[] {
  return normalizeSuggestionItems([...primary, ...secondary], count);
}

function toSuggestionItems(items: GeneratedSuggestion[]): SuggestionItem[] {
  return items.map((item) => ({
    title: item.title,
    description: item.description,
  }));
}

function toJson(value: SuggestionItem[]): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

export function suggestionsToJson(value: SuggestionItem[]): Prisma.InputJsonValue {
  return toJson(value);
}

export function normalizeQuestionForStorage(question: string): string {
  return question
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300);
}

export function sanitizeClientId(clientId: unknown): string | null {
  if (typeof clientId !== 'string') {
    return null;
  }

  const trimmed = clientId.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, 128);
}

export function resolveSuggestionAudience(input: {
  userId: string | null;
  clientId: string | null;
}): SuggestionAudience | null {
  if (input.userId) {
    return {
      audienceType: SuggestionAudienceType.USER,
      audienceKey: input.userId,
      userId: input.userId,
    };
  }

  if (input.clientId) {
    return {
      audienceType: SuggestionAudienceType.CLIENT,
      audienceKey: input.clientId,
      userId: null,
    };
  }

  return null;
}

export function getDefaultSuggestions(count = SUGGESTION_COUNT): SuggestionItem[] {
  return DEFAULT_SUGGESTIONS.slice(0, count);
}

export function parseStoredSuggestions(raw: unknown, count = SUGGESTION_COUNT): SuggestionItem[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const parsed = raw
    .map((entry): SuggestionItem | null => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const record = entry as Record<string, unknown>;
      const title = typeof record.title === 'string' ? record.title : '';
      const description = typeof record.description === 'string' ? record.description : '';
      if (!title || !description) {
        return null;
      }

      return { title, description };
    })
    .filter((entry): entry is SuggestionItem => entry !== null);

  return normalizeSuggestionItems(parsed, count);
}

function buildHeuristicSuggestions(personal: string[], trending: string[], count = SUGGESTION_COUNT): SuggestionItem[] {
  const seeds = [...personal, ...trending];
  const base = seeds.map((question) => ({
    title: question,
    description: personal.includes(question)
      ? 'Continue exploring themes from your recent questions.'
      : 'Popular question users are exploring right now.',
  }));

  return mergeSuggestions(base, DEFAULT_SUGGESTIONS, count);
}

async function loadPersonalQuestions(prisma: PrismaClient, audience: SuggestionAudience): Promise<string[]> {
  const where =
    audience.audienceType === SuggestionAudienceType.USER
      ? { userId: audience.audienceKey }
      : { clientId: audience.audienceKey, userId: null };

  const questionEvents = await prisma.questionEvent.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    distinct: ['normalizedText'],
    take: PERSONAL_HISTORY_LIMIT,
    select: {
      questionText: true,
    },
  });

  if (questionEvents.length > 0) {
    return questionEvents.map((entry) => entry.questionText);
  }

  if (audience.audienceType === SuggestionAudienceType.USER) {
    const sessions = await prisma.graphSession.findMany({
      where: { userId: audience.audienceKey },
      orderBy: { createdAt: 'desc' },
      take: PERSONAL_HISTORY_LIMIT,
      select: { rootQuery: true },
    });
    return sessions.map((session) => session.rootQuery);
  }

  const sessions = await prisma.anonymousSession.findMany({
    where: { clientId: audience.audienceKey },
    orderBy: { createdAt: 'desc' },
    take: PERSONAL_HISTORY_LIMIT,
    select: { rootQuery: true },
  });
  return sessions.map((session) => session.rootQuery);
}

async function loadTrendingQuestions(prisma: PrismaClient, exclude: Set<string>): Promise<string[]> {
  const since = new Date(Date.now() - TRENDING_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const grouped = await prisma.questionEvent.groupBy({
    by: ['normalizedText'],
    where: {
      createdAt: { gte: since },
    },
    _count: {
      normalizedText: true,
    },
    orderBy: {
      _count: {
        normalizedText: 'desc',
      },
    },
    take: TRENDING_LIMIT,
  });

  const normalizedKeys = grouped
    .map((row) => row.normalizedText)
    .filter((value) => value && !exclude.has(value));

  if (normalizedKeys.length === 0) {
    return [];
  }

  const examples = await prisma.questionEvent.findMany({
    where: {
      normalizedText: { in: normalizedKeys },
    },
    distinct: ['normalizedText'],
    orderBy: { createdAt: 'desc' },
    select: {
      normalizedText: true,
      questionText: true,
    },
  });

  const map = new Map(examples.map((entry) => [entry.normalizedText, entry.questionText]));
  return normalizedKeys.map((key) => map.get(key)).filter((value): value is string => Boolean(value));
}

export async function buildFreshSuggestions(
  prisma: PrismaClient,
  audience: SuggestionAudience
): Promise<FreshSuggestionsResult> {
  const personal = await loadPersonalQuestions(prisma, audience);
  const normalizedPersonal = new Set(
    personal.map((item) => normalizeQuestionForStorage(item)).filter((item) => item.length > 0)
  );
  const trending = await loadTrendingQuestions(prisma, normalizedPersonal);
  const heuristic = buildHeuristicSuggestions(personal, trending);

  if (personal.length === 0 && trending.length === 0) {
    return {
      suggestions: getDefaultSuggestions(),
      source: 'default',
      personalCount: 0,
      trendingCount: 0,
    };
  }

  try {
    const generated = await generateSuggestions({
      personalQuestions: personal,
      trendingQuestions: trending,
      suggestionCount: SUGGESTION_COUNT,
    });

    const modelSuggestions = normalizeSuggestionItems(toSuggestionItems(generated.suggestions), SUGGESTION_COUNT);
    const merged = mergeSuggestions(modelSuggestions, heuristic, SUGGESTION_COUNT);

    if (merged.length > 0) {
      return {
        suggestions: merged,
        source: modelSuggestions.length > 0 ? 'model' : 'heuristic',
        usage: generated.usage,
        personalCount: personal.length,
        trendingCount: trending.length,
      };
    }
  } catch {
    // Fall through to deterministic heuristics when model generation fails.
  }

  return {
    suggestions: heuristic,
    source: 'heuristic',
    personalCount: personal.length,
    trendingCount: trending.length,
  };
}
