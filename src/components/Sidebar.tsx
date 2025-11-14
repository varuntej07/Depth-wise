'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Star,
  Plus,
  LogOut,
  User,
  LayoutDashboard,
  Sparkles,
  Settings,
  BookOpen,
  HelpCircle,
  ChevronUp,
} from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
import { useRouter } from 'next/navigation';
import { SignInButton } from './auth/SignInButton';

interface ChatItem {
  id: string;
  title: string;
  timestamp: Date;
  isPinned?: boolean;
}

interface ChatSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onNewChat: () => void;
  chatHistory?: ChatItem[];
  selectedChatId?: string;
  onSelectChat?: (id: string) => void;
}

export function ChatSidebar({
  isCollapsed,
  onToggleCollapse,
  onNewChat,
  chatHistory = [],
  selectedChatId,
  onSelectChat,
}: ChatSidebarProps) {
  const { data: session } = useSession();
  const posthog = usePostHog();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close account menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };

    if (isAccountMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAccountMenuOpen]);

  const pinnedChats = chatHistory.filter((chat) => chat.isPinned);
  const regularChats = chatHistory.filter((chat) => !chat.isPinned);

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      action: () => {
        posthog.capture('account_menu_dashboard_clicked');
        router.push('/dashboard');
        setIsAccountMenuOpen(false);
      },
    },
    {
      icon: Sparkles,
      label: 'Upgrade',
      action: () => {
        posthog.capture('account_menu_upgrade_clicked');
        router.push('/pricing');
        setIsAccountMenuOpen(false);
      },
    },
    {
      icon: Settings,
      label: 'Settings',
      action: () => {
        posthog.capture('account_menu_settings_clicked');
        router.push('/settings');
        setIsAccountMenuOpen(false);
      },
    },
    {
      icon: BookOpen,
      label: 'Learn more',
      action: () => {
        posthog.capture('account_menu_learn_more_clicked');
        router.push('/learn-more');
        setIsAccountMenuOpen(false);
      },
    },
    {
      icon: HelpCircle,
      label: 'Get Help',
      action: () => {
        posthog.capture('account_menu_get_help_clicked');
        router.push('/help');
        setIsAccountMenuOpen(false);
      },
    },
    {
      icon: LogOut,
      label: 'Sign out',
      action: () => {
        posthog.capture('account_menu_sign_out_clicked');
        signOut();
        setIsAccountMenuOpen(false);
      },
      divider: true,
    },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={onToggleCollapse}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-900/90 backdrop-blur-xl border border-slate-700 hover:border-cyan-500/50 transition-all"
        aria-label="Toggle sidebar"
      >
        <MessageCircle className="w-5 h-5 text-slate-400" />
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {!isCollapsed && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onToggleCollapse}
          />
        )}
      </AnimatePresence>

      {/* Desktop Persistent Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? '64px' : '280px' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="hidden md:flex fixed left-0 top-0 bottom-0 bg-slate-950/95 backdrop-blur-xl border-r border-slate-800/50 z-40 flex-col"
      >
        {/* Header with Toggle */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/50">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                Explorations
              </span>
            </motion.div>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center mx-auto">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* Collapse Toggle Button */}
        <button
          onClick={onToggleCollapse}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 flex items-center justify-center transition-colors z-50"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        {/* New Chat Button */}
        <div className="p-3">
          <motion.button
            onClick={() => {
              posthog.capture('new_chat_clicked');
              onNewChat();
            }}
            whileHover={{ scale: 0.98 }}
            className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-700 transition-colors ${
              isCollapsed ? 'px-2' : 'px-4'
            }`}
            title={isCollapsed ? 'New chat' : undefined}
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            {!isCollapsed && <span className="text-sm font-medium text-slate-300">New Chat</span>}
          </motion.button>
        </div>

        {/* Chat History Sections */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-6">
          {/* Pinned Section */}
          {pinnedChats.length > 0 && (
            <div>
              {!isCollapsed && (
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">
                  Pinned
                </h3>
              )}
              <div className="space-y-1">
                {pinnedChats.map((chat) => (
                  <ChatHistoryItem
                    key={chat.id}
                    chat={chat}
                    isSelected={selectedChatId === chat.id}
                    isCollapsed={isCollapsed}
                    onSelect={() => {
                      posthog.capture('session_selected', {
                        session_id: chat.id,
                        from_pinned: true,
                      });
                      onSelectChat?.(chat.id);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Chats Section */}
          {regularChats.length > 0 && (
            <div>
              {!isCollapsed && (
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">
                  Chats
                </h3>
              )}
              <div className="space-y-1">
                {regularChats.map((chat) => (
                  <ChatHistoryItem
                    key={chat.id}
                    chat={chat}
                    isSelected={selectedChatId === chat.id}
                    isCollapsed={isCollapsed}
                    onSelect={() => {
                      posthog.capture('session_selected', {
                        session_id: chat.id,
                        from_pinned: false,
                      });
                      onSelectChat?.(chat.id);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Account Menu Section */}
        <div className="p-3 border-t border-slate-800/50" ref={accountMenuRef}>
          {session ? (
            <div className="relative">
              {/* Account Menu Dropdown */}
              <AnimatePresence>
                {isAccountMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full left-0 right-0 mb-2 bg-slate-900/98 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50"
                  >
                    <div className="p-2 space-y-0.5">
                      {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <div key={item.label}>
                            {item.divider && <div className="h-px bg-slate-700/50 my-1.5" />}
                            <button
                              onClick={item.action}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/70 transition-all text-left group"
                            >
                              <Icon className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                              <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                                {item.label}
                              </span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Account Button */}
              {!isCollapsed ? (
                <button
                  onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                  className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-slate-800/50 transition-all group"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-white truncate">
                      {session.user?.name || session.user?.email?.split('@')[0]}
                    </p>
                  </div>
                  <ChevronUp
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      isAccountMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              ) : (
                <button
                  onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                  className="w-full p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-700 flex items-center justify-center transition-colors"
                  title="Account menu"
                >
                  <User className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>
          ) : (
            <div className="px-3">
              <SignInButton />
            </div>
          )}
        </div>
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {!isCollapsed && isMobile && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="md:hidden fixed left-0 top-0 bottom-0 w-[280px] bg-slate-950/98 backdrop-blur-xl border-r border-slate-800/50 z-50 flex flex-col overflow-y-auto"
          >
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                  Explorations
                </span>
              </div>
              <button
                onClick={onToggleCollapse}
                className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* New Chat Button */}
            <div className="p-3">
              <button
                onClick={onNewChat}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-700 transition-colors"
              >
                <Plus className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-slate-300">New Chat</span>
              </button>
            </div>

            {/* Chat History */}
            <nav className="flex-1 overflow-y-auto px-3 space-y-6">
              {pinnedChats.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">
                    Pinned
                  </h3>
                  <div className="space-y-1">
                    {pinnedChats.map((chat) => (
                      <ChatHistoryItem
                        key={chat.id}
                        chat={chat}
                        isSelected={selectedChatId === chat.id}
                        isCollapsed={false}
                        onSelect={() => {
                          onSelectChat?.(chat.id);
                          onToggleCollapse();
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {regularChats.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">
                    Chats
                  </h3>
                  <div className="space-y-1">
                    {regularChats.map((chat) => (
                      <ChatHistoryItem
                        key={chat.id}
                        chat={chat}
                        isSelected={selectedChatId === chat.id}
                        isCollapsed={false}
                        onSelect={() => {
                          onSelectChat?.(chat.id);
                          onToggleCollapse();
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </nav>

            {/* Account Menu Section - Mobile */}
            <div className="p-3 border-t border-slate-800/50">
              {session ? (
                <div className="relative">
                  {/* Account Menu Dropdown - Mobile */}
                  <AnimatePresence>
                    {isAccountMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full left-0 right-0 mb-2 bg-slate-900/98 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50"
                      >
                        <div className="p-2 space-y-0.5">
                          {menuItems.map((item) => {
                            const Icon = item.icon;
                            return (
                              <div key={item.label}>
                                {item.divider && <div className="h-px bg-slate-700/50 my-1.5" />}
                                <button
                                  onClick={item.action}
                                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/70 transition-all text-left group"
                                >
                                  <Icon className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                                  <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                                    {item.label}
                                  </span>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Account Button - Mobile */}
                  <button
                    onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                    className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-slate-800/50 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-white truncate">
                        {session.user?.name || session.user?.email?.split('@')[0]}
                      </p>
                    </div>
                    <ChevronUp
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        isAccountMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>
              ) : (
                <div className="px-4">
                  <SignInButton />
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

interface ChatHistoryItemProps {
  chat: ChatItem;
  isSelected: boolean;
  isCollapsed: boolean;
  onSelect: () => void;
}

function ChatHistoryItem({ chat, isSelected, isCollapsed, onSelect }: ChatHistoryItemProps) {
  const formattedTime = new Date(chat.timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ x: isCollapsed ? 0 : 4 }}
      className={`
        w-full flex items-center gap-3 p-2.5 rounded-lg transition-all group relative
        ${
          isSelected
            ? 'bg-cyan-500/10 text-cyan-400'
            : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
        }
        ${isCollapsed ? 'justify-center' : ''}
      `}
      title={isCollapsed ? chat.title : undefined}
    >
      <MessageCircle className="w-4 h-4 flex-shrink-0" />
      {!isCollapsed && (
        <>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium truncate">{chat.title}</p>
            <p className="text-xs text-slate-500">{formattedTime}</p>
          </div>
          {chat.isPinned && <Star className="w-3 h-3 text-amber-400 flex-shrink-0" />}
        </>
      )}
    </motion.button>
  );
}