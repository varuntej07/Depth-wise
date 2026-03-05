'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Loading...',
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[var(--mint-surface)] border border-[var(--mint-elevated)] rounded-lg p-8 shadow-2xl flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-[var(--mint-accent-1)]" />
        <p className="text-lg font-medium text-[var(--mint-text-secondary)]">{message}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
