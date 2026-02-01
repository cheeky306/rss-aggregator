import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'News Aggregator | Daily Digest',
  description: 'AI-powered news aggregation for AI, SEO, and tech',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
