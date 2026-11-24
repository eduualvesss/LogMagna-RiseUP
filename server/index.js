const express = require('express');
const cors = require('cors');
const db = require('./db');
const rotasUnidades = require('./unidades');
const rotasAuth = require('./auth');
const { requireAuth } = rotasAuth;
const { router: rotasPedidos, trackingHandler, criarEventoRemessaHandler } = require('./routes/pedidos');
const rotasDashboard = require('./routes/dashboard');
const { categoriasRouter, seguradorasRouter, apolicesRouter } = require('./routes/seguros');
const { ocorrenciasRouter, sinistrosRouter, documentosRouter } = require('./routes/sinistros');
const { notificacoesRouter, atendimentosRouter, feedbacksRouter } = require('./routes/suporte');
const { auditoriaRouter, usuariosRouter } = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS restrito a origem do front (CLIENT_URL; padrao: Next.js em dev).
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json());

// Latencia simulada para exibir loadings no front (MOCK_DELAY_MS=0 desativa).
// Nunca aplicada em producao.
const MOCK_DELAY_MS = process.env.NODE_ENV === 'production' ? 0 : Number(process.env.MOCK_DELAY_MS ?? 150);
if (MOCK_DELAY_MS > 0) {
  app.use('/api', (req, res, next) => setTimeout(next, MOCK_DELAY_MS));
}

app.get('/api/health', (req, res) => {
  const tabelas = db.all(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );
  res.json({
    ok: true,
    database: 'Magna (SQLite)',
    tables: tabelas.length,
    tableNames: tabelas.map((t) => t.name),
  });
});

app.use('/api/auth', rotasAuth);
app.use('/api/dashboard', requireAuth, rotasDashboard);
app.use('/api/unidades', requireAuth, rotasUnidades);
app.use('/api/pedidos', requireAuth, rotasPedidos);
app.use('/api/products', requireAuth, rotasPedidos);
app.get('/api/tracking/:code', trackingHandler);
app.post('/api/remessas/:id/eventos', requireAuth, criarEventoRemessaHandler);

app.use('/api/categorias', requireAuth, categoriasRouter);
app.use('/api/seguradoras', requireAuth, seguradorasRouter);
app.use('/api/apolices', requireAuth, apolicesRouter);
app.use('/api/ocorrencias', requireAuth, ocorrenciasRouter);
app.use('/api/sinistros', requireAuth, sinistrosRouter);
app.use('/api/documentos', requireAuth, documentosRouter);
app.use('/api/notificacoes', requireAuth, notificacoesRouter);
app.use('/api/atendimentos', requireAuth, atendimentosRouter);
app.use('/api/feedbacks', requireAuth, feedbacksRouter);
app.use('/api/auditoria', requireAuth, auditoriaRouter);
app.use('/api/usuarios', requireAuth, usuariosRouter);

// Tratamento global de erros: sempre JSON, sem stack trace.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.status || err.statusCode || 500;
  let msg = 'Erro interno do servidor.';
  if (err.type === 'entity.too.large') msg = 'O conteúdo enviado excede o limite permitido (100 KB).';
  else if (err.type === 'entity.parse.failed') msg = 'JSON inválido.';
  else if (err.code === 'ERR_SQLITE_ERROR' || String(err.message || '').includes('CONSTRAINT')) {
    return res.status(409).json({ error: 'Violação de integridade no banco de dados.', erro: 'Violação de integridade no banco de dados.' });
  } else if (status < 500) msg = 'Requisição inválida.';
  else console.error(err);
  res.status(status).json({ error: msg, erro: msg });
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`LogMagna API rodando em http://localhost:${PORT} (Banco: ${db.dbPath})`));
}

module.exports = app;
