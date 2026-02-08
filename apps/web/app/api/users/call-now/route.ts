import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rateLimit';
import { dispatchDueCalls } from '@/lib/scheduler';

const callNowSchema = z.object({
  phoneNumber: z.string().regex(/^\+[1-9]\d{7,14}$/, 'Use E.164 format like +14155552671'),
  level: z.string().min(1).max(50),
  vocabEstimate: z.coerce.number().int().min(0).max(100000)
});

export async function POST(req: NextRequest) {
  if (!checkRateLimit(`users:call-now:${req.headers.get('x-forwarded-for') || 'local'}`, 15)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const json = await req.json();
  const parsed = callNowSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input' }, { status: 400 });
  }

  const manageToken = crypto.randomBytes(24).toString('hex');

  const existingUser = await prisma.user.findUnique({ where: { phoneNumber: parsed.data.phoneNumber } });
  const user = existingUser
    ? await prisma.user.update({
        where: { phoneNumber: parsed.data.phoneNumber },
        data: {
          level: parsed.data.level,
          vocabEstimate: parsed.data.vocabEstimate,
          manageToken,
          isActive: true
        }
      })
    : await prisma.user.create({
        data: {
          phoneNumber: parsed.data.phoneNumber,
          level: parsed.data.level,
          vocabEstimate: parsed.data.vocabEstimate,
          goals: 'Quick Spanish speaking practice call.',
          timezone: 'America/New_York',
          callsPerDay: 1,
          preferredTimes: ['09:00'],
          manageToken,
          isActive: true
        }
      });

  const scheduledFor = new Date(Date.now() + 1_000);
  await prisma.callJob.create({
    data: {
      userId: user.id,
      scheduledFor,
      status: 'scheduled'
    }
  });

  await dispatchDueCalls();

  return NextResponse.json({ ok: true, manageToken });
}
