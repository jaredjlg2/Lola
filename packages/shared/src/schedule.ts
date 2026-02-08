export type ScheduleInput = {
  timezone: string;
  preferredTimes: string[];
  callsPerDay: number;
  dayISO: string;
  fallbackHoursStart?: number;
  fallbackHoursEnd?: number;
};

const clampHour = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export function parseTimeToMinutes(value: string): number {
  const [hh, mm] = value.split(':').map(Number);
  return hh * 60 + mm;
}

function extractCandidateMinutes(preferredTimes: string[]): number[] {
  const out = new Set<number>();
  for (const pref of preferredTimes) {
    if (pref.includes('-')) {
      const [start, end] = pref.split('-');
      const s = parseTimeToMinutes(start);
      const e = parseTimeToMinutes(end);
      out.add(Math.floor((s + e) / 2));
    } else {
      out.add(parseTimeToMinutes(pref));
    }
  }
  return Array.from(out).sort((a, b) => a - b);
}

export function generateDailyCallTimes(input: ScheduleInput): string[] {
  const fallbackStart = input.fallbackHoursStart ?? 9;
  const fallbackEnd = input.fallbackHoursEnd ?? 20;
  const candidates = extractCandidateMinutes(input.preferredTimes);
  const need = input.callsPerDay;
  if (!candidates.length) return [];

  const selected = [...candidates.slice(0, need)];
  if (selected.length < need) {
    let base = selected[0] ?? candidates[0];
    while (selected.length < need) {
      base += 240;
      let hour = Math.floor(base / 60);
      const minute = ((base % 60) + 60) % 60;
      hour = clampHour(hour, fallbackStart, fallbackEnd);
      const normalized = hour * 60 + minute;
      if (!selected.includes(normalized)) selected.push(normalized);
      base = normalized;
    }
  }

  return selected.sort((a, b) => a - b).map((minutes) => {
    const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
    const mm = String(minutes % 60).padStart(2, '0');
    return `${input.dayISO}T${hh}:${mm}:00`;
  });
}
