import { NextRequest } from 'next/server';
import { getTrips, createTrip } from '@/lib/db';

export async function GET() {
  try {
    const trips = await getTrips();
    return Response.json(trips);
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const trip = await createTrip(body);
    return Response.json(trip, { status: 201 });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
