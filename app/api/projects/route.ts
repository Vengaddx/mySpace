import { NextRequest } from 'next/server';
import { createProject } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const project = await createProject(body);
    return Response.json(project, { status: 201 });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
