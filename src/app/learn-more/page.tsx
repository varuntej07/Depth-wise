'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  Lightbulb,
  Target,
  Zap,
  Users,
  Heart,
  GitBranch,
  Sparkles,
  Play,
  FileText,
} from 'lucide-react';

export default function LearnMorePage() {
  const features = [
    {
      icon: GitBranch,
      title: 'Interactive Knowledge Graphs',
      description: 'Explore topics through connected nodes that reveal relationships and deepen understanding.',
      gradient: 'from-cyan-500 to-blue-500',
    },
    {
      icon: Zap,
      title: 'AI-Powered Insights',
      description: 'Get intelligent explanations and context for every concept you explore.',
      gradient: 'from-blue-500 to-violet-500',
    },
    {
      icon: Target,
      title: 'Personalized Learning Paths',
      description: 'Follow customized exploration routes based on your interests and knowledge level.',
      gradient: 'from-violet-500 to-purple-500',
    },
    {
      icon: Users,
      title: 'Collaborative Exploration',
      description: 'Share your knowledge graphs and learn together with others.',
      gradient: 'from-purple-500 to-pink-500',
    },
  ];

  const resources = [
    {
      icon: Play,
      title: 'Getting Started Guide',
      description: 'Learn the basics of exploring knowledge graphs',
      link: '#',
    },
    {
      icon: FileText,
      title: 'Documentation',
      description: 'Comprehensive guides and tutorials',
      link: '#',
    },
    {
      icon: Lightbulb,
      title: 'Best Practices',
      description: 'Tips for effective knowledge exploration',
      link: '#',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 backdrop-blur-sm border border-cyan-500/30 hover:border-cyan-500/50 rounded-lg text-cyan-400 hover:text-cyan-300 transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
        </div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 mb-4">
            <BookOpen className="w-12 h-12 text-cyan-400" />
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent mb-4">
            Learn More
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Discover how our AI-powered knowledge graph explorer can transform the way you learn and explore information.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Powerful Features
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="p-6 bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 hover:border-cyan-500/50 transition-all"
                >
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} bg-opacity-10 mb-4`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-300">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Resources Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Learning Resources
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {resources.map((resource, index) => {
              const Icon = resource.icon;
              return (
                <motion.a
                  key={resource.title}
                  href={resource.link}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="group p-6 bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 hover:border-violet-500/50 transition-all cursor-pointer"
                >
                  <Icon className="w-10 h-10 text-violet-400 mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-violet-400 transition-colors">
                    {resource.title}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {resource.description}
                  </p>
                  <div className="mt-4 text-sm text-violet-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Explore →
                  </div>
                </motion.a>
              );
            })}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="p-8 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border-2 border-cyan-500/30 rounded-3xl text-center"
        >
          <Sparkles className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Exploring?
          </h2>
          <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
            Begin your journey of discovery with our AI-powered knowledge graph explorer.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-violet-500 hover:shadow-lg hover:shadow-cyan-500/50 rounded-xl text-white font-medium transition-all hover:scale-105"
          >
            Start Exploring
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
