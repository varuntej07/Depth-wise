'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type MouseEvent } from 'react';
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
import { motion, useMotionValue, useReducedMotion, useTransform, type Variants } from 'framer-motion';

type HeroNode = {
  id: string;
  x: number;
  y: number;
  z: number;
  size: number;
  depth: number;
  glow: string;
};

type HeroEdge = {
  from: string;
  to: string;
  opacity: number;
};

const heroNodes: HeroNode[] = [
  { id: 'root', x: 50, y: 16, z: 120, size: 22, depth: 0, glow: 'from-cyan-300/80 to-blue-500/50' },
  { id: 'l1', x: 34, y: 36, z: 100, size: 16, depth: 1, glow: 'from-emerald-300/70 to-teal-500/50' },
  { id: 'r1', x: 66, y: 36, z: 100, size: 16, depth: 1, glow: 'from-violet-300/70 to-indigo-500/50' },
  { id: 'l2', x: 24, y: 56, z: 80, size: 14, depth: 2, glow: 'from-sky-300/70 to-cyan-500/40' },
  { id: 'l3', x: 44, y: 54, z: 80, size: 12, depth: 2, glow: 'from-amber-200/70 to-orange-500/50' },
  { id: 'r2', x: 56, y: 54, z: 80, size: 12, depth: 2, glow: 'from-fuchsia-300/70 to-pink-500/50' },
  { id: 'r3', x: 76, y: 56, z: 80, size: 14, depth: 2, glow: 'from-indigo-300/70 to-purple-500/50' },
  { id: 'l4', x: 16, y: 76, z: 60, size: 10, depth: 3, glow: 'from-cyan-200/70 to-blue-400/40' },
  { id: 'r4', x: 84, y: 76, z: 60, size: 10, depth: 3, glow: 'from-emerald-200/70 to-teal-400/40' },
];

const heroEdges: HeroEdge[] = [
  { from: 'root', to: 'l1', opacity: 0.7 },
  { from: 'root', to: 'r1', opacity: 0.7 },
  { from: 'l1', to: 'l2', opacity: 0.5 },
  { from: 'l1', to: 'l3', opacity: 0.5 },
  { from: 'r1', to: 'r2', opacity: 0.5 },
  { from: 'r1', to: 'r3', opacity: 0.5 },
  { from: 'l2', to: 'l4', opacity: 0.35 },
  { from: 'r3', to: 'r4', opacity: 0.35 },
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

const nodeById = new Map(heroNodes.map((node) => [node.id, node]));

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
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/explore');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950">
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

  const nodeVariants: Variants = {
    hidden: { opacity: 0, scale: 0.6, y: 10 },
    show: (custom: number) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        delay: custom,
        duration: 0.6,
        ease: 'easeOut',
      },
    }),
  };

  const edgeVariants: Variants = {
    hidden: { opacity: 0, pathLength: 0 },
    show: (custom: number) => ({
      opacity: 1,
      pathLength: 1,
      transition: {
        delay: custom,
        duration: 0.6,
        ease: 'easeOut',
      },
    }),
  };

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-white overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(1200px 600px at 15% -10%, rgba(56, 189, 248, 0.22), transparent 60%), radial-gradient(900px 500px at 85% 0%, rgba(167, 139, 250, 0.22), transparent 55%), radial-gradient(700px 700px at 50% 80%, rgba(16, 185, 129, 0.18), transparent 55%), linear-gradient(180deg, #05070d 0%, #0b1020 55%, #05070d 100%)',
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
        className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(56,189,248,0.35),transparent_60%)] blur-3xl"
        animate={shouldReduceMotion ? undefined : { opacity: [0.6, 0.9, 0.6], scale: [1, 1.05, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute top-48 right-[-120px] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(244,114,182,0.35),transparent_60%)] blur-3xl"
        animate={shouldReduceMotion ? undefined : { opacity: [0.45, 0.75, 0.45], scale: [1.05, 1, 1.05] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="w-full border-b border-white/5 bg-slate-950/40 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 rounded-lg bg-cyan-500/30 blur" aria-hidden />
                  <div className="w-9 h-9 bg-white/90 text-slate-950 rounded-lg flex items-center justify-center shadow-lg">
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
          <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70">
                <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
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
                  className="group inline-flex items-center justify-center gap-3 rounded-full bg-white text-slate-950 px-8 py-4 text-base font-semibold shadow-[0_16px_40px_rgba(15,23,42,0.35)] transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                >
                  Start Exploring
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-4 text-base font-medium text-white/80 transition hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                >
                  View Pricing
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-sm text-white/60">
                {premiumHighlights.map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10">
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
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => {
                setIsHovering(false);
                handlePointerLeave();
              }}
            >
              <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-white/10 via-white/5 to-transparent border border-white/10" aria-hidden />
              <motion.div
                className="relative rounded-[32px] bg-slate-950/60 border border-white/10 p-8 sm:p-10 overflow-hidden"
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
                  <motion.div
                    className="absolute inset-0 rounded-3xl border border-white/5 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.2),transparent_60%),radial-gradient(circle_at_70%_70%,rgba(14,165,233,0.2),transparent_55%)]"
                    animate={
                      shouldReduceMotion
                        ? undefined
                        : {
                            rotateZ: [0, 2, 0],
                            scale: [1, 1.01, 1],
                          }
                    }
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                  />

                  <motion.svg
                    className="absolute inset-0 h-full w-full"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    initial="hidden"
                    animate="show"
                  >
                    <defs>
                      <linearGradient id="branchGlow" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="rgba(56,189,248,0.65)" />
                        <stop offset="100%" stopColor="rgba(167,139,250,0.35)" />
                      </linearGradient>
                    </defs>
                    {heroEdges.map((edge) => {
                      const fromNode = nodeById.get(edge.from);
                      const toNode = nodeById.get(edge.to);
                      if (!fromNode || !toNode) return null;
                      const edgeDelay = shouldReduceMotion ? 0 : (toNode.depth + 0.5) * 0.18;
                      return (
                        <motion.line
                          key={`${edge.from}-${edge.to}`}
                          x1={fromNode.x}
                          y1={fromNode.y}
                          x2={toNode.x}
                          y2={toNode.y}
                          stroke="url(#branchGlow)"
                          strokeWidth="0.7"
                          strokeOpacity={edge.opacity}
                          variants={edgeVariants}
                          custom={edgeDelay}
                        />
                      );
                    })}
                  </motion.svg>

                  {heroNodes.map((node, index) => (
                    <motion.div
                      key={node.id}
                      className="absolute"
                      style={{
                        top: `${node.y}%`,
                        left: `${node.x}%`,
                        transform: `translate(-50%, -50%) translateZ(${node.z}px)`,
                      }}
                      variants={nodeVariants}
                      initial="hidden"
                      animate="show"
                      custom={shouldReduceMotion ? 0 : node.depth * 0.18}
                      transition={
                        shouldReduceMotion
                          ? undefined
                          : {
                              delay: node.depth * 0.18,
                              duration: 0.6,
                              ease: 'easeOut',
                            }
                      }
                    >
                      <motion.div
                        className="relative"
                        style={{ height: node.size, width: node.size }}
                        animate={
                          shouldReduceMotion
                            ? undefined
                            : {
                                y: [0, -6, 0],
                                opacity: [0.8, 1, 0.8],
                              }
                        }
                        transition={{ duration: 5 + index, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <div
                          className={`absolute inset-0 rounded-full bg-gradient-to-br ${node.glow} blur`}
                          aria-hidden
                        />
                        <div className="absolute inset-0 rounded-full bg-white/80 shadow-[0_0_18px_rgba(255,255,255,0.4)]" />
                      </motion.div>
                    </motion.div>
                  ))}

                  <div className="absolute inset-x-6 bottom-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur px-5 py-4">
                    <div className="flex items-center justify-between text-xs text-white/60">
                      <span>Depth tree</span>
                      <span>{isHovering && !shouldReduceMotion ? 'Branch focus' : 'Ambient focus'}</span>
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className="h-full w-2/3 rounded-full bg-gradient-to-r from-cyan-400/80 to-indigo-400/80"
                        animate={
                          shouldReduceMotion
                            ? undefined
                            : {
                                x: ['-20%', '0%', '-20%'],
                              }
                        }
                        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    </div>
                  </div>
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
                  className="group relative rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_40px_rgba(15,23,42,0.35)] backdrop-blur"
                  whileHover={shouldReduceMotion ? undefined : { y: -6 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                >
                  <div
                    className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    aria-hidden
                  />
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 border border-white/15 shadow-inner">
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
            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-10 sm:p-16 shadow-[0_30px_60px_rgba(15,23,42,0.45)]">
              <div className="absolute -top-20 -right-24 h-48 w-48 rounded-full bg-cyan-500/30 blur-3xl" aria-hidden />
              <div className="absolute -bottom-24 left-12 h-56 w-56 rounded-full bg-indigo-500/30 blur-3xl" aria-hidden />
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
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-slate-950 px-8 py-4 text-base font-semibold shadow-[0_18px_40px_rgba(15,23,42,0.4)] transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                  >
                    Start Exploring
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-4 text-base font-medium text-white/80 transition hover:text-white hover:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                  >
                    Compare Plans
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 py-12 px-4 sm:px-6 lg:px-8 bg-slate-950/40 backdrop-blur">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/90 rounded-lg flex items-center justify-center text-slate-950">
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
