import './globals.css';

export const metadata = {
  title: 'Dashboard Financeiro',
  description: 'Frontend Next para o sistema antifraude',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body>{children}</body>
    </html>
  );
}
