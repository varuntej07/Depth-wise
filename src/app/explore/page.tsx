'use client';

import { useState, useEffect, useCallback } from 'react';
import SearchBar from '@/components/SearchBar';
import KnowledgeCanvas from '@/components/KnowledgeCanvas';
import ErrorAlert from '@/components/ErrorAlert';
import useGraphStore from '@/store/graphStore';
import { useSession } from 'next-auth/react';
import { ChatSidebar } from '@/components/Sidebar';
import { ShareButton } from '@/components/ShareButton';
import { API_ENDPOINTS } from '@/lib/api-config';
import { UsageIndicator } from '@/components/UsageIndicator';
import { normalizeLoadedSessionGraph } from '@/lib/graph-normalization';
import Link from 'next/link';
import { Compass, Crown, Layers, Network, Sparkles } from 'lucide-react';
import { SignInButton } from '@/components/auth/SignInButton';
import { UserMenu } from '@/components/auth/UserMenu';

interface ChatItem {
  id: string;
  title: string;
  timestamp: Date;
  isPinned?: boolean;
}

interface SessionGraphResponse {
  sessionId: string;
  rootQuery: string;
  nodes: unknown;
  edges: unknown;
  isPublic?: boolean;
  isAnonymous?: boolean;
}

const exploreGuides = [
  {
    title: 'Start with one precise question',
    description: 'Specific prompts create stronger root explanations and cleaner branch quality.',
    icon: Compass,
  },
  {
    title: 'Expand by intent',
    description: 'Follow branches by why, how, examples, or tradeoffs to keep depth focused.',
    icon: Network,
  },
  {
    title: 'Build layered understanding',
    description: 'Each explored node adds context so your map becomes a reusable knowledge artifact.',
    icon: Layers,
  },
];

export default function ExplorePage() {
  const { error, setError, nodes, sessionId, rootQuery, clearGraph, loadSession } = useGraphStore();
  const { data: session } = useSession();
  const [chatHistory, setChatHistory] = useState<ChatItem[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const hydrateSession = useCallback((data: SessionGraphResponse) => {
    const normalized = normalizeLoadedSessionGraph({
      sessionId: data.sessionId,
      nodes: data.nodes,
      edges: data.edges,
    });

    if (normalized.nodes.length === 0) {
      throw new Error('This chat could not be rendered because it has no valid nodes.');
    }

    loadSession(
      data.sessionId,
      data.rootQuery,
      normalized.nodes,
      normalized.edges,
      Boolean(data.isPublic),
      Boolean(data.isAnonymous)
    );
  }, [loadSession]);

  // Load sidebar state after mount and handle mobile auto-collapse
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setSidebarCollapsed(true);
    } else {
      const saved = localStorage.getItem('sidebarCollapsed');
      if (saved !== null) {
        setSidebarCollapsed(JSON.parse(saved));
      }
    }

    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
                const sessionData = (await sessionResponse.json()) as SessionGraphResponse;
                hydrateSession(sessionData);
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
  }, [session?.user, hydrateSession]);

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

  const handleDeleteChat = async (chatId: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.SESSION_DELETE(chatId), {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete session');

      // Re-fetch chat history
      fetchChatHistory();

      // Dispatch refresh-usage event to update UsageIndicator
      window.dispatchEvent(new CustomEvent('refresh-usage'));

      // If the deleted session is currently loaded, clear the graph
      if (sessionId === chatId) {
        clearGraph();
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      setError('Failed to delete chat session');
    }
  };

  const handleSelectChat = async (chatId: string) => {
    if (chatId === sessionId) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(API_ENDPOINTS.SESSION_GET(chatId));
      if (!response.ok) throw new Error('Failed to load session');

      const data = (await response.json()) as SessionGraphResponse;
      hydrateSession(data);
    } catch (error) {
      console.error('Error loading session:', error);
      setError(error instanceof Error ? error.message : 'Failed to load chat session');
    }
  };

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[var(--mint-page)] text-white">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(900px 480px at 12% -15%, rgba(110,231,183,0.16), transparent 60%), radial-gradient(860px 520px at 88% 5%, rgba(16,185,129,0.14), transparent 60%), linear-gradient(180deg, #050D0B 0%, #0D1A16 52%, #050D0B 100%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(rgba(209,213,219,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(209,213,219,0.08) 1px, transparent 1px)',
          backgroundSize: '34px 34px',
        }}
      />

      <ChatSidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        onNewChat={handleNewChat}
        chatHistory={chatHistory}
        selectedChatId={sessionId || undefined}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
      />

      <div
        className={`relative z-10 flex min-h-0 flex-1 flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'md:ml-16' : 'md:ml-[280px]'
        }`}
      >
        <header className="h-16 w-full flex-shrink-0 border-b border-[var(--mint-elevated)] bg-[rgba(13,26,22,0.78)] backdrop-blur-xl sm:h-[74px]">
          <div className="flex h-full items-center justify-between gap-3 px-3 sm:px-6">
            <div className="min-w-0 flex-1">
              {nodes.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">Active exploration</p>
                  <h2 className="truncate text-sm font-semibold text-[var(--mint-accent-1)] sm:text-base">{rootQuery || 'Exploring...'}</h2>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/55">
                    <Sparkles className="h-3.5 w-3.5 text-[var(--mint-accent-1)]" />
                    Depthwise Workspace
                  </p>
                  <h1 className="text-sm font-semibold text-white sm:text-base">Explore ideas as connected trees</h1>
                </div>
              )}
            </div>
            <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
                <Link
                  href="/home"
                  className="hidden rounded-lg border border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.35)] px-3 py-2 text-xs font-medium text-[var(--mint-text-secondary)] transition hover:border-[var(--mint-accent-2)] hover:text-white sm:inline-flex"
                >
                  Home
                </Link>
                <Link
                  href="/dashboard"
                  className="hidden rounded-lg border border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.35)] px-3 py-2 text-xs font-medium text-[var(--mint-text-secondary)] transition hover:border-[var(--mint-accent-2)] hover:text-white lg:inline-flex"
                >
                  Dashboard Preview
                </Link>

              {session && <UsageIndicator />}

              {!session && (
                <>
                  <div className="hidden sm:block">
                    <SignInButton />
                  </div>
                  <div className="sm:hidden">
                    <SignInButton isCollapsed={true} />
                  </div>
                </>
              )}

              {session && (
                <Link
                  href="/pricing"
                  className="hidden items-center gap-2 rounded-lg bg-[image:var(--mint-accent-gradient)] px-4 py-2 text-sm font-medium text-[#04120e] shadow-[0_8px_24px_var(--mint-accent-glow)] transition-all hover:brightness-105 active:scale-95 sm:flex"
                >
                  <Crown className="w-4 h-4" />
                  <span>Upgrade</span>
                </Link>
              )}
              {session && (
                <Link
                  href="/pricing"
                  className="sm:hidden flex items-center justify-center w-8 h-8 bg-[image:var(--mint-accent-gradient)] text-[#04120e] rounded-lg transition-all hover:brightness-105 active:scale-95"
                  title="Upgrade"
                >
                  <Crown className="w-4 h-4" />
                </Link>
              )}
              {session && <UserMenu />}
            </div>
          </div>
        </header>

        <main className="relative min-h-0 flex-1 overflow-hidden p-3 sm:p-5">
          {nodes.length === 0 ? (
            <div className="mx-auto grid h-full w-full max-w-7xl gap-5 lg:grid-cols-[1.08fr_0.92fr]">
              <div className="flex items-center">
                <SearchBar />
              </div>

              <div className="rounded-3xl border border-[var(--mint-elevated)] bg-[rgba(13,26,22,0.78)] p-6 backdrop-blur-xl sm:p-8">
                <p className="text-xs uppercase tracking-[0.24em] text-white/50">How to get better maps</p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Build depth deliberately.
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--mint-text-secondary)] sm:text-base">
                  Depthwise works best when each query sharpens scope and each branch explores one clear angle.
                </p>

                <div className="mt-6 space-y-3">
                  {exploreGuides.map((guide) => (
                    <article
                      key={guide.title}
                      className="rounded-2xl border border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.34)] p-4 transition hover:border-[var(--mint-accent-2)]"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--mint-accent-2)] bg-[rgba(16,185,129,0.16)]">
                          <guide.icon className="h-4 w-4 text-[var(--mint-accent-1)]" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-white sm:text-base">{guide.title}</h4>
                          <p className="mt-1 text-xs leading-relaxed text-[var(--mint-text-secondary)] sm:text-sm">{guide.description}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-[var(--mint-accent-2)] bg-[rgba(16,185,129,0.16)] p-4">
                  <p className="text-sm font-semibold text-[var(--mint-accent-1)]">Pro tip</p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--mint-text-secondary)] sm:text-sm">
                    Ask for comparisons and counterexamples early. You will uncover useful branches faster and avoid
                    shallow trees.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative h-full min-h-0 overflow-hidden rounded-3xl border border-[var(--mint-elevated)] bg-[rgba(13,26,22,0.85)] shadow-[0_24px_80px_rgba(5,13,11,0.62)]">
              <KnowledgeCanvas />
              <ShareButton />
            </div>
          )}
        </main>

        {error && <ErrorAlert message={error} onClose={() => setError(null)} />}
      </div>
    </div>
  );
}
