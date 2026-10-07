# HECC Chamados

Sistema de chamados do **Hospital Estadual Costa dos Coqueiros**.

## O que tem

- **Cadastro pelo próprio funcionário**: nome, setor, cargo, usuário e senha (a senha fica salva criptografada com bcrypt).
- **Login e senha** com sessão de 12 horas (um plantão).
- **4 níveis de prioridade** com prazo de atendimento:
  | Prioridade | Prazo | Quando usar |
  |---|---|---|
  | Crítica | 1 h | Parou o atendimento ao paciente ou um setor crítico |
  | Alta | 4 h | Impede o trabalho e não há alternativa |
  | Média | 8 h | Atrapalha, mas dá para seguir |
  | Baixa | 24 h | Dúvida, pedido ou melhoria |

  Os prazos ficam em `lib/constantes.js` e podem ser ajustados.
- **Fila com filtros** por prioridade, status, setor e busca (título, descrição ou nº do chamado). Os blocos de prioridade no topo também filtram e mostram quantos chamados estão fora do prazo.
- **Perfis**:
  - **Usuário**: abre chamados e vê só os seus.
  - **Técnico**: vê a fila inteira, assume chamados, muda status, prioridade e responsável.
  - **Administrador**: tudo do técnico, e também promove ou desativa usuários.
- **A primeira pessoa que se cadastrar vira Administradora.** Cadastre-se você primeiro.
- Histórico de cada chamado (comentários e todas as mudanças de status).
- O solicitante confirma a solução ou reabre o chamado.

## Publicar no Vercel (teste)

1. Crie um repositório no GitHub e envie esta pasta `hecc-chamados`.
2. Em [vercel.com](https://vercel.com), clique em **Add New → Project** e importe o repositório.
3. Antes do deploy, ou logo depois, abra o projeto e vá em **Storage → Create Database → Neon (Postgres)**. Ligue o banco ao projeto. O Vercel cria a variável `DATABASE_URL` sozinho.
4. Em **Settings → Environment Variables**, crie `JWT_SECRET` com um texto aleatório e longo. Para gerar um no PowerShell:
   ```powershell
   [guid]::NewGuid().ToString() + [guid]::NewGuid().ToString()
   ```
5. Faça o **Redeploy**. As tabelas são criadas sozinhas no primeiro acesso.
6. Abra o site, clique em **Crie o seu cadastro** e cadastre-se (você vira Administrador).

## Rodar no computador (opcional)

Precisa do [Node.js 20 ou mais novo](https://nodejs.org) e de um Postgres (pode usar o mesmo do Neon).

```bash
npm install
```

Copie `.env.example` para `.env.local` e preencha `DATABASE_URL` e `JWT_SECRET`. Depois:

```bash
npm run dev
```

Abra http://localhost:3000.

## Levar para a VPS depois

Na VPS (Ubuntu, por exemplo): instale Node.js 20+ e PostgreSQL, crie um banco, e no `.env.local` use
`DATABASE_URL=postgresql://hecc:SENHA@localhost:5432/hecc_chamados`. Então:

```bash
npm install && npm run build && npm start
```

Use um proxy (Nginx ou Caddy) com HTTPS na frente da porta 3000 e o `pm2` para manter o processo rodando.
Para levar os dados do Neon para a VPS, use `pg_dump` no Neon e `psql` na VPS.

## Estrutura

```
app/
  page.js                 fila de chamados com filtros
  login/  cadastro/       acesso
  chamados/novo/          abrir chamado
  chamados/[id]/          detalhe, histórico e atendimento
  usuarios/               gestão de perfis (admin)
  actions.js              todas as operações do servidor
lib/
  db.js                   conexão e criação das tabelas
  auth.js                 sessão e permissões
  constantes.js           prioridades, prazos, setores, categorias
```
