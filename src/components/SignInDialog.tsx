'use client';

import { signIn } from 'next-auth/react';
import { X, Lock, Check } from 'lucide-react';

interface SignInDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SignInDialog({ isOpen, onClose }: SignInDialogProps) {
  if (!isOpen) return null;

  const handleSignIn = () => {
    signIn('google', { callbackUrl: '/home' });
  };

  const benefits = [
    'Explore unlimited knowledge paths',
    'Save and revisit your graphs',
    'Access advanced AI insights',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-gradient-to-br from-[var(--mint-surface)] to-[var(--mint-elevated)] border border-[var(--mint-accent-2)] rounded-2xl shadow-2xl max-w-md w-full p-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--mint-text-secondary)] hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--mint-accent-1)] to-[var(--mint-accent-3)] border border-[var(--mint-accent-2)] flex items-center justify-center">
            <Lock className="w-8 h-8 text-[#04120e]" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-3">
            Sign in to Explore
          </h2>
          <p className="text-[var(--mint-text-secondary)] text-sm leading-relaxed">
            To explore deeper into this topic and unlock the full power of knowledge mapping,
            Please sign in with your Google account.
          </p>
        </div>

        {/* Benefits */}
        <div className="space-y-3 mb-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-3 text-sm text-[var(--mint-text-secondary)]">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[rgba(16,185,129,0.16)] border border-[var(--mint-accent-2)] flex items-center justify-center">
                <Check className="w-3 h-3 text-[var(--mint-accent-1)]" />
              </div>
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        {/* Sign in button */}
        <button
          onClick={handleSignIn}
          className="w-full px-6 py-3 rounded-lg bg-[image:var(--mint-accent-gradient)] hover:brightness-105 text-[#04120e] font-medium transition-all duration-200 shadow-lg shadow-[0_0_24px_var(--mint-accent-glow)] hover:shadow-[0_0_24px_var(--mint-accent-glow)]"
        >
          Sign in
        </button>

        {/* Footer note */}
        <p className="text-center text-xs text-[var(--mint-text-secondary)] mt-6">
          Free to start. No credit card required.
        </p>
      </div>
    </div>
  );
}
