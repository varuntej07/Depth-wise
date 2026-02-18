import SubscriptionPlans from '@/components/SubscriptionPlans';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Pricing - Depthwise',
  description: 'Choose the plan that fits your exploration needs. Start exploring for free or upgrade for unlimited knowledge graphs.',
};

export default function PricingPage() {
  return (
    <div className="relative">
      {/* Back to Home Button */}
      <div className="fixed top-6 left-6 z-50">
        <Link
          href="/home"
          className="flex items-center gap-2 px-4 py-2 bg-[var(--mint-surface)] backdrop-blur-sm border border-[var(--mint-accent-2)] hover:border-[var(--mint-accent-2)] rounded-lg text-[var(--mint-accent-1)] hover:text-[var(--mint-accent-1)] transition-all group"
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
