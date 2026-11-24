# LogMagna - Plataforma de Gestão, Rastreamento e Seguros de Encomendas

A **LogMagna** é uma plataforma full-stack para gerenciamento de encomendas, apólices de seguro, rastreamento logístico, ocorrências, sinistros, documentos, atendimentos, feedbacks e auditoria de operações, integrada ao banco relacional **Magna**.

---

## 🚀 Tecnologias e Stack

### Frontend (`client/`)
- **Next.js (v16, App Router)** com **React (v19)** e **TypeScript**.
- **Tailwind CSS (v4)** com paleta em verde floresta (`#1a3326`) e neutros suaves.
- **Lucide React** para ícones.

### Backend (`server/`)
- **Node.js (v24+)** com **Express (v5)**.
- **Banco de Dados SQLite embutido (`node:sqlite` — `DatabaseSync`)** persistido em `server/data/magna.db` (zero dependências externas).
- **Autenticação HMAC-SHA256 + hash de senha `scrypt`** (`crypto.timingSafeEqual`).
- **Scripts T-SQL (SQL Server)** equivalentes disponíveis em `database/schema.sqlserver.sql` e `database/seed.sqlserver.sql`.

---

## 📁 Estrutura do Projeto

```plaintext
LogMagna-RiseUP/
├── database/                    # Scripts DDL e carga inicial do Banco Magna
│   ├── schema.sqlite.sql        # Schema SQLite usado em tempo de execução
│   ├── schema.sqlserver.sql     # Schema T-SQL completo para SQL Server / SSMS
│   └── seed.sqlserver.sql       # Carga inicial T-SQL equivalente à seed do backend
├── server/                      # Backend Node.js / Express + node:sqlite
│   ├── db/
│   │   ├── index.js             # Conexão SQLite, helpers transacionais e auditoria
│   │   ├── crypto.js            # Hash e verificação scrypt de senhas
│   │   └── seed.js              # Seed automática idempotente das 16 tabelas
│   ├── routes/                  # Rotas REST por domínio
│   │   ├── dashboard.js         # Métricas consolidadas e próximas entregas
│   │   ├── pedidos.js           # Pedidos, remessas, tracking e eventos
│   │   ├── seguros.js           # Categorias, seguradoras e apólices
│   │   ├── sinistros.js         # Ocorrências, sinistros e documentos
│   │   ├── suporte.js           # Notificações, atendimentos e feedbacks
│   │   └── admin.js             # Auditoria e gerenciamento de usuários
│   ├── auth.js                  # Login, cadastro (USUARIO + CLIENTE) e perfil
│   ├── unidades.js              # CRUD de unidades logísticas com versão otimista
│   ├── index.js                 # Entrada da API REST Express
│   └── .env.example             # Variáveis de ambiente do servidor
├── client/                      # Frontend Next.js (App Router) + TypeScript
│   ├── app/
│   │   ├── components/          # Formulários e painéis modulares
│   │   ├── lib/                 # Sessão, authFetch, config e formatadores
│   │   ├── apolices/            # Gestão de apólices e seguradoras
│   │   ├── atendimentos/        # Chamados e pesquisas de feedback
│   │   ├── auditoria/           # Logs de auditoria, conta e categorias
│   │   ├── cadastro/            # Registro de novos usuários/clientes
│   │   ├── dashboard/           # Visão geral do cliente/admin
│   │   ├── login/               # Autenticação
│   │   ├── notificacoes/        # Central de notificações
│   │   ├── services/            # Listagem e gerenciamento de pedidos/seguros
│   │   ├── sinistros/           # Ocorrências, sinistros e documentos
│   │   ├── tracking/            # Rastreamento e eventos em tempo real
│   │   ├── unidades/            # Cadastro de unidades logísticas
│   │   └── add/                 # Cadastro transacional de pedido + apólice + remessa
│   └── .env.example             # Variáveis de ambiente do frontend
├── dev.js                       # Sobe backend e frontend juntos em desenvolvimento
├── iniciar.bat                  # Atalho de inicialização rápida no Windows
└── package.json                 # Scripts unificados do monorepo
```

---

## 🗄️ Estrutura do Banco de Dados (`Magna`)

Modelagem relacional original elaborada por **Hadassa Juliane** e adaptada para execução integrada em **SQLite** e entrega em **SQL Server**:
- [`database/schema.sqlite.sql`](database/schema.sqlite.sql) — schema utilizado em tempo de execução pelo backend Node/Express.
- [`database/schema.sqlserver.sql`](database/schema.sqlserver.sql) — schema T-SQL completo para SQL Server / SSMS (com remoção do `UNIQUE (id_usuario)` indevido em `AUDITORIA`, ampliação de `senha_hash` e textos, e colunas complementares de produto/envio/prêmio).
- [`database/seed.sqlserver.sql`](database/seed.sqlserver.sql) — carga inicial T-SQL equivalente à seed automática do backend.

### Tabelas Implementadas (16 tabelas)
1. `USUARIO` & `CLIENTE` — Autenticação corporativa, perfis (`admin` / `cliente`) e perfil comercial do cliente.
2. `CATEGORIA_PRODUTO` & `PEDIDO` — Pedidos com valor declarado, status, análise de retenção, categoria, produto e loja.
3. `SEGURADORA` & `APOLICE` — Seguradoras parceiras, valores segurados, vigências, coberturas e prêmio.
4. `REMESSA` & `EVENTO_RASTREIO` — Códigos de rastreio, origem/destino, previsão e linha do tempo de movimentações.
5. `OCORRENCIA`, `SINISTRO` & `DOCUMENTO` — Registro de incidentes de transporte, abertura/atualização de sinistros e validação de documentos anexos.
6. `NOTIFICACAO` — Avisos no painel por cliente (incluindo criação automática ao cadastrar pedidos, ocorrências e sinistros).
7. `ATENDIMENTO` & `FEEDBACK` — Chamados de suporte vinculados a pedidos e pesquisas estruturadas de experiência.
8. `AUDITORIA` — Trilha completa de logs por usuário, entidade, registro e ação.
9. `UNIDADE` — Cadastro CRUD de matriz, filiais e centros de distribuição com controle de versão otimista.

---

## 🔌 Principais Endpoints da API REST (`/api`)

- **Saúde e Autenticação**: `GET /api/health`, `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`, `PUT /api/auth/profile`
- **Operação**: `GET /api/dashboard`, `GET/POST /api/pedidos` (e `/api/products`), `GET/PATCH /api/pedidos/:id`, `GET /api/tracking/:code`, `POST /api/remessas/:id/eventos`
- **Seguros e Catálogo**: `GET/POST/PUT/DELETE /api/categorias`, `GET/POST/PUT/DELETE /api/seguradoras`, `GET/POST/PUT /api/apolices`
- **Ocorrências e Sinistros**: `GET/POST /api/ocorrencias`, `GET/POST/PUT /api/sinistros`, `GET/POST /api/sinistros/:id/documentos`, `PATCH/DELETE /api/documentos/:id`
- **Comunicação e Suporte**: `GET/POST /api/notificacoes`, `PATCH /api/notificacoes/:id/lida`, `POST /api/notificacoes/marcar-todas-lidas`, `GET/POST/PATCH /api/atendimentos`, `GET/POST /api/feedbacks`
- **Administração**: `GET/POST/PUT/DELETE /api/unidades`, `GET /api/auditoria`, `GET /api/usuarios`, `PATCH /api/usuarios/:id/ativo`

---

## 🖥️ Telas da Aplicação

- `/` — Landing Page institucional.
- `/login` e `/cadastro` — Login e criação de conta (`USUARIO` + `CLIENTE`).
- `/dashboard` — Visão geral com métricas reais do banco, próxima entrega e últimas ocorrências.
- `/services` — Listagem de pedidos e seguros com filtros por status/categoria/busca e modal de gerenciamento.
- `/tracking` — Rastreamento por código (`?code=...`), timeline de `EVENTO_RASTREIO`, ocorrências e formulários operacionais.
- `/add` — Cadastro transacional de pedido, apólice, remessa, evento inicial e notificação.
- `/apolices` — Gestão de apólices e seguradoras.
- `/sinistros` — Gestão de ocorrências, sinistros e documentos anexos (com validação).
- `/atendimentos` — Chamados de suporte e pesquisas de feedback.
- `/notificacoes` — Central de notificações integrada ao contador da barra superior.
- `/unidades` — CRUD de unidades logísticas.
- `/auditoria` — Logs de auditoria, edição do perfil do cliente, gerenciamento de usuários (`admin`) e categorias de produto.

### Credenciais de Demonstração (seed automática)
- **Cliente:** `cliente@logmagna.com` / `logmagna123`
- **Administrador:** `admin@logmagna.com` / `logmagna123`

---

## ⚙️ Variáveis de Ambiente

- **Backend** ([`server/.env.example`](server/.env.example)): `PORT`, `CLIENT_URL`, `AUTH_SECRET`, `DB_PATH`, `MOCK_DELAY_MS`.
- **Frontend** ([`client/.env.example`](client/.env.example)): `NEXT_PUBLIC_API_URL` (padrão `http://localhost:3001/api`).

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
npm run build                  # Build de produção do frontend Next.js
npm --prefix client run lint   # Verificação estática com oxlint
```

- **Frontend (Next.js):** `http://localhost:3000`
- **Backend (Express + SQLite Magna):** `http://localhost:3001`

> Na primeira inicialização, o servidor cria `server/data/magna.db` e popula todas as 16 tabelas automaticamente caso o banco esteja vazio.
