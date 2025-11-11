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
import { ShareButton } from '@/components/ShareButton';
import { API_ENDPOINTS } from '@/lib/api-config';
import { UsageIndicator } from '@/components/UsageIndicator';

interface ChatItem {
  id: string;
  title: string;
  timestamp: Date;
  isPinned?: boolean;
}

export default function Home() {
  const { error, setError, nodes, sessionId, clearGraph, loadSession } = useGraphStore();
  const { data: session, status } = useSession();
  const [chatHistory, setChatHistory] = useState<ChatItem[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load sidebar state after mount to avoid hydration mismatch
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved) {
      setSidebarCollapsed(JSON.parse(saved));
    }
  }, []);

  // Fetch chat history when user logs in or when sessionId changes
  useEffect(() => {
    if (session?.user) {
      fetchChatHistory();
    }
  }, [session, sessionId]);

  const fetchChatHistory = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.SESSION_LIST);
      if (!response.ok) return;
      const data = await response.json();
      setChatHistory(data.sessions || []);
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
    }
  };

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  const handleNewChat = () => {
    clearGraph();
  };

  const handleSelectChat = async (chatId: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.SESSION_GET(chatId));
      if (!response.ok) throw new Error('Failed to load session');

      const data = await response.json();
      loadSession(data.sessionId, data.rootQuery, data.nodes, data.edges);
    } catch (error) {
      console.error('Error loading session:', error);
      setError('Failed to load chat session');
    }
  };

  return (
    <div className="h-screen w-screen flex bg-slate-950 relative overflow-hidden">
      {/* Animated Grid Background */}
      <div className="fixed inset-0 bg-grid-pattern opacity-20 pointer-events-none"></div>
      <div className="fixed inset-0 bg-gradient-to-br from-cyan-950/20 via-slate-950 to-violet-950/20 pointer-events-none"></div>

      {/* Glowing orbs */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-slow pointer-events-none"></div>
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse-slow delay-1000 pointer-events-none"></div>

      {/* Sidebar */}
      <ChatSidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        onNewChat={handleNewChat}
        chatHistory={chatHistory}
        selectedChatId={sessionId || undefined}
        onSelectChat={handleSelectChat}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col relative z-10 transition-all duration-300 ${
          sidebarCollapsed ? 'md:ml-16' : 'md:ml-[280px]'
        }`}
      >
        {/* Header */}
        <header className="w-full border-b border-cyan-500/20 bg-slate-900/50 backdrop-blur-xl h-16 flex-shrink-0">
          <div className="h-full px-4 sm:px-6 flex items-center justify-end">
            <nav className="flex items-center gap-2 sm:gap-4">
              {/* Usage Indicator - only show when user is logged in */}
              {session && <UsageIndicator />}

              {/* User authentication section */}
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
              {/* Floating Share Button - appears over canvas */}
              <ShareButton />
            </>
          )}
        </main>

        {/* Error Alert */}
        {error && <ErrorAlert message={error} onClose={() => setError(null)} />}
      </div>
    </div>
  );
}
