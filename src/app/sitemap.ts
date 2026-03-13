import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

const BASE = 'https://depthwise.app';

const SEED_TOPICS = [
  'quantum-mechanics',
  'machine-learning',
  'stoicism',
  'history-of-rome',
  'evolution',
  'javascript',
  'economics',
  'climate-change',
  'consciousness',
  'blockchain',
  'game-theory',
  'philosophy-of-mind',
  'world-war-2',
  'astrophysics',
  'immunology',
  'democracy',
  'thermodynamics',
  'calculus',
  'cognitive-biases',
  'ancient-greece',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/help`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // Topic landing pages
  const topicRoutes: MetadataRoute.Sitemap = SEED_TOPICS.map((topic) => ({
    url: `${BASE}/explore/${topic}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Dynamic: public shared graphs
  let shareRoutes: MetadataRoute.Sitemap = [];
  try {
    const publicSessions = await prisma.graphSession.findMany({
      where: { isPublic: true },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 1000,
    });

    shareRoutes = publicSessions.map((s) => ({
      url: `${BASE}/share/${s.id}`,
      lastModified: s.updatedAt,
      changeFrequency: 'never' as const,
      priority: 0.5,
    }));
  } catch {
    // DB unavailable at build time — skip dynamic routes
  }

  return [...staticRoutes, ...topicRoutes, ...shareRoutes];
}
