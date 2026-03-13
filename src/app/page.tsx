'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
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
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Scramble util 
const SCRAMBLE_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789@#$%&';
const rsc = () => SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];

/**
 * ScrambleText — resolves characters left-to-right from scrambled noise.
 * Set `loopPeriod` to re-scramble on the same period as the tree loop.
 * Set `fadeIn` to start opacity-0 and transition in when scramble begins.
 */
function ScrambleText({
  text,
  startDelay,
  scrambleDuration = 0.7,
  loopPeriod,
  className,
  fadeIn = false,
  skip = false,
}: {
  text: string;
  startDelay: number;
  scrambleDuration?: number;
  loopPeriod?: number;
  className?: string;
  fadeIn?: boolean;
  skip?: boolean;
}) {
  const [chars, setChars] = useState<string[] | null>(null);
  const [visible, setVisible] = useState(!fadeIn);
  const frameRef = useRef<number>(0);
  const nextRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const tc = text.split('');
    if (skip) { setChars(tc); setVisible(true); return; }

    const runScramble = () => {
      setChars(tc.map((c) => (c === ' ' ? ' ' : rsc())));
      let t0: number | null = null;
      cancelAnimationFrame(frameRef.current);
      const tick = (ts: number) => {
        if (!t0) t0 = ts;
        const p = Math.min((ts - t0) / 1000 / scrambleDuration, 1);
        const r = Math.floor(p * tc.length);
        setChars(tc.map((c, i) => (c === ' ' ? ' ' : i < r ? c : rsc())));
        if (p < 1) {
          frameRef.current = requestAnimationFrame(tick);
        } else {
          setChars(tc);
          if (loopPeriod) {
            nextRef.current = setTimeout(runScramble, (loopPeriod - scrambleDuration) * 1000);
          }
        }
      };
      frameRef.current = requestAnimationFrame(tick);
    };

    const first = setTimeout(() => { if (fadeIn) setVisible(true); runScramble(); }, startDelay * 1000);
    return () => { clearTimeout(first); if (nextRef.current) clearTimeout(nextRef.current); cancelAnimationFrame(frameRef.current); };
  }, [text, startDelay, scrambleDuration, loopPeriod, fadeIn, skip]);

  return (
    <span className={`${className ?? ''}${fadeIn ? ` transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}` : ''}`}>
      {(chars ?? text.split('')).join('')}
    </span>
  );
}

// Tree data 
// Each element has its own delay = sequence * treeLoopStepSeconds.
// Edges appear 0.06s before their destination node.
// With treePhaseSeconds=15 and times [0, 0.05, 0.938, 1]:
//   - each node fades in over 0.75s, holds for ~12.2s, fades out over 0.93s
//   - total cycle: 15s + 1s repeatDelay = 16s

const treeLoopStepSeconds = 0.22;   // stagger between each node
const treePhaseSeconds    = 15.0;   // duration of each element's own animation
const treeRepeatDelay     = 1.0;    // silence between loops

type HeroNode = {
  id: string;
  x: number;       // % of container width
  y: number;       // % of container height
  depth: number;
  sequence: number; // order of appearance (0 = root)
  parentId?: string;
  title: string;
  subtitle: string;
  detail?: string;
};

type HeroEdge = { id: string; from: HeroNode; to: HeroNode };

const heroNodes: HeroNode[] = [
  { id: 'root', x: 50, y: 14, depth: 0, sequence: 0, title: 'How does gravity work?',  subtitle: 'Mass warps spacetime; objects follow those curves naturally', detail: '9.8 m/s² at Earth\'s surface' },
  { id: 'c1',   x: 20, y: 44, depth: 1, sequence: 1, parentId: 'root', title: 'Spacetime Curvature',  subtitle: 'A massive object bends the fabric of space and time around it', detail: 'Confirmed: 1919 solar eclipse' },
  { id: 'c2',   x: 50, y: 44, depth: 1, sequence: 2, parentId: 'root', title: 'Newton vs Einstein',   subtitle: 'Newton saw a pulling force; Einstein saw curved geometry',      detail: 'Both hold at different scales' },
  { id: 'c3',   x: 80, y: 44, depth: 1, sequence: 3, parentId: 'root', title: 'Why Do Things Fall?',  subtitle: 'Objects follow straight paths through curved spacetime',        detail: 'No force needed — just geometry' },
  { id: 'g1',   x: 38, y: 78, depth: 2, sequence: 4, parentId: 'c2',   title: 'Terminal Velocity',    subtitle: 'Air drag grows until it equals gravitational pull',            detail: '~56 m/s for a skydiver' },
  { id: 'g2',   x: 62, y: 78, depth: 2, sequence: 5, parentId: 'c2',   title: 'g = 9.8 m/s²',        subtitle: 'Earth pulls all objects equally, regardless of their mass',    detail: 'Varies ±0.5% across Earth' },
];

const heroNodeById = new Map(heroNodes.map((n) => [n.id, n]));
const heroEdges: HeroEdge[] = heroNodes
  .filter((n) => n.parentId)
  .flatMap((n) => {
    const from = heroNodeById.get(n.parentId!);
    if (!from) return [];
    return [{ id: `${from.id}-${n.id}`, from, to: n }];
  });

// Node half-heights in viewBox % units (container h≈420px at sm)
function nodeHalfH(depth: number) {
  if (depth === 0) return 12.0;
  if (depth === 1) return 10.5;
  return 9.0;
}

function buildPath(from: HeroNode, to: HeroNode) {
  const fx = from.x, fy = from.y + nodeHalfH(from.depth);
  const tx = to.x,   ty = to.y   - nodeHalfH(to.depth);
  const my = (fy + ty) / 2;
  // Slight S-curve for vertical paths so the center edge is visible
  const offset = fx === tx ? 5 : 0;
  return `M ${fx} ${fy} C ${fx + offset} ${my}, ${tx - offset} ${my}, ${tx} ${ty}`;
}

function nodeSizeClass(depth: number) {
  if (depth === 0) return 'w-[148px] h-[88px] sm:w-[190px] sm:h-[100px]';
  if (depth === 1) return 'w-[120px] h-[78px] sm:w-[158px] sm:h-[88px]';
  return 'w-[108px] h-[70px] sm:w-[140px] sm:h-[76px]';
}

//  Feature / highlights data 
const featureCards = [
  { title: 'Instant Clarity',  description: 'Ask a question. Depthwise answers and scaffolds the next layer instantly.', icon: Zap },
  { title: 'Branching Depth',  description: 'Each response unfolds into a tree of follow-ups so you explore deeper without losing context.', icon: Network },
  { title: 'Guided Insight',   description: 'Claude-powered explanations with clear summaries and just-right depth.', icon: Brain },
  { title: 'Share the Tree',   description: 'Send a single link and bring others into the same knowledge map.', icon: Share2 },
];

const premiumHighlights = [
  { title: 'Layered Thinking', description: 'Zoom from overview to detail with a smooth, depth-aware hierarchy.', icon: Layers },
  { title: 'Ambient Focus',    description: 'A calm, cinematic workspace that keeps complex topics readable.', icon: Sparkles },
  { title: 'Private By Default', description: 'Your research stays yours until you choose to share it.', icon: ShieldCheck },
];

const line1Words = 'Ask once. Explore in layers.'.split(' ');

// Page Component 
export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const year = useMemo(() => new Date().getFullYear(), []);

  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rotateX = useTransform(tiltY, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(tiltX, [-0.5, 0.5], [-12, 12]);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'authenticated') router.push('/explore');
  }, [status, router]);

  // GSAP only for scroll-triggered sections
  useGSAP(
    () => {
      if (shouldReduceMotion) return;
      gsap.from('.highlight-card', {
        scrollTrigger: { trigger: '.highlights-section', start: 'top 78%' },
        opacity: 0, y: 44, duration: 0.65, stagger: 0.13, ease: 'power2.out',
      });
      gsap.from('.feature-card', {
        scrollTrigger: { trigger: '.feature-section', start: 'top 75%' },
        opacity: 0, y: 48, duration: 0.6, stagger: 0.12, ease: 'power2.out',
      });
      gsap.from('.cta-inner', {
        scrollTrigger: { trigger: '.cta-section', start: 'top 80%' },
        opacity: 0, y: 32, duration: 0.7, ease: 'power2.out',
      });
    },
    { scope: containerRef },
  );

  if (status === 'loading') {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[var(--mint-page)]">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  const handlePointerMove = (e: MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) return;
    const r = e.currentTarget.getBoundingClientRect();
    tiltX.set((e.clientX - r.left) / r.width - 0.5);
    tiltY.set((e.clientY - r.top) / r.height - 0.5);
  };
  const handlePointerLeave = () => { tiltX.set(0); tiltY.set(0); };

  return (
    <div ref={containerRef} className="relative min-h-screen w-full bg-[var(--mint-page)] text-white overflow-hidden">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(1200px 600px at 15% -10%, rgba(110,231,183,0.2), transparent 60%), radial-gradient(900px 500px at 85% 0%, rgba(16,185,129,0.18), transparent 55%), radial-gradient(700px 700px at 50% 80%, rgba(52,211,153,0.16), transparent 55%), linear-gradient(180deg,#050D0B 0%,#0D1A16 55%,#050D0B 100%)' }} />
      <div className="pointer-events-none absolute inset-0 opacity-25 mix-blend-soft-light" style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='0.4'/></svg>\")" }} />
      <motion.div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(110,231,183,0.3),transparent_60%)] blur-3xl" animate={shouldReduceMotion ? undefined : { opacity: [0.6, 0.9, 0.6], scale: [1, 1.05, 1] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="pointer-events-none absolute top-48 right-[-120px] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.28),transparent_60%)] blur-3xl" animate={shouldReduceMotion ? undefined : { opacity: [0.45, 0.75, 0.45], scale: [1.05, 1, 1.05] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }} />

      <div className="relative z-10">
        {/* Nav */}
        <nav className="w-full border-b border-[var(--mint-elevated)] bg-[rgba(13,26,22,0.7)] backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 rounded-lg bg-[rgba(16,185,129,0.16)] blur" aria-hidden />
                  <div className="w-9 h-9 bg-[image:var(--mint-accent-gradient)] text-[#04120e] rounded-lg flex items-center justify-center shadow-lg"><Network className="w-5 h-5" /></div>
                </div>
                <span className="text-xl font-semibold tracking-tight">Depthwise</span>
              </div>
              <div className="flex items-center gap-5 text-sm">{session ? <UserMenu /> : <SignInButton />}</div>
            </div>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section className="pt-20 sm:pt-28 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-12 items-center">

            {/* Left: text */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.1] tracking-tight">
                  {/* Line 1 — word-by-word clip reveal via framer-motion */}
                  <span className="flex flex-wrap gap-x-[0.25em]">
                    {line1Words.map((word, i) => (
                      <span key={i} className="inline-block overflow-hidden" style={{ verticalAlign: 'bottom' }}>
                        <motion.span
                          className="inline-block"
                          initial={shouldReduceMotion ? false : { y: '105%', opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ duration: 0.55, delay: 0.05 + i * 0.11, ease: [0.33, 1, 0.68, 1] }}
                        >
                          {word}
                        </motion.span>
                      </span>
                    ))}
                  </span>
                  {/* Line 2 — scramble decode, starts while line 1 is still mid-reveal */}
                  <span className="block text-white/70 mt-1">
                    <ScrambleText
                      text="Depthwise grows your knowledge like a living tree."
                      startDelay={0.45}
                      scrambleDuration={1.15}
                      fadeIn
                      skip={shouldReduceMotion ?? false}
                    />
                  </span>
                </h1>

                <motion.p
                  className="hero-subtext text-base sm:text-lg text-white/70 max-w-xl"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 1.45 }}
                >
                  Ask a question and get a clear answer plus a set of next-step branches. Dive deeper node by node and keep every insight connected. depthwise.app
                </motion.p>
              </div>

              <motion.div
                className="hero-cta flex flex-col sm:flex-row sm:items-center gap-4"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.45, delay: 1.75 }}
              >
                <Link href="/explore" className="group inline-flex items-center justify-center gap-3 rounded-full bg-[image:var(--mint-accent-gradient)] text-[#04120e] px-8 py-4 text-base font-semibold shadow-[0_16px_40px_var(--mint-accent-glow)] transition-transform duration-300 hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mint-accent-2)]">
                  Start Exploring
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </motion.div>
            </div>

            {/* Right: tree — no border box, floats on dark bg, starts simultaneously */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.85, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              onMouseMove={handlePointerMove}
              onMouseLeave={handlePointerLeave}
            >
              <motion.div className="relative" style={{ perspective: '1200px' }}>
                <motion.div
                  className="relative h-[340px] sm:h-[420px] overflow-hidden"
                  style={{
                    rotateX: shouldReduceMotion ? 0 : rotateX,
                    rotateY: shouldReduceMotion ? 0 : rotateY,
                    transformStyle: 'preserve-3d',
                  }}
                  transition={{ type: 'spring', stiffness: 140, damping: 20 }}
                >
                  {/* Ambient glow, no borders */}
                  <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 55% at 50% 35%, rgba(16,185,129,0.1), transparent 70%)' }} />

                  {/* Edges */}
                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {heroEdges.map((edge) => {
                      const edgeDelay = shouldReduceMotion ? 0 : Math.max(0, edge.to.sequence * treeLoopStepSeconds - 0.06);
                      return (
                        <motion.path
                          key={edge.id}
                          d={buildPath(edge.from, edge.to)}
                          stroke="rgba(110,231,183,0.65)"
                          strokeWidth="0.62"
                          strokeLinecap="round"
                          fill="none"
                          initial={{ opacity: 0, pathLength: 0 }}
                          animate={shouldReduceMotion ? { opacity: 0.55, pathLength: 1 } : { opacity: [0, 0.68, 0.68, 0], pathLength: [0, 1, 1, 0] }}
                          transition={shouldReduceMotion ? undefined : {
                            duration: treePhaseSeconds,
                            times: [0, 0.05, 0.938, 1],
                            delay: edgeDelay,
                            repeat: Infinity,
                            repeatDelay: treeRepeatDelay,
                            ease: 'easeInOut',
                          }}
                        />
                      );
                    })}
                  </svg>

                  {/* Nodes */}
                  {heroNodes.map((node) => {
                    const nodeDelay = shouldReduceMotion ? 0 : node.sequence * treeLoopStepSeconds;
                    const sc = nodeSizeClass(node.depth);
                    return (
                      <motion.div
                        key={node.id}
                        className="absolute"
                        style={{ top: `${node.y}%`, left: `${node.x}%`, transform: 'translate(-50%,-50%)' }}
                      >
                        <motion.div
                          className={`${sc} rounded-xl border border-[var(--mint-accent-2)]/55 bg-[rgba(13,26,22,0.92)] shadow-[0_10px_24px_rgba(5,13,11,0.58)] flex flex-col p-2.5 sm:p-3`}
                          initial={{ opacity: 0, scale: 0.93, y: 6 }}
                          animate={shouldReduceMotion ? { opacity: 0.95, scale: 1, y: 0 } : { opacity: [0.12, 0.96, 0.96, 0.2], scale: [0.93, 1, 1, 0.96], y: [6, 0, 0, 4] }}
                          transition={shouldReduceMotion ? undefined : {
                            duration: treePhaseSeconds,
                            times: [0, 0.05, 0.938, 1],
                            delay: nodeDelay,
                            repeat: Infinity,
                            repeatDelay: treeRepeatDelay,
                            ease: 'easeInOut',
                          }}
                        >
                          {/* Title — scramble-decoded on each loop */}
                          <p className="text-[10px] sm:text-[11px] font-semibold text-white/92 leading-tight truncate">
                            <ScrambleText
                              text={node.title}
                              startDelay={nodeDelay}
                              scrambleDuration={0.65}
                              loopPeriod={treePhaseSeconds + treeRepeatDelay}
                              skip={shouldReduceMotion ?? false}
                            />
                          </p>
                          {/* Subtitle — wraps to 2 lines for context */}
                          <p className="text-[8px] sm:text-[8.5px] text-white/50 leading-tight mt-1 line-clamp-2">
                            {node.subtitle}
                          </p>
                          {/* Fact line pinned to bottom */}
                          {node.detail && (
                            <p className="mt-auto pt-1 text-[7px] sm:text-[7.5px] font-medium text-[var(--mint-accent-3)] truncate">
                              {node.detail}
                            </p>
                          )}
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* Premium Highlights */}
        <section className="highlights-section pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {premiumHighlights.map((item) => (
                <div key={item.title} className="highlight-card group relative rounded-2xl border border-[var(--mint-elevated)] bg-[rgba(13,26,22,0.72)] p-6 overflow-hidden backdrop-blur-sm hover:border-[rgba(16,185,129,0.45)] transition-colors duration-300 cursor-default hover:-translate-y-1 transition-transform">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[rgba(16,185,129,0.13)] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" aria-hidden />
                  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[rgba(110,231,183,0.55)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden />
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.22)] shadow-[0_0_18px_rgba(16,185,129,0.1)] group-hover:bg-[rgba(16,185,129,0.18)] group-hover:shadow-[0_0_24px_rgba(16,185,129,0.22)] transition-all duration-300">
                    <item.icon className="w-5 h-5 text-[rgba(110,231,183,0.92)]" />
                  </div>
                  <p className="mt-4 font-semibold text-white/95 tracking-tight">{item.title}</p>
                  <p className="mt-1.5 text-sm text-white/55 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Section */}
        <section className="feature-section py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-white/50">Built for depth</p>
                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-3">
                  A premium research workspace,
                  <span className="block text-white/60">designed for clarity and speed.</span>
                </h2>
              </div>
              <p className="text-base text-white/60 max-w-xl">Every interaction is tuned for flow, from instant graph generation to polished sharing, so you stay in momentum.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featureCards.map((feature) => (
                <div key={feature.title} className="feature-card group relative rounded-2xl border border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.35)] p-6 shadow-[0_20px_40px_rgba(5,13,11,0.45)] backdrop-blur hover:-translate-y-1.5 transition-transform duration-200">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[rgba(16,185,129,0.16)] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden />
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(32,52,45,0.38)] border border-[var(--mint-elevated)] shadow-inner">
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm text-white/65">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="cta-inner relative overflow-hidden rounded-[32px] border border-[var(--mint-elevated)] bg-[rgba(13,26,22,0.75)] p-10 sm:p-16 shadow-[0_30px_60px_rgba(5,13,11,0.5)]">
              <div className="absolute -top-20 -right-24 h-48 w-48 rounded-full bg-[rgba(16,185,129,0.16)] blur-3xl" aria-hidden />
              <div className="absolute -bottom-24 left-12 h-56 w-56 rounded-full bg-[rgba(16,185,129,0.16)] blur-3xl" aria-hidden />
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-white/50">Ready to explore</p>
                  <h3 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">Turn curiosity into a living map.</h3>
                  <p className="mt-4 text-base text-white/65 max-w-xl">Start with a single question. Depthwise keeps every branch organized, visual, and instantly shareable.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/explore" className="inline-flex items-center justify-center gap-2 rounded-full bg-[image:var(--mint-accent-gradient)] text-[#04120e] px-8 py-4 text-base font-semibold shadow-[0_18px_40px_var(--mint-accent-glow)] transition-transform duration-300 hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mint-accent-2)]">
                    Start Exploring <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/pricing" className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.35)] px-8 py-4 text-base font-medium text-[var(--mint-text-secondary)] transition hover:text-white hover:border-[var(--mint-accent-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mint-accent-glow)]">
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
              <div className="w-8 h-8 bg-[image:var(--mint-accent-gradient)] rounded-lg flex items-center justify-center text-[#04120e]"><Network className="w-4 h-4" /></div>
              <span className="text-lg font-semibold">Depthwise</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-white/60">
              <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="/help" className="hover:text-white transition-colors">Help</Link>
              <Link href="https://medium.com/@varuntej07/what-if-learning-looked-like-a-map-instead-of-a-chat-thread-68a354a24ff5" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Blog</Link>
            </div>
            <div className="text-sm text-white/40">&copy; {year} Depthwise</div>
          </div>
        </footer>
      </div>
    </div>
  );
}
