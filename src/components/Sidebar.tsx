'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Users,
  Star,
  Plus,
  Settings,
  LogOut,
  User,
} from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';

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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const pinnedChats = chatHistory.filter((chat) => chat.isPinned);
  const regularChats = chatHistory.filter((chat) => !chat.isPinned);

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
            onClick={onNewChat}
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
                    onSelect={() => onSelectChat?.(chat.id)}
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
                    onSelect={() => onSelectChat?.(chat.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* User Profile Section */}
        <div className="p-3 border-t border-slate-800/50 space-y-2">
          {!isCollapsed ? (
            <>
              {session ? (
                <>
                  <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-800/30 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">
                        {session.user?.name || session.user?.email?.split('@')[0]}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{session.user?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-all text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <p className="text-xs text-slate-500 text-center">Sign in to save chats</p>
              )}
            </>
          ) : (
            <button
              onClick={() => signOut()}
              className="w-full p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-700 flex items-center justify-center transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
            </button>
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

            {/* User Profile */}
            <div className="p-3 border-t border-slate-800/50 space-y-2">
              {session ? (
                <>
                  <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-800/30 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">
                        {session.user?.name || session.user?.email?.split('@')[0]}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{session.user?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-all text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <p className="text-xs text-slate-500 text-center">Sign in to save chats</p>
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