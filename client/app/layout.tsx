import type { ReactNode } from 'react';
import { AuthProvider } from '@/components/providers/AuthProvider';
import './globals.css';

export const metadata = {
  title: 'LogMagna | Inteligência Logística e Seguro de Cargas',
  description: 'Plataforma corporativa de rastreamento, apólices, sinistros e gestão operacional LogMagna.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
