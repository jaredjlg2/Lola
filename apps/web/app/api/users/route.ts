import { NextRequest, NextResponse } from 'next/server';
import { createUserSchema } from '@lola/shared/validation';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rateLimit';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  if (!checkRateLimit(`users:${req.headers.get('x-forwarded-for') || 'local'}`, 15)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const json = await req.json();
  const parsed = createUserSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input' }, { status: 400 });
  }

  const manageToken = crypto.randomBytes(24).toString('hex');
  const user = await prisma.user.upsert({
    where: { phoneNumber: parsed.data.phoneNumber },
    update: { ...parsed.data, manageToken, isActive: true },
    create: { ...parsed.data, manageToken }
  });

  return NextResponse.json({ id: user.id, manageToken });
}
