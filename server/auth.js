const crypto = require('crypto');
const express = require('express');
const { users } = require('./seeds');

const router = express.Router();
const SECRET = process.env.AUTH_SECRET || 'logmagna-dev-secret';
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

// POST /api/auth/login { email, password }
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return res.status(400).json({ error: 'Informe e-mail e senha.' });
  }
  const user = users.find((u) => u.email === email.trim().toLowerCase());
  const ok = user && user.checkPassword(password);
  if (!ok) return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
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