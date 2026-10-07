import './globals.css';
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import { getUser } from '@/lib/auth';
import Topo from './components/topo';

const sans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-sans' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono' });

export const metadata = {
  title: 'HECC Chamados',
  description: 'Central de chamados do Hospital Estadual Costa dos Coqueiros',
};

export const viewport = { width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }) {
  const user = await getUser();
  return (
    <html lang="pt-BR" className={`${sans.variable} ${mono.variable}`}>
      <body>
        {user && <Topo user={user} />}
        <main className="pagina">{children}</main>
      </body>
    </html>
  );
}
