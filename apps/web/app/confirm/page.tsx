export default async function Confirm({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  return (
    <main>
      <h2>You’re all set ✅</h2>
      <p>Lola will schedule your calls daily.</p>
      <a href={`/manage/${params.token}`}>Manage my schedule</a>
    </main>
  );
}
