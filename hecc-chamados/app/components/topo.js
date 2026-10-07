import Link from 'next/link';
import { sair } from '@/app/actions';
import { PERFIL_L } from '@/lib/constantes';
import { Marca } from './pills';

export default function Topo({ user }) {
  return (
    <header className="topo">
      <div className="topo-dentro">
        <Link href="/" className="topo-marca">
          <Marca />
        </Link>
        <nav className="topo-nav">
          <Link href="/">Chamados</Link>
          <Link href="/chamados/novo" className="btn btn-primario btn-peq">
            + Novo chamado
          </Link>
          {user.perfil === 'admin' && <Link href="/usuarios">Usuários</Link>}
        </nav>
        <div className="topo-user">
          <span className="topo-quem">
            <strong>{user.nome}</strong>
            <small>
              {user.cargo} · {user.setor}
              {user.perfil !== 'usuario' && ` · ${PERFIL_L[user.perfil]}`}
            </small>
          </span>
          <form action={sair}>
            <button type="submit" className="btn btn-peq">
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
