'use client';

import { useState, useEffect } from 'react';
import SearchBar from '@/components/SearchBar';
import KnowledgeCanvas from '@/components/KnowledgeCanvas';
import ErrorAlert from '@/components/ErrorAlert';
import useGraphStore from '@/store/graphStore';
import { useSession } from 'next-auth/react';
import { ChatSidebar } from '@/components/Sidebar';
import { ShareButton } from '@/components/ShareButton';
import { API_ENDPOINTS } from '@/lib/api-config';
import { UsageIndicator } from '@/components/UsageIndicator';
import Link from 'next/link';
import { Crown } from 'lucide-react';

interface ChatItem {
  id: string;
  title: string;
  timestamp: Date;
  isPinned?: boolean;
}

export default function ExplorePage() {
  const { error, setError, nodes, sessionId, clearGraph, loadSession } = useGraphStore();
  const { data: session } = useSession();
  const [chatHistory, setChatHistory] = useState<ChatItem[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  // Load sidebar state after mount to avoid hydration mismatch
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved !== null) {
      setSidebarCollapsed(JSON.parse(saved));
    }
  }, []);

  // Migrate anonymous session when user signs in
  useEffect(() => {
    const migrateAnonymousSession = async () => {
      if (session?.user) {
        const pendingSessionId = localStorage.getItem('pendingAnonymousSessionId');

        if (pendingSessionId) {
          try {
            const response = await fetch(API_ENDPOINTS.SESSION_MIGRATE, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ anonymousSessionId: pendingSessionId }),
            });

            if (response.ok) {
              const data = await response.json();

              // Load the migrated session
              const sessionResponse = await fetch(API_ENDPOINTS.SESSION_GET(data.sessionId));
              if (sessionResponse.ok) {
                const sessionData = await sessionResponse.json();
                loadSession(
                  sessionData.sessionId,
                  sessionData.rootQuery,
                  sessionData.nodes,
                  sessionData.edges
                );
              }

              // Clear the pending session
              localStorage.removeItem('pendingAnonymousSessionId');
            }
          } catch (error) {
            console.error('Failed to migrate anonymous session:', error);
            // Clear the pending session even on error to avoid retry loops
            localStorage.removeItem('pendingAnonymousSessionId');
          }
        }
      }
    };

    migrateAnonymousSession();
  }, [session?.user, loadSession]);

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
    <div className="h-screen w-screen flex bg-black relative overflow-hidden">

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
        <header className="w-full bg-black border-b border-zinc-800 h-16 flex-shrink-0">
          <div className="h-full px-4 sm:px-6 flex items-center justify-end">
            <div className="flex items-center gap-3">
              {/* Usage Indicator - only show when user is logged in */}
              {session && <UsageIndicator />}

              {/* Upgrade Button - only show when user is logged in */}
              {session && (
                <Link
                  href="/pricing"
                  className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-medium transition-all hover:bg-zinc-100 active:scale-95 shadow-sm"
                >
                  <Crown className="w-4 h-4" />
                  <span>Upgrade</span>
                </Link>
              )}
            </div>
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
