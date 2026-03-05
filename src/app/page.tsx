'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, type MouseEvent } from 'react';
import { SignInButton } from '@/components/auth/SignInButton';
import { UserMenu } from '@/components/auth/UserMenu';
import Link from 'next/link';
import {
  ArrowRight,
  Network,
  Zap,
  Brain,
  Share2,
  Sparkles,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';

type HeroSkeletonNode = {
  id: string;
  x: number;
  y: number;
  depth: number;
  sequence: number;
  parentId?: string;
};

type HeroSkeletonEdge = {
  id: string;
  from: HeroSkeletonNode;
  to: HeroSkeletonNode;
};

const heroSkeletonNodes: HeroSkeletonNode[] = [
  { id: 'root', x: 50, y: 20, depth: 0, sequence: 0 },
  { id: 'l1', x: 33, y: 50, depth: 1, sequence: 1, parentId: 'root' },
  { id: 'r1', x: 67, y: 50, depth: 1, sequence: 2, parentId: 'root' },
  { id: 'l2', x: 18, y: 79, depth: 2, sequence: 3, parentId: 'l1' },
  { id: 'l3', x: 40, y: 79, depth: 2, sequence: 4, parentId: 'l1' },
  { id: 'r2', x: 60, y: 79, depth: 2, sequence: 5, parentId: 'r1' },
  { id: 'r3', x: 82, y: 79, depth: 2, sequence: 6, parentId: 'r1' },
];

const featureCards = [
  {
    title: 'Instant Clarity',
    description: 'Ask a question. Depthwise answers and scaffolds the next layer instantly.',
    icon: Zap,
  },
  {
    title: 'Branching Depth',
    description: 'Each response unfolds into a tree of follow-ups so you explore deeper without losing context.',
    icon: Network,
  },
  {
    title: 'Guided Insight',
    description: 'Claude-powered explanations with clear summaries and just-right depth.',
    icon: Brain,
  },
  {
    title: 'Share the Tree',
    description: 'Send a single link and bring others into the same knowledge map.',
    icon: Share2,
  },
];

const heroSkeletonNodeById = new Map(heroSkeletonNodes.map((node) => [node.id, node]));
const heroSkeletonEdges: HeroSkeletonEdge[] = heroSkeletonNodes
  .filter((node) => node.parentId)
  .flatMap((node) => {
    const fromNode = heroSkeletonNodeById.get(node.parentId as string);
    if (!fromNode) {
      return [];
    }

    return [
      {
        id: `${fromNode.id}-${node.id}`,
        from: fromNode,
        to: node,
      },
    ];
  });

const treeLoopStepSeconds = 0.22;
const treePhaseSeconds = 2.7;
const treeRepeatDelaySeconds = 1.25;

function getSkeletonNodeSizeClass(depth: number): string {
  if (depth === 0) {
    return 'w-[138px] h-[92px] sm:w-[152px] sm:h-[100px]';
  }

  if (depth === 1) {
    return 'w-[118px] h-[78px] sm:w-[128px] sm:h-[84px]';
  }

  return 'w-[104px] h-[70px] sm:w-[112px] sm:h-[76px]';
}

function getNodeHalfHeight(depth: number): number {
  if (depth === 0) return 12.2;
  if (depth === 1) return 10.4;
  return 9.4;
}

function buildEdgePath(from: HeroSkeletonNode, to: HeroSkeletonNode): string {
  const fromHalfHeight = getNodeHalfHeight(from.depth);
  const toHalfHeight = getNodeHalfHeight(to.depth);
  const fromX = from.x;
  const fromY = from.y + fromHalfHeight;
  const toX = to.x;
  const toY = to.y - toHalfHeight;
  const midY = (fromY + toY) / 2;

  return `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`;
}

const premiumHighlights = [
  {
    title: 'Layered Thinking',
    description: 'Zoom from overview to detail with a smooth, depth-aware hierarchy.',
    icon: Layers,
  },
  {
    title: 'Ambient Focus',
    description: 'A calm, cinematic workspace that keeps complex topics readable.',
    icon: Sparkles,
  },
  {
    title: 'Private By Default',
    description: 'Your research stays yours until you choose to share it.',
    icon: ShieldCheck,
  },
];

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const year = useMemo(() => new Date().getFullYear(), []);

  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rotateX = useTransform(tiltY, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(tiltX, [-0.5, 0.5], [-12, 12]);

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/explore');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[var(--mint-page)]">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  const handlePointerMove = (event: MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    tiltX.set(x);
    tiltY.set(y);
  };

  const handlePointerLeave = () => {
    tiltX.set(0);
    tiltY.set(0);
  };

  return (
    <div className="relative min-h-screen w-full bg-[var(--mint-page)] text-white overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(1200px 600px at 15% -10%, rgba(110, 231, 183, 0.2), transparent 60%), radial-gradient(900px 500px at 85% 0%, rgba(16, 185, 129, 0.18), transparent 55%), radial-gradient(700px 700px at 50% 80%, rgba(52, 211, 153, 0.16), transparent 55%), linear-gradient(180deg, #050D0B 0%, #0D1A16 55%, #050D0B 100%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-25 mix-blend-soft-light"
        style={{
          backgroundImage:
            'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'120\' height=\'120\'><filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'2\' stitchTiles=\'stitch\'/></filter><rect width=\'120\' height=\'120\' filter=\'url(%23n)\' opacity=\'0.4\'/></svg>")',
        }}
      />
      <motion.div
        className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(110,231,183,0.3),transparent_60%)] blur-3xl"
        animate={shouldReduceMotion ? undefined : { opacity: [0.6, 0.9, 0.6], scale: [1, 1.05, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute top-48 right-[-120px] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.28),transparent_60%)] blur-3xl"
        animate={shouldReduceMotion ? undefined : { opacity: [0.45, 0.75, 0.45], scale: [1.05, 1, 1.05] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="w-full border-b border-[var(--mint-elevated)] bg-[rgba(13,26,22,0.7)] backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 rounded-lg bg-[rgba(16,185,129,0.16)] blur" aria-hidden />
                  <div className="w-9 h-9 bg-[image:var(--mint-accent-gradient)] text-[#04120e] rounded-lg flex items-center justify-center shadow-lg">
                    <Network className="w-5 h-5" />
                  </div>
                </div>
                <span className="text-xl font-semibold tracking-tight">Depthwise</span>
              </div>
              <div className="flex items-center gap-5 text-sm">
                <Link href="/pricing" className="text-white/70 hover:text-white transition-colors">
                  Pricing
                </Link>
                {session ? <UserMenu /> : <SignInButton />}
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-20 sm:pt-28 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.35)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--mint-text-secondary)]">
                <span className="h-2 w-2 rounded-full bg-[var(--mint-accent-2)] shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
                Progressive Depth Learning
              </div>
              <div className="space-y-6">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight">
                  Ask once. Explore in layers.
                  <span className="block text-white/70">Depthwise grows your knowledge like a living tree.</span>
                </h1>
                <p className="text-base sm:text-lg text-white/70 max-w-xl">
                  Ask a question and get a clear answer plus a set of next-step branches. Dive deeper node by node and
                  keep every insight connected. depthwise.app
                </p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <Link
                  href="/explore"
                  className="group inline-flex items-center justify-center gap-3 rounded-full bg-[image:var(--mint-accent-gradient)] text-[#04120e] px-8 py-4 text-base font-semibold shadow-[0_16px_40px_var(--mint-accent-glow)] transition-transform duration-300 hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mint-accent-2)]"
                >
                  Start Exploring
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.35)] px-7 py-4 text-base font-medium text-[var(--mint-text-secondary)] transition hover:border-[var(--mint-accent-2)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mint-accent-glow)]"
                >
                  View Pricing
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-sm text-white/60">
                {premiumHighlights.map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(32,52,45,0.35)] border border-[var(--mint-elevated)]">
                      <item.icon className="w-4 h-4 text-white/80" />
                    </div>
                    <div>
                      <p className="font-medium text-white/90">{item.title}</p>
                      <p className="text-xs text-white/60">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <motion.div
              className="relative"
              onMouseMove={handlePointerMove}
              onMouseLeave={handlePointerLeave}
            >
              <motion.div
                className="relative rounded-[32px] bg-[rgba(13,26,22,0.72)] border border-[var(--mint-elevated)] p-6 sm:p-7 overflow-hidden"
                style={{
                  perspective: '1200px',
                }}
              >
                <motion.div
                  className="relative h-[320px] sm:h-[360px]"
                  style={{
                    rotateX: shouldReduceMotion ? 0 : rotateX,
                    rotateY: shouldReduceMotion ? 0 : rotateY,
                    transformStyle: 'preserve-3d',
                  }}
                  transition={{ type: 'spring', stiffness: 140, damping: 20 }}
                >
                  <div className="absolute inset-0 rounded-3xl border border-[var(--mint-elevated)] bg-[radial-gradient(circle_at_26%_20%,rgba(110,231,183,0.16),transparent_60%),radial-gradient(circle_at_74%_78%,rgba(16,185,129,0.15),transparent_55%)]" />

                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {heroSkeletonEdges.map((edge) => {
                      const edgeDelay = shouldReduceMotion ? 0 : Math.max(0, edge.to.sequence * treeLoopStepSeconds - 0.06);
                      const edgePath = buildEdgePath(edge.from, edge.to);

                      return (
                        <motion.path
                          key={edge.id}
                          d={edgePath}
                          stroke="rgba(110,231,183,0.65)"
                          strokeWidth="0.62"
                          strokeLinecap="round"
                          fill="none"
                          initial={{ opacity: 0, pathLength: 0 }}
                          animate={
                            shouldReduceMotion
                              ? { opacity: 0.55, pathLength: 1 }
                              : { opacity: [0, 0.68, 0.68, 0], pathLength: [0, 1, 1, 0] }
                          }
                          transition={
                            shouldReduceMotion
                              ? undefined
                              : {
                                  duration: treePhaseSeconds,
                                  times: [0, 0.3, 0.78, 1],
                                  delay: edgeDelay,
                                  repeat: Infinity,
                                  repeatDelay: treeRepeatDelaySeconds,
                                  ease: 'easeInOut',
                                }
                          }
                        />
                      );
                    })}
                  </svg>

                  {heroSkeletonNodes.map((node) => {
                    const nodeDelay = shouldReduceMotion ? 0 : node.sequence * treeLoopStepSeconds;
                    const sizeClass = getSkeletonNodeSizeClass(node.depth);
                    return (
                      <motion.div
                        key={node.id}
                        className="absolute"
                        style={{
                          top: `${node.y}%`,
                          left: `${node.x}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <motion.div
                          className={`${sizeClass} rounded-xl border border-[var(--mint-accent-2)]/55 bg-[rgba(13,26,22,0.92)] p-2.5 shadow-[0_10px_24px_rgba(5,13,11,0.58)]`}
                          initial={{ opacity: 0, scale: 0.93, y: 6 }}
                          animate={
                            shouldReduceMotion
                              ? { opacity: 0.95, scale: 1, y: 0 }
                              : {
                                  opacity: [0.12, 0.96, 0.96, 0.2],
                                  scale: [0.93, 1, 1, 0.96],
                                  y: [6, 0, 0, 4],
                                }
                          }
                          transition={
                            shouldReduceMotion
                              ? undefined
                              : {
                                  duration: treePhaseSeconds,
                                  times: [0, 0.28, 0.76, 1],
                                  delay: nodeDelay,
                                  repeat: Infinity,
                                  repeatDelay: treeRepeatDelaySeconds,
                                  ease: 'easeInOut',
                                }
                          }
                        >
                          <div className="h-3 w-[62%] rounded bg-gradient-to-r from-[var(--mint-accent-1)] via-[var(--mint-accent-2)] to-[var(--mint-accent-3)] animate-shimmer" />
                          <div className="mt-2 h-px w-full bg-[var(--mint-elevated)]/85" />
                          <div className="mt-2 space-y-1.5">
                            <div className="h-2 w-full rounded bg-gradient-to-r from-[var(--mint-accent-1)]/70 via-[var(--mint-accent-2)]/60 to-[var(--mint-accent-3)]/70 animate-shimmer" />
                            <div className="h-2 w-[86%] rounded bg-gradient-to-r from-[var(--mint-accent-1)]/70 via-[var(--mint-accent-2)]/60 to-[var(--mint-accent-3)]/70 animate-shimmer" />
                            <div className="h-2 w-[70%] rounded bg-gradient-to-r from-[var(--mint-accent-1)]/70 via-[var(--mint-accent-2)]/60 to-[var(--mint-accent-3)]/70 animate-shimmer" />
                          </div>
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Feature Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-white/50">Built for depth</p>
                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-3">
                  A premium research workspace,
                  <span className="block text-white/60">designed for clarity and speed.</span>
                </h2>
              </div>
              <p className="text-base text-white/60 max-w-xl">
                Every interaction is tuned for flow, from instant graph generation to polished sharing, so you stay in
                momentum.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featureCards.map((feature) => (
                <motion.div
                  key={feature.title}
                  className="group relative rounded-2xl border border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.35)] p-6 shadow-[0_20px_40px_rgba(5,13,11,0.45)] backdrop-blur"
                  whileHover={shouldReduceMotion ? undefined : { y: -6 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                >
                  <div
                    className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[rgba(16,185,129,0.16)] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    aria-hidden
                  />
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(32,52,45,0.38)] border border-[var(--mint-elevated)] shadow-inner">
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm text-white/65">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="relative overflow-hidden rounded-[32px] border border-[var(--mint-elevated)] bg-[rgba(13,26,22,0.75)] p-10 sm:p-16 shadow-[0_30px_60px_rgba(5,13,11,0.5)]">
              <div className="absolute -top-20 -right-24 h-48 w-48 rounded-full bg-[rgba(16,185,129,0.16)] blur-3xl" aria-hidden />
              <div className="absolute -bottom-24 left-12 h-56 w-56 rounded-full bg-[rgba(16,185,129,0.16)] blur-3xl" aria-hidden />
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-white/50">Ready to explore</p>
                  <h3 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">
                    Turn curiosity into a living map.
                  </h3>
                  <p className="mt-4 text-base text-white/65 max-w-xl">
                    Start with a single question. Depthwise keeps every branch organized, visual, and instantly
                    shareable.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/explore"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[image:var(--mint-accent-gradient)] text-[#04120e] px-8 py-4 text-base font-semibold shadow-[0_18px_40px_var(--mint-accent-glow)] transition-transform duration-300 hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mint-accent-2)]"
                  >
                    Start Exploring
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.35)] px-8 py-4 text-base font-medium text-[var(--mint-text-secondary)] transition hover:text-white hover:border-[var(--mint-accent-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mint-accent-glow)]"
                  >
                    Compare Plans
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[var(--mint-elevated)] py-12 px-4 sm:px-6 lg:px-8 bg-[rgba(13,26,22,0.7)] backdrop-blur">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[image:var(--mint-accent-gradient)] rounded-lg flex items-center justify-center text-[#04120e]">
                <Network className="w-4 h-4" />
              </div>
              <span className="text-lg font-semibold">Depthwise</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-white/60">
              <Link href="/pricing" className="hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="/help" className="hover:text-white transition-colors">
                Help
              </Link>
            </div>
            <div className="text-sm text-white/40">(c) {year} Depthwise</div>
          </div>
        </footer>
      </div>
    </div>
  );
}
