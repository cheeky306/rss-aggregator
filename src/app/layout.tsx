import type { Metadata } from 'next';
import './globals.css';
import { ChatProvider } from '@/components/ChatProvider';

export const metadata: Metadata = {
  title: 'Cheeks Digest | AI-Powered News',
  description: 'AI-powered news aggregation for AI, SEO, and tech',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ChatProvider>
          {children}
        </ChatProvider>
      </body>
    </html>
  );
}
