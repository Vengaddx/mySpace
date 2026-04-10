import { NextRequest } from 'next/server';
import { getGoals, createGoal } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const month = new URL(req.url).searchParams.get('month') ?? undefined;
    const goals = await getGoals(month);
    return Response.json(goals);
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const goal = await createGoal(body);
    return Response.json(goal, { status: 201 });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
