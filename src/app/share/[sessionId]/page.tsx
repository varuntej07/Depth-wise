import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import SharePageClient from '@/components/SharePageClient';

interface Props {
  params: Promise<{ sessionId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sessionId } = await params;

  const session = await prisma.graphSession.findUnique({
    where: { id: sessionId, isPublic: true },
    include: {
      nodes: { where: { depth: 0 }, take: 1, orderBy: { createdAt: 'asc' } },
    },
  });

  if (!session) {
    return { title: 'Shared Graph – Depthwise' };
  }

  const rootNode = session.nodes[0];
  const topic = session.title ?? session.rootQuery;
  const description = rootNode?.summary ?? rootNode?.content?.slice(0, 160) ?? `Explore "${topic}" as an interactive knowledge tree on Depthwise.`;

  return {
    title: topic,
    description,
    alternates: { canonical: `https://depthwise.app/share/${sessionId}` },
    openGraph: {
      title: `${topic} – Depthwise`,
      description,
      url: `https://depthwise.app/share/${sessionId}`,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${topic} – Depthwise`,
      description,
    },
  };
}

export default async function SharePage({ params }: Props) {
  const { sessionId } = await params;

  // Fetch session data server-side for static HTML (crawlable content)
  const session = await prisma.graphSession.findUnique({
    where: { id: sessionId, isPublic: true },
    include: {
      nodes: {
        where: { depth: 0 },
        take: 1,
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  const topic = session ? (session.title ?? session.rootQuery) : null;
  const rootNode = session?.nodes[0] ?? null;

  return (
    <>
      {/* SSR content for crawlers — visually hidden, always present in HTML */}
      {topic && (
        <div className="sr-only">
          <h1>{topic}</h1>
          {rootNode?.content && <p>{rootNode.content}</p>}
          {rootNode?.summary && <p>{rootNode.summary}</p>}
        </div>
      )}

      {/* Interactive graph — client component */}
      <SharePageClient sessionId={sessionId} />
    </>
  );
}
