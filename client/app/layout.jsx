import './globals.css';

export const metadata = { title: 'LogMagna' };

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
