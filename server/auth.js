const crypto = require('crypto');
const express = require('express');
const db = require('./db');
const { hashSenha, verificarSenha } = require('./db/crypto');

const router = express.Router();

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
  const body = b64({ sub: user.id_usuario, email: user.email_corporativo, exp: Date.now() + TTL_MS });
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

function formatarUsuarioPublico(u) {
  return {
    id: u.id_usuario,
    id_usuario: u.id_usuario,
    nome: u.nome_completo,
    nome_completo: u.nome_completo,
    email: u.email_corporativo,
    email_corporativo: u.email_corporativo,
    papel: u.perfil,
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

// Middleware: exige Authorization: Bearer <token> valido.
function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '');
  const payload = verifyToken(token);
  const user = payload && buscarUsuarioAtivoPorId(payload.sub);
  if (!user) {
    return res.status(401).json({ error: 'Autenticação necessária.', erro: 'Autenticação necessária.' });
  }
  req.user = {
    ...formatarUsuarioPublico(user),
    isAdmin: user.perfil === 'admin',
  };
  next();
}

// Limite simples de tentativas por IP (5 falhas / minuto).
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
  const emailNormalizado = email.trim().toLowerCase();
  const user = db.get(
    `SELECT id_usuario, nome_completo, email_corporativo, senha_hash, perfil, data_cadastro, ativo, cliente_id_cliente
     FROM USUARIO
     WHERE LOWER(email_corporativo) = ?`,
    emailNormalizado
  );
  const ok = user && user.ativo === 1 && verificarSenha(password, user.senha_hash);
  if (!ok) {
    registrarFalha(req.ip);
    const msg = user && user.ativo === 0 ? 'Usuário desativado.' : 'E-mail ou senha inválidos.';
    return res.status(401).json({ error: msg });
  }
  falhas.delete(req.ip);
  db.registrarAuditoria({
    idUsuario: user.id_usuario,
    entidade: 'USUARIO',
    idRegistro: user.id_usuario,
    acao: 'LOGIN',
  });
  res.json({ token: createToken(user), user: formatarUsuarioPublico(user) });
});

// POST /api/auth/register
router.post('/register', limiteLogin, (req, res) => {
  const {
    nome_completo,
    nome,
    email_corporativo,
    email,
    password,
    data_nascimento,
    tipo_vinculo,
    frequencia_compra,
    faixa_gasto_medio,
  } = req.body || {};

  const nomeFinal = String(nome_completo ?? nome ?? '').trim();
  const emailFinal = String(email_corporativo ?? email ?? '').trim().toLowerCase();

  if (!nomeFinal || !emailFinal || typeof password !== 'string') {
    return res.status(400).json({ error: 'Nome completo, e-mail e senha são obrigatórios.' });
  }
  if (nomeFinal.length > 120 || emailFinal.length > 120) {
    return res.status(400).json({ error: 'Nome ou e-mail excedem 120 caracteres.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailFinal)) {
    return res.status(400).json({ error: 'Informe um e-mail válido.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
  }
  if (
    db.temHtmlInseguro([
      nomeFinal,
      emailFinal,
      data_nascimento,
      tipo_vinculo,
      frequencia_compra,
      faixa_gasto_medio,
    ])
  ) {
    return res.status(400).json({ error: 'Caracteres HTML (< ou >) não são permitidos.' });
  }

  const existente = db.get('SELECT id_usuario FROM USUARIO WHERE LOWER(email_corporativo) = ?', emailFinal);
  if (existente) {
    return res.status(409).json({ error: 'Já existe um usuário cadastrado com este e-mail.' });
  }

  const idUsuario = db.gerarId('USR');
  const idCliente = db.gerarId('CLI');
  const agora = db.agoraIso();
  const senhaHash = hashSenha(password);

  db.transaction(() => {
    db.run(
      `INSERT INTO USUARIO (id_usuario, nome_completo, email_corporativo, senha_hash, perfil, data_cadastro, ativo, cliente_id_cliente)
       VALUES (?, ?, ?, ?, 'cliente', ?, 1, NULL)`,
      idUsuario,
      nomeFinal,
      emailFinal,
      senhaHash,
      agora
    );
    db.run(
      `INSERT INTO CLIENTE (id_cliente, id_usuario, data_nascimento, nome_completo, tipo_vinculo, frequencia_compra, faixa_gasto_medio)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      idCliente,
      idUsuario,
      typeof data_nascimento === 'string' && data_nascimento.trim() ? data_nascimento.trim() : null,
      nomeFinal,
      typeof tipo_vinculo === 'string' && tipo_vinculo.trim() ? tipo_vinculo.trim() : 'Pessoa Física',
      typeof frequencia_compra === 'string' && frequencia_compra.trim() ? frequencia_compra.trim() : 'Mensal',
      typeof faixa_gasto_medio === 'string' && faixa_gasto_medio.trim() ? faixa_gasto_medio.trim() : 'R$ 500 a R$ 1.500'
    );
    db.run('UPDATE USUARIO SET cliente_id_cliente = ? WHERE id_usuario = ?', idCliente, idUsuario);
    db.registrarAuditoria({
      idUsuario,
      entidade: 'USUARIO',
      idRegistro: idUsuario,
      acao: 'CADASTRO',
      dataHora: agora,
    });
  });

  const novoUsuario = buscarUsuarioAtivoPorId(idUsuario);
  res.status(201).json({
    token: createToken(novoUsuario),
    user: formatarUsuarioPublico(novoUsuario),
  });
});

// GET /api/auth/me (Authorization: Bearer <token>)
router.get('/me', (req, res) => {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '');
  const payload = verifyToken(token);
  const user = payload && buscarUsuarioAtivoPorId(payload.sub);
  if (!user) return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
  const cliente = buscarClientePorUsuario(user.id_usuario);
  res.json({ user: formatarUsuarioPublico(user), cliente });
});

// PUT /api/auth/profile
router.put('/profile', requireAuth, (req, res) => {
  const {
    nome_completo,
    data_nascimento,
    tipo_vinculo,
    frequencia_compra,
    faixa_gasto_medio,
  } = req.body || {};

  const nomeFinal = String(nome_completo ?? '').trim();
  if (!nomeFinal || nomeFinal.length > 120) {
    return res.status(400).json({ error: 'Informe um nome completo válido (até 120 caracteres).' });
  }
  if (db.temHtmlInseguro([nomeFinal, data_nascimento, tipo_vinculo, frequencia_compra, faixa_gasto_medio])) {
    return res.status(400).json({ error: 'Caracteres HTML (< ou >) não são permitidos.' });
  }

  db.transaction(() => {
    db.run('UPDATE USUARIO SET nome_completo = ? WHERE id_usuario = ?', nomeFinal, req.user.id_usuario);
    const clienteAtual = buscarClientePorUsuario(req.user.id_usuario);
    if (clienteAtual) {
      db.run(
        `UPDATE CLIENTE
         SET nome_completo = ?, data_nascimento = ?, tipo_vinculo = ?, frequencia_compra = ?, faixa_gasto_medio = ?
         WHERE id_usuario = ?`,
        nomeFinal,
        typeof data_nascimento === 'string' && data_nascimento.trim() ? data_nascimento.trim() : null,
        typeof tipo_vinculo === 'string' && tipo_vinculo.trim() ? tipo_vinculo.trim() : clienteAtual.tipo_vinculo,
        typeof frequencia_compra === 'string' && frequencia_compra.trim() ? frequencia_compra.trim() : clienteAtual.frequencia_compra,
        typeof faixa_gasto_medio === 'string' && faixa_gasto_medio.trim() ? faixa_gasto_medio.trim() : clienteAtual.faixa_gasto_medio,
        req.user.id_usuario
      );
    }
    db.registrarAuditoria({
      idUsuario: req.user.id_usuario,
      entidade: 'CLIENTE',
      idRegistro: req.user.cliente_id_cliente || req.user.id_usuario,
      acao: 'ATUALIZAR_PERFIL',
    });
  });

  const atualizado = buscarUsuarioAtivoPorId(req.user.id_usuario);
  const cliente = buscarClientePorUsuario(req.user.id_usuario);
  res.json({ user: formatarUsuarioPublico(atualizado), cliente });
});

module.exports = router;
module.exports.requireAuth = requireAuth;
