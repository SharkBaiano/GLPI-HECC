import { requireAdmin } from '@/lib/auth';
import { query } from '@/lib/db';
import { PERFIS } from '@/lib/constantes';
import { dataHora } from '@/lib/formato';
import { alterarPerfil, alternarAtivo } from '@/app/actions';
import { BotaoEnviar } from '@/app/components/forms';

export const metadata = { title: 'Usuários · HECC Chamados' };

export default async function Usuarios() {
  const admin = await requireAdmin();
  const { rows: usuarios } = await query(
    `SELECT u.id, u.nome, u.usuario, u.setor, u.cargo, u.perfil, u.ativo, u.criado_em,
            (SELECT COUNT(*)::int FROM chamados c WHERE c.solicitante_id = u.id) AS abertos
       FROM usuarios u
      ORDER BY u.ativo DESC, u.nome`
  );

  return (
    <div className="painel">
      <h1 className="titulo-pagina">Usuários</h1>
      <p className="muted">
        Todo mundo entra como <strong>Usuário</strong> (abre e acompanha os próprios chamados). Mude para{' '}
        <strong>Técnico</strong> quem atende a fila, e para <strong>Administrador</strong> quem também gerencia os
        acessos.
      </p>

      <div className="tabela-wrap">
        <table className="tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Usuário</th>
              <th>Setor / Cargo</th>
              <th>Chamados</th>
              <th>Cadastro</th>
              <th>Perfil</th>
              <th>Acesso</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => {
              const eu = u.id === admin.id;
              return (
                <tr key={u.id} className={u.ativo ? '' : 'inativo'}>
                  <td>
                    <strong>{u.nome}</strong>
                    {eu && <small> (você)</small>}
                  </td>
                  <td className="num">{u.usuario}</td>
                  <td>
                    {u.setor}
                    <small>{u.cargo}</small>
                  </td>
                  <td className="num">{u.abertos}</td>
                  <td className="num">{dataHora(u.criado_em)}</td>
                  <td>
                    {eu ? (
                      'Administrador'
                    ) : (
                      <form action={alterarPerfil} className="form-inline">
                        <input type="hidden" name="id" value={u.id} />
                        <select id={`perfil-${u.id}`} name="perfil" defaultValue={u.perfil} aria-label="Perfil">
                          {PERFIS.map((p) => (
                            <option key={p.v} value={p.v}>
                              {p.l}
                            </option>
                          ))}
                        </select>
                        <BotaoEnviar className="btn btn-peq" pendente="…">
                          Salvar
                        </BotaoEnviar>
                      </form>
                    )}
                  </td>
                  <td>
                    {eu ? (
                      <span className="muted">—</span>
                    ) : (
                      <form action={alternarAtivo}>
                        <input type="hidden" name="id" value={u.id} />
                        <BotaoEnviar className={u.ativo ? 'btn btn-peq btn-perigo' : 'btn btn-peq'} pendente="…">
                          {u.ativo ? 'Desativar' : 'Reativar'}
                        </BotaoEnviar>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
