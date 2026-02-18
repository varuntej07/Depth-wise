import { LAYOUT_CONFIG } from '@/lib/layout';
import { GraphEdge, GraphNode, FollowUpType } from '@/types/graph';

type UnknownRecord = Record<string, unknown>;

const VALID_FOLLOW_UP_TYPES = new Set<FollowUpType>([
  'why',
  'how',
  'what',
  'example',
  'compare',
]);
const MAX_SAFE_COORDINATE = 25000;

function asRecord(value: unknown): UnknownRecord | null {
  if (value && typeof value === 'object') {
    return value as UnknownRecord;
  }
  return null;
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asText(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function isSaneCoordinate(value: number | null): value is number {
  return value !== null && Math.abs(value) <= MAX_SAFE_COORDINATE;
}

function normalizeDepth(value: unknown): number {
  const parsed = toFiniteNumber(value);
  if (parsed === null) {
    return 1;
  }
  return Math.max(1, Math.floor(parsed));
}

function asFollowUpType(value: unknown): FollowUpType | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  return VALID_FOLLOW_UP_TYPES.has(value as FollowUpType)
    ? (value as FollowUpType)
    : undefined;
}

function getFallbackPosition(depth: number, index: number, count: number) {
  const horizontalSpacing =
    depth <= 2 ? LAYOUT_CONFIG.level1.horizontalSpacing : LAYOUT_CONFIG.level2Plus.horizontalSpacing;
  const verticalSpacing = LAYOUT_CONFIG.level2Plus.verticalSpacing;

  return {
    x: (index - (count - 1) / 2) * horizontalSpacing,
    y: (depth - 1) * verticalSpacing,
  };
}

interface NormalizeLoadedSessionInput {
  sessionId: string;
  nodes: unknown;
  edges: unknown;
}

interface NormalizeLoadedSessionOutput {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function normalizeLoadedSessionGraph({
  sessionId,
  nodes,
  edges,
}: NormalizeLoadedSessionInput): NormalizeLoadedSessionOutput {
  const rawNodes = Array.isArray(nodes) ? nodes : [];
  const rawEdges = Array.isArray(edges) ? edges : [];

  const depthCounts = new Map<number, number>();

  for (const rawNode of rawNodes) {
    const nodeRecord = asRecord(rawNode);
    if (!nodeRecord) continue;

    const nodeId = asNonEmptyString(nodeRecord.id);
    if (!nodeId) continue;

    const dataRecord = asRecord(nodeRecord.data);
    const depth = normalizeDepth(dataRecord?.depth);
    depthCounts.set(depth, (depthCounts.get(depth) || 0) + 1);
  }

  const depthIndices = new Map<number, number>();
  const seenNodeIds = new Set<string>();
  const normalizedNodes: GraphNode[] = [];

  for (const rawNode of rawNodes) {
    const nodeRecord = asRecord(rawNode);
    if (!nodeRecord) continue;

    const nodeId = asNonEmptyString(nodeRecord.id);
    if (!nodeId || seenNodeIds.has(nodeId)) continue;

    const dataRecord = asRecord(nodeRecord.data);
    const positionRecord = asRecord(nodeRecord.position);
    const depth = normalizeDepth(dataRecord?.depth);

    const depthIndex = depthIndices.get(depth) || 0;
    const depthCount = depthCounts.get(depth) || 1;
    depthIndices.set(depth, depthIndex + 1);

    const fallbackPosition = getFallbackPosition(depth, depthIndex, depthCount);
    const rawX = toFiniteNumber(positionRecord?.x);
    const rawY = toFiniteNumber(positionRecord?.y);
    const x = isSaneCoordinate(rawX) ? rawX : fallbackPosition.x;
    const y = isSaneCoordinate(rawY) ? rawY : fallbackPosition.y;

    const title = asNonEmptyString(dataRecord?.title) || 'Untitled node';
    const parentId = asNonEmptyString(dataRecord?.parentId) || undefined;

    normalizedNodes.push({
      id: nodeId,
      type: 'knowledge',
      position: { x, y },
      data: {
        title,
        content: asText(dataRecord?.content) || '',
        summary: asText(dataRecord?.summary) || '',
        depth,
        explored: typeof dataRecord?.explored === 'boolean' ? dataRecord.explored : false,
        loading: false,
        sessionId,
        parentId,
        followUpType: asFollowUpType(dataRecord?.followUpType),
      },
    });

    seenNodeIds.add(nodeId);
  }

  const normalizedEdges: GraphEdge[] = [];
  const seenEdgeIds = new Set<string>();

  for (const rawEdge of rawEdges) {
    const edgeRecord = asRecord(rawEdge);
    if (!edgeRecord) continue;

    const edgeId = asNonEmptyString(edgeRecord.id);
    const source = asNonEmptyString(edgeRecord.source);
    const target = asNonEmptyString(edgeRecord.target);

    if (!edgeId || seenEdgeIds.has(edgeId)) continue;
    if (!source || !target) continue;
    if (!seenNodeIds.has(source) || !seenNodeIds.has(target)) continue;

    normalizedEdges.push({
      id: edgeId,
      source,
      target,
      animated: typeof edgeRecord.animated === 'boolean' ? edgeRecord.animated : true,
    });
    seenEdgeIds.add(edgeId);
  }

  return {
    nodes: normalizedNodes,
    edges: normalizedEdges,
  };
}
