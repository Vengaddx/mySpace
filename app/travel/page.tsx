import { getTrips } from '@/lib/db';

export const dynamic = 'force-dynamic';
import { TravelClient } from '@/components/travel/TravelClient';

export default async function TravelPage() {
  const trips = await getTrips();
  return <TravelClient initialTrips={trips} />;
}
