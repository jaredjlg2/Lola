import { prisma } from '@/lib/prisma';

export default async function ManagePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const user = await prisma.user.findUnique({ where: { manageToken: token } });
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
    </main>
  );
}
