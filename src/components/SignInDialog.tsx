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
    signIn('google', { callbackUrl: '/' });
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
      <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 border border-cyan-500/30 rounded-2xl shadow-2xl max-w-md w-full p-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
            <Lock className="w-8 h-8 text-cyan-400" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-3">
            Sign in to Explore
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            To explore deeper into this topic and unlock the full power of knowledge mapping,
            Please sign in with your Google account.
          </p>
        </div>

        {/* Benefits */}
        <div className="space-y-3 mb-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-3 text-sm text-slate-300">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                <Check className="w-3 h-3 text-cyan-400" />
              </div>
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        {/* Sign in button */}
        <button
          onClick={handleSignIn}
          className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium transition-all duration-200 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40"
        >
          Sign in
        </button>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Free to start. No credit card required.
        </p>
      </div>
    </div>
  );
}
