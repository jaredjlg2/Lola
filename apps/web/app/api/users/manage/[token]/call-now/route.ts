import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dispatchDueCalls } from '@/lib/scheduler';

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const user = await prisma.user.findUnique({ where: { manageToken: token } });
  if (!user) return NextResponse.json({ error: 'Invalid manage token' }, { status: 404 });

  const scheduledFor = new Date(Date.now() + 1_000);
  await prisma.callJob.create({
    data: {
      userId: user.id,
      scheduledFor,
      status: 'scheduled'
    }
  });

  console.log(`[call-now] queued immediate call for user=${user.id} scheduledFor=${scheduledFor.toISOString()}`);
  await dispatchDueCalls();

  return NextResponse.redirect(new URL(`/manage/${token}`, req.url));
}
