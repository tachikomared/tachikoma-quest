import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const domain = process.env.NEXT_PUBLIC_DOMAIN;
  const questId = params.id;
  const embedUrl = `https://${domain}/api/quests/${questId}/embed`;

  return {
    title: 'Tachikoma Quest',
    openGraph: {
      title: 'Tachikoma Quest',
      description: 'Complete onchain and social tasks.',
      url: `https://${domain}/quest/${questId}`,
    },
    other: {
      'fc:frame': 'vNext',
      'fc:frame:app_id': 'tachikoma-quest',
      'fc:miniapp:url': `https://${domain}/quest/${questId}`,
    },
  };
}

export default function QuestPage() {
  return <div>Quest Detail Page with proper metadata tags</div>;
}
