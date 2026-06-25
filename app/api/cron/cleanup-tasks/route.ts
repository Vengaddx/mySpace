import { NextRequest } from 'next/server';
import { deleteStaleCompletedTasks } from '@/lib/db';

const RETENTION_DAYS = 10;

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const deleted = await deleteStaleCompletedTasks(RETENTION_DAYS);
    return Response.json({ deleted });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
