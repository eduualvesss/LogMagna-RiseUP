const crypto = require('crypto');
const express = require('express');
const { users } = require('./seeds');

const router = express.Router();
// Segredo de assinatura dos tokens: obrigatorio em producao.
// Em desenvolvimento, sem AUTH_SECRET, gera um segredo aleatorio por processo
// (os tokens deixam de valer ao reiniciar o servidor).
let SECRET = process.env.AUTH_SECRET;
if (!SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('AUTH_SECRET nao definido. Defina uma chave forte para iniciar em producao.');
    process.exit(1);
  }
  SECRET = crypto.randomBytes(32).toString('hex');
  console.warn('[auth] AUTH_SECRET nao definido: usando segredo aleatorio temporario (apenas desenvolvimento).');
}
const TTL_MS = 8 * 60 * 60 * 1000;

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const sign = (data) => crypto.createHmac('sha256', SECRET).update(data).digest('base64url');

function createToken(user) {
  const body = b64({ sub: user.id, email: user.email, exp: Date.now() + TTL_MS });
  return `${body}.${sign(body)}`;
}

function verifyToken(token) {
  if (typeof token !== 'string') return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const esperado = Buffer.from(sign(body));
  const recebido = Buffer.from(sig);
  if (esperado.length !== recebido.length || !crypto.timingSafeEqual(esperado, recebido)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    return payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

const publico = (u) => ({ id: u.id, nome: u.nome, email: u.email, papel: u.papel });

// Middleware: exige Authorization: Bearer <token> valido.
function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '');
  const payload = verifyToken(token);
  const user = payload && users.find((u) => u.id === payload.sub);
  if (!user) return res.status(401).json({ error: 'Autenticação necessária.', erro: 'Autenticação necessária.' });
  req.user = user;
  next();
}

// Limite simples de tentativas de login por IP (5 falhas / minuto).
const JANELA_MS = 60 * 1000;
const MAX_FALHAS = 5;
const falhas = new Map();
function limiteLogin(req, res, next) {
  const agora = Date.now();
  const reg = falhas.get(req.ip);
  if (reg && agora - reg.inicio < JANELA_MS && reg.n >= MAX_FALHAS) {
    const retry = Math.ceil((JANELA_MS - (agora - reg.inicio)) / 1000);
    res.set('Retry-After', String(retry));
    return res.status(429).json({ error: `Muitas tentativas. Tente novamente em ${retry}s.` });
  }
  next();
}
function registrarFalha(ip) {
  const agora = Date.now();
  const reg = falhas.get(ip);
  if (!reg || agora - reg.inicio >= JANELA_MS) falhas.set(ip, { inicio: agora, n: 1 });
  else reg.n += 1;
}

// POST /api/auth/login { email, password }
router.post('/login', limiteLogin, (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return res.status(400).json({ error: 'Informe e-mail e senha.' });
  }
  const user = users.find((u) => u.email === email.trim().toLowerCase());
  const ok = user && user.checkPassword(password);
  if (!ok) {
    registrarFalha(req.ip);
    return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
  }
  falhas.delete(req.ip);
  res.json({ token: createToken(user), user: publico(user) });
});

// GET /api/auth/me (Authorization: Bearer <token>)
router.get('/me', (req, res) => {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '');
  const payload = verifyToken(token);
  const user = payload && users.find((u) => u.id === payload.sub);
  if (!user) return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
  res.json({ user: publico(user) });
});

module.exports = router;
module.exports.requireAuth = requireAuth;