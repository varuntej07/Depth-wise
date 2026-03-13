import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Network } from 'lucide-react';

const SEED_TOPICS = [
  'quantum-mechanics',
  'machine-learning',
  'stoicism',
  'history-of-rome',
  'evolution',
  'javascript',
  'economics',
  'climate-change',
  'consciousness',
  'blockchain',
  'game-theory',
  'philosophy-of-mind',
  'world-war-2',
  'astrophysics',
  'immunology',
  'democracy',
  'thermodynamics',
  'calculus',
  'cognitive-biases',
  'ancient-greece',
] as const;

function toTitle(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function toDescription(slug: string): string {
  const title = toTitle(slug);
  return `Depthwise reveals ${title} as a branching knowledge tree — each concept connects to its causes, implications, and real-world examples. Start with a question and go as deep as you want.`;
}

export function generateStaticParams() {
  return SEED_TOPICS.map((topic) => ({ topic }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topic: string }>;
}): Promise<Metadata> {
  const { topic } = await params;
  const title = toTitle(topic);
  const description = toDescription(topic);

  return {
    title: `Explore ${title}`,
    description,
    alternates: { canonical: `https://depthwise.app/explore/${topic}` },
    openGraph: {
      title: `Explore ${title} – Depthwise`,
      description,
      url: `https://depthwise.app/explore/${topic}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Explore ${title} – Depthwise`,
      description,
    },
  };
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  const title = toTitle(topic);
  const description = toDescription(topic);

  return (
    <div className="min-h-screen bg-[var(--mint-page)] text-white">
      {/* Background */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            'radial-gradient(1200px 600px at 15% -10%, rgba(110,231,183,0.15), transparent 60%), linear-gradient(180deg,#050D0B 0%,#0D1A16 55%,#050D0B 100%)',
        }}
      />

      <div className="relative z-10">
        {/* Nav */}
        <nav className="w-full border-b border-[var(--mint-elevated)] bg-[rgba(13,26,22,0.7)] backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16 gap-3">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[image:var(--mint-accent-gradient)] text-[#04120e] rounded-lg flex items-center justify-center shadow-lg">
                  <Network className="w-4 h-4" />
                </div>
                <span className="text-lg font-semibold tracking-tight">Depthwise</span>
              </Link>
            </div>
          </div>
        </nav>

        {/* Content */}
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <p className="text-sm uppercase tracking-[0.25em] text-white/50 mb-4">
            Topic Explorer
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold leading-tight tracking-tight mb-6">
            {title}
          </h1>
          <p className="text-lg text-white/70 leading-relaxed mb-10">
            {description}
          </p>

          <div className="rounded-2xl border border-[var(--mint-elevated)] bg-[rgba(13,26,22,0.72)] p-6 mb-10">
            <p className="text-sm text-white/50 mb-3">What Depthwise reveals about {title}:</p>
            <ul className="space-y-2 text-white/80 text-sm">
              <li>• The core concepts and how they connect</li>
              <li>• Historical context and key milestones</li>
              <li>• Practical applications and real-world implications</li>
              <li>• Common misconceptions and clarifications</li>
              <li>• Related fields and adjacent ideas</li>
            </ul>
          </div>

          <Link
            href={`/explore?q=${encodeURIComponent(title)}`}
            className="inline-flex items-center justify-center gap-3 rounded-full bg-[image:var(--mint-accent-gradient)] text-[#04120e] px-8 py-4 text-base font-semibold shadow-[0_16px_40px_var(--mint-accent-glow)] transition-transform duration-300 hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mint-accent-2)]"
          >
            Start Exploring {title}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </main>
      </div>
    </div>
  );
}
