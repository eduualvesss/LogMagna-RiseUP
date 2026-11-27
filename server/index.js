const express = require('express');
const cors = require('cors');
const db = require('./db');
const { PORT, IS_PROD, CLIENT_ORIGINS } = require('./config/env');
const { securityHeaders } = require('./middleware/security');
const publicRoutes = require('./routes/public');
const privateRoutes = require('./routes/private');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(securityHeaders);

const ORIGEM_LOCAL_RE =
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/i;

app.use(
  cors((req, callback) => {
    const origin = req.headers.origin;
    if (!origin) return callback(null, { origin: true });

    if (CLIENT_ORIGINS.length > 0 && CLIENT_ORIGINS.includes(origin)) {
      return callback(null, { origin: true });
    }
    const reqHost = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
    if (reqHost && (origin === `https://${reqHost}` || origin === `http://${reqHost}`)) {
      return callback(null, { origin: true });
    }
    if (!IS_PROD && ORIGEM_LOCAL_RE.test(origin)) {
      return callback(null, { origin: true });
    }
    if (origin === 'http://localhost:3000') {
      return callback(null, { origin: true });
    }
    return callback(null, { origin: false });
  })
);
app.use(express.json({ limit: '100kb' }));

// Sincronizacao transparente com Vercel Private Blob antes e depois de cada requisicao
app.use('/api', (req, res, next) => {
  const isWrite = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  db.syncBeforeRequest(isWrite)
    .then(() => {
      const origJson = res.json.bind(res);
      const origEnd = res.end.bind(res);
      let flushed = false;

      const ensureFlush = () => {
        if (flushed || !db.isDirty()) return Promise.resolve();
        flushed = true;
        return db.flushAfterRequest();
      };

      res.json = (body) => {
        ensureFlush()
          .catch((err) => console.error('Erro ao persistir banco:', err))
          .finally(() => origJson(body));
        return res;
      };

      res.end = (chunk, encoding, callback) => {
        if (flushed || !db.isDirty()) {
          return origEnd(chunk, encoding, callback);
        }
        ensureFlush()
          .catch((err) => console.error('Erro ao persistir banco:', err))
          .finally(() => origEnd(chunk, encoding, callback));
        return res;
      };

      next();
    })
    .catch(next);
});

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
