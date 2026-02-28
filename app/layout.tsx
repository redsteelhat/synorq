import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Toaster } from 'sonner';

const geist = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist',
  display: 'swap',
});

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Synorq – AI Operations Platform',
  description: 'Birden fazla AI aracını (ChatGPT, Claude, Gemini) tek panelden yönetin.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="dark" suppressHydrationWarning>
      <body className={`${geist.variable} ${geistMono.variable} bg-[#080C14] font-sans antialiased`} suppressHydrationWarning>
        {children}
        <Toaster theme="dark" richColors />
      </body>
    </html>
  );
}
