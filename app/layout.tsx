import type { Metadata } from 'next';
import './globals.css';
import Navigation from './components/Navigation';
import { WardrobeProvider } from './context/WardrobeContext';

export const metadata: Metadata = {
  title: 'Personal Stylist',
  description: 'AI-powered wardrobe planner – weekly outfit suggestions, closet management, and event styling.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <WardrobeProvider>
          <Navigation />
          <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            {children}
          </main>
        </WardrobeProvider>
      </body>
    </html>
  );
}
