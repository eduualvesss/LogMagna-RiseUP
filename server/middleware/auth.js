const crypto = require('crypto');
const db = require('../db');
const { AUTH_SECRET } = require('../config/env');

const TTL_MS = 8 * 60 * 60 * 1000;
const tokensRevogados = new Map();

const limpezaRevogados = setInterval(() => {
  const agora = Date.now();
  for (const [jti, exp] of tokensRevogados.entries()) {
    if (exp <= agora) tokensRevogados.delete(jti);
  }
}, 15 * 60 * 1000);
if (typeof limpezaRevogados.unref === 'function') limpezaRevogados.unref();

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const sign = (data) => crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('base64url');

function createToken(user) {
  const body = b64({
    jti: crypto.randomUUID(),
    sub: user.id_usuario,
    email: user.email_corporativo,
    exp: Date.now() + TTL_MS,
  });
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
    if (!payload || payload.exp <= Date.now()) return null;
    if (payload.jti && tokensRevogados.has(payload.jti)) return null;
    return payload;
  } catch {
    return null;
  }
}

function revogarToken(jti, exp) {
  if (jti) tokensRevogados.set(jti, exp || Date.now() + TTL_MS);
}

function formatarUsuarioPublico(u) {
  return {
    id_usuario: u.id_usuario,
    nome_completo: u.nome_completo,
    email_corporativo: u.email_corporativo,
    perfil: u.perfil,
    ativo: Boolean(u.ativo),
    data_cadastro: u.data_cadastro,
    cliente_id_cliente: u.cliente_id_cliente || null,
  };
}

function buscarUsuarioAtivoPorId(idUsuario) {
  return db.get(
    `SELECT id_usuario, nome_completo, email_corporativo, perfil, data_cadastro, ativo, cliente_id_cliente
     FROM USUARIO
     WHERE id_usuario = ? AND ativo = 1`,
    idUsuario
  );
}

function buscarClientePorUsuario(idUsuario) {
  return db.get(
    `SELECT id_cliente, id_usuario, data_nascimento, nome_completo, tipo_vinculo, frequencia_compra, faixa_gasto_medio
     FROM CLIENTE
     WHERE id_usuario = ?`,
    idUsuario
  );
}

function extrairBearer(req) {
  const auth = req.headers.authorization || '';
  return auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
}

function requireAuth(req, res, next) {
  const token = extrairBearer(req);
  const payload = verifyToken(token);
  const user = payload && buscarUsuarioAtivoPorId(payload.sub);
  if (!user) {
    return res.status(401).json({ error: 'Autenticação necessária.' });
  }
  req.authToken = payload;
  req.user = {
    ...formatarUsuarioPublico(user),
    isAdmin: user.perfil === 'admin',
  };
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Acesso restrito a administradores.' });
  }
  next();
}

module.exports = {
  createToken,
  verifyToken,
  revogarToken,
  formatarUsuarioPublico,
  buscarUsuarioAtivoPorId,
  buscarClientePorUsuario,
  requireAuth,
  requireAdmin,
};
