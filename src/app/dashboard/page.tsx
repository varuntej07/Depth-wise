'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Bookmark,
  Clock3,
  ExternalLink,
  Filter,
  Globe,
  LayoutGrid,
  TrendingUp,
  X,
} from 'lucide-react';

type SortKey = 'recent' | 'title' | 'depth';

type DashboardCard = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  lastOpened: string;
  openedAt: number;
  category: string;
  depth: number;
  gradient: string;
};

const previewStats = [
  { label: 'Public Graphs', value: '1,240+', icon: LayoutGrid },
  { label: 'Topics Covered', value: '86', icon: Globe },
  { label: 'Avg. Insights / Graph', value: '42', icon: BarChart3 },
  { label: 'Weekly Growth', value: '+18%', icon: TrendingUp },
];

const exploreCards: DashboardCard[] = [
  {
    id: 'exp-1',
    title: 'AI Adoption Atlas',
    description: 'How regulation and infrastructure shape enterprise model rollout timelines.',
    tags: ['Technology', 'Policy', 'Timeline'],
    lastOpened: '15 min ago',
    openedAt: 1708276500,
    category: 'Technology',
    depth: 4,
    gradient: 'from-[var(--mint-accent-1)] via-[var(--mint-accent-2)] to-[var(--mint-accent-3)]',
  },
  {
    id: 'exp-2',
    title: 'Climate Systems Map',
    description: 'Linked causes behind emissions, weather shocks, and adaptation outcomes.',
    tags: ['Climate', 'Science', 'Systems'],
    lastOpened: '34 min ago',
    openedAt: 1708275300,
    category: 'Science',
    depth: 5,
    gradient: 'from-[var(--mint-accent-1)] via-[var(--mint-accent-2)] to-[var(--mint-accent-3)]',
  },
  {
    id: 'exp-3',
    title: 'Global Health Signals',
    description: 'Regional intervention patterns tied to disease spread and response capacity.',
    tags: ['Health', 'Data', 'Forecasting'],
    lastOpened: '1h ago',
    openedAt: 1708273200,
    category: 'Health',
    depth: 3,
    gradient: 'from-[var(--mint-accent-1)] via-[var(--mint-accent-2)] to-[var(--mint-accent-3)]',
  },
  {
    id: 'exp-4',
    title: 'Venture Funding Pulse',
    description: 'Cross-sector capital movement with stage, geography, and cycle overlays.',
    tags: ['Finance', 'Startup', 'Trends'],
    lastOpened: '2h ago',
    openedAt: 1708269600,
    category: 'Finance',
    depth: 2,
    gradient: 'from-[var(--mint-accent-1)] via-[var(--mint-accent-2)] to-[var(--mint-accent-3)]',
  },
  {
    id: 'exp-5',
    title: 'Urban Mobility Web',
    description: 'Transit policy decisions and usage shifts visualized as connected networks.',
    tags: ['Mobility', 'Cities', 'Policy'],
    lastOpened: '3h ago',
    openedAt: 1708266000,
    category: 'Policy',
    depth: 4,
    gradient: 'from-[var(--mint-accent-1)] via-[var(--mint-accent-2)] to-[var(--mint-accent-3)]',
  },
  {
    id: 'exp-6',
    title: 'Education Outcomes Matrix',
    description: 'Programs, teacher support, and assessment quality impact student outcomes.',
    tags: ['Education', 'Impact', 'Research'],
    lastOpened: '4h ago',
    openedAt: 1708262400,
    category: 'Education',
    depth: 3,
    gradient: 'from-[var(--mint-accent-1)] via-[var(--mint-accent-2)] to-[var(--mint-accent-3)]',
  },
  {
    id: 'exp-7',
    title: 'Supply Chain Friction Graph',
    description: 'Upstream dependencies and freight bottlenecks mapped by region.',
    tags: ['Operations', 'Logistics', 'Risk'],
    lastOpened: '5h ago',
    openedAt: 1708258800,
    category: 'Operations',
    depth: 5,
    gradient: 'from-[var(--mint-accent-1)] via-[var(--mint-accent-2)] to-[var(--mint-accent-3)]',
  },
  {
    id: 'exp-8',
    title: 'Energy Transition Index',
    description: 'Generation mix changes tied to policy, storage, and pricing pressure.',
    tags: ['Energy', 'Markets', 'Climate'],
    lastOpened: '7h ago',
    openedAt: 1708251600,
    category: 'Energy',
    depth: 4,
    gradient: 'from-[var(--mint-accent-1)] via-[var(--mint-accent-2)] to-[var(--mint-accent-3)]',
  },
  {
    id: 'exp-9',
    title: 'Consumer Sentiment Tree',
    description: 'Brand trust and spending intent organized into leading sentiment branches.',
    tags: ['Consumer', 'Behavior', 'Insights'],
    lastOpened: '9h ago',
    openedAt: 1708244400,
    category: 'Consumer',
    depth: 2,
    gradient: 'from-[var(--mint-accent-1)] via-[var(--mint-accent-2)] to-[var(--mint-accent-3)]',
  },
  {
    id: 'exp-10',
    title: 'Semiconductor Risk Atlas',
    description: 'Manufacturing, sourcing, and geopolitical chokepoints connected in one map.',
    tags: ['Hardware', 'Risk', 'Industry'],
    lastOpened: '12h ago',
    openedAt: 1708233600,
    category: 'Industry',
    depth: 5,
    gradient: 'from-[var(--mint-accent-1)] via-[var(--mint-accent-2)] to-[var(--mint-accent-3)]',
  },
  {
    id: 'exp-11',
    title: 'Startup GTM Patterns',
    description: 'Acquisition loops and product velocity drivers by business model.',
    tags: ['Go-to-Market', 'Growth', 'B2B'],
    lastOpened: '18h ago',
    openedAt: 1708212000,
    category: 'Startup',
    depth: 3,
    gradient: 'from-[var(--mint-accent-1)] via-[var(--mint-accent-2)] to-[var(--mint-accent-3)]',
  },
  {
    id: 'exp-12',
    title: 'Global Trade Corridors',
    description: 'Trade routes, tariffs, and production shifts linked across regions.',
    tags: ['Trade', 'Macro', 'Policy'],
    lastOpened: '1 day ago',
    openedAt: 1708190400,
    category: 'Macro',
    depth: 4,
    gradient: 'from-[var(--mint-accent-1)] via-[var(--mint-accent-2)] to-[var(--mint-accent-3)]',
  },
  {
    id: 'exp-13',
    title: 'AI Safety Debates',
    description: 'Argument trees comparing open, closed, and hybrid governance models.',
    tags: ['AI', 'Governance', 'Debate'],
    lastOpened: '2 days ago',
    openedAt: 1708104000,
    category: 'Technology',
    depth: 5,
    gradient: 'from-[var(--mint-accent-1)] via-[var(--mint-accent-2)] to-[var(--mint-accent-3)]',
  },
  {
    id: 'exp-14',
    title: 'Healthcare Cost Drivers',
    description: 'Pricing, policy, and utilization branches behind care cost inflation.',
    tags: ['Healthcare', 'Economics', 'Data'],
    lastOpened: '3 days ago',
    openedAt: 1708017600,
    category: 'Health',
    depth: 3,
    gradient: 'from-[var(--mint-accent-1)] via-[var(--mint-accent-2)] to-[var(--mint-accent-3)]',
  },
  {
    id: 'exp-15',
    title: 'Retail Demand Signals',
    description: 'Seasonality and promotion effects tracked across demand clusters.',
    tags: ['Retail', 'Forecasting', 'Analytics'],
    lastOpened: '4 days ago',
    openedAt: 1707931200,
    category: 'Consumer',
    depth: 2,
    gradient: 'from-[var(--mint-accent-1)] via-[var(--mint-accent-2)] to-[var(--mint-accent-3)]',
  },
];

const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'recent', label: 'Recently Opened' },
  { key: 'title', label: 'Title (A-Z)' },
  { key: 'depth', label: 'Depth (High-Low)' },
];

const sortCards = (cards: DashboardCard[], sortKey: SortKey) => {
  const sorted = [...cards];

  if (sortKey === 'title') {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
    return sorted;
  }

  if (sortKey === 'depth') {
    sorted.sort((a, b) => b.depth - a.depth);
    return sorted;
  }

  sorted.sort((a, b) => b.openedAt - a.openedAt);
  return sorted;
};

export default function DashboardPage() {
  const [sortKey, setSortKey] = useState<SortKey>('recent');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDepth, setSelectedDepth] = useState('All');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isMoreCategoriesOpen, setIsMoreCategoriesOpen] = useState(false);
  const [isExploreLoading, setIsExploreLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsExploreLoading(false);
    }, 900);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isFilterDrawerOpen) return;
    setIsMoreCategoriesOpen(false);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFilterDrawerOpen]);

  const categoryOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const card of exploreCards) {
      counts.set(card.category, (counts.get(card.category) || 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([category]) => category);
  }, []);

  const primaryCategoryOptions = useMemo(() => ['All', ...categoryOptions.slice(0, 8)], [categoryOptions]);
  const moreCategoryOptions = useMemo(() => categoryOptions.slice(8), [categoryOptions]);

  const depthOptions = useMemo(() => {
    return ['All', '2', '3', '4', '5'];
  }, []);

  const filteredExploreCards = useMemo(() => {
    const filtered = exploreCards.filter((card) => {
      const categoryMatch = selectedCategory === 'All' || card.category === selectedCategory;
      const depthMatch = selectedDepth === 'All' || card.depth === Number(selectedDepth);
      return categoryMatch && depthMatch;
    });
    return sortCards(filtered, sortKey);
  }, [sortKey, selectedCategory, selectedDepth]);

  const renderFilters = () => (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">Category</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {['All', ...categoryOptions].map((category) => {
            const active = category === selectedCategory;
            return (
              <button
                key={category}
                type="button"
                onClick={() => {
                  setSelectedCategory(category);
                  setIsMoreCategoriesOpen(false);
                }}
                className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                  active
                    ? 'border-[var(--mint-accent-2)] bg-[rgba(16,185,129,0.16)] text-[var(--mint-accent-1)]'
                    : 'border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.3)] text-[var(--mint-text-secondary)] hover:border-[var(--mint-accent-2)] hover:text-white'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">Depth</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {depthOptions.map((depth) => {
            const active = depth === selectedDepth;
            return (
              <button
                key={depth}
                type="button"
                onClick={() => setSelectedDepth(depth)}
                className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                  active
                    ? 'border-[var(--mint-accent-2)] bg-[rgba(16,185,129,0.16)] text-[var(--mint-accent-1)]'
                    : 'border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.3)] text-[var(--mint-text-secondary)] hover:border-[var(--mint-accent-2)] hover:text-white'
                }`}
              >
                {depth === 'All' ? 'All' : `D${depth}`}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">Sort</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {sortOptions.map((option) => {
            const active = option.key === sortKey;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => setSortKey(option.key)}
                className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                  active
                    ? 'border-[var(--mint-accent-2)] bg-[rgba(16,185,129,0.16)] text-[var(--mint-accent-1)]'
                    : 'border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.3)] text-[var(--mint-text-secondary)] hover:border-[var(--mint-accent-2)] hover:text-white'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--mint-page)] text-white antialiased">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(1000px 560px at 7% -10%, rgba(110,231,183,0.18), transparent 58%), radial-gradient(900px 580px at 95% 0%, rgba(16,185,129,0.13), transparent 60%), linear-gradient(180deg, #050D0B 0%, #0D1A16 42%, #050D0B 100%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'linear-gradient(rgba(209,213,219,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(209,213,219,0.07) 1px, transparent 1px)',
          backgroundSize: '34px 34px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="space-y-3">
            <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Curated recents and explorations, crafted for fast review.
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/explore"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[image:var(--mint-accent-gradient)] px-5 py-2.5 text-sm font-semibold text-[#04120e] shadow-[0_8px_24px_var(--mint-accent-glow)] transition hover:-translate-y-0.5 hover:brightness-105"
            >
              Explore Now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {previewStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="group rounded-[22px] border border-[var(--mint-elevated)] bg-[rgba(13,26,22,0.82)] p-5 shadow-[0_22px_45px_rgba(5,13,11,0.55)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-[var(--mint-accent-2)] hover:shadow-[0_28px_56px_rgba(16,185,129,0.28)]"
              >
                <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--mint-accent-2)] bg-[rgba(16,185,129,0.16)] transition group-hover:border-[var(--mint-accent-2)] group-hover:bg-[rgba(16,185,129,0.16)]">
                  <Icon className="h-5 w-5 text-[var(--mint-accent-1)]" />
                </div>
                <p className="text-3xl font-semibold tracking-tight text-white">{stat.value}</p>
                <p className="mt-1 text-sm text-[var(--mint-text-secondary)]">{stat.label}</p>
              </div>
            );
          })}
        </motion.div>

        <div className="mt-7">
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="space-y-5"
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Explore</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-[2rem]">Featured Graphs</h2>
                </div>
                <div className="flex flex-col items-start gap-3 sm:items-end">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full border border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.34)] px-3 py-1 text-xs text-[var(--mint-text-secondary)]">
                      {filteredExploreCards.length} items
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsFilterDrawerOpen(true)}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.3)] px-3 py-1.5 text-xs font-medium text-[var(--mint-text-secondary)] transition hover:border-[var(--mint-accent-2)] hover:text-white lg:hidden"
                    >
                      <Filter className="h-3.5 w-3.5" />
                      Filters
                    </button>
                  </div>
                  <div className="hidden max-w-[560px] flex-wrap items-center justify-end gap-2 lg:flex">
                    <span className="text-[10px] uppercase tracking-[0.16em] text-white/50">Sort</span>
                    {sortOptions.map((option) => {
                      const active = option.key === sortKey;
                      return (
                        <button
                          key={`desktop-sort-${option.key}`}
                          type="button"
                          onClick={() => setSortKey(option.key)}
                          className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                            active
                              ? 'border-[var(--mint-accent-2)] bg-[rgba(16,185,129,0.16)] text-[var(--mint-accent-1)]'
                    : 'border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.3)] text-[var(--mint-text-secondary)] hover:border-[var(--mint-accent-2)] hover:text-white'
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="hidden flex-wrap items-start gap-4 lg:flex">
                <div className="relative flex flex-wrap items-center gap-2">
                  <span className="text-[10px] uppercase tracking-[0.16em] text-white/50">Category</span>
                  {primaryCategoryOptions.map((category) => {
                    const active = category === selectedCategory;
                    return (
                      <button
                        key={`desktop-category-${category}`}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(category);
                          setIsMoreCategoriesOpen(false);
                        }}
                        className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                          active
                            ? 'border-[var(--mint-accent-2)] bg-[rgba(16,185,129,0.16)] text-[var(--mint-accent-1)]'
                    : 'border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.3)] text-[var(--mint-text-secondary)] hover:border-[var(--mint-accent-2)] hover:text-white'
                        }`}
                      >
                        {category}
                      </button>
                    );
                  })}
                  {moreCategoryOptions.length > 0 && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsMoreCategoriesOpen((current) => !current)}
                        className="rounded-full border border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.3)] px-2.5 py-1 text-[11px] text-[var(--mint-text-secondary)] transition hover:border-[var(--mint-accent-2)] hover:text-white"
                      >
                        More
                      </button>
                      <AnimatePresence>
                        {isMoreCategoriesOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.98 }}
                            transition={{ duration: 0.16, ease: 'easeOut' }}
                            className="absolute left-0 top-9 z-20 w-72 rounded-xl border border-[var(--mint-elevated)] bg-[rgba(13,26,22,0.96)] p-3 shadow-[0_20px_45px_rgba(5,13,11,0.62)]"
                          >
                            <div className="flex flex-wrap gap-2">
                              {moreCategoryOptions.map((category) => {
                                const active = category === selectedCategory;
                                return (
                                  <button
                                    key={`desktop-more-category-${category}`}
                                    type="button"
                                    onClick={() => {
                                      setSelectedCategory(category);
                                      setIsMoreCategoriesOpen(false);
                                    }}
                                    className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                                      active
                                        ? 'border-[var(--mint-accent-2)] bg-[rgba(16,185,129,0.16)] text-[var(--mint-accent-1)]'
                    : 'border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.3)] text-[var(--mint-text-secondary)] hover:border-[var(--mint-accent-2)] hover:text-white'
                                    }`}
                                  >
                                    {category}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] uppercase tracking-[0.16em] text-white/50">Depth</span>
                  {depthOptions.map((depth) => {
                    const active = depth === selectedDepth;
                    return (
                      <button
                        key={`desktop-depth-${depth}`}
                        type="button"
                        onClick={() => setSelectedDepth(depth)}
                        className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                          active
                            ? 'border-[var(--mint-accent-2)] bg-[rgba(16,185,129,0.16)] text-[var(--mint-accent-1)]'
                            : 'border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.3)] text-[var(--mint-text-secondary)] hover:border-[var(--mint-accent-2)] hover:text-white'
                        }`}
                      >
                        {depth === 'All' ? 'All' : `D${depth}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {isExploreLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div
                    key={`explore-skeleton-${index}`}
                    className="overflow-hidden rounded-[18px] border border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.34)]"
                  >
                    <div className="h-28 animate-pulse bg-[var(--mint-elevated)]" />
                    <div className="space-y-2.5 p-3">
                      <div className="h-3.5 w-4/5 animate-pulse rounded bg-[var(--mint-elevated)]" />
                      <div className="flex gap-2">
                        <div className="h-4.5 w-14 animate-pulse rounded-full bg-[var(--mint-elevated)]" />
                        <div className="h-4.5 w-12 animate-pulse rounded-full bg-[var(--mint-elevated)]" />
                      </div>
                      <div className="h-3 w-20 animate-pulse rounded bg-[var(--mint-elevated)]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredExploreCards.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.28)] p-8 text-center">
                <p className="text-base font-medium text-white">No graphs match these filters.</p>
                <p className="mt-2 text-sm text-[var(--mint-text-secondary)]">Clear category or depth filters to see more results.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedDepth('All');
                  }}
                  className="mt-4 rounded-full border border-[var(--mint-elevated)] px-4 py-2 text-xs font-medium text-[var(--mint-text-secondary)] transition hover:border-[var(--mint-accent-2)] hover:text-white"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {filteredExploreCards.map((card) => (
                  <article
                    key={card.id}
                    className="group relative overflow-hidden rounded-[18px] border border-[var(--mint-elevated)] bg-[rgba(13,26,22,0.84)] shadow-[0_16px_30px_rgba(5,13,11,0.45)] transition duration-300 hover:-translate-y-1 hover:border-[var(--mint-accent-2)] hover:shadow-[0_22px_44px_rgba(16,185,129,0.28)]"
                  >
                    <div className={`h-28 bg-gradient-to-br ${card.gradient}`} />
                    <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5 opacity-0 transition group-hover:opacity-100">
                      <button
                        type="button"
                        aria-label="Open graph"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white/90 transition hover:border-white/50"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        aria-label="Bookmark graph"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white/90 transition hover:border-white/50"
                      >
                        <Bookmark className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="p-3">
                      <h3 className="truncate text-sm font-semibold text-white">{card.title}</h3>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {card.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.35)] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[var(--mint-text-secondary)]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-white/60">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 className="h-3.5 w-3.5" />
                          {card.lastOpened}
                        </span>
                        <span className="rounded-full border border-[var(--mint-accent-2)] bg-[rgba(16,185,129,0.16)] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[var(--mint-accent-1)]">
                          D{card.depth}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </motion.section>
        </div>
      </div>

      <AnimatePresence>
        {isFilterDrawerOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close filters"
              className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px] lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterDrawerOpen(false)}
            />
            <motion.aside
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed inset-x-4 top-20 z-50 max-h-[72vh] overflow-y-auto rounded-2xl border border-[var(--mint-elevated)] bg-[rgba(13,26,22,0.96)] p-4 shadow-2xl backdrop-blur-xl lg:hidden"
            >
              <div className="mb-4 flex items-center justify-between border-b border-[var(--mint-elevated)] pb-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-[var(--mint-accent-1)]" />
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-white/75">Filters</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--mint-elevated)] bg-[rgba(32,52,45,0.3)] text-[var(--mint-text-secondary)] transition hover:border-[var(--mint-accent-2)] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {renderFilters()}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
