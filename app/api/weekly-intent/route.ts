import { NextRequest } from 'next/server';
import { getWeeklyIntent, upsertWeeklyIntent } from '@/lib/db';

export async function GET() {
  try {
    const intent = await getWeeklyIntent();
    return Response.json(intent);
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const intent = await upsertWeeklyIntent(body);
    return Response.json(intent);
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
