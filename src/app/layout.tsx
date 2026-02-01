import type { Metadata } from 'next';
import './globals.css';
import { AIProvider } from '@/components/AIProvider';

export const metadata: Metadata = {
  title: "Tilly's Journal | AI Research",
  description: 'Your personal AI research journal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AIProvider>
          {children}
        </AIProvider>
      </body>
    </html>
  );
}
