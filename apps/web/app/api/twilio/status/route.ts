import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const mapStatus = (twilioStatus: string) => {
  if (twilioStatus === 'completed') return 'completed' as const;
  if (twilioStatus === 'no-answer') return 'no_answer' as const;
  if (twilioStatus === 'in-progress' || twilioStatus === 'answered') return 'in_progress' as const;
  return 'failed' as const;
};

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const jobId = url.searchParams.get('jobId');
  if (!jobId) return NextResponse.json({ ok: false }, { status: 400 });

  const form = await req.formData();
  const twilioCallSid = String(form.get('CallSid') || '');
  const twilioStatus = String(form.get('CallStatus') || '');
  const mappedStatus = mapStatus(twilioStatus);

  console.log(`[twilio/status] jobId=${jobId} twilioStatus=${twilioStatus || 'n/a'} mappedStatus=${mappedStatus} callSid=${twilioCallSid || 'n/a'}`);

  await prisma.callJob.update({
    where: { id: jobId },
    data: { twilioCallSid, status: mappedStatus }
  });

  return NextResponse.json({ ok: true });
}
