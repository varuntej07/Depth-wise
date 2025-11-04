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
      className="w-full p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/30 hover:bg-slate-800/50 transition-all text-left group"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-500/20 transition-colors">
          <Sparkles className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors truncate">
            {title}
          </p>
          {description && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{description}</p>
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