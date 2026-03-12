'use client';

import { useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';

/* ─────────────────────── data ─────────────────────── */

interface TreeNode {
  id: string;
  text: string;
  tag?: { label: string; color: string };
  x: number; // % of container width
  y: number; // % of container height
  depth: number;
  parentId?: string;
}

const nodes: TreeNode[] = [
  { id: 'root', text: 'How does gravity work?', x: 50, y: 14, depth: 0 },
  {
    id: 'c1',
    text: 'Spacetime curvature',
    tag: { label: 'how', color: '#10B981' },
    x: 18,
    y: 48,
    depth: 1,
    parentId: 'root',
  },
  {
    id: 'c2',
    text: 'Newton vs Einstein',
    tag: { label: 'compare', color: '#6EE7B7' },
    x: 50,
    y: 48,
    depth: 1,
    parentId: 'root',
  },
  {
    id: 'c3',
    text: 'Why do objects fall?',
    tag: { label: 'why', color: '#34D399' },
    x: 82,
    y: 48,
    depth: 1,
    parentId: 'root',
  },
  {
    id: 'g1',
    text: 'Terminal velocity',
    tag: { label: 'how', color: '#10B981' },
    x: 72,
    y: 82,
    depth: 2,
    parentId: 'c3',
  },
  {
    id: 'g2',
    text: 'Gravitational acceleration',
    tag: { label: 'why', color: '#34D399' },
    x: 92,
    y: 82,
    depth: 2,
    parentId: 'c3',
  },
];

interface Edge {
  id: string;
  from: TreeNode;
  to: TreeNode;
}

const nodeMap = new Map(nodes.map((n) => [n.id, n]));
const edges: Edge[] = nodes
  .filter((n) => n.parentId)
  .map((n) => ({
    id: `${n.parentId}-${n.id}`,
    from: nodeMap.get(n.parentId!)!,
    to: n,
  }));

/* ────────────── scramble chars set ────────────── */

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&?<>{}[]~';

function scrambledText(final: string, progress: number): string {
  const solved = Math.floor(progress * final.length);
  let out = '';
  for (let i = 0; i < final.length; i++) {
    if (final[i] === ' ') {
      out += ' ';
    } else if (i < solved) {
      out += final[i];
    } else {
      out += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
    }
  }
  return out;
}

/* ────────────── edge SVG path builder ────────────── */

function edgePath(from: TreeNode, to: TreeNode): string {
  const halfH: Record<number, number> = { 0: 7, 1: 6.2, 2: 5.5 };
  const fx = from.x;
  const fy = from.y + (halfH[from.depth] ?? 6);
  const tx = to.x;
  const ty = to.y - (halfH[to.depth] ?? 6);
  const my = (fy + ty) / 2;
  return `M ${fx} ${fy} C ${fx} ${my}, ${tx} ${my}, ${tx} ${ty}`;
}

/* ────────── node size classes by depth ────────── */

function nodeSizeClass(depth: number) {
  if (depth === 0) return 'w-[170px] h-[54px] sm:w-[200px] sm:h-[58px]';
  if (depth === 1) return 'w-[148px] h-[52px] sm:w-[158px] sm:h-[56px]';
  return 'w-[150px] h-[50px] sm:w-[166px] sm:h-[54px]';
}

/* ═══════════════════ COMPONENT ═══════════════════ */

export default function HeroTreeAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const textRefs = useRef<Map<string, HTMLSpanElement>>(new Map());
  const edgeRefs = useRef<Map<string, SVGPathElement>>(new Map());
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const setNodeRef = useCallback(
    (id: string) => (el: HTMLDivElement | null) => {
      if (el) nodeRefs.current.set(id, el);
    },
    [],
  );
  const setTextRef = useCallback(
    (id: string) => (el: HTMLSpanElement | null) => {
      if (el) textRefs.current.set(id, el);
    },
    [],
  );
  const setEdgeRef = useCallback(
    (id: string) => (el: SVGPathElement | null) => {
      if (el) edgeRefs.current.set(id, el);
    },
    [],
  );

  /* ── text scramble helper (returns a tween) ── */
  function scrambleTween(id: string, duration = 0.6) {
    const span = textRefs.current.get(id);
    const node = nodes.find((n) => n.id === id)!;
    if (!span) return gsap.to({}, { duration: 0 });
    const proxy = { progress: 0 };
    return gsap.to(proxy, {
      progress: 1,
      duration,
      ease: 'none',
      onUpdate() {
        span.textContent = scrambledText(node.text, proxy.progress);
      },
      onComplete() {
        span.textContent = node.text;
      },
    });
  }

  /* ── edge draw helper ── */
  function drawEdgeTween(id: string, duration = 0.45) {
    const path = edgeRefs.current.get(id);
    if (!path) return gsap.to({}, { duration: 0 });
    const len = path.getTotalLength();
    gsap.set(path, { strokeDasharray: len, strokeDashoffset: len, opacity: 0 });
    return gsap.to(path, {
      strokeDashoffset: 0,
      opacity: 1,
      duration,
      ease: 'power2.inOut',
    });
  }

  /* ── fade-in node ── */
  function fadeInNode(id: string, duration = 0.4) {
    const el = nodeRefs.current.get(id);
    if (!el) return gsap.to({}, { duration: 0 });
    gsap.set(el, { opacity: 0, y: 12, scale: 0.92 });
    return gsap.to(el, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration,
      ease: 'power3.out',
    });
  }

  useEffect(() => {
    /* Small delay so refs are mounted */
    const ctx = gsap.context(() => {
      /* ── hide everything initially ── */
      nodes.forEach((n) => {
        const el = nodeRefs.current.get(n.id);
        if (el) gsap.set(el, { opacity: 0, y: 12, scale: 0.92 });
      });
      edges.forEach((e) => {
        const path = edgeRefs.current.get(e.id);
        if (path) {
          const len = path.getTotalLength();
          gsap.set(path, { strokeDasharray: len, strokeDashoffset: len, opacity: 0 });
        }
      });

      function buildTimeline() {
        const tl = gsap.timeline({
          delay: 0.6,
          onComplete() {
            /* loop: fade out then restart */
            gsap.to(containerRef.current, {
              opacity: 0,
              duration: 0.6,
              delay: 3,
              ease: 'power2.inOut',
              onComplete() {
                /* reset everything */
                nodes.forEach((n) => {
                  const el = nodeRefs.current.get(n.id);
                  if (el) gsap.set(el, { opacity: 0, y: 12, scale: 0.92 });
                  const span = textRefs.current.get(n.id);
                  if (span) span.textContent = '';
                });
                edges.forEach((e) => {
                  const path = edgeRefs.current.get(e.id);
                  if (path) {
                    const len = path.getTotalLength();
                    gsap.set(path, { strokeDasharray: len, strokeDashoffset: len, opacity: 0 });
                  }
                });
                /* remove pulse class from grandchildren */
                ['g1', 'g2'].forEach((id) => {
                  const el = nodeRefs.current.get(id);
                  if (el) el.classList.remove('hero-node-pulse');
                });

                gsap.to(containerRef.current, {
                  opacity: 1,
                  duration: 0.3,
                  onComplete: () => buildTimeline(),
                });
              },
            });
          },
        });

        /* ── Stage 1: Root node ── */
        tl.add(fadeInNode('root', 0.5));
        tl.add(scrambleTween('root', 0.6), '-=0.15');

        /* ── Stage 2: Three child nodes ── */
        tl.add(() => {}, '+=0.3'); // pause

        // edges grow out
        tl.add(drawEdgeTween('root-c1', 0.5), '+=0');
        tl.add(drawEdgeTween('root-c2', 0.5), '<0.1');
        tl.add(drawEdgeTween('root-c3', 0.5), '<0.1');

        // child nodes fade in staggered
        tl.add(fadeInNode('c1', 0.4), '-=0.15');
        tl.add(fadeInNode('c2', 0.4), '<0.15');
        tl.add(fadeInNode('c3', 0.4), '<0.15');

        // text scramble for each child
        tl.add(scrambleTween('c1', 0.5), '-=0.25');
        tl.add(scrambleTween('c2', 0.5), '<0.08');
        tl.add(scrambleTween('c3', 0.5), '<0.08');

        /* ── Stage 3: Two grandchild nodes from c3 ── */
        tl.add(() => {}, '+=0.3'); // pause

        tl.add(drawEdgeTween('c3-g1', 0.45), '+=0');
        tl.add(drawEdgeTween('c3-g2', 0.45), '<0.1');

        tl.add(fadeInNode('g1', 0.4), '-=0.1');
        tl.add(fadeInNode('g2', 0.4), '<0.15');

        tl.add(scrambleTween('g1', 0.5), '-=0.2');
        tl.add(scrambleTween('g2', 0.5), '<0.08');

        /* ── Stage 4: Pulse on newest nodes ── */
        tl.add(() => {
          ['g1', 'g2'].forEach((id) => {
            const el = nodeRefs.current.get(id);
            if (el) el.classList.add('hero-node-pulse');
          });
        }, '+=0.15');

        tlRef.current = tl;
      }

      buildTimeline();
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-[340px] sm:h-[380px] select-none"
      aria-label="Animated knowledge tree showing how a question branches into deeper topics"
    >
      {/* background */}
      <div className="absolute inset-0 rounded-3xl border border-[var(--mint-elevated)] bg-[radial-gradient(circle_at_26%_20%,rgba(110,231,183,0.12),transparent_60%),radial-gradient(circle_at_74%_78%,rgba(16,185,129,0.10),transparent_55%)]" />

      {/* SVG edges */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {edges.map((e) => (
          <path
            key={e.id}
            ref={setEdgeRef(e.id)}
            d={edgePath(e.from, e.to)}
            stroke="rgba(110,231,183,0.6)"
            strokeWidth="0.5"
            strokeLinecap="round"
            fill="none"
            style={{ opacity: 0 }}
          />
        ))}
      </svg>

      {/* Nodes */}
      {nodes.map((node) => {
        const sizeClass = nodeSizeClass(node.depth);
        return (
          <div
            key={node.id}
            ref={setNodeRef(node.id)}
            className="absolute"
            style={{
              top: `${node.y}%`,
              left: `${node.x}%`,
              transform: 'translate(-50%, -50%)',
              opacity: 0,
            }}
          >
            <div
              className={`${sizeClass} rounded-xl border border-[rgba(110,231,183,0.3)] bg-[rgba(13,26,22,0.94)] shadow-[0_8px_28px_rgba(5,13,11,0.6)] flex flex-col justify-center px-3 sm:px-4 relative overflow-hidden`}
              style={
                node.tag
                  ? { borderLeftWidth: '3px', borderLeftColor: node.tag.color }
                  : undefined
              }
            >
              {/* tag */}
              {node.tag && (
                <span
                  className="absolute top-1.5 right-2 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider opacity-70"
                  style={{ color: node.tag.color }}
                >
                  {node.tag.label}
                </span>
              )}
              {/* text */}
              <span
                ref={setTextRef(node.id)}
                className={`font-mono leading-tight ${
                  node.depth === 0
                    ? 'text-[12px] sm:text-[13px] font-semibold text-white/95'
                    : 'text-[11px] sm:text-[12px] text-white/85'
                }`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
