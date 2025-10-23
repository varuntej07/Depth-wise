'use client';

import SearchBar from '@/components/SearchBar';
import KnowledgeCanvas from '@/components/KnowledgeCanvas';
import ErrorAlert from '@/components/ErrorAlert';
import useGraphStore from '@/store/graphStore';

export default function Home() {
  const { error, setError, nodes } = useGraphStore();

  return (
    <div className={`${nodes.length === 0 ? 'min-h-screen' : 'h-screen'} w-screen flex flex-col bg-slate-950 relative`}>
      {/* Animated Grid Background */}
      <div className="fixed inset-0 bg-grid-pattern opacity-20 pointer-events-none"></div>
      <div className="fixed inset-0 bg-gradient-to-br from-cyan-950/20 via-slate-950 to-violet-950/20 pointer-events-none"></div>

      {/* Glowing orbs */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-slow pointer-events-none"></div>
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse-slow delay-1000 pointer-events-none"></div>

      {/* Header */}
      <header className="relative z-10 w-full border-b border-cyan-500/20 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-base sm:text-xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                Knowledge Graph
              </span>
            </div>
            <nav className="flex items-center gap-2 sm:gap-6">
              <button className="hidden sm:block text-slate-400 hover:text-cyan-400 transition-colors text-sm">
                Documentation
              </button>
              <button className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition-all text-xs sm:text-sm">
                Sign In
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Canvas */}
      <main className={`flex-1 relative z-10 ${nodes.length === 0 ? 'overflow-y-auto' : 'overflow-hidden'}`}>
        {nodes.length === 0 ? (
          <div className="flex items-center justify-center min-h-full py-8 sm:py-12">
            <div className="text-center max-w-4xl px-4 sm:px-6">
              {/* Animated Neural Network Icon */}
              <div className="relative mb-12 animate-in fade-in zoom-in duration-1000">
                <div className="w-32 h-32 mx-auto relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full opacity-20 blur-2xl animate-pulse-slow"></div>
                  <svg className="w-32 h-32 relative" viewBox="0 0 100 100" fill="none">
                    {/* Central node */}
                    <circle cx="50" cy="50" r="8" fill="url(#gradient)" className="animate-pulse" />
                    {/* Connecting nodes */}
                    <circle cx="30" cy="30" r="5" fill="url(#gradient)" className="animate-pulse delay-100" />
                    <circle cx="70" cy="30" r="5" fill="url(#gradient)" className="animate-pulse delay-200" />
                    <circle cx="30" cy="70" r="5" fill="url(#gradient)" className="animate-pulse delay-300" />
                    <circle cx="70" cy="70" r="5" fill="url(#gradient)" className="animate-pulse delay-400" />
                    {/* Connection lines */}
                    <line x1="50" y1="50" x2="30" y2="30" stroke="url(#gradient)" strokeWidth="1" opacity="0.5" />
                    <line x1="50" y1="50" x2="70" y2="30" stroke="url(#gradient)" strokeWidth="1" opacity="0.5" />
                    <line x1="50" y1="50" x2="30" y2="70" stroke="url(#gradient)" strokeWidth="1" opacity="0.5" />
                    <line x1="50" y1="50" x2="70" y2="70" stroke="url(#gradient)" strokeWidth="1" opacity="0.5" />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 animate-in fade-in slide-in-from-bottom duration-1000 delay-200">
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                  Explore the Universe
                </span>
                <br />
                <span className="text-white">of Knowledge</span>
              </h1>

              <p className="text-slate-400 text-base sm:text-lg mb-8 sm:mb-12 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom duration-1000 delay-400">
                Ask any question and watch as an interactive neural network unfolds.
                <br className="hidden sm:block" />
                <span className="sm:inline block mt-1 sm:mt-0">Discover connections, dive deeper, and build your understanding.</span>
              </p>

              <div className="mb-8 sm:mb-16 animate-in fade-in duration-1000 delay-600">
                <SearchBar />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="group relative p-4 sm:p-6 rounded-2xl bg-slate-900/50 backdrop-blur-sm border border-cyan-500/20 hover:border-cyan-500/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom duration-1000 delay-800">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Start Simple</h3>
                    <p className="text-slate-400 text-xs sm:text-sm">
                      Begin with high-level concepts and build foundational understanding
                    </p>
                  </div>
                </div>

                <div className="group relative p-4 sm:p-6 rounded-2xl bg-slate-900/50 backdrop-blur-sm border border-violet-500/20 hover:border-violet-500/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom duration-1000 delay-900">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Go Deeper</h3>
                    <p className="text-slate-400 text-xs sm:text-sm">
                      Click any node to explore technical details and dive into complexity
                    </p>
                  </div>
                </div>

                <div className="group relative p-4 sm:p-6 rounded-2xl bg-slate-900/50 backdrop-blur-sm border border-blue-500/20 hover:border-blue-500/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom duration-1000 delay-1000">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Build Your Map</h3>
                    <p className="text-slate-400 text-xs sm:text-sm">
                      Create a visual network of interconnected concepts and insights
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <KnowledgeCanvas />
        )}
      </main>

      {/* Error Alert */}
      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}
    </div>
  );
}
