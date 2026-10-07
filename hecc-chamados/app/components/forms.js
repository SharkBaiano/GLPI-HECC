'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { entrar, cadastrar, abrirChamado } from '@/app/actions';
import { SETORES, CATEGORIAS, PRIORIDADES } from '@/lib/constantes';

export function BotaoEnviar({ children, pendente = 'Enviando…', className = 'btn btn-primario' }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? pendente : children}
    </button>
  );
}

function Erro({ state }) {
  if (!state?.erro) return null;
  return (
    <p className="alerta" role="alert">
      {state.erro}
    </p>
  );
}

export function LoginForm() {
  const [state, action] = useFormState(entrar, null);
  return (
    <form action={action} className="cartao form-acesso" key={state?.ts}>
      <h1>Entrar</h1>
      <Erro state={state} />
      <label className="campo">
        <span>Usuário</span>
        <input
          id="login-usuario"
          name="usuario"
          autoComplete="username"
          autoCapitalize="none"
          required
          defaultValue={state?.usuario}
          autoFocus
        />
      </label>
      <label className="campo">
        <span>Senha</span>
        <input id="login-senha" name="senha" type="password" autoComplete="current-password" required />
      </label>
      <BotaoEnviar pendente="Entrando…">Entrar</BotaoEnviar>
      <p className="rodape-form">
        Primeiro acesso? <Link href="/cadastro">Crie o seu cadastro</Link>
      </p>
    </form>
  );
}

export function CadastroForm() {
  const [state, action] = useFormState(cadastrar, null);
  const [setor, setSetor] = useState('');
  const v = state?.valores ?? {};
  return (
    <form action={action} className="cartao form-acesso" key={state?.ts}>
      <h1>Criar acesso</h1>
      <p className="muted">Preencha com os seus dados. Eles aparecem nos chamados que você abrir.</p>
      <Erro state={state} />
      <label className="campo">
        <span>Nome completo</span>
        <input id="cad-nome" name="nome" autoComplete="name" required defaultValue={v.nome} />
      </label>
      <div className="linha-2">
        <label className="campo">
          <span>Setor</span>
          <select id="cad-setor" name="setor" required value={setor} onChange={(e) => setSetor(e.target.value)}>
            <option value="" disabled>
              Escolha…
            </option>
            {SETORES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          <span>Cargo</span>
          <input
            id="cad-cargo"
            name="cargo"
            placeholder="Ex.: Técnico(a) de Enfermagem"
            required
            defaultValue={v.cargo}
          />
        </label>
      </div>
      {setor === 'Outro' && (
        <label className="campo">
          <span>Nome do setor</span>
          <input id="cad-setor-outro" name="setorOutro" required defaultValue={v.setorOutro} />
        </label>
      )}
      <label className="campo">
        <span>Usuário (para entrar no sistema)</span>
        <input
          id="cad-usuario"
          name="usuario"
          autoComplete="username"
          autoCapitalize="none"
          placeholder="Ex.: maria.santos"
          required
          defaultValue={v.usuario}
        />
      </label>
      <div className="linha-2">
        <label className="campo">
          <span>Senha</span>
          <input id="cad-senha" name="senha" type="password" autoComplete="new-password" minLength={8} required />
        </label>
        <label className="campo">
          <span>Repita a senha</span>
          <input
            id="cad-confirmar"
            name="confirmar"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
      </div>
      <small className="muted">Mínimo de 8 caracteres.</small>
      <BotaoEnviar pendente="Criando acesso…">Criar acesso</BotaoEnviar>
      <p className="rodape-form">
        Já tem cadastro? <Link href="/login">Entrar</Link>
      </p>
    </form>
  );
}

export function NovoChamadoForm({ setorPadrao }) {
  const [state, action] = useFormState(abrirChamado, null);
  const v = state?.valores ?? {};
  const setores = SETORES.includes(setorPadrao) ? SETORES : [setorPadrao, ...SETORES];
  return (
    <form action={action} className="form-chamado" key={state?.ts}>
      <Erro state={state} />

      <fieldset className="prioridades">
        <legend>Prioridade</legend>
        {PRIORIDADES.map((p) => (
          <label key={p.v} className={`opcao-prio prio-${p.v}`}>
            <input
              type="radio"
              id={`prio-${p.v}`}
              name="prioridade"
              value={p.v}
              defaultChecked={(v.prioridade || 'media') === p.v}
            />
            <span className="opcao-topo">
              <i className="ponto" aria-hidden="true" />
              <strong>{p.l}</strong>
              <span className="sla">até {p.slaHoras} h</span>
            </span>
            <span className="opcao-dica">{p.dica}</span>
          </label>
        ))}
      </fieldset>

      <label className="campo">
        <span>Título</span>
        <input
          id="ch-titulo"
          name="titulo"
          maxLength={120}
          placeholder="Ex.: Impressora de pulseiras do PS não imprime"
          required
          defaultValue={v.titulo}
        />
      </label>

      <div className="linha-2">
        <label className="campo">
          <span>Categoria</span>
          <select id="ch-categoria" name="categoria" required defaultValue={v.categoria || ''}>
            <option value="" disabled>
              Escolha…
            </option>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          <span>Setor do problema</span>
          <select id="ch-setor" name="setor" defaultValue={v.setor || setorPadrao}>
            {setores.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="linha-2">
        <label className="campo">
          <span>Local exato (opcional)</span>
          <input id="ch-local" name="local" placeholder="Ex.: Leito 4, sala de triagem" defaultValue={v.local} />
        </label>
        <label className="campo">
          <span>Ramal para contato (opcional)</span>
          <input id="ch-ramal" name="ramal" inputMode="numeric" placeholder="Ex.: 2140" defaultValue={v.ramal} />
        </label>
      </div>

      <label className="campo">
        <span>Descrição</span>
        <textarea
          id="ch-descricao"
          name="descricao"
          rows={6}
          placeholder="O que aconteceu, desde quando, e se aparece alguma mensagem de erro."
          required
          defaultValue={v.descricao}
        />
      </label>

      <div className="acoes">
        <BotaoEnviar pendente="Abrindo chamado…">Abrir chamado</BotaoEnviar>
        <Link href="/" className="btn">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
