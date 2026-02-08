import { prisma } from '@/lib/prisma';

export default async function ManagePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const user = await prisma.user.findUnique({
    where: { manageToken: token },
    include: {
      callJobs: {
        include: { callSession: true },
        orderBy: { scheduledFor: 'desc' },
        take: 20
      }
    }
  });
  if (!user) return <p>Invalid manage link.</p>;

  return (
    <main>
      <h2>Manage schedule</h2>
      <form action={`/api/users/manage/${token}`} method="post" style={{ display: 'grid', gap: 10 }}>
        <textarea name="goals" defaultValue={user.goals} required />
        <input name="callsPerDay" type="number" min={1} max={3} defaultValue={user.callsPerDay} required />
        <input name="timezone" defaultValue={user.timezone} required />
        <input name="preferredTimes" defaultValue={(user.preferredTimes as string[]).join(',')} required />
        <button type="submit">Update</button>
      </form>

      <form action={`/api/users/manage/${token}/call-now`} method="post" style={{ marginTop: 16 }}>
        <button type="submit">Call now</button>
      </form>

      <section style={{ marginTop: 24 }}>
        <h3>Recent call logs</h3>
        {user.callJobs.length === 0 ? (
          <p>No calls logged yet.</p>
        ) : (
          <ul style={{ display: 'grid', gap: 12, paddingLeft: 18 }}>
            {user.callJobs.map((job: (typeof user.callJobs)[number]) => (
              <li key={job.id}>
                <div>
                  <strong>{job.status}</strong> — scheduled {job.scheduledFor.toISOString()}
                </div>
                <div>jobId: {job.id}</div>
                <div>twilioSid: {job.twilioCallSid || 'n/a'}</div>
                {job.callSession?.transcript ? (
                  <details>
                    <summary>Transcript</summary>
                    <pre style={{ whiteSpace: 'pre-wrap' }}>{job.callSession.transcript}</pre>
                  </details>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
