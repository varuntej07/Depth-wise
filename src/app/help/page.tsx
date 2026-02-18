'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  HelpCircle,
  MessageCircle,
  Mail,
  Book,
  Search,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Users,
  FileQuestion,
} from 'lucide-react';

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const faqCategories = [
    {
      icon: Sparkles,
      title: 'Getting Started',
      questions: [
        'How do I create my first knowledge graph?',
        'What are explorations and how do they work?',
        'How can I save my progress?',
      ],
    },
    {
      icon: FileQuestion,
      title: 'Account & Billing',
      questions: [
        'How do I upgrade my plan?',
        'What payment methods are accepted?',
        'How do I cancel my subscription?',
      ],
    },
    {
      icon: MessageCircle,
      title: 'Features',
      questions: [
        'How does the AI-powered exploration work?',
        'Can I share my knowledge graphs?',
        'What is the maximum depth for explorations?',
      ],
    },
  ];

  const contactOptions = [
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Chat with our support team',
      action: 'Start Chat',
      color: 'from-[var(--mint-accent-1)] to-[var(--mint-accent-3)]',
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'support@depthwise.ai',
      action: 'Send Email',
      color: 'from-[var(--mint-accent-1)] to-[var(--mint-accent-3)]',
    },
    {
      icon: Users,
      title: 'Community Forum',
      description: 'Connect with other users',
      action: 'Visit Forum',
      color: 'from-[var(--mint-accent-1)] to-[var(--mint-accent-3)]',
    },
    {
      icon: Book,
      title: 'Documentation',
      description: 'Browse our guides',
      action: 'View Docs',
      color: 'from-[var(--mint-accent-1)] to-[var(--mint-accent-3)]',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--mint-page)] via-[var(--mint-surface)] to-[var(--mint-page)] text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/home"
            className="flex items-center gap-2 px-4 py-2 bg-[var(--mint-surface)] backdrop-blur-sm border border-[var(--mint-accent-2)] hover:border-[var(--mint-accent-2)] rounded-lg text-[var(--mint-accent-1)] hover:text-[var(--mint-accent-1)] transition-all group"
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
          <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-[var(--mint-accent-1)] to-[var(--mint-accent-3)] border border-[var(--mint-accent-2)] mb-4">
            <HelpCircle className="w-12 h-12 text-[var(--mint-accent-1)]" />
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-[var(--mint-accent-1)] via-[var(--mint-accent-2)] to-[var(--mint-accent-3)] bg-clip-text text-transparent mb-4">
            How can we help?
          </h1>
          <p className="text-xl text-[var(--mint-text-secondary)] max-w-3xl mx-auto mb-8">
            Find answers to common questions or get in touch with our support team
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--mint-text-secondary)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for help..."
              className="w-full pl-12 pr-4 py-4 bg-[var(--mint-elevated)] backdrop-blur border border-[var(--mint-elevated)] rounded-xl text-white placeholder:text-[var(--mint-text-secondary)] focus:outline-none focus:border-[var(--mint-accent-2)] transition-colors"
            />
          </div>
        </motion.div>

        {/* Contact Options Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Get in Touch
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactOptions.map((option, index) => {
              const Icon = option.icon;
              return (
                <motion.div
                  key={option.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="group p-6 bg-[var(--mint-elevated)] backdrop-blur rounded-2xl border border-[var(--mint-elevated)] hover:border-[var(--mint-accent-2)] transition-all cursor-pointer"
                >
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${option.color} bg-opacity-10 mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {option.title}
                  </h3>
                  <p className="text-sm text-[var(--mint-text-secondary)] mb-4">
                    {option.description}
                  </p>
                  <button className="text-sm text-[var(--mint-accent-1)] font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                    {option.action}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* FAQ Categories */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {faqCategories.map((category, index) => {
              const Icon = category.icon;
              return (
                <motion.div
                  key={category.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="p-6 bg-[var(--mint-elevated)] backdrop-blur rounded-2xl border border-[var(--mint-elevated)]"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Icon className="w-6 h-6 text-[var(--mint-accent-1)]" />
                    <h3 className="text-lg font-bold text-white">
                      {category.title}
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {category.questions.map((question) => (
                      <button
                        key={question}
                        className="w-full text-left text-sm text-[var(--mint-text-secondary)] hover:text-[var(--mint-accent-1)] transition-colors flex items-start gap-2 group"
                      >
                        <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0 text-[var(--mint-text-secondary)] group-hover:text-[var(--mint-accent-1)]" />
                        <span>{question}</span>
                      </button>
                    ))}
                  </div>
                  <button className="mt-4 w-full text-sm text-[var(--mint-accent-1)] font-medium hover:text-[var(--mint-accent-1)] transition-colors flex items-center justify-center gap-1">
                    View All
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Still Need Help Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="p-8 bg-gradient-to-br from-[var(--mint-accent-1)] to-[var(--mint-accent-3)] border-2 border-[var(--mint-accent-2)] rounded-3xl text-center"
        >
          <MessageCircle className="w-12 h-12 text-[var(--mint-accent-1)] mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-4">
            Still need help?
          </h2>
          <p className="text-[var(--mint-text-secondary)] mb-6 max-w-2xl mx-auto">
            Our support team is here to assist you with any questions or issues you may have.
          </p>
          <button className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[var(--mint-accent-1)] to-[var(--mint-accent-3)] hover:shadow-lg hover:shadow-[0_0_24px_var(--mint-accent-glow)] rounded-xl text-white font-medium transition-all hover:scale-105">
            Contact Support
            <MessageCircle className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
