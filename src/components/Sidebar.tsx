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
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white text-black hover:bg-zinc-100 active:scale-95 transition-all shadow-lg"
        aria-label="Toggle sidebar"
      >
        <MessageCircle className="w-5 h-5" />
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
        className="hidden md:flex fixed left-0 top-0 bottom-0 bg-black border-r border-zinc-800 z-40 flex-col"
      >
        {/* Header with Toggle */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-black" />
              </div>
              <span className="text-sm font-bold text-white">
                Explorations
              </span>
            </motion.div>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center mx-auto">
              <MessageCircle className="w-4 h-4 text-black" />
            </div>
          )}
        </div>

        {/* Collapse Toggle Button */}
        <button
          onClick={onToggleCollapse}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 active:scale-90 flex items-center justify-center transition-all z-50"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5 text-zinc-400" />
          )}
        </button>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={() => {
              posthog.capture('new_chat_clicked');
              onNewChat();
            }}
            className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-lg bg-white text-black hover:bg-zinc-100 active:scale-95 transition-all ${
              isCollapsed ? 'px-2' : 'px-4'
            }`}
            title={isCollapsed ? 'New chat' : undefined}
          >
            <Plus className="w-4 h-4" />
            {!isCollapsed && <span className="text-sm font-medium">New Chat</span>}
          </button>
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
        <div className="p-3 border-t border-zinc-800" ref={accountMenuRef}>
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
                    className="absolute bottom-full left-0 right-0 mb-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="p-2 space-y-0.5">
                      {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <div key={item.label}>
                            {item.divider && <div className="h-px bg-zinc-700 my-1.5" />}
                            <button
                              onClick={item.action}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800 active:scale-98 transition-all text-left group"
                            >
                              <Icon className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                              <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
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
                  className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-zinc-900 active:scale-98 transition-all group"
                >
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-black" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-white truncate">
                      {session.user?.name || session.user?.email?.split('@')[0]}
                    </p>
                  </div>
                  <ChevronUp
                    className={`w-4 h-4 text-zinc-400 transition-transform ${
                      isAccountMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              ) : (
                <button
                  onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                  className="w-full p-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 active:scale-95 flex items-center justify-center transition-all"
                  title="Account menu"
                >
                  <User className="w-4 h-4 text-zinc-400" />
                </button>
              )}
            </div>
          ) : (
            <SignInButton isCollapsed={isCollapsed} />
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
            className="md:hidden fixed left-0 top-0 bottom-0 w-[280px] bg-black border-r border-zinc-800 z-50 flex flex-col overflow-y-auto"
          >
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-black" />
                </div>
                <span className="text-sm font-bold text-white">
                  Explorations
                </span>
              </div>
              <button
                onClick={onToggleCollapse}
                className="p-2 rounded-lg hover:bg-zinc-900 active:scale-95 transition-all"
              >
                <ChevronLeft className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            {/* New Chat Button */}
            <div className="p-3">
              <button
                onClick={onNewChat}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg bg-white text-black hover:bg-zinc-100 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">New Chat</span>
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
            <div className="p-3 border-t border-zinc-800">
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
                        className="absolute bottom-full left-0 right-0 mb-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-50"
                      >
                        <div className="p-2 space-y-0.5">
                          {menuItems.map((item) => {
                            const Icon = item.icon;
                            return (
                              <div key={item.label}>
                                {item.divider && <div className="h-px bg-zinc-700 my-1.5" />}
                                <button
                                  onClick={item.action}
                                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800 active:scale-98 transition-all text-left group"
                                >
                                  <Icon className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                                  <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
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
                    className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-zinc-900 active:scale-98 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-black" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-white truncate">
                        {session.user?.name || session.user?.email?.split('@')[0]}
                      </p>
                    </div>
                    <ChevronUp
                      className={`w-4 h-4 text-zinc-400 transition-transform ${
                        isAccountMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>
              ) : (
                <SignInButton isCollapsed={false} />
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
            ? 'bg-white text-black'
            : 'text-zinc-400 hover:bg-zinc-900 hover:text-white active:scale-98'
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