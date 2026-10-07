import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { CadastroForm } from '@/app/components/forms';
import { Marca } from '@/app/components/pills';

export const metadata = { title: 'Criar acesso · HECC Chamados' };

export default async function Cadastro() {
  if (await getUser()) redirect('/');
  return (
    <div className="acesso">
      <div className="acesso-marca">
        <Marca />
        <p>Central de chamados de TI e manutenção</p>
      </div>
      <CadastroForm />
    </div>
  );
}
