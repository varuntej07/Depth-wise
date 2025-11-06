'use client';

import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import { ShareModal } from './ShareModal';
import useGraphStore from '@/store/graphStore';

/**
 * ShareButton Component
 *
 * A button that opens the share modal.
 * Only visible when the user has a graph loaded (has a sessionId).
 *
 * This button should be placed in the header or toolbar
 * where users can easily access it.
 */
export const ShareButton: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get session info from store to determine if we should show the button
  const { sessionId, isPublic } = useGraphStore();

  // Don't show the button if there's no graph loaded
  if (!sessionId) {
    return null;
  }

  return (
    <>
      {/* Share Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-500/50 rounded-lg transition-all group"
        title="Share this graph"
      >
        <Share2 className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
        <span className="hidden sm:block text-sm text-cyan-400 font-medium">
          Share
        </span>

        {/* Show badge if already public */}
        {isPublic && (
          <span className="hidden sm:flex items-center justify-center w-2 h-2 bg-green-400 rounded-full">
            <span className="absolute w-2 h-2 bg-green-400 rounded-full animate-ping" />
          </span>
        )}
      </button>

      {/* Share Modal */}
      <ShareModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
