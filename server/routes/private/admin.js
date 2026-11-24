const express = require('express');
const db = require('../../db');
const { hashSenha, validarForcaSenha } = require('../../db/crypto');
const { requireAdmin } = require('../../middleware/auth');

const auditoriaRouter = express.Router();
const usuariosRouter = express.Router();

// ---------------- AUDITORIA ----------------

auditoriaRouter.get('/', (req, res) => {
  const conds = [];
  const params = [];

  if (!req.user.isAdmin) {
    conds.push('a.id_usuario = ?');
    params.push(req.user.id_usuario);
  }
  if (typeof req.query.entidade === 'string' && req.query.entidade.trim()) {
    conds.push('a.entidade = ?');
    params.push(req.query.entidade.trim());
  }
  if (typeof req.query.acao === 'string' && req.query.acao.trim()) {
    conds.push('a.acao = ?');
    params.push(req.query.acao.trim());
  }
  if (typeof req.query.busca === 'string' && req.query.busca.trim()) {
    const termo = `%${req.query.busca.trim().toLowerCase()}%`;
    conds.push('(LOWER(a.id_registro) LIKE ? OR LOWER(u.nome_completo) LIKE ? OR LOWER(u.email_corporativo) LIKE ?)');
    params.push(termo, termo, termo);
  }

  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const rows = db.all(
    `SELECT a.id_log, a.id_usuario, a.entidade, a.id_registro, a.acao, a.data_hora,
            u.nome_completo AS usuario_nome, u.email_corporativo AS usuario_email, u.perfil AS usuario_perfil
     FROM AUDITORIA a
     INNER JOIN USUARIO u ON u.id_usuario = a.id_usuario
     ${where}
     ORDER BY a.data_hora DESC
     LIMIT 200`,
    ...params
  );

  res.json(rows);
});

// ---------------- USUARIOS ----------------

const SELECT_USUARIO = `
  SELECT
    u.id_usuario,
    u.nome_completo,
    u.email_corporativo,
    u.perfil,
    u.data_cadastro,
    u.ativo,
    u.cliente_id_cliente,
    c.id_cliente,
    c.data_nascimento,
    c.tipo_vinculo,
    c.frequencia_compra,
    c.faixa_gasto_medio
  FROM USUARIO u
  LEFT JOIN CLIENTE c ON c.id_usuario = u.id_usuario
`;

usuariosRouter.get('/', (req, res) => {
  const where = req.user.isAdmin ? '' : 'WHERE u.id_usuario = ?';
  const params = req.user.isAdmin ? [] : [req.user.id_usuario];

  const rows = db.all(`${SELECT_USUARIO} ${where} ORDER BY u.data_cadastro DESC`, ...params);
  res.json(rows.map((u) => ({ ...u, ativo: Boolean(u.ativo) })));
});

usuariosRouter.post('/', requireAdmin, (req, res) => {
  const {
    nome_completo,
    email_corporativo,
    password,
    perfil = 'cliente',
    tipo_vinculo,
    frequencia_compra,
    faixa_gasto_medio,
  } = req.body || {};

  const nomeFinal = String(nome_completo ?? '').trim();
  const emailFinal = String(email_corporativo ?? '').trim().toLowerCase();
  const perfilFinal = perfil === 'admin' ? 'admin' : 'cliente';

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
  if (db.temHtmlInseguro([nomeFinal, emailFinal, tipo_vinculo, frequencia_compra, faixa_gasto_medio])) {
    return res.status(400).json({ error: 'Caracteres HTML (< ou >) não são permitidos.' });
  }

  const existente = db.get('SELECT id_usuario FROM USUARIO WHERE LOWER(email_corporativo) = ?', emailFinal);
  if (existente) {
    return res.status(409).json({ error: 'Já existe um usuário cadastrado com este e-mail.' });
  }

  const idUsuario = db.gerarId('USR');
  const idCliente = db.gerarId('CLI');
  const agora = db.agoraIso();

  db.transaction(() => {
    db.run(
      `INSERT INTO USUARIO (id_usuario, nome_completo, email_corporativo, senha_hash, perfil, data_cadastro, ativo, cliente_id_cliente)
       VALUES (?, ?, ?, ?, ?, ?, 1, NULL)`,
      idUsuario,
      nomeFinal,
      emailFinal,
      hashSenha(password),
      perfilFinal,
      agora
    );
    db.run(
      `INSERT INTO CLIENTE (id_cliente, id_usuario, data_nascimento, nome_completo, tipo_vinculo, frequencia_compra, faixa_gasto_medio)
       VALUES (?, ?, NULL, ?, ?, ?, ?)`,
      idCliente,
      idUsuario,
      nomeFinal,
      typeof tipo_vinculo === 'string' && tipo_vinculo.trim()
        ? tipo_vinculo.trim()
        : perfilFinal === 'admin'
          ? 'Corporativo'
          : 'Pessoa Física',
      typeof frequencia_compra === 'string' && frequencia_compra.trim() ? frequencia_compra.trim() : 'Mensal',
      typeof faixa_gasto_medio === 'string' && faixa_gasto_medio.trim() ? faixa_gasto_medio.trim() : 'R$ 500 a R$ 1.500'
    );
    db.run('UPDATE USUARIO SET cliente_id_cliente = ? WHERE id_usuario = ?', idCliente, idUsuario);
    db.registrarAuditoria({
      idUsuario: req.user.id_usuario,
      entidade: 'USUARIO',
      idRegistro: idUsuario,
      acao: 'CRIAR_POR_ADMIN',
    });
  });

  const criado = db.get(`${SELECT_USUARIO} WHERE u.id_usuario = ?`, idUsuario);
  res.status(201).json({ ...criado, ativo: Boolean(criado.ativo) });
});

usuariosRouter.patch('/:id/ativo', requireAdmin, (req, res) => {
  const alvo = db.get('SELECT id_usuario, ativo FROM USUARIO WHERE id_usuario = ?', req.params.id);
  if (!alvo) return res.status(404).json({ error: 'Usuário não encontrado.' });
  if (alvo.id_usuario === req.user.id_usuario) {
    return res.status(400).json({ error: 'Você não pode desativar o próprio usuário logado.' });
  }

  const { ativo } = req.body || {};
  if (typeof ativo !== 'boolean') {
    return res.status(400).json({ error: 'Informe o campo ativo (true/false).' });
  }

  db.transaction(() => {
    db.run('UPDATE USUARIO SET ativo = ? WHERE id_usuario = ?', ativo ? 1 : 0, alvo.id_usuario);
    db.registrarAuditoria({
      idUsuario: req.user.id_usuario,
      entidade: 'USUARIO',
      idRegistro: alvo.id_usuario,
      acao: ativo ? 'ATIVAR' : 'DESATIVAR',
    });
  });

  const updated = db.get(`${SELECT_USUARIO} WHERE u.id_usuario = ?`, alvo.id_usuario);
  res.json({ ...updated, ativo: Boolean(updated.ativo) });
});

usuariosRouter.patch('/:id/perfil', requireAdmin, (req, res) => {
  const alvo = db.get('SELECT id_usuario, perfil FROM USUARIO WHERE id_usuario = ?', req.params.id);
  if (!alvo) return res.status(404).json({ error: 'Usuário não encontrado.' });
  if (alvo.id_usuario === req.user.id_usuario) {
    return res.status(400).json({ error: 'Você não pode alterar o perfil da própria conta logada.' });
  }

  const { perfil } = req.body || {};
  if (perfil !== 'admin' && perfil !== 'cliente') {
    return res.status(400).json({ error: 'Perfil inválido. Escolha admin ou cliente.' });
  }

  db.transaction(() => {
    db.run('UPDATE USUARIO SET perfil = ? WHERE id_usuario = ?', perfil, alvo.id_usuario);
    db.registrarAuditoria({
      idUsuario: req.user.id_usuario,
      entidade: 'USUARIO',
      idRegistro: alvo.id_usuario,
      acao: `ALTERAR_PERFIL_${perfil.toUpperCase()}`,
    });
  });

  const updated = db.get(`${SELECT_USUARIO} WHERE u.id_usuario = ?`, alvo.id_usuario);
  res.json({ ...updated, ativo: Boolean(updated.ativo) });
});

module.exports = { auditoriaRouter, usuariosRouter };
