import { NextRequest } from 'next/server';
import { updateMonthlyGoal } from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const goal = await updateMonthlyGoal(id, body);
    return Response.json(goal);
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
