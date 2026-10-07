import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SignJWT, jwtVerify } from 'jose';
import { query } from './db';

const COOKIE = 'hecc_sessao';
const DURACAO_HORAS = 12; // um plantão

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) {
    throw new Error('JWT_SECRET ausente ou muito curta (mínimo 16 caracteres). Veja o arquivo .env.example.');
  }
  return new TextEncoder().encode(s);
}

export async function createSession(userId) {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${DURACAO_HORAS}h`)
    .sign(secret());
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: DURACAO_HORAS * 60 * 60,
  });
}

export function destroySession() {
  cookies().delete(COOKIE);
}

export async function getUser() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  let uid;
  try {
    const { payload } = await jwtVerify(token, secret());
    uid = payload.uid;
  } catch {
    return null;
  }
  const { rows } = await query(
    'SELECT id, nome, usuario, setor, cargo, perfil, ativo FROM usuarios WHERE id = $1',
    [uid]
  );
  const u = rows[0];
  if (!u || !u.ativo) return null;
  return u;
}

export const isStaff = (u) => u?.perfil === 'tecnico' || u?.perfil === 'admin';

export async function requireUser() {
  const u = await getUser();
  if (!u) redirect('/login');
  return u;
}

export async function requireStaff() {
  const u = await requireUser();
  if (!isStaff(u)) redirect('/');
  return u;
}

export async function requireAdmin() {
  const u = await requireUser();
  if (u.perfil !== 'admin') redirect('/');
  return u;
}
