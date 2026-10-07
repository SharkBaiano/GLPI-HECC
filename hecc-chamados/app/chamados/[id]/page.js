import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser, isStaff } from '@/lib/auth';
import { query } from '@/lib/db';
import { PRIORIDADES, STATUS } from '@/lib/constantes';
import { dataHora } from '@/lib/formato';
import { comentar, atualizarChamado, assumirChamado, responderSolucao } from '@/app/actions';
import { PillPrioridade, PillStatus, Prazo } from '@/app/components/pills';
import { BotaoEnviar } from '@/app/components/forms';

export async function generateMetadata({ params }) {
  return { title: `Chamado #${params.id} · HECC Chamados` };
}

export default async function Chamado({ params }) {
  const user = await requireUser();
  const staff = isStaff(user);
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const { rows } = await query(
    `SELECT c.*, s.nome AS solicitante_nome, s.cargo AS solicitante_cargo, s.setor AS solicitante_setor,
            t.nome AS tecnico_nome
       FROM chamados c
       JOIN usuarios s ON s.id = c.solicitante_id
       LEFT JOIN usuarios t ON t.id = c.tecnico_id
      WHERE c.id = $1`,
    [id]
  );
  const c = rows[0];
  if (!c || (!staff && c.solicitante_id !== user.id)) notFound();

  const { rows: historico } = await query(
    `SELECT h.*, u.nome AS autor_nome, u.cargo AS autor_cargo, u.perfil AS autor_perfil
       FROM comentarios h JOIN usuarios u ON u.id = h.autor_id
      WHERE h.chamado_id = $1
      ORDER BY h.criado_em ASC, h.id ASC`,
    [id]
  );

  const tecnicos = staff
    ? (
        await query(
          "SELECT id, nome FROM usuarios WHERE perfil IN ('tecnico','admin') AND ativo ORDER BY nome"
        )
      ).rows
    : [];

  const encerrado = c.status === 'fechado';
  const souSolicitante = c.solicitante_id === user.id;

  return (
    <div className="chamado">
      <Link href="/" className="voltar">
        ← Voltar para a lista
      </Link>

      <header className={`chamado-cabeca prio-${c.prioridade}`}>
        <span className="num-grande">#{c.id}</span>
        <h1>{c.titulo}</h1>
        <div className="chamado-tags">
          <PillPrioridade v={c.prioridade} />
          <PillStatus v={c.status} />
          <Prazo c={c} />
        </div>
      </header>

      <div className="chamado-grade">
        <div className="chamado-principal">
          <section className="cartao">
            <h2 className="rotulo">Descrição</h2>
            <p className="descricao">{c.descricao}</p>
          </section>

          {souSolicitante && c.status === 'resolvido' && (
            <section className="cartao aviso-solucao">
              <h2>A equipe marcou este chamado como resolvido</h2>
              <p className="muted">O problema foi resolvido mesmo?</p>
              <div className="acoes">
                <form action={responderSolucao}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="decisao" value="confirmar" />
                  <BotaoEnviar pendente="Fechando…">Sim, pode fechar</BotaoEnviar>
                </form>
                <form action={responderSolucao}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="decisao" value="reabrir" />
                  <BotaoEnviar className="btn" pendente="Reabrindo…">
                    Não, o problema continua
                  </BotaoEnviar>
                </form>
              </div>
            </section>
          )}

          <section>
            <h2 className="rotulo">Andamento</h2>
            <ol className="historico">
              {historico.map((h) =>
                h.tipo === 'sistema' ? (
                  <li key={h.id} className="evento">
                    <span>{h.texto}</span>
                    <small>
                      {h.autor_nome} · {dataHora(h.criado_em)}
                    </small>
                  </li>
                ) : (
                  <li key={h.id} className={h.autor_perfil === 'usuario' ? 'msg' : 'msg msg-equipe'}>
                    <div className="msg-cabeca">
                      <strong>{h.autor_nome}</strong>
                      <small>
                        {h.autor_cargo} · {dataHora(h.criado_em)}
                      </small>
                    </div>
                    <p>{h.texto}</p>
                  </li>
                )
              )}
            </ol>

            {!encerrado ? (
              <form action={comentar} className="form-comentario" key={historico.length}>
                <input type="hidden" name="id" value={c.id} />
                <label className="campo">
                  <span>{staff ? 'Responder ou registrar o que foi feito' : 'Adicionar informação'}</span>
                  <textarea id="comentario-texto" name="texto" rows={3} required />
                </label>
                <BotaoEnviar pendente="Enviando…">Enviar</BotaoEnviar>
              </form>
            ) : (
              <p className="muted">Chamado fechado. Para um novo problema, abra outro chamado.</p>
            )}
          </section>
        </div>

        <aside className="chamado-lateral">
          <section className="cartao">
            <h2 className="rotulo">Dados do chamado</h2>
            <dl className="dados">
              <dt>Solicitante</dt>
              <dd>
                {c.solicitante_nome}
                <small>
                  {c.solicitante_cargo} · {c.solicitante_setor}
                </small>
              </dd>
              <dt>Setor do problema</dt>
              <dd>{c.setor}</dd>
              {c.local && (
                <>
                  <dt>Local</dt>
                  <dd>{c.local}</dd>
                </>
              )}
              {c.ramal && (
                <>
                  <dt>Ramal</dt>
                  <dd className="num">{c.ramal}</dd>
                </>
              )}
              <dt>Categoria</dt>
              <dd>{c.categoria}</dd>
              <dt>Técnico</dt>
              <dd>{c.tecnico_nome ?? 'Ainda sem técnico'}</dd>
              <dt>Aberto em</dt>
              <dd className="num">{dataHora(c.criado_em)}</dd>
              {c.resolvido_em && (
                <>
                  <dt>Resolvido em</dt>
                  <dd className="num">{dataHora(c.resolvido_em)}</dd>
                </>
              )}
            </dl>
          </section>

          {staff && (
            <section className="cartao">
              <h2 className="rotulo">Atendimento</h2>
              {c.tecnico_id !== user.id && (
                <form action={assumirChamado} className="assumir">
                  <input type="hidden" name="id" value={c.id} />
                  <BotaoEnviar pendente="Assumindo…">Assumir chamado</BotaoEnviar>
                </form>
              )}
              <form action={atualizarChamado} className="form-atendimento" key={String(c.atualizado_em)}>
                <input type="hidden" name="id" value={c.id} />
                <label className="campo">
                  <span>Status</span>
                  <select id="at-status" name="status" defaultValue={c.status}>
                    {STATUS.map((s) => (
                      <option key={s.v} value={s.v}>
                        {s.l}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="campo">
                  <span>Prioridade</span>
                  <select id="at-prioridade" name="prioridade" defaultValue={c.prioridade}>
                    {PRIORIDADES.map((p) => (
                      <option key={p.v} value={p.v}>
                        {p.l}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="campo">
                  <span>Técnico responsável</span>
                  <select id="at-tecnico" name="tecnico_id" defaultValue={c.tecnico_id ?? ''}>
                    <option value="">Sem técnico</option>
                    {tecnicos.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome}
                      </option>
                    ))}
                  </select>
                </label>
                <BotaoEnviar className="btn" pendente="Salvando…">
                  Salvar alterações
                </BotaoEnviar>
              </form>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
