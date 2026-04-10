import { NextRequest } from 'next/server';
import { getTasks, createTask } from '@/lib/db';

export async function GET() {
  try {
    const tasks = await getTasks();
    return Response.json(tasks);
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const task = await createTask(body);
    return Response.json(task, { status: 201 });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
