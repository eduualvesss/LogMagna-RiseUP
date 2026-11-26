# LogMagna - Plataforma de Gestão, Rastreamento e Seguros de Cargas

A **LogMagna** é uma plataforma full-stack para gerenciamento de encomendas, apólices de seguro, rastreamento logístico público e operacional, ocorrências, sinistros, documentos comprobatórios, atendimentos, feedbacks, notificações e auditoria corporativa, integrada ao banco relacional **Magna**.

---

## 🚀 Tecnologias e Stack

### Frontend (`client/`)
- **Next.js (v16, App Router)** com **React (v19)** e **TypeScript (`strict: true`)**.
- **Arquitetura em camadas (`page > component > hook > service > api`)**:
  - `client/app/(public)/` e `client/app/(private)/` — separação explícita de rotas públicas e autenticadas via Next.js Route Groups e guard de sessão.
  - `client/src/components/` — componentes de UI reutilizáveis (`ui/`), shell corporativo (`layout/`), provedores de contexto (`providers/`) e módulos por domínio (`features/`).
  - `client/src/hooks/` — hooks de estado e carregamento assíncrono com `AbortController`.
  - `client/src/services/` — cliente HTTP centralizado (`api.ts`) e serviços por domínio.
- **Tailwind CSS (v4)**, **Lucide React** e **oxlint** para análise estática.

### Backend (`server/`)
- **Node.js (v24+)** com **Express (v5)** e separação entre **rotas públicas** (`server/routes/public/`) e **rotas privadas protegidas por JWT/HMAC + RBAC** (`server/routes/private/`).
- **Banco de Dados SQLite embutido (`node:sqlite` — `DatabaseSync`)** persistido em `server/data/magna.db` com PRAGMAs de performance (`WAL`, `foreign_keys`, `busy_timeout`, `cache_size`).
- **Segurança**: cabeçalhos HTTP (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`), CORS restrito por origem, rate limiting com limpeza automática, política de senha forte (`>= 8` caracteres com letra e número), hash `scrypt` + `timingSafeEqual`, revogação de token (`jti`) no logout e controle de acesso por perfil (`admin` / `cliente`).
- **Scripts T-SQL (SQL Server)** equivalentes em [`database/schema.sqlserver.sql`](database/schema.sqlserver.sql).

---

## 📁 Estrutura do Projeto

```plaintext
LogMagna-RiseUP/
├── database/                         # Scripts DDL do Banco Magna
│   ├── schema.sqlite.sql             # Schema SQLite executado pelo backend
│   ├── schema.sqlserver.sql          # Schema T-SQL para SQL Server / SSMS
│   └── seed.sqlserver.sql            # Referência T-SQL
├── server/                           # Backend Node.js / Express + node:sqlite
│   ├── config/env.js                 # Variáveis de ambiente e segredo HMAC
│   ├── db/
│   │   ├── index.js                  # Conexão SQLite, PRAGMAs e helpers transacionais
│   │   ├── crypto.js                 # Validação de senha, scrypt e timingSafeEqual
│   │   ├── bootstrap.js              # Catálogo inicial (CATEGORIA_PRODUTO e SEGURADORA)
│   │   └── reset.js                  # Reset limpo de registros mantendo o catálogo
│   ├── middleware/
│   │   ├── auth.js                   # Token HMAC-SHA256, revogação (jti), requireAuth e requireAdmin
│   │   ├── rateLimit.js              # Limitador em memória com limpeza periódica
│   │   └── security.js               # Cabeçalhos HTTP defensivos
│   └── routes/
│       ├── public/                   # Endpoints públicos (/health, /auth/*, /tracking/:code)
│       └── private/                  # Endpoints autenticados (account, dashboard, pedidos, seguros, sinistros, suporte, unidades, admin)
├── client/                           # Frontend Next.js (App Router) + TypeScript
│   ├── app/
│   │   ├── (public)/                 # Rotas abertas: /, /login, /cadastro, /rastrear
│   │   ├── (private)/                # Rotas autenticadas sob PrivateLayout + AppShell
│   │   ├── globals.css
│   │   └── layout.tsx
│   └── src/
│       ├── components/               # ui/, layout/, providers/ e features/
│       ├── hooks/                    # Contextos e hooks de dados com AbortController
│       ├── services/                 # api.ts + serviços por domínio
│       ├── lib/                      # Config, formatação e storage
│       └── types/                    # Tipagens canônicas do Banco Magna
├── dev.js                            # Sobe backend e frontend juntos em desenvolvimento
├── iniciar.bat                       # Atalho de inicialização rápida no Windows
└── package.json                      # Scripts unificados do monorepo
```

---

## 🔐 Primeiro Acesso e Perfis (Sem Seeds de Usuários)

A plataforma inicia **sem contas pré-cadastradas e sem dados fictícios** nas tabelas transacionais (`USUARIO`, `CLIENTE`, `PEDIDO`, `APOLICE`, `REMESSA`, `SINISTRO`, `UNIDADE`, `AUDITORIA`), mantendo apenas o catálogo mínimo de operação (`CATEGORIA_PRODUTO` e `SEGURADORA`):

1. No primeiro acesso em `/cadastro` (quando ainda não existem usuários no banco, `GET /api/auth/setup-status` retorna `needsSetup: true`), **a primeira conta criada recebe automaticamente o perfil `admin`**.
2. Os cadastros públicos seguintes recebem o perfil `cliente`.
3. Usuários `admin` podem gerenciar outros usuários, alternar perfis (`admin` / `cliente`), cadastrar unidades logísticas, gerenciar categorias/seguradoras e validar documentos de sinistro em `/auditoria`, `/unidades` e `/apolices`.

Para zerar pedidos, usuários e movimentações preservando o catálogo inicial:
```bash
npm run db:reset
```

---

## 🗄️ Estrutura do Banco de Dados (`Magna`)

Modelagem relacional original elaborada por **Hadassa Juliane** e adaptada para execução integrada em **SQLite** e entrega em **SQL Server**:
- [`database/schema.sqlite.sql`](database/schema.sqlite.sql) — schema utilizado em tempo de execução pelo backend Node/Express.
- [`database/schema.sqlserver.sql`](database/schema.sqlserver.sql) — schema T-SQL completo para SQL Server / SSMS.

### Tabelas Implementadas (16 tabelas)
1. `USUARIO` & `CLIENTE` — Autenticação corporativa, perfis (`admin` / `cliente`) e perfil comercial do cliente.
2. `CATEGORIA_PRODUTO` & `PEDIDO` — Pedidos com valor declarado, status, análise de retenção, categoria, produto e loja.
3. `SEGURADORA` & `APOLICE` — Seguradoras parceiras, valores segurados, vigências, coberturas e prêmio.
4. `REMESSA` & `EVENTO_RASTREIO` — Códigos de rastreio, origem/destino, previsão e linha do tempo de movimentações.
5. `OCORRENCIA`, `SINISTRO` & `DOCUMENTO` — Registro de incidentes, abertura/atualização de sinistros e validação administrativa de documentos anexos.
6. `NOTIFICACAO` — Avisos por cliente com criação automática ao cadastrar pedidos, ocorrências e sinistros.
7. `ATENDIMENTO` & `FEEDBACK` — Chamados de suporte vinculados a pedidos e pesquisas estruturadas de experiência.
8. `AUDITORIA` — Trilha completa de logs por usuário, entidade, registro e ação.
9. `UNIDADE` — Cadastro CRUD de hubs e centros de distribuição com controle de versão otimista.

---

## 🔌 Principais Endpoints da API REST (`/api`)

### Rotas Públicas (`server/routes/public/`)
- `GET /api/health` — Saúde da API e contagem de tabelas do Banco Magna.
- `GET /api/auth/setup-status`, `POST /api/auth/login`, `POST /api/auth/register` — Verificação de primeiro acesso, autenticação e cadastro.
- `GET /api/tracking/:code` — Consulta pública sanitizada de rastreamento (sem exposição de PII do cliente ou valores financeiros).

### Rotas Privadas (`server/routes/private/` — exigem `Bearer Token`)
- **Conta**: `GET /api/auth/me`, `PUT /api/auth/profile`, `PUT /api/auth/password`, `POST /api/auth/logout`.
- **Operação**: `GET /api/dashboard`, `GET/POST /api/pedidos`, `GET/PATCH/DELETE /api/pedidos/:id`, `GET /api/pedidos/rastreio/:code`, `POST /api/remessas/:id/eventos`.
- **Seguros e Catálogo**: `GET /api/categorias`, `POST/PUT/DELETE /api/categorias` (`admin`), `GET /api/seguradoras`, `POST/PUT/DELETE /api/seguradoras` (`admin`), `GET/POST/PUT /api/apolices`.
- **Ocorrências e Sinistros**: `GET/POST /api/ocorrencias`, `GET/POST/PUT /api/sinistros`, `GET/POST /api/sinistros/:id/documentos`, `PATCH /api/documentos/:id` (`admin`), `DELETE /api/documentos/:id`.
- **Comunicação e Suporte**: `GET/POST /api/notificacoes`, `PATCH /api/notificacoes/:id/lida`, `POST /api/notificacoes/marcar-todas-lidas`, `DELETE /api/notificacoes/:id`, `GET/POST/PATCH /api/atendimentos`, `GET/POST /api/feedbacks`.
- **Administração**: `GET/POST/PUT/DELETE /api/unidades` (`admin` para escrita), `GET /api/auditoria`, `GET/POST /api/usuarios` (`admin`), `PATCH /api/usuarios/:id/ativo` (`admin`), `PATCH /api/usuarios/:id/perfil` (`admin`).

---

## 🖥️ Telas da Aplicação

### Rotas Públicas (`(public)`)
- `/` — Landing Page institucional com acesso direto ao rastreamento público.
- `/rastrear` — Consulta pública de encomendas por código (`?code=...`).
- `/login` e `/cadastro` — Autenticação e criação de conta (com fluxo automático de primeiro administrador).

### Rotas Privadas (`(private)`)
- `/dashboard` — Visão geral operacional com agregações SQL em tempo real, próxima entrega e últimas ocorrências.
- `/services` — Listagem de pedidos e remessas com filtros e edição de status/retenção.
- `/tracking` — Rastreamento operacional completo e lançamento de eventos em tempo real.
- `/add` — Cadastro transacional de pedido, apólice, remessa, evento inicial e notificação.
- `/apolices` — Gestão de apólices e seguradoras.
- `/sinistros` — Gestão de ocorrências, sinistros e documentos anexos (validação restrita a `admin`).
- `/atendimentos` — Chamados de suporte e pesquisas de feedback.
- `/notificacoes` — Central de notificações integrada ao contador da barra superior.
- `/unidades` — CRUD de hubs e unidades operacionais (`admin`).
- `/auditoria` — Minha conta & alteração de senha, gestão de usuários/perfis (`admin`), categorias (`admin`) e logs de auditoria.

---

## ⚙️ Variáveis de Ambiente

- **Backend** ([`server/.env.example`](server/.env.example)): `PORT`, `CLIENT_URL`, `AUTH_SECRET`, `DB_PATH`.
- **Frontend** ([`client/.env.example`](client/.env.example)): `NEXT_PUBLIC_API_URL` (padrão `http://127.0.0.1:3001/api`).

---

## ⚡ Como Rodar

Na raiz do repositório (`LogMagna-RiseUP`):

```bash
# Instalar dependências (se necessário)
npm run install:all

# Iniciar Backend + Frontend juntos
npm run dev
```

Outros scripts úteis:
```bash
npm run db:reset  # Limpa pedidos/usuários/movimentações mantendo o catálogo padrão
npm run lint      # Verificação estática com oxlint
npm run build     # Build de produção do frontend Next.js
```

- **Frontend (Next.js):** `http://localhost:3000`
- **Backend (Express + SQLite Magna):** `http://localhost:3001`
