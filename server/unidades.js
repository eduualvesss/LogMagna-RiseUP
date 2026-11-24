const express = require('express');
const db = require('./db');

const router = express.Router();

const TIPOS = ['Matriz', 'Filial', 'Centro de distribuição'];
const STATUS = ['ativa', 'inativa'];

function validar(corpo) {
  const { nome, tipo, cidade, estado, status } = corpo || {};
  const textos = [nome, cidade, estado];
  if (textos.some((v) => typeof v !== 'string')) return 'Nome, cidade e estado devem ser texto.';
  if (db.temHtmlInseguro(textos)) return 'Caracteres HTML (< ou >) não são permitidos.';
  const nomeLimpo = nome.trim();
  const cidadeLimpa = cidade.trim();
  const ufLimpa = estado.trim();
  if (!nomeLimpo) return 'O nome é obrigatório.';
  if (nomeLimpo.length > 120) return 'O nome deve ter no máximo 120 caracteres.';
  if (!TIPOS.includes(tipo)) return 'Tipo inválido.';
  if (!cidadeLimpa) return 'A cidade é obrigatória.';
  if (cidadeLimpa.length > 80) return 'A cidade deve ter no máximo 80 caracteres.';
  if (!/^[A-Za-z]{2}$/.test(ufLimpa)) return 'Informe o estado com 2 letras válidas (ex.: PE).';
  if (!STATUS.includes(status)) return 'Status inválido.';
  return null;
}

const SELECT_BASE = `
  SELECT id_unidade AS id, id_unidade, nome, tipo, cidade, estado, status, version
  FROM UNIDADE
`;

// GET /api/unidades?busca=recife&status=ativa
router.get('/', (req, res) => {
  const busca = typeof req.query.busca === 'string' ? req.query.busca.trim().toLowerCase() : '';
  const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';

  const conds = [];
  const params = [];

  if (busca) {
    conds.push('(LOWER(nome) LIKE ? OR LOWER(cidade) LIKE ?)');
    params.push(`%${busca}%`, `%${busca}%`);
  }
  if (status) {
    conds.push('status = ?');
    params.push(status);
  }

  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const resultado = db.all(`${SELECT_BASE} ${where} ORDER BY id_unidade ASC`, ...params);
  res.json(resultado);
});

// GET /api/unidades/:id
router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(404).json({ erro: 'Unidade não encontrada.' });
  const unidade = db.get(`${SELECT_BASE} WHERE id_unidade = ?`, id);
  if (!unidade) return res.status(404).json({ erro: 'Unidade não encontrada.' });
  res.json(unidade);
});

// POST /api/unidades
router.post('/', (req, res) => {
  const erro = validar(req.body);
  if (erro) return res.status(400).json({ erro });

  const { nome, tipo, cidade, estado, status } = req.body;
  const info = db.transaction(() => {
    const result = db.run(
      `INSERT INTO UNIDADE (nome, tipo, cidade, estado, status, version)
       VALUES (?, ?, ?, ?, ?, 1)`,
      nome.trim(),
      tipo,
      cidade.trim(),
      estado.trim().toUpperCase(),
      status
    );
    const idInserido = Number(result.lastInsertRowid);
    db.registrarAuditoria({
      idUsuario: req.user?.id_usuario,
      entidade: 'UNIDADE',
      idRegistro: String(idInserido),
      acao: 'CRIAR',
    });
    return idInserido;
  });

  const nova = db.get(`${SELECT_BASE} WHERE id_unidade = ?`, info);
  res.status(201).json(nova);
});

// PUT /api/unidades/:id
router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(404).json({ erro: 'Unidade não encontrada.' });

  const atual = db.get(`${SELECT_BASE} WHERE id_unidade = ?`, id);
  if (!atual) return res.status(404).json({ erro: 'Unidade não encontrada.' });

  const erro = validar(req.body);
  if (erro) return res.status(400).json({ erro });

  if (req.body.version !== undefined && Number(req.body.version) !== atual.version) {
    return res.status(409).json({
      erro: 'Conflito de edição: esta unidade foi alterada por outro operador. Recarregue os dados.',
    });
  }

  const { nome, tipo, cidade, estado, status } = req.body;
  const novaVersao = (atual.version || 1) + 1;

  db.transaction(() => {
    db.run(
      `UPDATE UNIDADE
       SET nome = ?, tipo = ?, cidade = ?, estado = ?, status = ?, version = ?
       WHERE id_unidade = ?`,
      nome.trim(),
      tipo,
      cidade.trim(),
      estado.trim().toUpperCase(),
      status,
      novaVersao,
      id
    );
    db.registrarAuditoria({
      idUsuario: req.user?.id_usuario,
      entidade: 'UNIDADE',
      idRegistro: String(id),
      acao: 'ATUALIZAR',
    });
  });

  const atualizada = db.get(`${SELECT_BASE} WHERE id_unidade = ?`, id);
  res.json(atualizada);
});

// DELETE /api/unidades/:id
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(404).json({ erro: 'Unidade não encontrada.' });

  const atual = db.get('SELECT id_unidade FROM UNIDADE WHERE id_unidade = ?', id);
  if (!atual) return res.status(404).json({ erro: 'Unidade não encontrada.' });

  db.transaction(() => {
    db.run('DELETE FROM UNIDADE WHERE id_unidade = ?', id);
    db.registrarAuditoria({
      idUsuario: req.user?.id_usuario,
      entidade: 'UNIDADE',
      idRegistro: String(id),
      acao: 'EXCLUIR',
    });
  });

  res.status(204).end();
});

module.exports = router;
