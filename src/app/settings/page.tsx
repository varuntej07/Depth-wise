'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Sparkles,
} from 'lucide-react';

export default function SettingsPage() {
  if (false) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full"
        />
      </div>
    );
  }

  const settingsSections = [
    {
      icon: User,
      title: 'Profile',
      description: 'Manage your account information',
      color: 'from-cyan-500 to-blue-500',
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Configure your notification preferences',
      color: 'from-blue-500 to-violet-500',
    },
    {
      icon: Shield,
      title: 'Privacy & Security',
      description: 'Control your privacy and security settings',
      color: 'from-violet-500 to-purple-500',
    },
    {
      icon: Palette,
      title: 'Appearance',
      description: 'Customize the look and feel',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Globe,
      title: 'Language & Region',
      description: 'Set your language and regional preferences',
      color: 'from-pink-500 to-rose-500',
    },
    {
      icon: Sparkles,
      title: 'AI Preferences',
      description: 'Customize your AI interaction settings',
      color: 'from-rose-500 to-orange-500',
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

        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30">
              <SettingsIcon className="w-6 h-6 text-cyan-400" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              Settings
            </h1>
          </div>
          <p className="text-slate-400 text-lg">
            Manage your account and customize your experience
          </p>
        </motion.div>

        {/* Settings Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsSections.map((section, index) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group p-6 bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 hover:border-cyan-500/50 transition-all cursor-pointer"
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${section.color} bg-opacity-10 mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                  {section.title}
                </h3>
                <p className="text-sm text-slate-400">
                  {section.description}
                </p>
                <div className="mt-4 text-sm text-cyan-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Configure →
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Coming Soon Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 p-6 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-500/30 rounded-2xl"
        >
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-white">Coming Soon</h3>
          </div>
          <p className="text-slate-300">
            We&apos;re working hard to bring you these settings. Stay tuned for updates!
          </p>
        </motion.div>
      </div>
    </div>
  );
}
