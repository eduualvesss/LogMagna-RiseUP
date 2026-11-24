const express = require('express');
const db = require('../../db');
const { hashSenha, verificarSenha, validarForcaSenha } = require('../../db/crypto');
const { criarRateLimit } = require('../../middleware/rateLimit');
const { createToken, formatarUsuarioPublico, buscarUsuarioAtivoPorId } = require('../../middleware/auth');

const router = express.Router();

const limiteAuth = criarRateLimit({
  janelaMs: 60 * 1000,
  maxTentativas: 15,
  mensagem: 'Muitas tentativas de autenticação. Tente novamente em instantes',
});

// GET /api/auth/setup-status
router.get('/setup-status', (req, res) => {
  const row = db.get('SELECT COUNT(*) AS total FROM USUARIO');
  res.json({ needsSetup: (row?.total || 0) === 0 });
});

// POST /api/auth/login
router.post('/login', limiteAuth.middleware, (req, res) => {
  const { email_corporativo, email, password } = req.body || {};
  const emailBruto = email_corporativo ?? email;
  if (typeof emailBruto !== 'string' || typeof password !== 'string' || !emailBruto.trim() || !password) {
    return res.status(400).json({ error: 'Informe e-mail e senha.' });
  }
  const emailNormalizado = emailBruto.trim().toLowerCase();
  const user = db.get(
    `SELECT id_usuario, nome_completo, email_corporativo, senha_hash, perfil, data_cadastro, ativo, cliente_id_cliente
     FROM USUARIO
     WHERE LOWER(email_corporativo) = ?`,
    emailNormalizado
  );
  const ok = user && user.ativo === 1 && verificarSenha(password, user.senha_hash);
  if (!ok) {
    limiteAuth.registrarTentativa(req);
    const msg = user && user.ativo === 0 ? 'Usuário desativado.' : 'E-mail ou senha inválidos.';
    return res.status(401).json({ error: msg });
  }
  limiteAuth.limparTentativas(req);
  db.registrarAuditoria({
    idUsuario: user.id_usuario,
    entidade: 'USUARIO',
    idRegistro: user.id_usuario,
    acao: 'LOGIN',
  });
  res.json({ token: createToken(user), user: formatarUsuarioPublico(user) });
});

// POST /api/auth/register
router.post('/register', limiteAuth.middleware, (req, res) => {
  const {
    nome_completo,
    email_corporativo,
    password,
    data_nascimento,
    tipo_vinculo,
    frequencia_compra,
    faixa_gasto_medio,
  } = req.body || {};

  const nomeFinal = String(nome_completo ?? '').trim();
  const emailFinal = String(email_corporativo ?? '').trim().toLowerCase();

  if (!nomeFinal || !emailFinal || typeof password !== 'string') {
    return res.status(400).json({ error: 'Nome completo, e-mail e senha são obrigatórios.' });
  }
  if (nomeFinal.length > 120 || emailFinal.length > 120) {
    return res.status(400).json({ error: 'Nome ou e-mail excedem 120 caracteres.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailFinal)) {
    return res.status(400).json({ error: 'Informe um e-mail válido.' });
  }
  const erroSenha = validarForcaSenha(password);
  if (erroSenha) {
    return res.status(400).json({ error: erroSenha });
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
    limiteAuth.registrarTentativa(req);
    return res.status(409).json({ error: 'Já existe um usuário cadastrado com este e-mail.' });
  }

  const idUsuario = db.gerarId('USR');
  const idCliente = db.gerarId('CLI');
  const agora = db.agoraIso();
  const senhaHash = hashSenha(password);

  db.transaction(() => {
    const totalRow = db.get('SELECT COUNT(*) AS total FROM USUARIO');
    const primeiroAcesso = (totalRow?.total || 0) === 0;
    const perfil = primeiroAcesso ? 'admin' : 'cliente';

    db.run(
      `INSERT INTO USUARIO (id_usuario, nome_completo, email_corporativo, senha_hash, perfil, data_cadastro, ativo, cliente_id_cliente)
       VALUES (?, ?, ?, ?, ?, ?, 1, NULL)`,
      idUsuario,
      nomeFinal,
      emailFinal,
      senhaHash,
      perfil,
      agora
    );
    db.run(
      `INSERT INTO CLIENTE (id_cliente, id_usuario, data_nascimento, nome_completo, tipo_vinculo, frequencia_compra, faixa_gasto_medio)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      idCliente,
      idUsuario,
      typeof data_nascimento === 'string' && data_nascimento.trim() ? data_nascimento.trim() : null,
      nomeFinal,
      typeof tipo_vinculo === 'string' && tipo_vinculo.trim()
        ? tipo_vinculo.trim()
        : primeiroAcesso
          ? 'Corporativo'
          : 'Pessoa Física',
      typeof frequencia_compra === 'string' && frequencia_compra.trim() ? frequencia_compra.trim() : 'Mensal',
      typeof faixa_gasto_medio === 'string' && faixa_gasto_medio.trim() ? faixa_gasto_medio.trim() : 'R$ 500 a R$ 1.500'
    );
    db.run('UPDATE USUARIO SET cliente_id_cliente = ? WHERE id_usuario = ?', idCliente, idUsuario);
    db.registrarAuditoria({
      idUsuario,
      entidade: 'USUARIO',
      idRegistro: idUsuario,
      acao: primeiroAcesso ? 'SETUP_ADMIN' : 'CADASTRO',
      dataHora: agora,
    });
  });

  const novoUsuario = buscarUsuarioAtivoPorId(idUsuario);
  res.status(201).json({
    token: createToken(novoUsuario),
    user: formatarUsuarioPublico(novoUsuario),
  });
});

module.exports = router;
