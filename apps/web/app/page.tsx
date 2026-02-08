'use client';

import { useState } from 'react';

export default function Home() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <main>
      <h1>Lola — Daily Spanish Speaking Calls</h1>
      <p>Practice speaking Spanish with a patient AI tutor by phone.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit(new FormData(e.currentTarget));
        }}
        style={{ display: 'grid', gap: 12 }}
      >
        <input name="level" placeholder="Current level (A0-C2 or free text)" required />
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
