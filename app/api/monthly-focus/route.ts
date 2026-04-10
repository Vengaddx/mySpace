import { NextRequest } from 'next/server';
import { getMonthlyFocus, upsertMonthlyFocus } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const month = new URL(req.url).searchParams.get('month') ?? undefined;
    const focus = await getMonthlyFocus(month);
    return Response.json(focus);
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const focus = await upsertMonthlyFocus(body);
    return Response.json(focus);
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
