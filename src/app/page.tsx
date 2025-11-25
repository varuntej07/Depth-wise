'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SignInButton } from '@/components/auth/SignInButton';
import { UserMenu } from '@/components/auth/UserMenu';
import Link from 'next/link';
import { ArrowRight, Sparkles, Network, Zap, Brain, Share2, Search } from 'lucide-react';

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // If user is already authenticated, redirect to explore page
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/explore');
    }
  }, [status, router]);

  // Show loading state while checking auth
  if (status === 'loading') {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950">
        <div className="text-cyan-400 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-grid-pattern opacity-20 pointer-events-none"></div>
      <div className="fixed inset-0 bg-gradient-to-br from-cyan-950/20 via-slate-950 to-violet-950/20 pointer-events-none"></div>

      {/* Glowing orbs */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-slow pointer-events-none"></div>
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse-slow delay-1000 pointer-events-none"></div>

      {/* Navigation */}
      <nav className="relative z-10 w-full bg-slate-900/50 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-violet-500 rounded-lg flex items-center justify-center">
                <Network className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                Depthwise
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/pricing" className="text-slate-300 hover:text-white transition-colors">
                Pricing
              </Link>
              {session ? <UserMenu /> : <SignInButton />}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm mb-8">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Knowledge Exploration</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Explore Any Topic
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
              Visually & Deeply
            </span>
          </h1>

          <p className="text-xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Transform your curiosity into understanding. Ask any question and watch as an interactive knowledge graph unfolds before your eyes. No documents needed—just ask and explore.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/explore"
              className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 rounded-xl text-white font-semibold text-lg transition-all hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/50"
            >
              Start Exploring
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl text-white font-semibold text-lg transition-all"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Why Choose <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">Depthwise</span>?
            </h2>
            <p className="text-slate-400 text-lg">The fastest way to learn anything</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl hover:border-cyan-500/50 transition-all hover:shadow-lg hover:shadow-cyan-500/10">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">One-Click Exploration</h3>
              <p className="text-slate-400">
                No setup, no documents required. Just ask a question and start exploring instantly. Every answer branches into deeper insights.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl hover:border-violet-500/50 transition-all hover:shadow-lg hover:shadow-violet-500/10">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center mb-4">
                <Network className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Visual Knowledge Graphs</h3>
              <p className="text-slate-400">
                See how concepts connect. Our interactive graphs reveal the structure of knowledge, making complex topics easy to understand.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl hover:border-pink-500/50 transition-all hover:shadow-lg hover:shadow-pink-500/10">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Depth</h3>
              <p className="text-slate-400">
                Powered by Claude, the most advanced AI. Get accurate, nuanced explanations with 3-4 branches of exploration per topic.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl hover:border-cyan-500/50 transition-all hover:shadow-lg hover:shadow-cyan-500/10">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Curiosity-Driven</h3>
              <p className="text-slate-400">
                Follow your curiosity wherever it leads. Click any node to dive deeper, explore tangents, or discover surprising connections.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl hover:border-violet-500/50 transition-all hover:shadow-lg hover:shadow-violet-500/10">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center mb-4">
                <Share2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Share & Collaborate</h3>
              <p className="text-slate-400">
                Share your knowledge graphs with anyone. Perfect for research, teaching, or collaborative learning.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl hover:border-pink-500/50 transition-all hover:shadow-lg hover:shadow-pink-500/10">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Save & Revisit</h3>
              <p className="text-slate-400">
                All your explorations are saved. Pick up where you left off or revisit topics to deepen your understanding.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-500/20 rounded-3xl backdrop-blur-sm">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to Explore?
            </h2>
            <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of curious minds exploring knowledge in a whole new way. Start your first exploration in seconds.
            </p>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 rounded-xl text-white font-semibold text-lg transition-all hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/50"
            >
              Start Exploring Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-violet-500 rounded-lg flex items-center justify-center">
                <Network className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                Depthwise
              </span>
            </div>
            <div className="flex items-center gap-8 text-sm text-slate-400">
              <Link href="/pricing" className="hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="/help" className="hover:text-white transition-colors">
                Help
              </Link>
              <Link href="/learn-more" className="hover:text-white transition-colors">
                Learn More
              </Link>
            </div>
            <div className="text-sm text-slate-500">
              © 2025 Depthwise. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
