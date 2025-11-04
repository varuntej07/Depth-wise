'use client';

import { motion } from 'framer-motion';
import {
  Download,
  Share2,
  Copy,
  Maximize2,
  Minimize2,
  Code2,
  PenTool,
  Shapes,
  CircleDot,
  Type,
  MessageCircle,
  Grid3x3,
} from 'lucide-react';
import { useState } from 'react';

interface BottomToolbarProps {
  onDownload?: () => void;
  onShare?: () => void;
  onCopy?: () => void;
  onExpand?: () => void;
  onMinimize?: () => void;
  isExpanded?: boolean;
  onShowCode?: () => void;
}

export function BottomToolbar({
  onDownload,
  onShare,
  onCopy,
  onExpand,
  onMinimize,
  isExpanded = false,
  onShowCode,
}: BottomToolbarProps) {
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);

  const tools: Array<{
    id: string;
    icon?: typeof PenTool;
    label?: string;
    onClick?: () => void;
    color?: string;
    isDivider?: boolean;
  }> = [
    {
      id: 'pen',
      icon: PenTool,
      label: 'Annotate',
      onClick: () => console.log('Annotate'),
      color: 'text-amber-400',
    },
    {
      id: 'shapes',
      icon: Shapes,
      label: 'Shapes',
      onClick: () => console.log('Shapes'),
      color: 'text-violet-400',
    },
    {
      id: 'circle',
      icon: CircleDot,
      label: 'Mark',
      onClick: () => console.log('Mark'),
      color: 'text-pink-400',
    },
    {
      id: 'divider1',
      isDivider: true,
    },
    {
      id: 'text',
      icon: Type,
      label: 'Text',
      onClick: () => console.log('Text'),
      color: 'text-blue-400',
    },
    {
      id: 'message',
      icon: MessageCircle,
      label: 'Comment',
      onClick: () => console.log('Comment'),
      color: 'text-cyan-400',
    },
    {
      id: 'grid',
      icon: Grid3x3,
      label: 'Layout',
      onClick: () => console.log('Layout'),
      color: 'text-green-400',
    },
    {
      id: 'divider2',
      isDivider: true,
    },
    {
      id: 'copy',
      icon: Copy,
      label: 'Copy',
      onClick: onCopy,
      color: 'text-slate-400',
    },
    {
      id: 'download',
      icon: Download,
      label: 'Download',
      onClick: onDownload,
      color: 'text-slate-400',
    },
    {
      id: 'share',
      icon: Share2,
      label: 'Share',
      onClick: onShare,
      color: 'text-slate-400',
    },
    {
      id: 'code',
      icon: Code2,
      label: 'Code',
      onClick: onShowCode,
      color: 'text-slate-400',
    },
    {
      id: 'divider3',
      isDivider: true,
    },
    {
      id: 'expand',
      icon: isExpanded ? Minimize2 : Maximize2,
      label: isExpanded ? 'Minimize' : 'Expand',
      onClick: isExpanded ? onMinimize : onExpand,
      color: 'text-slate-400',
    },
  ];

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.3 }}
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-30"
    >
      <div className="flex items-center gap-1 px-4 py-3 rounded-full bg-slate-900/95 backdrop-blur-md border border-slate-700/50 shadow-xl shadow-slate-900/50">
        {tools.map((tool) => {
          if (tool.isDivider) {
            return (
              <div
                key={tool.id}
                className="w-px h-6 bg-slate-700/30 mx-1"
              />
            );
          }

          const Icon = tool.icon;
          const isActive = hoveredTool === tool.id;

          if (!Icon) return null;

          return (
            <motion.button
              key={tool.id}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onMouseEnter={() => setHoveredTool(tool.id)}
              onMouseLeave={() => setHoveredTool(null)}
              onClick={tool.onClick}
              className="relative p-2 rounded-lg hover:bg-slate-800/50 transition-colors group"
              title={tool.label}
            >
              <Icon className={`w-5 h-5 ${tool.color || 'text-slate-400'} transition-colors`} />

              {/* Tooltip */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 rounded text-xs font-medium bg-slate-800 text-slate-200 whitespace-nowrap pointer-events-none"
                  >
                    {tool.label}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

import { AnimatePresence } from 'framer-motion';