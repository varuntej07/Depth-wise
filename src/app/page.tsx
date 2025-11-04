'use client';

import { useState, useEffect } from 'react';
import SearchBar from '@/components/SearchBar';
import KnowledgeCanvas from '@/components/KnowledgeCanvas';
import ErrorAlert from '@/components/ErrorAlert';
import useGraphStore from '@/store/graphStore';
import { SignInButton } from '@/components/auth/SignInButton';
import { UserMenu } from '@/components/auth/UserMenu';
import { useSession } from 'next-auth/react';
import { ChatSidebar } from '@/components/Sidebar';

export default function Home() {
  const { error, setError, nodes } = useGraphStore();
  const { data: session, status } = useSession();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  return (
    <div className="h-screen w-screen flex bg-slate-950 relative overflow-hidden">
      {/* Animated Grid Background */}
      <div className="fixed inset-0 bg-grid-pattern opacity-20 pointer-events-none"></div>
      <div className="fixed inset-0 bg-gradient-to-br from-cyan-950/20 via-slate-950 to-violet-950/20 pointer-events-none"></div>

      {/* Glowing orbs */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-slow pointer-events-none"></div>
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse-slow delay-1000 pointer-events-none"></div>

      {/* Sidebar */}
      <ChatSidebar isCollapsed={sidebarCollapsed} onToggleCollapse={toggleSidebar} onNewChat={() => {}} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative z-10 md:ml-0 transition-all duration-300" style={{
        marginLeft: typeof window !== 'undefined' && window.innerWidth >= 768 ? (sidebarCollapsed ? '64px' : '280px') : '0'
      }}>
        {/* Header */}
        <header className="w-full border-b border-cyan-500/20 bg-slate-900/50 backdrop-blur-xl h-16 flex-shrink-0">
          <div className="h-full px-4 sm:px-6 flex items-center justify-end">
            <nav className="flex items-center gap-2 sm:gap-4">
              {status === 'loading' ? (
                <div className="w-8 h-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin"></div>
              ) : session ? (
                <UserMenu />
              ) : (
                <SignInButton />
              )}
            </nav>
          </div>
        </header>

        {/* Canvas */}
        <main className="flex-1 relative overflow-hidden">
          {nodes.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-4xl px-4 sm:px-6">
                <SearchBar />
              </div>
            </div>
          ) : (
            <>
              <SearchBar isCompact={true} />
              <KnowledgeCanvas />
            </>
          )}
        </main>

        {/* Error Alert */}
        {error && <ErrorAlert message={error} onClose={() => setError(null)} />}
      </div>
    </div>
  );
}
