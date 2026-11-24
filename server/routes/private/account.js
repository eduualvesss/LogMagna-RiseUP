const express = require('express');
const db = require('../../db');
const { hashSenha, verificarSenha, validarForcaSenha } = require('../../db/crypto');
const {
  buscarUsuarioAtivoPorId,
  buscarClientePorUsuario,
  formatarUsuarioPublico,
  revogarToken,
} = require('../../middleware/auth');

const router = express.Router();

// GET /api/auth/me
router.get('/me', (req, res) => {
  const user = buscarUsuarioAtivoPorId(req.user.id_usuario);
  if (!user) return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
  const cliente = buscarClientePorUsuario(user.id_usuario);
  res.json({ user: formatarUsuarioPublico(user), cliente });
});

// PUT /api/auth/profile
router.put('/profile', (req, res) => {
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

// PUT /api/auth/password
router.put('/password', (req, res) => {
  const { senha_atual, nova_senha } = req.body || {};
  if (typeof senha_atual !== 'string' || !senha_atual) {
    return res.status(400).json({ error: 'Informe a senha atual.' });
  }
  const erroForca = validarForcaSenha(nova_senha);
  if (erroForca) {
    return res.status(400).json({ error: erroForca });
  }

  const user = db.get('SELECT id_usuario, senha_hash FROM USUARIO WHERE id_usuario = ?', req.user.id_usuario);
  if (!user || !verificarSenha(senha_atual, user.senha_hash)) {
    return res.status(401).json({ error: 'Senha atual incorreta.' });
  }

  db.transaction(() => {
    db.run('UPDATE USUARIO SET senha_hash = ? WHERE id_usuario = ?', hashSenha(nova_senha), req.user.id_usuario);
    db.registrarAuditoria({
      idUsuario: req.user.id_usuario,
      entidade: 'USUARIO',
      idRegistro: req.user.id_usuario,
      acao: 'ALTERAR_SENHA',
    });
  });

  res.json({ ok: true });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  if (req.authToken?.jti) {
    revogarToken(req.authToken.jti, req.authToken.exp);
  }
  db.registrarAuditoria({
    idUsuario: req.user.id_usuario,
    entidade: 'USUARIO',
    idRegistro: req.user.id_usuario,
    acao: 'LOGOUT',
  });
  res.status(204).end();
});

module.exports = router;
