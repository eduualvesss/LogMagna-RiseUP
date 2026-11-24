const express = require('express');
const cors = require('cors');
const db = require('./db');
const { PORT, IS_PROD, CLIENT_ORIGINS } = require('./config/env');
const { securityHeaders } = require('./middleware/security');
const publicRoutes = require('./routes/public');
const privateRoutes = require('./routes/private');

const app = express();
app.disable('x-powered-by');
app.use(securityHeaders);

const ORIGEM_LOCAL_RE =
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/i;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (CLIENT_ORIGINS.length > 0) {
        return callback(null, CLIENT_ORIGINS.includes(origin));
      }
      if (!IS_PROD && ORIGEM_LOCAL_RE.test(origin)) {
        return callback(null, true);
      }
      return callback(null, origin === 'http://localhost:3000');
    },
  })
);
app.use(express.json({ limit: '100kb' }));

// Separação explícita de rotas públicas e rotas privadas (autenticadas)
app.use('/api', publicRoutes);
app.use('/api', privateRoutes);

// Tratamento global de erros: sempre JSON, sem stack trace.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.status || err.statusCode || 500;
  let msg = 'Erro interno do servidor.';
  if (err.type === 'entity.too.large') msg = 'O conteúdo enviado excede o limite permitido (100 KB).';
  else if (err.type === 'entity.parse.failed') msg = 'JSON inválido.';
  else if (err.code === 'ERR_SQLITE_ERROR' || String(err.message || '').includes('CONSTRAINT')) {
    return res.status(409).json({ error: 'Violação de integridade no banco de dados.' });
  } else if (status < 500) msg = 'Requisição inválida.';
  else console.error(err);
  res.status(status).json({ error: msg });
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`LogMagna API rodando em http://localhost:${PORT} (Banco: ${db.dbPath})`));
}

module.exports = app;
