import Anthropic from '@anthropic-ai/sdk';
import { ExploreTerm, FollowUpType } from '@/types/graph';
import { logger } from '@/lib/logger';

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  logger.error('ANTHROPIC_API_KEY is not set');
}

const anthropic = new Anthropic({
  apiKey: apiKey || '',
  maxRetries: 2,
  timeout: 45_000,
});

export const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';
const ENABLE_PROMPT_TOKEN_COUNT = process.env.ENABLE_PROMPT_TOKEN_COUNT === 'true';

const MODEL_PRICING_PER_MILLION: Record<string, { inputUsd: number; outputUsd: number }> = {
  'claude-haiku-4-5-20251001': { inputUsd: 1, outputUsd: 5 },
  'claude-sonnet-4-5-20250929': { inputUsd: 3, outputUsd: 15 },
  'claude-opus-4-1-20250805': { inputUsd: 15, outputUsd: 75 },
};

function ensureApiKey(): void {
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured. Please set it in your environment variables.');
  }
}

interface ExplorationContext {
  rootQuery: string;
  currentNode?: {
    title: string;
    content: string;
  };
  path: string[];
  depth: number;
  coveredTopics: string[];
  exploreType?: FollowUpType;
  focusTerm?: string;
  branchCount?: number;
}

interface GeneratedBranch {
  title: string;
  summary: string;
  depthPreview?: string;
  followUpType: FollowUpType;
}

interface ClaudePayload {
  answer?: unknown;
  keyTerms?: unknown;
  branches?: unknown;
}

export interface GenerationUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
  estimatedCostUsd: number;
  requestId?: string;
}

export interface GenerationResult {
  answer: string;
  keyTerms: ExploreTerm[];
  branches: GeneratedBranch[];
  usage: GenerationUsage;
}

const SYSTEM_PROMPT = `You are a knowledge exploration assistant for a visual node graph.

Goals:
1. Give a clear answer in 3-4 sentences.
2. Include one concrete example.
3. Provide 3-5 high-signal terms users can click to explore deeper.
4. Generate branch nodes that represent different exploration angles.

Branch rules:
- Keep branches parallel, not step-by-step instructions.
- Use specific titles.
- Summaries should be 1-2 sentences.
- Each branch must include followUpType:
  "why" | "how" | "what" | "example" | "compare"
- Keep at least 2 different followUpTypes across branches.

Term rules:
- keyTerms should be concrete nouns/phrases from the answer.
- Avoid generic terms like "system", "technology", "process".
- Every keyTerm must include:
  - label: short chip text
  - query: a full follow-up question the system can explore directly

Return ONLY valid JSON:
{
  "answer": "string",
  "keyTerms": [
    { "label": "string", "query": "string" }
  ],
  "branches": [
    {
      "title": "string",
      "summary": "string",
      "depthPreview": "string",
      "followUpType": "why" | "how" | "what" | "example" | "compare"
    }
  ]
}`;

function getExploreTypeGuidance(exploreType: FollowUpType): string {
  switch (exploreType) {
    case 'why':
      return 'User asked for WHY. Emphasize causes, motivation, and rationale.';
    case 'how':
      return 'User asked for HOW. Emphasize mechanisms and implementation details.';
    case 'what':
      return 'User asked for WHAT. Emphasize definitions, components, and categories.';
    case 'example':
      return 'User asked for EXAMPLES. Emphasize real-world cases and practical scenarios.';
    case 'compare':
      return 'User asked for COMPARE. Emphasize tradeoffs and alternatives.';
    default:
      return '';
  }
}

function buildPrompt(context: ExplorationContext): string {
  const branchCount = Math.min(5, Math.max(2, context.branchCount ?? (context.depth === 1 ? 4 : 3)));
  const exploreTypeGuidance = context.exploreType ? getExploreTypeGuidance(context.exploreType) : '';
  const focusTermGuidance = context.focusTerm
    ? `The user clicked this specific term to dig deeper: "${context.focusTerm}". Focus answer and branches around this term.`
    : '';

  if (context.depth === 1) {
    return `Root query: "${context.rootQuery}"

${exploreTypeGuidance}
${focusTermGuidance}

Write a clear answer with:
1) Definition
2) How it works
3) Why it matters
4) One concrete example

Then generate exactly ${branchCount} branch nodes and 3-5 keyTerms.`;
  }

  return `Root query: "${context.rootQuery}"
Current path: ${context.path.join(' -> ')}
Current node title: "${context.currentNode?.title || 'Unknown topic'}"
Current node content: "${(context.currentNode?.content || '').slice(0, 1800)}"
Current depth: ${context.depth}
Target depth: ${context.depth + 1}
Already covered sibling topics: ${context.coveredTopics.join(', ') || 'none'}

${exploreTypeGuidance}
${focusTermGuidance}

Generate one deeper explanation for this node context, then exactly ${branchCount} non-overlapping deeper branches and 3-5 keyTerms from that explanation.
Avoid repeating covered sibling topics.`;
}

function parseJsonResponse(raw: string): ClaudePayload {
  const trimmed = raw.trim();

  if (trimmed.startsWith('```')) {
    const withoutFenceStart = trimmed.replace(/^```(?:json)?\s*/i, '');
    const withoutFenceEnd = withoutFenceStart.replace(/\s*```$/, '');
    return JSON.parse(withoutFenceEnd);
  }

  return JSON.parse(trimmed);
}

function normalizeFollowUpType(value: unknown): FollowUpType {
  if (value === 'why' || value === 'how' || value === 'what' || value === 'example' || value === 'compare') {
    return value;
  }
  return 'how';
}

function normalizeBranches(input: unknown): GeneratedBranch[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item): GeneratedBranch | null => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const title = typeof record.title === 'string' ? record.title.trim() : '';
      const summary = typeof record.summary === 'string' ? record.summary.trim() : '';

      if (!title || !summary) {
        return null;
      }

      return {
        title: title.slice(0, 120),
        summary: summary.slice(0, 400),
        depthPreview: typeof record.depthPreview === 'string' ? record.depthPreview.slice(0, 180) : undefined,
        followUpType: normalizeFollowUpType(record.followUpType),
      };
    })
    .filter((item): item is GeneratedBranch => item !== null)
    .slice(0, 6);
}

function normalizeTerms(input: unknown): ExploreTerm[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item): ExploreTerm | null => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const label = typeof record.label === 'string' ? record.label.trim() : '';
      const query = typeof record.query === 'string' ? record.query.trim() : '';

      if (!label || !query) {
        return null;
      }

      return {
        label: label.slice(0, 60),
        query: query.slice(0, 220),
      };
    })
    .filter((item): item is ExploreTerm => item !== null)
    .slice(0, 8);
}

function estimateCostUsd(
  model: string,
  usage: { input_tokens?: number; output_tokens?: number }
): number {
  const pricing = MODEL_PRICING_PER_MILLION[model];
  if (!pricing) {
    return 0;
  }

  const inputTokens = usage.input_tokens || 0;
  const outputTokens = usage.output_tokens || 0;

  const total =
    (inputTokens / 1_000_000) * pricing.inputUsd +
    (outputTokens / 1_000_000) * pricing.outputUsd;

  return Math.round(total * 1_000_000) / 1_000_000;
}

export async function generateBranches(context: ExplorationContext): Promise<GenerationResult> {
  ensureApiKey();

  const prompt = buildPrompt(context);
  const timer = logger.startTimer();
  let promptTokensEstimate: number | undefined;

  if (ENABLE_PROMPT_TOKEN_COUNT) {
    try {
      const tokenCount = await anthropic.messages.countTokens({
        model: CLAUDE_MODEL,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      });
      promptTokensEstimate = tokenCount.input_tokens;
    } catch (error) {
      logger.warn('Anthropic token count failed', {
        model: CLAUDE_MODEL,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  try {
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1800,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (!content || content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const parsed = parseJsonResponse(content.text);
    const answer = typeof parsed.answer === 'string' ? parsed.answer.trim() : '';
    const branches = normalizeBranches(parsed.branches);
    const keyTerms = normalizeTerms(parsed.keyTerms);

    if (!answer) {
      throw new Error('Claude returned empty answer');
    }

    const usage = {
      model: CLAUDE_MODEL,
      inputTokens: message.usage.input_tokens || 0,
      outputTokens: message.usage.output_tokens || 0,
      cacheCreationInputTokens: message.usage.cache_creation_input_tokens || 0,
      cacheReadInputTokens: message.usage.cache_read_input_tokens || 0,
      estimatedCostUsd: estimateCostUsd(CLAUDE_MODEL, message.usage),
      requestId: message._request_id || undefined,
    };

    logger.aiUsage('anthropic', {
      model: usage.model,
      requestId: usage.requestId,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      cacheCreationInputTokens: usage.cacheCreationInputTokens,
      cacheReadInputTokens: usage.cacheReadInputTokens,
      estimatedCostUsd: usage.estimatedCostUsd,
      promptTokensEstimate,
      durationMs: logger.durationMs(timer),
      depth: context.depth,
      focusTerm: context.focusTerm,
      branchCount: branches.length,
      keyTermCount: keyTerms.length,
    });

    return {
      answer,
      branches,
      keyTerms,
      usage,
    };
  } catch (error) {
    logger.apiError('Claude.generateBranches', error, {
      model: CLAUDE_MODEL,
      durationMs: logger.durationMs(timer),
      depth: context.depth,
      focusTerm: context.focusTerm,
    });
    throw error;
  }
}

export { anthropic };
