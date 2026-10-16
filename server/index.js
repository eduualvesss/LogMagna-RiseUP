const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const RATE = 0.02;

const products = [
  { id: 'LM-2026-001', name: 'Notebook Dell Inspiron', value: 4200, status: 'Em trânsito', tracking: 'BR123456789SP', origin: 'Campinas, SP', destination: 'São Paulo, SP' },
  { id: 'LM-2026-002', name: 'Fone Sony WH-1000XM5', value: 2000, status: 'Aguardando', tracking: 'BR987654321SP', origin: 'Curitiba, PR', destination: 'São Paulo, SP' },
  { id: 'LM-2026-003', name: 'Câmera Canon EOS R50', value: 1800, status: 'Entregue', tracking: 'BR555444333SP', origin: 'Rio de Janeiro, RJ', destination: 'São Paulo, SP' },
].map((p) => ({ ...p, cost: +(p.value * RATE).toFixed(2) }));

const history = {
  'BR123456789SP': [
    { status: 'Pacote saiu para entrega', location: 'Centro de distribuição • São Paulo, SP', date: '08/10 • 08:15', current: true },
    { status: 'Pacote em trânsito', location: 'Unidade de tratamento • Campinas, SP', date: '07/10 • 22:40' },
    { status: 'Pacote postado', location: 'Agência • Campinas, SP', date: '06/10 • 09:42' },
  ],
};

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
