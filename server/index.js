const express = require('express');
const cors = require('cors');
const rotasUnidades = require('./unidades');
const rotasAuth = require('./auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Latencia simulada para exibir loadings no front (MOCK_DELAY_MS=0 desativa).
const MOCK_DELAY_MS = Number(process.env.MOCK_DELAY_MS ?? 600);
app.use('/api', (req, res, next) => setTimeout(next, MOCK_DELAY_MS));
app.use('/api/auth', rotasAuth);
app.use('/api/unidades', rotasUnidades);

const { RATE, products, history } = require('./seeds');

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/api/products', (req, res) => res.json(products));

app.post('/api/products', (req, res) => {
  const { name, value, store, destination, tracking } = req.body || {};
  const num = Number(value);
  if (!name || !Number.isFinite(num) || num <= 0) {
    return res.status(400).json({ error: 'Nome e valor válidos são obrigatórios.' });
  }
  const product = {
    id: `LM-2026-${String(products.length + 1).padStart(3, '0')}`,
    name,
    value: num,
    cost: +(num * RATE).toFixed(2),
    status: 'Aguardando',
    tracking: tracking || '',
    store: store || '',
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

app.listen(PORT, () => console.log(`LogMagna API rodando em http://localhost:${PORT}`));
