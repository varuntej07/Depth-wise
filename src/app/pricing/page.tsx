import SubscriptionPlans from '@/components/SubscriptionPlans';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Pricing - Knowledge Graph Explorer',
  description: 'Choose the plan that fits your exploration needs',
};

export default function PricingPage() {
  return (
    <div className="relative">
      {/* Back to Home Button */}
      <div className="fixed top-6 left-6 z-50">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 backdrop-blur-sm border border-cyan-500/30 hover:border-cyan-500/50 rounded-lg text-cyan-400 hover:text-cyan-300 transition-all group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Home</span>
        </Link>
      </div>

      {/* Subscription Plans */}
      <SubscriptionPlans />
    </div>
  );
}
