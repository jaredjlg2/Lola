import { describe, expect, it } from 'vitest';
import { generateDailyCallTimes } from '../src/schedule';
import { createUserSchema } from '../src/validation';

describe('validation', () => {
  it('accepts valid payload', () => {
    const parsed = createUserSchema.parse({
      phoneNumber: '+14155552671',
      level: 'A2',
      vocabEstimate: 1200,
      goals: 'Quiero practicar conversación para viajar',
      timezone: 'America/New_York',
      callsPerDay: 2,
      preferredTimes: ['09:00', '18:00-19:00']
    });
    expect(parsed.callsPerDay).toBe(2);
  });
});

describe('generateDailyCallTimes', () => {
  it('creates fallback times when needed', () => {
    const result = generateDailyCallTimes({
      timezone: 'America/New_York',
      preferredTimes: ['10:00'],
      callsPerDay: 3,
      dayISO: '2026-01-01'
    });
    expect(result).toEqual([
      '2026-01-01T10:00:00',
      '2026-01-01T14:00:00',
      '2026-01-01T18:00:00'
    ]);
  });
});
