import { requireUser } from '@/lib/auth';
import { NovoChamadoForm } from '@/app/components/forms';

export const metadata = { title: 'Novo chamado · HECC Chamados' };

export default async function NovoChamado() {
  const user = await requireUser();
  return (
    <div className="estreito">
      <h1 className="titulo-pagina">Novo chamado</h1>
      <p className="muted">
        Escolha a prioridade pelo impacto no atendimento. Chamados críticos vão para o topo da fila da equipe.
      </p>
      <NovoChamadoForm setorPadrao={user.setor} />
    </div>
  );
}
