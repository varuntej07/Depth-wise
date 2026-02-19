'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  HelpCircle,
  Home,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Plus,
  Search,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { useRouter } from 'next/navigation';

interface ChatItem {
  id: string;
  title: string;
  timestamp: Date | string;
  isPinned?: boolean;
}

interface ChatSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onNewChat: () => void;
  chatHistory?: ChatItem[];
  selectedChatId?: string;
  onSelectChat?: (id: string) => void;
  onDeleteChat?: (id: string) => void;
}

function formatChatTimestamp(timestamp: Date | string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isSameDay) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ChatSidebar({
  isCollapsed,
  onToggleCollapse,
  onNewChat,
  chatHistory = [],
  selectedChatId,
  onSelectChat,
  onDeleteChat,
}: ChatSidebarProps) {
  const posthog = usePostHog();
  const router = useRouter();

  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
  const [isQuickNavOpen, setIsQuickNavOpen] = useState(false);

  const overlaySearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isSearchShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';

      if (isSearchShortcut) {
        event.preventDefault();
        setIsSearchOverlayOpen(true);
        return;
      }

      if (event.key === 'Escape') {
        setIsSearchOverlayOpen(false);
        setIsQuickNavOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isSearchOverlayOpen) return;
    const timer = window.setTimeout(() => overlaySearchInputRef.current?.focus(), 10);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
    };
  }, [isSearchOverlayOpen]);

  const orderedChats = useMemo(() => {
    const pinned = chatHistory.filter((chat) => chat.isPinned);
    const regular = chatHistory.filter((chat) => !chat.isPinned);
    return [...pinned, ...regular];
  }, [chatHistory]);

  const filteredChats = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return orderedChats;

    return orderedChats.filter((chat) => chat.title.toLowerCase().includes(normalized));
  }, [orderedChats, searchQuery]);

  const quickNavItems = useMemo(
    () => [
      { href: '/home', label: 'Home', icon: Home },
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/pricing', label: 'Pricing', icon: Crown },
      { href: '/help', label: 'Help', icon: HelpCircle },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
    []
  );

  const openSearchOverlay = () => {
    setIsQuickNavOpen(false);
    setIsSearchOverlayOpen(true);
  };
  const closeSearchOverlay = () => setIsSearchOverlayOpen(false);
  const openQuickNav = () => {
    setIsSearchOverlayOpen(false);
    setIsQuickNavOpen(true);
  };
  const closeQuickNav = () => setIsQuickNavOpen(false);

  const handleNewChatClick = () => {
    posthog.capture('new_chat_clicked');
    onNewChat();

    if (isMobile && !isCollapsed) {
      onToggleCollapse();
    }
  };

  const handleDashboardClick = () => {
    posthog.capture('sidebar_dashboard_clicked');
    router.push('/dashboard');

    if (isMobile && !isCollapsed) {
      onToggleCollapse();
    }
  };

  const handleSelectChat = (chat: ChatItem) => {
    posthog.capture('session_selected', {
      session_id: chat.id,
      from_pinned: Boolean(chat.isPinned),
      source: isSearchOverlayOpen ? 'search_overlay' : 'sidebar',
    });

    onSelectChat?.(chat.id);
    setIsSearchOverlayOpen(false);

    if (isMobile && !isCollapsed) {
      onToggleCollapse();
    }
  };

  const handleQuickNavigate = (href: string) => {
    posthog.capture('sidebar_quick_nav_clicked', { destination: href });
    router.push(href);
    closeQuickNav();

    if (isMobile && !isCollapsed) {
      onToggleCollapse();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={onToggleCollapse}
        className="fixed left-4 top-4 z-50 rounded-lg border border-transparent bg-[image:var(--mint-accent-gradient)] text-[#04120e] p-2 shadow-[0_8px_24px_var(--mint-accent-glow)] transition hover:brightness-105 md:hidden"
        aria-label="Toggle sidebar"
      >
        <MessageCircle className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={openQuickNav}
        className="fixed bottom-4 left-4 z-50 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--mint-elevated)] bg-[rgba(13,26,22,0.92)] text-white/85 shadow-[0_8px_24px_rgba(2,6,18,0.45)] transition hover:border-[var(--mint-accent-2)] hover:bg-[rgba(32,52,45,0.55)] md:hidden"
        aria-label="Open pages menu"
      >
        <Menu className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {!isCollapsed && isMobile && (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm md:hidden"
            onClick={onToggleCollapse}
            aria-label="Close sidebar"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 64 : 280 }}
        transition={{ type: 'spring', damping: 24, stiffness: 210 }}
        onClick={isCollapsed ? onToggleCollapse : undefined}
        className="fixed bottom-0 left-0 top-0 z-40 hidden border-r border-[var(--mint-elevated)] bg-[rgba(13,26,22,0.95)] backdrop-blur md:flex"
      >
        {isCollapsed ? (
          <div className="flex h-full w-full flex-col items-center gap-3 py-4">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onToggleCollapse();
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--mint-accent-2)] bg-[rgba(16,185,129,0.16)] text-[var(--mint-accent-1)] transition hover:bg-[rgba(16,185,129,0.22)]"
              title="Expand Sidebar"
              aria-label="Expand Sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleNewChatClick();
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.35)] text-white/85 transition hover:border-[var(--mint-accent-2)] hover:bg-[rgba(32,52,45,0.55)]"
              title="New Chat"
              aria-label="New Chat"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                openSearchOverlay();
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.35)] text-white/85 transition hover:border-[var(--mint-accent-2)] hover:bg-[rgba(32,52,45,0.55)]"
              title="Search Chats"
              aria-label="Search Chats"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleDashboardClick();
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.35)] text-white/85 transition hover:border-[var(--mint-accent-2)] hover:bg-[rgba(32,52,45,0.55)]"
              title="Dashboard"
              aria-label="Dashboard"
            >
              <LayoutDashboard className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                openQuickNav();
              }}
              className="mt-auto inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.35)] text-white/85 transition hover:border-[var(--mint-accent-2)] hover:bg-[rgba(32,52,45,0.55)]"
              title="Pages Menu"
              aria-label="Pages Menu"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex h-full w-full flex-col">
            <div className="flex h-16 items-center justify-between border-b border-[var(--mint-elevated)] px-4">
              <div className="flex items-center gap-2">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--mint-accent-2)] bg-[rgba(16,185,129,0.16)] text-[var(--mint-accent-1)]">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold tracking-tight text-white">Depthwise</p>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">Explore</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onToggleCollapse}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.3)] text-white/80 transition hover:border-[var(--mint-accent-2)] hover:bg-[rgba(32,52,45,0.5)]"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 border-b border-[var(--mint-elevated)] p-4">
              <button
                type="button"
                onClick={handleNewChatClick}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[image:var(--mint-accent-gradient)] px-4 py-2.5 text-sm font-semibold text-[#04120e] transition hover:brightness-105"
              >
                <Plus className="h-4 w-4" />
                New Chat
              </button>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search chats"
                  className="w-full rounded-xl border border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.3)] py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-[var(--mint-text-secondary)] outline-none transition focus:border-[var(--mint-accent-2)] focus:ring-2 focus:ring-[var(--mint-accent-glow)]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {filteredChats.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.28)] p-4 text-center text-xs text-white/55">
                  No chats found.
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredChats.map((chat) => (
                    <ChatHistoryItem
                      key={chat.id}
                      chat={chat}
                      isSelected={selectedChatId === chat.id}
                      onSelect={() => handleSelectChat(chat)}
                      onDeleteChat={onDeleteChat}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-[var(--mint-elevated)] p-3">
              <button
                type="button"
                onClick={openQuickNav}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.35)] px-3 py-2.5 text-sm font-medium text-white/80 transition hover:border-[var(--mint-accent-2)] hover:bg-[rgba(32,52,45,0.5)]"
              >
                <Menu className="h-4 w-4" />
                Pages
              </button>
            </div>
          </div>
        )}
      </motion.aside>

      <AnimatePresence>
        {!isCollapsed && isMobile && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed bottom-0 left-0 top-0 z-50 flex w-[280px] flex-col border-r border-[var(--mint-elevated)] bg-[rgba(13,26,22,0.97)] backdrop-blur md:hidden"
          >
            <div className="flex h-16 items-center justify-between border-b border-[var(--mint-elevated)] px-4">
              <div>
                <p className="text-sm font-semibold tracking-tight text-white">Depthwise</p>
                <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">Explore</p>
              </div>
              <button
                type="button"
                onClick={onToggleCollapse}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.3)] text-white/80 transition hover:border-[var(--mint-accent-2)] hover:bg-[rgba(32,52,45,0.5)]"
                aria-label="Close sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 border-b border-[var(--mint-elevated)] p-4">
              <button
                type="button"
                onClick={handleNewChatClick}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[image:var(--mint-accent-gradient)] px-4 py-2.5 text-sm font-semibold text-[#04120e] transition hover:brightness-105"
              >
                <Plus className="h-4 w-4" />
                New Chat
              </button>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search chats"
                  className="w-full rounded-xl border border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.3)] py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-[var(--mint-text-secondary)] outline-none transition focus:border-[var(--mint-accent-2)] focus:ring-2 focus:ring-[var(--mint-accent-glow)]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {filteredChats.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.28)] p-4 text-center text-xs text-white/55">
                  No chats found.
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredChats.map((chat) => (
                    <ChatHistoryItem
                      key={chat.id}
                      chat={chat}
                      isSelected={selectedChatId === chat.id}
                      onSelect={() => handleSelectChat(chat)}
                      onDeleteChat={onDeleteChat}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-[var(--mint-elevated)] p-3">
              <button
                type="button"
                onClick={openQuickNav}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.35)] px-3 py-2.5 text-sm font-medium text-white/80 transition hover:border-[var(--mint-accent-2)] hover:bg-[rgba(32,52,45,0.5)]"
              >
                <Menu className="h-4 w-4" />
                Pages
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isQuickNavOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeQuickNav}
              className="fixed inset-0 z-[72] bg-black/55 backdrop-blur-[2px]"
              aria-label="Close pages menu"
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="fixed bottom-4 left-4 z-[82] w-[min(320px,calc(100vw-2rem))] rounded-2xl border border-[var(--mint-elevated)] bg-[rgba(13,26,22,0.97)] p-3 shadow-[0_24px_72px_rgba(2,6,18,0.7)]"
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/55">Pages</p>
                <button
                  type="button"
                  onClick={closeQuickNav}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.3)] text-white/70 transition hover:border-[var(--mint-accent-2)] hover:text-white"
                  aria-label="Close pages menu"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="space-y-1.5">
                {quickNavItems.map((item) => (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => handleQuickNavigate(item.href)}
                    className="inline-flex w-full items-center gap-2.5 rounded-lg border border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.3)] px-3 py-2 text-sm text-white/85 transition hover:border-[var(--mint-accent-2)] hover:bg-[rgba(32,52,45,0.48)]"
                  >
                    <item.icon className="h-4 w-4 text-[var(--mint-accent-1)]" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSearchOverlayOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSearchOverlay}
              className="fixed inset-0 z-[70] bg-black/55 backdrop-blur-[2px]"
              aria-label="Close search"
            />
            <motion.div
              initial={{ opacity: 0, y: -14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="fixed left-1/2 top-20 z-[80] w-[min(680px,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border border-[var(--mint-elevated)] bg-[rgba(13,26,22,0.96)] p-4 shadow-[0_28px_80px_rgba(2,6,18,0.65)]"
            >
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                <input
                  ref={overlaySearchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search chats (Cmd/Ctrl+K)"
                  className="w-full rounded-xl border border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.3)] py-2.5 pl-9 pr-10 text-sm text-white placeholder:text-[var(--mint-text-secondary)] outline-none transition focus:border-[var(--mint-accent-2)] focus:ring-2 focus:ring-[var(--mint-accent-glow)]"
                />
                <button
                  type="button"
                  onClick={closeSearchOverlay}
                  className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md border border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.3)] text-white/70 transition hover:border-[var(--mint-accent-2)] hover:text-white"
                  aria-label="Close search overlay"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-3 max-h-[52vh] overflow-y-auto">
                {filteredChats.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.28)] p-4 text-center text-xs text-white/55">
                    No chats found.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {filteredChats.map((chat) => (
                      <button
                        key={`overlay-${chat.id}`}
                        type="button"
                        onClick={() => handleSelectChat(chat)}
                        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition ${
                          selectedChatId === chat.id
                            ? 'border-[var(--mint-accent-2)] bg-[rgba(16,185,129,0.16)] text-[var(--mint-accent-1)]'
                            : 'border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.28)] text-white/80 hover:border-[var(--mint-elevated)] hover:bg-[rgba(32,52,45,0.4)]'
                        }`}
                      >
                        <span className="truncate text-sm font-medium">{chat.title}</span>
                        <span className="ml-3 flex-shrink-0 text-[11px] text-white/50">{formatChatTimestamp(chat.timestamp)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

interface ChatHistoryItemProps {
  chat: ChatItem;
  isSelected: boolean;
  onSelect: () => void;
  onDeleteChat?: (id: string) => void;
}

function ChatHistoryItem({ chat, isSelected, onSelect, onDeleteChat }: ChatHistoryItemProps) {
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onSelect}
        className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
          isSelected
            ? 'border-[var(--mint-accent-2)] bg-[rgba(16,185,129,0.16)] text-[var(--mint-accent-1)]'
            : 'border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.28)] text-white/80 hover:border-[var(--mint-elevated)] hover:bg-[rgba(32,52,45,0.4)]'
        }`}
      >
        <p className="truncate text-sm font-medium">{chat.title}</p>
        <p className="mt-1 text-[11px] text-white/50">{formatChatTimestamp(chat.timestamp)}</p>
      </button>

      {onDeleteChat && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDeleteChat(chat.id);
          }}
          className="absolute right-2 top-2.5 inline-flex h-7 w-7 items-center justify-center rounded-md border border-transparent bg-transparent text-white/45 opacity-0 transition hover:border-red-400/30 hover:bg-red-400/10 hover:text-red-300 group-hover:opacity-100"
          title="Delete chat"
          aria-label="Delete chat"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
