export interface SuggestionItem {
  title: string;
  description: string;
}

export const DEFAULT_SUGGESTIONS: SuggestionItem[] = [
  {
    title: 'How does quantum computing work?',
    description: 'Explore the fundamentals of quantum mechanics and computation.',
  },
  {
    title: 'What is artificial intelligence?',
    description: 'Understand machine learning, neural networks, and modern AI systems.',
  },
  {
    title: 'How do black holes form?',
    description: 'Dive into astrophysics and gravitational collapse.',
  },
  {
    title: 'What is blockchain technology?',
    description: 'Learn how distributed ledgers and consensus models work.',
  },
];
