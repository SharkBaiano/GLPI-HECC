import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { LoginForm } from '@/app/components/forms';
import { Marca } from '@/app/components/pills';

export const metadata = { title: 'Entrar · HECC Chamados' };

export default async function Login() {
  if (await getUser()) redirect('/');
  return (
    <div className="acesso">
      <div className="acesso-marca">
        <Marca />
        <p>Central de chamados de TI e manutenção</p>
      </div>
      <LoginForm />
    </div>
  );
}
