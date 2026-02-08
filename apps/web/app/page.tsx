'use client';

import { useState } from 'react';

const LEVEL_OPTIONS = [
  { value: 'A0', label: 'A0 — Absolute beginner (just starting)' },
  { value: 'A1', label: 'A1 — Basic words and simple phrases' },
  { value: 'A2', label: 'A2 — Everyday topics and short conversations' },
  { value: 'B1', label: 'B1 — Independent speaker in familiar situations' },
  { value: 'B2', label: 'B2 — Comfortable discussing many topics' },
  { value: 'C1', label: 'C1 — Advanced and nuanced communication' },
  { value: 'C2', label: 'C2 — Near-native fluency' }
] as const;

const LEVEL_EXPLANATIONS: Record<string, string> = {
  A0: 'New to Spanish. We focus on core sounds, greetings, and confidence.',
  A1: 'You can understand and use very common expressions with support.',
  A2: 'You can handle simple routine tasks and short exchanges.',
  B1: 'You can manage travel and daily-life conversations with moderate detail.',
  B2: 'You can speak fairly naturally and explain opinions on many topics.',
  C1: 'You can use Spanish flexibly for social, academic, or professional contexts.',
  C2: 'You can understand and express almost everything with precision.'
};

export default function Home() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [callNowLoading, setCallNowLoading] = useState(false);
  const [callNowError, setCallNowError] = useState('');
  const [level, setLevel] = useState('A0');

  async function handleSubmit(formData: FormData) {
    setError('');
    setLoading(true);
    const preferredTimes = String(formData.get('preferredTimes') || '')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);

    const payload = {
      phoneNumber: formData.get('phoneNumber'),
      level: formData.get('level'),
      vocabEstimate: formData.get('vocabEstimate'),
      goals: formData.get('goals'),
      timezone: formData.get('timezone'),
      callsPerDay: formData.get('callsPerDay'),
      preferredTimes
    };

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const isJson = (res.headers.get('content-type') || '').includes('application/json');
      const data = isJson ? await res.json() : null;

      if (!res.ok) {
        setError(data?.error || 'Unable to save right now. Please try again.');
        return;
      }

      if (!data?.manageToken) {
        setError('Saved, but we could not open your confirmation page. Please retry.');
        return;
      }

      window.location.href = `/confirm?token=${encodeURIComponent(data.manageToken)}`;
    } catch {
      setError('Network error while saving. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCallNow(formData: FormData) {
    setCallNowError('');
    setCallNowLoading(true);

    const payload = {
      phoneNumber: formData.get('phoneNumber'),
      level: formData.get('level'),
      vocabEstimate: formData.get('vocabEstimate')
    };

    try {
      const res = await fetch('/api/users/call-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const isJson = (res.headers.get('content-type') || '').includes('application/json');
      const data = isJson ? await res.json() : null;

      if (!res.ok) {
        setCallNowError(data?.error || 'Unable to queue your call right now. Please try again.');
        return;
      }

      if (!data?.manageToken) {
        setCallNowError('Call queued, but we could not open your confirmation page. Please retry.');
        return;
      }

      window.location.href = `/confirm?token=${encodeURIComponent(data.manageToken)}`;
    } catch {
      setCallNowError('Network error while queuing your call. Please try again.');
    } finally {
      setCallNowLoading(false);
    }
  }

  return (
    <main>
      <h1>Lola — Daily Spanish Speaking Calls</h1>
      <p>Practice speaking Spanish with a patient AI tutor by phone.</p>

      <h2>Call now</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleCallNow(new FormData(e.currentTarget));
        }}
        style={{ display: 'grid', gap: 12 }}
      >
        <input name="phoneNumber" placeholder="Phone (+14155552671)" pattern="^\+[1-9]\d{7,14}$" required />
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Your level</span>
          <select name="level" value={level} onChange={(e) => setLevel(e.target.value)} required>
            {LEVEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <small>{LEVEL_EXPLANATIONS[level]}</small>
        </label>
        <input name="vocabEstimate" type="number" min={0} placeholder="Vocabulary estimate" required />
        <button disabled={callNowLoading}>{callNowLoading ? 'Calling...' : 'Call now'}</button>
      </form>
      {callNowError ? <p style={{ color: 'crimson' }}>{callNowError}</p> : null}

      <h2 style={{ marginTop: 24 }}>Or set up daily calls</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit(new FormData(e.currentTarget));
        }}
        style={{ display: 'grid', gap: 12 }}
      >
        <select name="level" defaultValue="A0" required>
          {LEVEL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input name="vocabEstimate" type="number" min={0} placeholder="Vocabulary estimate" required />
        <textarea name="goals" placeholder="What do you want to practice?" required />
        <input name="phoneNumber" placeholder="Phone (+14155552671)" pattern="^\+[1-9]\d{7,14}$" required />
        <input name="callsPerDay" type="number" min={1} max={3} required defaultValue={1} />
        <input name="timezone" defaultValue="America/New_York" required />
        <input name="preferredTimes" placeholder="Times/windows e.g. 09:00,18:00-19:00" required />
        <button disabled={loading}>{loading ? 'Saving...' : 'Start my daily calls'}</button>
      </form>
      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
    </main>
  );
}
