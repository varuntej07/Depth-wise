'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef } from 'react';
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
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import HeroTreeAnimation from '@/components/HeroTreeAnimation';

gsap.registerPlugin(useGSAP, ScrollTrigger);


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

const line1Words = 'Ask once. Explore in layers.'.split(' ');
const line2Words = 'Depthwise grows your knowledge like a living tree.'.split(' ');

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const year = useMemo(() => new Date().getFullYear(), []);

  const containerRef = useRef<HTMLDivElement>(null);
  const heroGraphicRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/explore');
    }
  }, [status, router]);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.from('.hero-badge', { opacity: 0, y: 20, duration: 0.5 })
        .from('.hero-word', { opacity: 0, y: 40, duration: 0.55, stagger: 0.055 }, '-=0.15')
        .from('.hero-subtext', { opacity: 0, y: 22, duration: 0.55 }, '-=0.3')
        .from('.hero-cta > *', { opacity: 0, scale: 0.95, y: 12, duration: 0.45, stagger: 0.09 }, '-=0.3');

      gsap.from(heroGraphicRef.current, {
        opacity: 0,
        x: 70,
        duration: 0.9,
        ease: 'power3.out',
        delay: 0.3,
      });

      gsap.from('.highlight-card', {
        scrollTrigger: {
          trigger: '.highlights-section',
          start: 'top 78%',
        },
        opacity: 0,
        y: 44,
        duration: 0.65,
        stagger: 0.13,
        ease: 'power2.out',
      });

      gsap.from('.feature-card', {
        scrollTrigger: {
          trigger: '.feature-section',
          start: 'top 75%',
        },
        opacity: 0,
        y: 48,
        duration: 0.6,
        stagger: 0.12,
        ease: 'power2.out',
      });

      gsap.from('.cta-inner', {
        scrollTrigger: {
          trigger: '.cta-section',
          start: 'top 80%',
        },
        opacity: 0,
        y: 32,
        duration: 0.7,
        ease: 'power2.out',
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

  return (
    <div ref={containerRef} className="relative min-h-screen w-full bg-[var(--mint-page)] text-white overflow-hidden">
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
        animate={{ opacity: [0.6, 0.9, 0.6], scale: [1, 1.05, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute top-48 right-[-120px] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.28),transparent_60%)] blur-3xl"
        animate={{ opacity: [0.45, 0.75, 0.45], scale: [1.05, 1, 1.05] }}
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
                {session ? <UserMenu /> : <SignInButton />}
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-20 sm:pt-28 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.1] tracking-tight">
                  <span className="flex flex-wrap gap-x-[0.25em]">
                    {line1Words.map((word, i) => (
                      <span key={i} className="hero-word inline-block">{word}</span>
                    ))}
                  </span>
                  <span className="flex flex-wrap gap-x-[0.25em] text-white/70 mt-1">
                    {line2Words.map((word, i) => (
                      <span key={i} className="hero-word inline-block">{word}</span>
                    ))}
                  </span>
                </h1>
                <p className="hero-subtext text-base sm:text-lg text-white/70 max-w-xl">
                  Ask a question and get a clear answer plus a set of next-step branches. Dive deeper node by node and
                  keep every insight connected. depthwise.app
                </p>
              </div>

              <div className="hero-cta flex flex-col sm:flex-row sm:items-center gap-4">
                <Link
                  href="/explore"
                  className="group inline-flex items-center justify-center gap-3 rounded-full bg-[image:var(--mint-accent-gradient)] text-[#04120e] px-8 py-4 text-base font-semibold shadow-[0_16px_40px_var(--mint-accent-glow)] transition-transform duration-300 hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mint-accent-2)]"
                >
                  Start Exploring
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            <div ref={heroGraphicRef} className="relative rounded-[32px] bg-[rgba(13,26,22,0.72)] border border-[var(--mint-elevated)] p-6 sm:p-7 overflow-hidden">
              <HeroTreeAnimation />
            </div>
          </div>
        </section>

        {/* Premium Highlights — full-width, centered 3-column */}
        <section className="highlights-section pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {premiumHighlights.map((item, i) => (
                <div
                  key={item.title}
                  className="highlight-card group relative rounded-2xl border border-[var(--mint-elevated)] bg-[rgba(13,26,22,0.72)] p-6 overflow-hidden backdrop-blur-sm hover:border-[rgba(16,185,129,0.45)] transition-colors duration-300 cursor-default hover:-translate-y-1 transition-transform"
                >
                  <div
                    className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[rgba(16,185,129,0.13)] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    aria-hidden
                  />
                  <div
                    className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[rgba(110,231,183,0.55)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    aria-hidden
                  />
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
              <p className="text-base text-white/60 max-w-xl">
                Every interaction is tuned for flow, from instant graph generation to polished sharing, so you stay in
                momentum.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featureCards.map((feature) => (
                <div
                  key={feature.title}
                  className="feature-card group relative rounded-2xl border border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.35)] p-6 shadow-[0_20px_40px_rgba(5,13,11,0.45)] backdrop-blur hover:-translate-y-1.5 transition-transform duration-200"
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
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="cta-inner relative overflow-hidden rounded-[32px] border border-[var(--mint-elevated)] bg-[rgba(13,26,22,0.75)] p-10 sm:p-16 shadow-[0_30px_60px_rgba(5,13,11,0.5)]">
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
              <Link
                href="https://medium.com/@varuntej07/what-if-learning-looked-like-a-map-instead-of-a-chat-thread-68a354a24ff5"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Blog
              </Link>
            </div>
            <div className="text-sm text-white/40">&copy; {year} Depthwise</div>
          </div>
        </footer>
      </div>
    </div>
  );
}
