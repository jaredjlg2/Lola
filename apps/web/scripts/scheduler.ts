import { schedulerTick } from '../lib/scheduler';

async function run() {
  await schedulerTick();
  console.log('[scheduler] tick complete');
}

void run().then(() => process.exit(0));
