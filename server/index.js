const express = require('express');
const cors = require('cors');
const rotasUnidades = require('./unidades');
const rotasAuth = require('./auth');
const { requireAuth } = rotasAuth;

const app = express();
const PORT = process.env.PORT || 3001;

// CORS restrito a origem do front (CLIENT_URL; padrao: Next.js em dev).
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json());

// Latencia simulada para exibir loadings no front (MOCK_DELAY_MS=0 desativa).
// Nunca aplicada em producao.
const MOCK_DELAY_MS = process.env.NODE_ENV === 'production' ? 0 : Number(process.env.MOCK_DELAY_MS ?? 600);
app.use('/api', (req, res, next) => setTimeout(next, MOCK_DELAY_MS));
app.use('/api/auth', rotasAuth);
app.use('/api/unidades', requireAuth, rotasUnidades);

const { RATE, products, history } = require('./seeds');

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/api/products', requireAuth, (req, res) => res.json(products));

app.post('/api/products', requireAuth, (req, res) => {
  const { name, value, store, destination, tracking, purchaseDate, cep } = req.body || {};
  const num = Number(value);
  if (typeof name !== 'string' || !name.trim() || !Number.isFinite(num) || num <= 0) {
    return res.status(400).json({ error: 'Nome e valor válidos são obrigatórios.' });
  }
  if (name.trim().length > 120) {
    return res.status(400).json({ error: 'O nome do produto deve ter no máximo 120 caracteres.' });
  }
  const camposTexto = [name, store, destination, tracking, purchaseDate, cep].filter((v) => typeof v === 'string');
  if (camposTexto.some((v) => /[<>]/.test(v))) {
    return res.status(400).json({ error: 'Caracteres HTML (< ou >) não são permitidos.' });
  }
  const product = {
    id: `LM-2026-${String(products.length + 1).padStart(3, '0')}`,
    name,
    value: num,
    cost: +(num * RATE).toFixed(2),
    status: 'Aguardando',
    tracking: tracking || '',
    store: store || '',
    purchaseDate: typeof purchaseDate === 'string' ? purchaseDate : '',
    cep: typeof cep === 'string' ? cep : '',
    origin: 'Origem demo',
    destination: destination || 'São Paulo, SP',
  };
  products.push(product);
  res.status(201).json(product);
});

app.get('/api/tracking/:code', (req, res) => {
  const code = req.params.code.trim().toUpperCase();
  const product = products.find((p) => p.tracking === code);
  if (!product) return res.status(404).json({ error: 'Código de rastreio não encontrado.' });
  res.json({
    ...product,
    history: history[code] || [
      { status: product.status, location: product.origin, date: '06/10 • 09:42', current: true },
    ],
  });
});

// Tratamento global de erros: sempre JSON, sem stack trace.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.status || err.statusCode || 500;
  let msg = 'Erro interno do servidor.';
  if (err.type === 'entity.too.large') msg = 'O conteúdo enviado excede o limite permitido (100 KB).';
  else if (err.type === 'entity.parse.failed') msg = 'JSON inválido.';
  else if (status < 500) msg = 'Requisição inválida.';
  else console.error(err);
  res.status(status).json({ error: msg, erro: msg });
});

app.listen(PORT,  () => console.log(`LogMagna API rodando em http://localhost:${PORT}`));
