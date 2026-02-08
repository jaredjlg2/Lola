import { updateUserSchema } from '@lola/shared/validation';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const formData = await req.formData();
  const preferredTimes = String(formData.get('preferredTimes') || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  const parsed = updateUserSchema.safeParse({
    goals: formData.get('goals'),
    callsPerDay: formData.get('callsPerDay'),
    timezone: formData.get('timezone'),
    preferredTimes
  });

  if (!parsed.success) return NextResponse.json({ error: 'Invalid update' }, { status: 400 });
  await prisma.user.update({ where: { manageToken: token }, data: parsed.data });
  return NextResponse.redirect(new URL(`/manage/${token}`, req.url));
}
