import { prisma } from './prisma';
import { generateDailyCallTimes } from '@lola/shared/schedule';
import { env } from './env';
import twilio from 'twilio';
import { maskPhone } from './utils';

const client = twilio(env.twilioAccountSid, env.twilioAuthToken);

function toDateInTimezone(dayOffset: number, timezone: string): string {
  const now = new Date();
  const dateInZone = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    new Date(now.getTime() + dayOffset * 86_400_000)
  );
  return dateInZone;
}

function toUtcDateFromLocal(dayISO: string, timeHHmm: string, timezone: string): Date {
  const [hour, minute] = timeHHmm.split(':').map(Number);
  const [year, month, day] = dayISO.split('-').map(Number);
  const utcCandidate = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const localInZone = new Date(utcCandidate.toLocaleString('en-US', { timeZone: timezone }));
  const diff = utcCandidate.getTime() - localInZone.getTime();
  return new Date(utcCandidate.getTime() + diff);
}

export async function scheduleCallsForNext24Hours() {
  const users = await prisma.user.findMany({ where: { isActive: true } });
  for (const user of users) {
    const dayISO = toDateInTimezone(0, user.timezone);
    const localTimes = generateDailyCallTimes({
      timezone: user.timezone,
      preferredTimes: user.preferredTimes as string[],
      callsPerDay: user.callsPerDay,
      dayISO,
      fallbackHoursStart: env.allowedCallHoursStart,
      fallbackHoursEnd: env.allowedCallHoursEnd
    });

    for (const localDateTime of localTimes) {
      const hhmm = localDateTime.slice(11, 16);
      const scheduledFor = toUtcDateFromLocal(dayISO, hhmm, user.timezone);
      await prisma.callJob.upsert({
        where: { userId_scheduledFor: { userId: user.id, scheduledFor } },
        update: {},
        create: { userId: user.id, scheduledFor, status: 'scheduled' }
      });
    }
  }
}

export async function dispatchDueCalls() {
  const dueJobs = await prisma.callJob.findMany({
    where: { status: 'scheduled', scheduledFor: { lte: new Date() } },
    include: { user: true },
    take: 20
  });

  for (const job of dueJobs) {
    try {
      const call = await client.calls.create({
        to: job.user.phoneNumber,
        from: env.twilioPhoneNumber,
        url: `${env.publicBaseUrl}/api/twilio/voice?jobId=${job.id}`,
        statusCallback: `${env.publicBaseUrl}/api/twilio/status?jobId=${job.id}`,
        statusCallbackEvent: ['initiated', 'answered', 'completed']
      });
      await prisma.callJob.update({ where: { id: job.id }, data: { status: 'in_progress', twilioCallSid: call.sid } });
      console.log(`[scheduler] calling ${maskPhone(job.user.phoneNumber)} job=${job.id}`);
    } catch (error) {
      await prisma.callJob.update({ where: { id: job.id }, data: { status: 'failed' } });
      console.error('[scheduler] call failed', error);
    }
  }
}

export async function schedulerTick() {
  await scheduleCallsForNext24Hours();
  await dispatchDueCalls();
}
