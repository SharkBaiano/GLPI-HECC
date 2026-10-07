'use server';

import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { query } from '@/lib/db';
import {
  createSession,
  destroySession,
  requireUser,
  requireStaff,
  requireAdmin,
  isStaff,
} from '@/lib/auth';
import { PRIORIDADE, STATUS_L, CATEGORIAS, PERFIL_L } from '@/lib/constantes';

const txt = (fd, k, max = 200) => String(fd.get(k) ?? '').trim().slice(0, max);
const idDe = (fd) => {
  const n = Number(fd.get('id'));
  return Number.isInteger(n) && n > 0 ? n : null;
};

async function registrar(chamadoId, autorId, texto, tipo = 'sistema') {
  await query('INSERT INTO comentarios (chamado_id, autor_id, texto, tipo) VALUES ($1, $2, $3, $4)', [
    chamadoId,
    autorId,
    texto,
    tipo,
  ]);
}

async function chamadoVisivel(id, user) {
  if (!id) return null;
  const { rows } = await query('SELECT * FROM chamados WHERE id = $1', [id]);
  const c = rows[0];
  if (!c) return null;
  if (!isStaff(user) && c.solicitante_id !== user.id) return null;
  return c;
}

/* ---------- Acesso ---------- */

export async function cadastrar(_prev, fd) {
  const valores = {
    nome: txt(fd, 'nome', 120).replace(/\s+/g, ' '),
    usuario: txt(fd, 'usuario', 30).toLowerCase(),
    setor: txt(fd, 'setor', 80),
    setorOutro: txt(fd, 'setorOutro', 80),
    cargo: txt(fd, 'cargo', 80),
  };
  const senha = String(fd.get('senha') ?? '');
  const confirmar = String(fd.get('confirmar') ?? '');
  const falha = (erro) => ({ erro, valores, ts: Date.now() });

  if (valores.nome.split(' ').length < 2) return falha('Informe nome e sobrenome.');
  if (!/^[a-z0-9._-]{3,30}$/.test(valores.usuario)) {
    return falha('O usuário deve ter de 3 a 30 caracteres: letras sem acento, números, ponto, hífen ou sublinhado.');
  }
  const setor = valores.setor === 'Outro' ? valores.setorOutro : valores.setor;
  if (!setor) return falha('Escolha o seu setor (ou escreva o nome dele em "Outro").');
  if (!valores.cargo) return falha('Informe o seu cargo.');
  if (senha.length < 8) return falha('A senha precisa ter pelo menos 8 caracteres.');
  if (senha !== confirmar) return falha('As duas senhas não são iguais.');

  const hash = await bcrypt.hash(senha, 10);
  let id;
  try {
    // A primeira pessoa a se cadastrar vira administradora do sistema.
    const { rows } = await query(
      `INSERT INTO usuarios (nome, usuario, senha_hash, setor, cargo, perfil)
       VALUES ($1, $2, $3, $4, $5,
         CASE WHEN EXISTS (SELECT 1 FROM usuarios) THEN 'usuario' ELSE 'admin' END)
       RETURNING id`,
      [valores.nome, valores.usuario, hash, setor, valores.cargo]
    );
    id = rows[0].id;
  } catch (e) {
    if (e.code === '23505') return falha('Esse usuário já existe. Escolha outro ou entre com a sua senha.');
    throw e;
  }
  await createSession(id);
  redirect('/');
}

export async function entrar(_prev, fd) {
  const usuario = txt(fd, 'usuario', 30).toLowerCase();
  const senha = String(fd.get('senha') ?? '');
  const { rows } = await query('SELECT id, senha_hash, ativo FROM usuarios WHERE usuario = $1', [usuario]);
  const u = rows[0];
  const ok = u ? await bcrypt.compare(senha, u.senha_hash) : false;
  if (!ok) return { erro: 'Usuário ou senha incorretos.', usuario, ts: Date.now() };
  if (!u.ativo) return { erro: 'Seu acesso está desativado. Procure a equipe de TI.', usuario, ts: Date.now() };
  await createSession(u.id);
  redirect('/');
}

export async function sair() {
  destroySession();
  redirect('/login');
}

/* ---------- Chamados ---------- */

export async function abrirChamado(_prev, fd) {
  const user = await requireUser();
  const v = {
    titulo: txt(fd, 'titulo', 120),
    descricao: txt(fd, 'descricao', 4000),
    categoria: txt(fd, 'categoria', 60),
    prioridade: txt(fd, 'prioridade', 10),
    setor: txt(fd, 'setor', 80) || user.setor,
    local: txt(fd, 'local', 120),
    ramal: txt(fd, 'ramal', 20),
  };
  const falha = (erro) => ({ erro, valores: v, ts: Date.now() });

  if (v.titulo.length < 5) return falha('Escreva um título com pelo menos 5 caracteres.');
  if (v.descricao.length < 10) return falha('Descreva o problema com mais detalhes.');
  if (!CATEGORIAS.includes(v.categoria)) return falha('Escolha uma categoria.');
  if (!PRIORIDADE[v.prioridade]) return falha('Escolha a prioridade.');

  const { rows } = await query(
    `INSERT INTO chamados (titulo, descricao, categoria, prioridade, setor, local, ramal, solicitante_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [v.titulo, v.descricao, v.categoria, v.prioridade, v.setor, v.local, v.ramal, user.id]
  );
  const id = rows[0].id;
  await registrar(id, user.id, `Chamado aberto com prioridade ${PRIORIDADE[v.prioridade].l}`);
  redirect(`/chamados/${id}`);
}

export async function comentar(fd) {
  const user = await requireUser();
  const id = idDe(fd);
  const texto = txt(fd, 'texto', 4000);
  const c = await chamadoVisivel(id, user);
  if (!c || !texto) return;

  await registrar(id, user.id, texto, 'comentario');
  if (c.status === 'aguardando' && c.solicitante_id === user.id) {
    await query("UPDATE chamados SET status = 'em_atendimento', atualizado_em = NOW() WHERE id = $1", [id]);
    await registrar(id, user.id, 'Solicitante respondeu. Status voltou para Em atendimento');
  } else {
    await query('UPDATE chamados SET atualizado_em = NOW() WHERE id = $1', [id]);
  }
  revalidatePath(`/chamados/${id}`);
}

export async function atualizarChamado(fd) {
  const user = await requireStaff();
  const id = idDe(fd);
  const c = await chamadoVisivel(id, user);
  if (!c) return;

  const status = STATUS_L[fd.get('status')] ? String(fd.get('status')) : c.status;
  const prioridade = PRIORIDADE[fd.get('prioridade')] ? String(fd.get('prioridade')) : c.prioridade;
  const tecnicoRaw = Number(fd.get('tecnico_id'));
  let tecnicoId = null;
  let tecnicoNome = null;
  if (Number.isInteger(tecnicoRaw) && tecnicoRaw > 0) {
    const { rows } = await query(
      "SELECT id, nome FROM usuarios WHERE id = $1 AND perfil IN ('tecnico','admin') AND ativo",
      [tecnicoRaw]
    );
    if (rows[0]) {
      tecnicoId = rows[0].id;
      tecnicoNome = rows[0].nome;
    }
  }

  const mudancas = [];
  if (status !== c.status) mudancas.push(`Status: ${STATUS_L[c.status]} → ${STATUS_L[status]}`);
  if (prioridade !== c.prioridade) {
    mudancas.push(`Prioridade: ${PRIORIDADE[c.prioridade].l} → ${PRIORIDADE[prioridade].l}`);
  }
  if (tecnicoId !== c.tecnico_id) mudancas.push(tecnicoId ? `Técnico responsável: ${tecnicoNome}` : 'Técnico removido');
  if (!mudancas.length) return;

  await query(
    `UPDATE chamados
        SET status = $2, prioridade = $3, tecnico_id = $4, atualizado_em = NOW(),
            resolvido_em = CASE WHEN $2 IN ('resolvido','fechado') THEN COALESCE(resolvido_em, NOW()) ELSE NULL END
      WHERE id = $1`,
    [id, status, prioridade, tecnicoId]
  );
  for (const m of mudancas) await registrar(id, user.id, m);
  revalidatePath(`/chamados/${id}`);
  revalidatePath('/');
}

export async function assumirChamado(fd) {
  const user = await requireStaff();
  const id = idDe(fd);
  const c = await chamadoVisivel(id, user);
  if (!c || c.tecnico_id === user.id) return;
  await query(
    `UPDATE chamados
        SET tecnico_id = $2, atualizado_em = NOW(),
            status = CASE WHEN status = 'aberto' THEN 'em_atendimento' ELSE status END
      WHERE id = $1`,
    [id, user.id]
  );
  await registrar(id, user.id, `${user.nome} assumiu o chamado`);
  revalidatePath(`/chamados/${id}`);
  revalidatePath('/');
}

// Solicitante confirma que o problema foi resolvido, ou reabre o chamado.
export async function responderSolucao(fd) {
  const user = await requireUser();
  const id = idDe(fd);
  const c = await chamadoVisivel(id, user);
  if (!c || c.solicitante_id !== user.id || c.status !== 'resolvido') return;

  if (fd.get('decisao') === 'confirmar') {
    await query("UPDATE chamados SET status = 'fechado', atualizado_em = NOW() WHERE id = $1", [id]);
    await registrar(id, user.id, 'Solicitante confirmou a solução. Chamado fechado');
  } else {
    await query(
      "UPDATE chamados SET status = 'aberto', resolvido_em = NULL, atualizado_em = NOW() WHERE id = $1",
      [id]
    );
    await registrar(id, user.id, 'Solicitante informou que o problema continua. Chamado reaberto');
  }
  revalidatePath(`/chamados/${id}`);
  revalidatePath('/');
}

/* ---------- Administração ---------- */

export async function alterarPerfil(fd) {
  const admin = await requireAdmin();
  const id = idDe(fd);
  const perfil = String(fd.get('perfil') ?? '');
  if (!id || id === admin.id || !PERFIL_L[perfil]) return;
  await query('UPDATE usuarios SET perfil = $2 WHERE id = $1', [id, perfil]);
  revalidatePath('/usuarios');
}

export async function alternarAtivo(fd) {
  const admin = await requireAdmin();
  const id = idDe(fd);
  if (!id || id === admin.id) return;
  await query('UPDATE usuarios SET ativo = NOT ativo WHERE id = $1', [id]);
  revalidatePath('/usuarios');
}
