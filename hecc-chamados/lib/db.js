import { Pool } from 'pg';

// Tabelas criadas automaticamente na primeira conexão.
const SCHEMA = `
CREATE TABLE IF NOT EXISTS usuarios (
  id          SERIAL PRIMARY KEY,
  nome        TEXT NOT NULL,
  usuario     TEXT NOT NULL UNIQUE,
  senha_hash  TEXT NOT NULL,
  setor       TEXT NOT NULL,
  cargo       TEXT NOT NULL,
  perfil      TEXT NOT NULL DEFAULT 'usuario' CHECK (perfil IN ('usuario','tecnico','admin')),
  ativo       BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chamados (
  id              SERIAL PRIMARY KEY,
  titulo          TEXT NOT NULL,
  descricao       TEXT NOT NULL,
  categoria       TEXT NOT NULL,
  prioridade      TEXT NOT NULL CHECK (prioridade IN ('baixa','media','alta','critica')),
  status          TEXT NOT NULL DEFAULT 'aberto'
                  CHECK (status IN ('aberto','em_atendimento','aguardando','resolvido','fechado')),
  setor           TEXT NOT NULL,
  local           TEXT NOT NULL DEFAULT '',
  ramal           TEXT NOT NULL DEFAULT '',
  solicitante_id  INTEGER NOT NULL REFERENCES usuarios(id),
  tecnico_id      INTEGER REFERENCES usuarios(id),
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolvido_em    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS comentarios (
  id          SERIAL PRIMARY KEY,
  chamado_id  INTEGER NOT NULL REFERENCES chamados(id) ON DELETE CASCADE,
  autor_id    INTEGER NOT NULL REFERENCES usuarios(id),
  texto       TEXT NOT NULL,
  tipo        TEXT NOT NULL DEFAULT 'comentario' CHECK (tipo IN ('comentario','sistema')),
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chamados_status_idx      ON chamados (status);
CREATE INDEX IF NOT EXISTS chamados_solicitante_idx ON chamados (solicitante_id);
CREATE INDEX IF NOT EXISTS chamados_tecnico_idx     ON chamados (tecnico_id);
CREATE INDEX IF NOT EXISTS comentarios_chamado_idx  ON comentarios (chamado_id);
`;

const g = globalThis;

function pool() {
  if (!g.__heccPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL não configurada. Veja o arquivo .env.example.');
    }
    const local = /@(localhost|127\.0\.0\.1)[:/]/.test(connectionString);
    g.__heccPool = new Pool({
      connectionString,
      ssl: local ? false : { rejectUnauthorized: false },
      max: 5,
    });
  }
  return g.__heccPool;
}

function ensureSchema() {
  if (!g.__heccSchema) {
    g.__heccSchema = pool()
      .query(SCHEMA)
      .catch((e) => {
        g.__heccSchema = null; // tenta de novo na próxima requisição
        throw e;
      });
  }
  return g.__heccSchema;
}

export async function query(text, params = []) {
  await ensureSchema();
  return pool().query(text, params);
}
