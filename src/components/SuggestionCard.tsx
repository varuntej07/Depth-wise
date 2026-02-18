'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface SuggestionCardProps {
  title: string;
  description?: string;
  onClick: () => void;
  index?: number;
}

const SUGGESTION_EXAMPLES = [
  {
    title: 'How does quantum computing work?',
    description: 'Explore the fundamentals of quantum mechanics and computation',
  },
  {
    title: 'What is artificial intelligence?',
    description: 'Understand machine learning, neural networks, and AI systems',
  },
  {
    title: 'How do black holes form?',
    description: 'Dive into astrophysics and gravitational phenomena',
  },
  {
    title: 'What is blockchain technology?',
    description: 'Learn about distributed systems and cryptocurrency',
  },
];

export function SuggestionCard({ title, description, onClick, index = 0 }: SuggestionCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group w-full rounded-xl border border-[var(--mint-elevated)] bg-[rgba(13,26,22,0.82)] p-4 text-left transition-all hover:border-[var(--mint-accent-2)] hover:bg-[rgba(32,52,45,0.46)]"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[rgba(16,185,129,0.16)] transition-colors group-hover:bg-[rgba(16,185,129,0.16)]">
          <Sparkles className="h-4 w-4 text-[var(--mint-accent-1)]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white transition-colors group-hover:text-[var(--mint-accent-1)]">
            {title}
          </p>
          {description && (
            <p className="mt-1 line-clamp-2 text-xs text-[var(--mint-text-secondary)]">{description}</p>
          )}
        </div>
      </div>
    </motion.button>
  );
}

interface SuggestionsGridProps {
  onSelectSuggestion: (query: string) => void;
  displayCount?: number;
}

export function SuggestionsGrid({ onSelectSuggestion, displayCount = 2 }: SuggestionsGridProps) {
  const suggestions = SUGGESTION_EXAMPLES.slice(0, displayCount);

  return (
    <div className="w-full max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
      {suggestions.map((suggestion, index) => (
        <SuggestionCard
          key={suggestion.title}
          title={suggestion.title}
          description={suggestion.description}
          onClick={() => onSelectSuggestion(suggestion.title)}
          index={index}
        />
      ))}
    </div>
  );
}

export function getSuggestionExamples() {
  return SUGGESTION_EXAMPLES;
}
