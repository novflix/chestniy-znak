import type { Metadata } from 'next';
import { AuthProvider } from '@/components/AuthContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Система маркировки',
  description: 'Система маркировки товаров — аналог Честный знак',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-gray-950 text-gray-100 font-sans antialiased min-h-screen">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
