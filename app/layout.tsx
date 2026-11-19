import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Accurate Online - Excel Converter (Sumber ke OtherPayment)',
  description: 'Program konversi tabel Excel Sumber ke format Other Payment (Pembayaran Lainnya) Accurate Online',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
