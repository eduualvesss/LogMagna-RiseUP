const express = require('express');
const db = require('../db');

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

usuariosRouter.get('/', (req, res) => {
  const where = req.user.isAdmin ? '' : 'WHERE u.id_usuario = ?';
  const params = req.user.isAdmin ? [] : [req.user.id_usuario];

  const rows = db.all(
    `SELECT
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
     ${where}
     ORDER BY u.data_cadastro DESC`,
    ...params
  );

  res.json(rows.map((u) => ({ ...u, ativo: Boolean(u.ativo) })));
});

usuariosRouter.patch('/:id/ativo', (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Apenas administradores podem alterar o status de usuários.' });
  }
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

  const updated = db.get(
    `SELECT id_usuario, nome_completo, email_corporativo, perfil, data_cadastro, ativo, cliente_id_cliente
     FROM USUARIO WHERE id_usuario = ?`,
    alvo.id_usuario
  );
  res.json({ ...updated, ativo: Boolean(updated.ativo) });
});

module.exports = { auditoriaRouter, usuariosRouter };
