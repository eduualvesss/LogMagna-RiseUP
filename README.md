# LogMagna - Plataforma de Gestão e Rastreamento de Encomendas

A **LogMagna** é uma solução moderna e intuitiva para o gerenciamento de encomendas e simulação de seguros para compras online. O projeto oferece uma experiência visual limpa e elegante, centralizando o cadastro de produtos, acompanhamento detalhado de entregas e cálculo transparente de custos de proteção.

---

## 🚀 Tecnologias e Stack

O ecossistema é dividido em duas partes integradas: **Frontend (Client)** e **Backend (Server)**.

### Frontend
- **React (v19)**: Biblioteca base para a construção da interface reativa por componentes.
- **Vite (v8)**: Ferramenta de build e servidor de desenvolvimento ultrarrápido com Hot Module Replacement (HMR).
- **Tailwind CSS (v4)**: Framework de estilização utilitária para design responsivo e consistente, com paleta em verde floresta sólido e neutros suaves.
- **React Router DOM (v7)**: Gerenciamento de rotas e navegação client-side SPA (Single Page Application).
- **Lucide React**: Biblioteca de ícones moderna e consistente.

### Backend
- **Node.js**: Ambiente de execução JavaScript server-side.
- **Express (v5)**: Framework web minimalista para construção da API REST.
- **CORS**: Middleware para habilitar requisições cross-origin entre o cliente React e a API Node.

---

## 📁 Estrutura do Projeto

```plaintext
LogMagna/
├── .gitignore               # Configurações de arquivos ignorados no versionamento
├── README.md                # Documentação detalhada da aplicação
├── server/                  # Backend Node.js / Express
│   ├── index.js             # API REST, endpoints e lógica de negócio
│   ├── package.json         # Dependências e scripts do servidor
│   └── package-lock.json
└── client/                  # Frontend React / Vite
    ├── index.html           # Documento HTML principal
    ├── vite.config.js       # Configuração do Vite e plugins (React, Tailwind)
    ├── package.json         # Dependências e scripts do frontend
    ├── public/              # Arquivos públicos e ícones
    └── src/
        ├── main.jsx         # Ponto de entrada do React
        ├── index.css        # Importação do Tailwind e estilos base
        ├── App.jsx          # Componentes visuais, rotas e páginas da aplicação
        └── assets/          # Imagens e recursos estáticos (ex: fotos de produtos/hero)
```

---

## 📦 Bibliotecas Utilizadas e Justificativa

| Dependência | Escopo | Finalidade |
| :--- | :--- | :--- |
| `express` | Backend | Criação das rotas HTTP e manipulação de requisições/respostas JSON. |
| `cors` | Backend | Permite que o frontend (Vite na porta 5173) se comunique sem bloqueios com o backend (porta 3001). |
| `react` & `react-dom` | Frontend | Renderização da interface baseada em estado e ciclo de vida. |
| `react-router-dom` | Frontend | Navegação entre telas (`/`, `/dashboard`, `/services`, `/tracking`, `/add`) sem recarregar a página. |
| `@tailwindcss/vite` & `tailwindcss` | Frontend | Estilização ágil com design tokens nativos e ausência de gradientes excessivos (verde sólido `#1a3326` e variações harmoniosas). |
| `lucide-react` | Frontend | Ícones de alta fidelidade visual para cada recurso (entregas, caixas, status, busca, etc). |

---

## 🖥️ Telas e Funcionalidades Principais

1. **Landing Page (`/`)**
   - Apresentação da marca LogMagna.
   - Chamadas para ação (CTAs) para conhecer a área do cliente ou cadastrar compras.
   - Seção explicativa em 3 passos: *Cadastre sua compra*, *Organize seus serviços* e *Acompanhe o caminho*.
   - Exibição de logo vetorial em verde sólido e imagem de entregas.

2. **Visão Geral / Dashboard (`/dashboard`)**
   - Resumo com métricas consolidando total de serviços ativos, soma de valores dos produtos, contagem de entregas pendentes e custo simulado de proteção.
   - Card interativo da **próxima entrega** em trânsito com linha de trajeto (origem e destino).
   - Card de acesso rápido para cadastrar um novo produto.

3. **Serviços Contratados (`/services`)**
   - Listagem dinâmica obtida em tempo real via API (`GET /api/products`).
   - Tabela organizada com nome do produto, código de registro, valor do bem, custo simulado e status do envio (tags coloridas para *Em trânsito*, *Aguardando* ou *Entregue*).
   - Filtros por categoria e campo de busca.

4. **Rastrear Encomenda (`/tracking`)**
   - Busca em tempo real por código de rastreio (ex: `BR123456789SP`) consumindo `GET /api/tracking/:code`.
   - Linha do tempo (timeline) completa com histórico de movimentações, datas, horários e indicação da última atualização.
   - Painel lateral com resumo da encomenda, transportadora, valor e destino.

5. **Cadastrar Produto (`/add`)**
   - Formulário com dados do produto (nome, categoria, valor, vendedor, data de compra) e dados de envio (transportadora, rastreio, CEP, cidade/UF).
   - **Resumo dinâmico em tempo real**: calcula automaticamente a taxa ilustrativa de 2% sobre o valor digitado conforme o usuário preenche.
   - Envio via `POST /api/products` com persistência em memória no servidor e feedback imediato de sucesso ou erro.

---

## 🔌 Endpoints da API REST

A API do servidor roda por padrão na porta `3001`:

- **`GET /api/health`**
  - Retorna o status de integridade do servidor: `{ "ok": true }`.
- **`GET /api/products`**
  - Retorna a lista de produtos cadastrados com seus respectivos valores, custos calculados e status de envio.
- **`POST /api/products`**
  - Cadastra um novo produto.
  - *Payload esperado:* `{ "name": string, "value": number, "store": string, "destination": string, "tracking": string }`.
  - Retorna o objeto criado com ID gerado (`LM-2026-XXX`) e custo simulado calculado.
- **`GET /api/tracking/:code`**
  - Busca os dados e histórico de movimentações de um pacote pelo código de rastreio. Retorna `404` caso não encontrado.

---

## 🛠️ Como Executar o Projeto Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) instalado (versão 18 ou superior recomendada).
- Gerenciador de pacotes `npm`.

### 1. Inicializando o Backend (Server)

Abra um terminal na pasta raiz e execute:

```bash
cd server
npm install
npm run dev
# ou: npm start
```

O servidor iniciará em: **`http://localhost:3001`**

### 2. Inicializando o Frontend (Client)

Em outro terminal, execute:

```bash
cd client
npm install
npm run dev
```

O frontend iniciará por padrão em: **`http://localhost:5173`** (ou porta indicada no terminal). Abra a URL no seu navegador para acessar a aplicação.

---

## 🎨 Identidade Visual e Estilo

- **Cores**: Priorização de tons sólidos de verde floresta (`#1a3326` e `#2d4a3e`) com fundos neutros (`#f4f6f5`), eliminando gradientes pesados e garantindo um aspecto corporativo premium.
- **Tipografia e Ícones**: Tipografia limpa, hierarquia visual equilibrada e ícones contextuais do Lucide React.
- **Logo**: Ícone customizado de entrega com caminhão dinâmico em traço sólido.
