export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'Arial, sans-serif', maxWidth: 760, margin: '20px auto', padding: 16 }}>{children}</body>
    </html>
  );
}
