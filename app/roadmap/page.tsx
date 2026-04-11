import { RoadmapClient } from '@/components/roadmap/RoadmapClient';
import { MOCK_GOALS, LIFE_AREAS } from '@/lib/roadmap-data';

export const metadata = { title: 'Roadmap — mySpace' };

export default function RoadmapPage() {
  return <RoadmapClient initialGoals={MOCK_GOALS} lifeAreas={LIFE_AREAS} />;
}
