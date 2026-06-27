import './globals.css';

export const metadata = {
  title: 'EventFlow - manage your stack',
  description: 'Nowoczesny system zarządzania magazynem i logistyką',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}