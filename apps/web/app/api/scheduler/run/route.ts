import { NextResponse } from 'next/server';
import { schedulerTick } from '@/lib/scheduler';

export async function POST() {
  await schedulerTick();
  return NextResponse.json({ ok: true });
}
