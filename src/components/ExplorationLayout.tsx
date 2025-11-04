'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchBar from './SearchBar';
import KnowledgeCanvas from './KnowledgeCanvas';
import { ChatSidebar } from './Sidebar';
import { BottomToolbar } from './BottomToolbar';
import ErrorAlert from './ErrorAlert';
import NodeDetailModal from './NodeDetailModal';
import useGraphStore from '@/store/graphStore';
import { KnowledgeNodeData } from '@/types/graph';

interface ChatItem {
  id: string;
  title: string;
  timestamp: Date;
  isPinned?: boolean;
}

export function ExplorationLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isCanvasExpanded, setIsCanvasExpanded] = useState(false);
  const [selectedNodeData, setSelectedNodeData] = useState<KnowledgeNodeData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatItem[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const { nodes, error, clearError, sessionId, loadSession, setLoading } = useGraphStore();
  const hasExistingGraph = nodes.length > 0;

  // Fetch chat history function
  const fetchChatHistory = async () => {
    try {
      const response = await fetch('/api/sessions');
      if (response.ok) {
        const data = await response.json();
        setChatHistory(data.sessions);
      } else {
        console.error('Failed to fetch chat history');
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  // Fetch chat history on mount
  useEffect(() => {
    fetchChatHistory();
  }, []);

  // Refresh chat history when a new session is created
  useEffect(() => {
    if (sessionId && !chatHistory.find((chat) => chat.id === sessionId)) {
      fetchChatHistory();
    }
  }, [sessionId, chatHistory]);

  // Handle node selection from canvas
  useEffect(() => {
    const handleNodeSelect = (event: Event) => {
      const customEvent = event as CustomEvent<{ nodeData: KnowledgeNodeData }>;
      setSelectedNodeData(customEvent.detail.nodeData);
      setIsModalOpen(true);
    };

    window.addEventListener('node-selected', handleNodeSelect);
    return () => window.removeEventListener('node-selected', handleNodeSelect);
  }, []);

  const handleNewChat = () => {
    useGraphStore.getState().clearGraph();
    setSelectedChatId(null);
    setIsSidebarCollapsed(true);
  };

  const handleSelectChat = async (id: string) => {
    // Don't reload if already selected
    if (id === sessionId) {
      return;
    }

    setSelectedChatId(id);
    setLoading(true);

    try {
      const response = await fetch(`/api/session/${id}`);

      if (!response.ok) {
        throw new Error('Failed to load session');
      }

      const data = await response.json();

      // Load the session into the graph store
      loadSession(data.sessionId, data.rootQuery, data.nodes, data.edges);

      // Collapse the sidebar after loading (optional, for better UX)
      setIsSidebarCollapsed(true);
    } catch (error) {
      console.error('Error loading session:', error);
      useGraphStore.getState().setError('Failed to load chat history');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    console.log('Download graph as image');
    // TODO: Implement graph export functionality
  };

  const handleShare = () => {
    console.log('Share graph');
    // TODO: Implement sharing functionality
  };

  const handleCopy = () => {
    console.log('Copy graph to clipboard');
    // TODO: Implement copy functionality
  };

  const handleShowCode = () => {
    console.log('Show code representation');
    // TODO: Implement code export
  };

  return (
    <div className="w-full h-screen bg-slate-950 overflow-hidden">
      {/* Sidebar */}
      <ChatSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onNewChat={handleNewChat}
        chatHistory={chatHistory}
        selectedChatId={selectedChatId || undefined}
        onSelectChat={handleSelectChat}
      />

      {/* Main Content Area */}
      <div
        className={`transition-all duration-300 ${
          isSidebarCollapsed ? 'md:ml-16' : 'md:ml-[280px]'
        }`}
      >
        <AnimatePresence mode="wait">
          {hasExistingGraph ? (
            <motion.div
              key="canvas-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full h-screen flex flex-col relative"
            >
              {/* Top Search Bar (Compact) */}
              <div className="pt-6 px-4 z-20">
                <SearchBar isCompact={true} />
              </div>

              {/* Canvas Container */}
              <motion.div
                animate={{
                  height: isCanvasExpanded ? '100vh' : 'calc(100vh - 80px)',
                }}
                transition={{ duration: 0.3 }}
                className="flex-1 relative overflow-hidden"
              >
                <KnowledgeCanvas />
              </motion.div>

              {/* Bottom Toolbar */}
              <BottomToolbar
                onDownload={handleDownload}
                onShare={handleShare}
                onCopy={handleCopy}
                onExpand={() => setIsCanvasExpanded(true)}
                onMinimize={() => setIsCanvasExpanded(false)}
                isExpanded={isCanvasExpanded}
                onShowCode={handleShowCode}
              />
            </motion.div>
          ) : (
            <motion.div
              key="search-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full h-screen"
            >
              <SearchBar isCompact={false} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <ErrorAlert message={error} onClose={clearError} />
        )}
      </AnimatePresence>

      {/* Node Detail Modal */}
      <NodeDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={selectedNodeData || {
          title: '',
          content: '',
          depth: 0,
          explored: false,
          loading: false,
          sessionId: '',
        }}
      />
    </div>
  );
}