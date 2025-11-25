'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SignInButton } from '@/components/auth/SignInButton';
import { UserMenu } from '@/components/auth/UserMenu';
import Link from 'next/link';
import { ArrowRight, Network, Zap, Brain, Share2 } from 'lucide-react';

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/explore');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-black text-white">
      {/* Navigation */}
      <nav className="w-full bg-black border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <Network className="w-5 h-5 text-black" />
              </div>
              <span className="text-xl font-bold text-white">
                Depthwise
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/pricing" className="text-zinc-400 hover:text-white transition-colors text-sm">
                Pricing
              </Link>
              {session ? <UserMenu /> : <SignInButton />}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold mb-8 leading-tight tracking-tight">
            Explore any topic
            <br />
            <span className="text-white">visually</span>
          </h1>

          <p className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto">
            Ask any question and watch as an interactive knowledge graph unfolds. No documents needed.
          </p>

          {/* Single Primary CTA */}
          <Link
            href="/explore"
            className="inline-flex items-center gap-3 px-10 py-5 bg-white text-black font-semibold text-lg rounded-lg transition-all hover:bg-zinc-100 active:scale-95 active:shadow-inner shadow-lg"
          >
            Start Exploring
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-black" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">One Click</h3>
              <p className="text-sm text-zinc-400">
                No setup required. Just ask and explore instantly.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mx-auto mb-4">
                <Network className="w-6 h-6 text-black" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">Visual Graphs</h3>
              <p className="text-sm text-zinc-400">
                See how concepts connect in real-time.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mx-auto mb-4">
                <Brain className="w-6 h-6 text-black" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">AI-Powered</h3>
              <p className="text-sm text-zinc-400">
                Accurate, nuanced explanations powered by Claude.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mx-auto mb-4">
                <Share2 className="w-6 h-6 text-black" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">Share</h3>
              <p className="text-sm text-zinc-400">
                Share your knowledge graphs with anyone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
                <Network className="w-4 h-4 text-black" />
              </div>
              <span className="text-lg font-bold text-white">
                Depthwise
              </span>
            </div>
            <div className="flex items-center gap-8 text-sm text-zinc-400">
              <Link href="/pricing" className="hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="/help" className="hover:text-white transition-colors">
                Help
              </Link>
            </div>
            <div className="text-sm text-zinc-600">
              © 2025 Depthwise
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
