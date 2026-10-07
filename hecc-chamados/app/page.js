import Link from 'next/link';
import { requireUser, isStaff } from '@/lib/auth';
import { query } from '@/lib/db';
import {
  PRIORIDADES,
  PRIORIDADE,
  STATUS,
  STATUS_L,
  SETORES,
  SQL_SLA_HORAS,
  SQL_ORDEM_PRIORIDADE,
} from '@/lib/constantes';
import { tempoDesde } from '@/lib/formato';
import { PillPrioridade, PillStatus, Prazo } from '@/app/components/pills';

const um = (v) => (Array.isArray(v) ? v[0] : v ?? '');

function montarUrl(f, mudancas) {
  const m = { ...f, ...mudancas };
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(m)) {
    if (!v) continue;
    if (k === 'status' && v === 'ativos') continue;
    if (k === 'escopo' && v === 'todos') continue;
    s.set(k, v);
  }
  const q = s.toString();
  return q ? `/?${q}` : '/';
}

export default async function Painel({ searchParams }) {
  const user = await requireUser();
  const staff = isStaff(user);
  const f = {
    prioridade: um(searchParams.prioridade),
    status: um(searchParams.status) || 'ativos',
    setor: um(searchParams.setor),
    q: um(searchParams.q).trim().slice(0, 100),
    escopo: staff ? um(searchParams.escopo) || 'todos' : 'todos',
  };

  const where = [];
  const params = [];
  const p = (v) => {
    params.push(v);
    return `$${params.length}`;
  };

  // Quem vê o quê: usuário comum só vê os próprios chamados; técnico/admin vê todos.
  if (!staff) where.push(`c.solicitante_id = ${p(user.id)}`);
  else if (f.escopo === 'comigo') where.push(`c.tecnico_id = ${p(user.id)}`);
  else if (f.escopo === 'sem_tecnico') where.push('c.tecnico_id IS NULL');
  const baseWhere = [...where];
  const baseParams = [...params];

  if (PRIORIDADE[f.prioridade]) where.push(`c.prioridade = ${p(f.prioridade)}`);
  if (f.status === 'ativos') where.push("c.status NOT IN ('resolvido','fechado')");
  else if (STATUS_L[f.status]) where.push(`c.status = ${p(f.status)}`);
  if (f.setor) where.push(`c.setor = ${p(f.setor)}`);
  if (f.q) {
    const like = p(`%${f.q}%`);
    const num = p(f.q.replace(/^#/, ''));
    where.push(`(c.titulo ILIKE ${like} OR c.descricao ILIKE ${like} OR c.id::text = ${num})`);
  }

  const sqlWhere = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const { rows: chamados } = await query(
    `SELECT c.*, s.nome AS solicitante_nome, t.nome AS tecnico_nome
       FROM chamados c
       JOIN usuarios s ON s.id = c.solicitante_id
       LEFT JOIN usuarios t ON t.id = c.tecnico_id
       ${sqlWhere}
      ORDER BY CASE WHEN c.status IN ('resolvido','fechado') THEN 1 ELSE 0 END,
               ${SQL_ORDEM_PRIORIDADE}, c.criado_em ASC
      LIMIT 300`,
    params
  );

  const baseSql = baseWhere.length ? `WHERE ${baseWhere.join(' AND ')} AND` : 'WHERE';
  const { rows: contagem } = await query(
    `SELECT c.prioridade, COUNT(*)::int AS n,
            COUNT(*) FILTER (WHERE NOW() > c.criado_em + make_interval(hours => ${SQL_SLA_HORAS}))::int AS vencidos
       FROM chamados c
       ${baseSql} c.status NOT IN ('resolvido','fechado')
      GROUP BY c.prioridade`,
    baseParams
  );
  const cont = Object.fromEntries(contagem.map((r) => [r.prioridade, r]));
  const filtrando = f.prioridade || f.status !== 'ativos' || f.setor || f.q;

  return (
    <div className="painel">
      <div className="painel-cabeca">
        <div>
          <h1 className="titulo-pagina">{staff ? 'Fila de chamados' : 'Meus chamados'}</h1>
          <p className="muted">
            {staff
              ? 'Ordenada por prioridade e, dentro dela, pelo chamado mais antigo.'
              : 'Acompanhe aqui os chamados que você abriu.'}
          </p>
        </div>
        {staff && (
          <div className="abas" role="tablist">
            {[
              ['todos', 'Todos'],
              ['comigo', 'Comigo'],
              ['sem_tecnico', 'Sem técnico'],
            ].map(([v, l]) => (
              <Link key={v} href={montarUrl(f, { escopo: v })} className={f.escopo === v ? 'aba ativa' : 'aba'}>
                {l}
              </Link>
            ))}
          </div>
        )}
      </div>

      <section className="resumo" aria-label="Chamados em aberto por prioridade">
        {PRIORIDADES.map((pr) => {
          const n = cont[pr.v]?.n ?? 0;
          const venc = cont[pr.v]?.vencidos ?? 0;
          const ativo = f.prioridade === pr.v;
          return (
            <Link
              key={pr.v}
              href={montarUrl(f, { prioridade: ativo ? '' : pr.v })}
              className={`bloco prio-${pr.v}${ativo ? ' ativo' : ''}`}
              aria-pressed={ativo}
            >
              <span className="bloco-rotulo">
                <i className="ponto" aria-hidden="true" />
                {pr.l}
              </span>
              <span className="bloco-num">{n}</span>
              <span className="bloco-rodape">
                {venc > 0 ? <b>{venc} fora do prazo</b> : `prazo de ${pr.slaHoras} h`}
              </span>
            </Link>
          );
        })}
      </section>

      <form className="filtros" method="get" action="/">
        {f.escopo !== 'todos' && <input type="hidden" name="escopo" value={f.escopo} />}
        <label className="campo campo-busca">
          <span>Buscar</span>
          <input id="f-q" name="q" type="search" placeholder="Título, descrição ou nº do chamado" defaultValue={f.q} />
        </label>
        <label className="campo">
          <span>Prioridade</span>
          <select id="f-prioridade" name="prioridade" defaultValue={f.prioridade}>
            <option value="">Todas</option>
            {PRIORIDADES.map((pr) => (
              <option key={pr.v} value={pr.v}>
                {pr.l}
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          <span>Status</span>
          <select id="f-status" name="status" defaultValue={f.status}>
            <option value="ativos">Em aberto</option>
            {STATUS.map((s) => (
              <option key={s.v} value={s.v}>
                {s.l}
              </option>
            ))}
            <option value="todos">Todos</option>
          </select>
        </label>
        {staff && (
          <label className="campo">
            <span>Setor</span>
            <select id="f-setor" name="setor" defaultValue={f.setor}>
              <option value="">Todos</option>
              {SETORES.filter((s) => s !== 'Outro').map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="filtros-acoes">
          <button type="submit" className="btn btn-primario">
            Filtrar
          </button>
          {filtrando && (
            <Link href={montarUrl({ escopo: f.escopo }, {})} className="btn">
              Limpar
            </Link>
          )}
        </div>
      </form>

      {chamados.length === 0 ? (
        <div className="vazio">
          <h2>Nenhum chamado por aqui</h2>
          <p className="muted">
            {filtrando ? 'Nenhum chamado bate com esses filtros.' : 'Quando um chamado for aberto, ele aparece nesta lista.'}
          </p>
          <Link href="/chamados/novo" className="btn btn-primario">
            Abrir um chamado
          </Link>
        </div>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>Nº</th>
                <th>Chamado</th>
                <th>Prioridade</th>
                <th>Status</th>
                <th>Setor</th>
                {staff && <th>Solicitante</th>}
                <th>Técnico</th>
                <th>Aberto há</th>
                <th>Prazo</th>
              </tr>
            </thead>
            <tbody>
              {chamados.map((c) => (
                <tr key={c.id} className={`linha prio-${c.prioridade}`}>
                  <td className="num">
                    <Link href={`/chamados/${c.id}`}>#{c.id}</Link>
                  </td>
                  <td className="col-titulo">
                    <Link href={`/chamados/${c.id}`}>{c.titulo}</Link>
                    <small>{c.categoria}</small>
                  </td>
                  <td>
                    <PillPrioridade v={c.prioridade} />
                  </td>
                  <td>
                    <PillStatus v={c.status} />
                  </td>
                  <td>{c.setor}</td>
                  {staff && <td>{c.solicitante_nome}</td>}
                  <td>{c.tecnico_nome ?? <span className="muted">—</span>}</td>
                  <td className="num">{tempoDesde(c.criado_em)}</td>
                  <td>
                    <Prazo c={c} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
