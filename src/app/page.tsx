import type { Metadata } from 'next';
import LandingPageClient from '@/components/LandingPageClient';

export const metadata: Metadata = {
  title: 'Depthwise – Explore Any Topic as a Visual Knowledge Tree',
  description:
    'Depthwise uses AI to let you explore any topic as an interactive branching knowledge tree. Go deep on any branch, not just linearly.',
  alternates: {
    canonical: 'https://depthwise.app',
  },
};

export default function Page() {
  return <LandingPageClient />;
}
