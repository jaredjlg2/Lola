import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';
import { generateTutorReply } from '@lola/voice/index';

const twiml = twilio.twiml.VoiceResponse;

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const jobId = url.searchParams.get('jobId');
  if (!jobId) return new NextResponse('Missing jobId', { status: 400 });

  const form = await req.formData();
  const speechResult = String(form.get('SpeechResult') || '').trim();
  const callStatus = String(form.get('CallStatus') || '');

  const job = await prisma.callJob.findUnique({ where: { id: jobId }, include: { user: true, callSession: true } });
  if (!job) return new NextResponse('No job', { status: 404 });

  const response = new twiml();

  if (!speechResult) {
    response.say({ voice: 'alice', language: 'es-ES' }, `Hola, soy Lola. Qué alegría practicar contigo hoy. ${job.user.goals}. Empecemos. ¿Cómo estás hoy?`);
  } else {
    const history = job.callSession?.transcript
      ? job.callSession.transcript.split('\n').slice(-8).map((line) => {
          const [role, ...rest] = line.split(':');
          return { role: role as 'user' | 'assistant', content: rest.join(':').trim() };
        })
      : [];

    const ai = await generateTutorReply({
      openaiApiKey: env.openaiApiKey,
      model: env.openaiModel,
      profile: {
        level: job.user.level,
        vocabEstimate: job.user.vocabEstimate,
        goals: job.user.goals
      },
      history,
      latestUserMessage: speechResult
    });

    const transcript = `${job.callSession?.transcript || ''}\nuser: ${speechResult}\nassistant: ${ai}`.trim();
    await prisma.callSession.upsert({
      where: { callJobId: job.id },
      update: { transcript, metadata: { lastCallStatus: callStatus, model: env.openaiModel } },
      create: { userId: job.userId, callJobId: job.id, transcript, metadata: { model: env.openaiModel } }
    });

    response.say({ voice: 'alice', language: 'es-ES' }, ai);
  }

  const gather = response.gather({
    input: ['speech'],
    speechTimeout: 'auto',
    action: `${env.publicBaseUrl}/api/twilio/voice?jobId=${jobId}`,
    method: 'POST'
  });
  gather.say({ voice: 'alice', language: 'es-ES' }, 'Te escucho.');
  response.redirect({ method: 'POST' }, `${env.publicBaseUrl}/api/twilio/voice?jobId=${jobId}`);

  return new NextResponse(response.toString(), { headers: { 'Content-Type': 'text/xml' } });
}
