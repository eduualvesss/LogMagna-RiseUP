const express = require('express');
const db = require('../../db');
const { requireAdmin } = require('../../middleware/auth');

const categoriasRouter = express.Router();
const seguradorasRouter = express.Router();
const apolicesRouter = express.Router();

// ---------------- CATEGORIA_PRODUTO ----------------

categoriasRouter.get('/', (req, res) => {
  const rows = db.all(
    `SELECT c.id_categoria, c.descricao, COUNT(p.id_pedido) AS total_pedidos
     FROM CATEGORIA_PRODUTO c
     LEFT JOIN PEDIDO p ON p.id_categoria = c.id_categoria
     GROUP BY c.id_categoria, c.descricao
     ORDER BY c.id_categoria ASC`
  );
  res.json(rows);
});

categoriasRouter.post('/', requireAdmin, (req, res) => {
  const { id_categoria, descricao } = req.body || {};
  if (typeof descricao !== 'string' || !descricao.trim()) {
    return res.status(400).json({ error: 'Descrição da categoria é obrigatória.' });
  }
  if (descricao.trim().length > 255) {
    return res.status(400).json({ error: 'A descrição deve ter no máximo 255 caracteres.' });
  }
  if (db.temHtmlInseguro([id_categoria, descricao])) {
    return res.status(400).json({ error: 'Caracteres HTML (< ou >) não são permitidos.' });
  }

  const id = typeof id_categoria === 'string' && id_categoria.trim() ? id_categoria.trim().toUpperCase() : db.gerarId('CAT');
  const existe = db.get('SELECT id_categoria FROM CATEGORIA_PRODUTO WHERE id_categoria = ?', id);
  if (existe) return res.status(409).json({ error: 'Já existe uma categoria com esse código.' });

  db.transaction(() => {
    db.run('INSERT INTO CATEGORIA_PRODUTO (id_categoria, descricao) VALUES (?, ?)', id, descricao.trim());
    db.registrarAuditoria({
      idUsuario: req.user.id_usuario,
      entidade: 'CATEGORIA_PRODUTO',
      idRegistro: id,
      acao: 'CRIAR',
    });
  });

  res.status(201).json(db.get('SELECT * FROM CATEGORIA_PRODUTO WHERE id_categoria = ?', id));
});

categoriasRouter.put('/:id', requireAdmin, (req, res) => {
  const atual = db.get('SELECT * FROM CATEGORIA_PRODUTO WHERE id_categoria = ?', req.params.id);
  if (!atual) return res.status(404).json({ error: 'Categoria não encontrada.' });

  const { descricao } = req.body || {};
  if (typeof descricao !== 'string' || !descricao.trim()) {
    return res.status(400).json({ error: 'Descrição da categoria é obrigatória.' });
  }
  if (db.temHtmlInseguro([descricao])) {
    return res.status(400).json({ error: 'Caracteres HTML (< ou >) não são permitidos.' });
  }

  db.transaction(() => {
    db.run('UPDATE CATEGORIA_PRODUTO SET descricao = ? WHERE id_categoria = ?', descricao.trim().slice(0, 255), atual.id_categoria);
    db.registrarAuditoria({
      idUsuario: req.user.id_usuario,
      entidade: 'CATEGORIA_PRODUTO',
      idRegistro: atual.id_categoria,
      acao: 'ATUALIZAR',
    });
  });

  res.json(db.get('SELECT * FROM CATEGORIA_PRODUTO WHERE id_categoria = ?', atual.id_categoria));
});

categoriasRouter.delete('/:id', requireAdmin, (req, res) => {
  const atual = db.get('SELECT * FROM CATEGORIA_PRODUTO WHERE id_categoria = ?', req.params.id);
  if (!atual) return res.status(404).json({ error: 'Categoria não encontrada.' });

  const uso = db.get('SELECT COUNT(*) AS n FROM PEDIDO WHERE id_categoria = ?', atual.id_categoria);
  if (uso && uso.n > 0) {
    return res.status(409).json({ error: 'Não é possível excluir uma categoria vinculada a pedidos.' });
  }

  db.transaction(() => {
    db.run('DELETE FROM CATEGORIA_PRODUTO WHERE id_categoria = ?', atual.id_categoria);
    db.registrarAuditoria({
      idUsuario: req.user.id_usuario,
      entidade: 'CATEGORIA_PRODUTO',
      idRegistro: atual.id_categoria,
      acao: 'EXCLUIR',
    });
  });

  res.status(204).end();
});

// ---------------- SEGURADORA ----------------

seguradorasRouter.get('/', (req, res) => {
  const rows = db.all(
    `SELECT s.id_seguradora, s.razao_social, s.contato, COUNT(a.id_apolice) AS total_apolices
     FROM SEGURADORA s
     LEFT JOIN APOLICE a ON a.id_seguradora = s.id_seguradora
     GROUP BY s.id_seguradora, s.razao_social, s.contato
     ORDER BY s.id_seguradora ASC`
  );
  res.json(rows);
});

seguradorasRouter.post('/', requireAdmin, (req, res) => {
  const { razao_social, contato } = req.body || {};
  if (typeof razao_social !== 'string' || !razao_social.trim()) {
    return res.status(400).json({ error: 'Razão social da seguradora é obrigatória.' });
  }
  if (db.temHtmlInseguro([razao_social, contato])) {
    return res.status(400).json({ error: 'Caracteres HTML (< ou >) não são permitidos.' });
  }

  const id = db.gerarId('SEG');
  db.transaction(() => {
    db.run(
      'INSERT INTO SEGURADORA (id_seguradora, razao_social, contato) VALUES (?, ?, ?)',
      id,
      razao_social.trim().slice(0, 120),
      typeof contato === 'string' ? contato.trim().slice(0, 120) : ''
    );
    db.registrarAuditoria({
      idUsuario: req.user.id_usuario,
      entidade: 'SEGURADORA',
      idRegistro: id,
      acao: 'CRIAR',
    });
  });

  res.status(201).json(db.get('SELECT * FROM SEGURADORA WHERE id_seguradora = ?', id));
});

seguradorasRouter.put('/:id', requireAdmin, (req, res) => {
  const atual = db.get('SELECT * FROM SEGURADORA WHERE id_seguradora = ?', req.params.id);
  if (!atual) return res.status(404).json({ error: 'Seguradora não encontrada.' });

  const { razao_social, contato } = req.body || {};
  if (typeof razao_social !== 'string' || !razao_social.trim()) {
    return res.status(400).json({ error: 'Razão social da seguradora é obrigatória.' });
  }
  if (db.temHtmlInseguro([razao_social, contato])) {
    return res.status(400).json({ error: 'Caracteres HTML (< ou >) não são permitidos.' });
  }

  db.transaction(() => {
    db.run(
      'UPDATE SEGURADORA SET razao_social = ?, contato = ? WHERE id_seguradora = ?',
      razao_social.trim().slice(0, 120),
      typeof contato === 'string' ? contato.trim().slice(0, 120) : '',
      atual.id_seguradora
    );
    db.registrarAuditoria({
      idUsuario: req.user.id_usuario,
      entidade: 'SEGURADORA',
      idRegistro: atual.id_seguradora,
      acao: 'ATUALIZAR',
    });
  });

  res.json(db.get('SELECT * FROM SEGURADORA WHERE id_seguradora = ?', atual.id_seguradora));
});

seguradorasRouter.delete('/:id', requireAdmin, (req, res) => {
  const atual = db.get('SELECT * FROM SEGURADORA WHERE id_seguradora = ?', req.params.id);
  if (!atual) return res.status(404).json({ error: 'Seguradora não encontrada.' });

  const uso = db.get('SELECT COUNT(*) AS n FROM APOLICE WHERE id_seguradora = ?', atual.id_seguradora);
  if (uso && uso.n > 0) {
    return res.status(409).json({ error: 'Não é possível excluir uma seguradora que possui apólices emitidas.' });
  }

  db.transaction(() => {
    db.run('DELETE FROM SEGURADORA WHERE id_seguradora = ?', atual.id_seguradora);
    db.registrarAuditoria({
      idUsuario: req.user.id_usuario,
      entidade: 'SEGURADORA',
      idRegistro: atual.id_seguradora,
      acao: 'EXCLUIR',
    });
  });

  res.status(204).end();
});

// ---------------- APOLICE ----------------

const SELECT_APOLICE = `
  SELECT
    a.id_apolice,
    a.id_seguradora,
    s.razao_social AS seguradora_razao_social,
    s.contato AS seguradora_contato,
    a.valor_segurado,
    a.valor_premio,
    a.vigencia_inicio,
    a.vigencia_fim,
    a.coberturas,
    r.id_remessa,
    r.codigo_rastreio,
    p.id_pedido,
    p.id_cliente,
    p.nome_produto,
    c.nome_completo AS cliente_nome
  FROM APOLICE a
  INNER JOIN SEGURADORA s ON s.id_seguradora = a.id_seguradora
  LEFT JOIN REMESSA r ON r.id_apolice = a.id_apolice
  LEFT JOIN PEDIDO p ON p.id_pedido = r.id_pedido
  LEFT JOIN CLIENTE c ON c.id_cliente = p.id_cliente
`;

apolicesRouter.get('/', (req, res) => {
  const conds = [];
  const params = [];

  if (!req.user.isAdmin) {
    conds.push('p.id_cliente = ?');
    params.push(req.user.cliente_id_cliente || '__sem_cliente__');
  }
  if (typeof req.query.id_seguradora === 'string' && req.query.id_seguradora.trim()) {
    conds.push('a.id_seguradora = ?');
    params.push(req.query.id_seguradora.trim());
  }

  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const rows = db.all(`${SELECT_APOLICE} ${where} ORDER BY a.vigencia_inicio DESC, a.id_apolice DESC`, ...params);
  res.json(rows);
});

apolicesRouter.post('/', (req, res) => {
  const { id_seguradora, valor_segurado, vigencia_inicio, vigencia_fim, coberturas, valor_premio, id_remessa } = req.body || {};
  const valor = Number(valor_segurado);
  if (typeof id_seguradora !== 'string' || !id_seguradora.trim() || !Number.isFinite(valor) || valor <= 0) {
    return res.status(400).json({ error: 'Seguradora e valor segurado válido são obrigatórios.' });
  }
  if (typeof coberturas !== 'string' || !coberturas.trim()) {
    return res.status(400).json({ error: 'Informe as coberturas da apólice.' });
  }
  if (db.temHtmlInseguro([id_seguradora, vigencia_inicio, vigencia_fim, coberturas, id_remessa])) {
    return res.status(400).json({ error: 'Caracteres HTML (< ou >) não são permitidos.' });
  }

  const seg = db.get('SELECT id_seguradora FROM SEGURADORA WHERE id_seguradora = ?', id_seguradora.trim());
  if (!seg) return res.status(400).json({ error: 'Seguradora não encontrada.' });

  if (typeof id_remessa === 'string' && id_remessa.trim()) {
    const rem = db.get(
      `SELECT r.id_remessa, p.id_cliente
       FROM REMESSA r
       INNER JOIN PEDIDO p ON p.id_pedido = r.id_pedido
       WHERE r.id_remessa = ?`,
      id_remessa.trim()
    );
    if (!rem) return res.status(400).json({ error: 'Remessa informada não encontrada.' });
    if (!req.user.isAdmin && rem.id_cliente !== req.user.cliente_id_cliente) {
      return res.status(403).json({ error: 'Acesso negado à remessa informada.' });
    }
  }

  const hoje = db.agoraIso().slice(0, 10);
  const proxAno = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const inicio = typeof vigencia_inicio === 'string' && vigencia_inicio.trim() ? vigencia_inicio.trim() : hoje;
  const fim = typeof vigencia_fim === 'string' && vigencia_fim.trim() ? vigencia_fim.trim() : proxAno;
  const premio =
    valor_premio !== undefined && valor_premio !== '' && Number.isFinite(Number(valor_premio))
      ? Number(valor_premio)
      : +(valor * db.RATE).toFixed(2);

  const idApolice = db.gerarId('APL');
  db.transaction(() => {
    db.run(
      `INSERT INTO APOLICE (id_apolice, id_seguradora, valor_segurado, vigencia_inicio, vigencia_fim, coberturas, valor_premio)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      idApolice,
      seg.id_seguradora,
      valor,
      inicio,
      fim,
      coberturas.trim().slice(0, 255),
      premio
    );
    if (typeof id_remessa === 'string' && id_remessa.trim()) {
      db.run('UPDATE REMESSA SET id_apolice = ? WHERE id_remessa = ?', idApolice, id_remessa.trim());
    }
    db.registrarAuditoria({
      idUsuario: req.user.id_usuario,
      entidade: 'APOLICE',
      idRegistro: idApolice,
      acao: 'CRIAR',
    });
  });

  res.status(201).json(db.get(`${SELECT_APOLICE} WHERE a.id_apolice = ?`, idApolice));
});

apolicesRouter.put('/:id', (req, res) => {
  const atual = db.get(`${SELECT_APOLICE} WHERE a.id_apolice = ?`, req.params.id);
  if (!atual) return res.status(404).json({ error: 'Apólice não encontrada.' });
  if (!req.user.isAdmin && atual.id_cliente !== req.user.cliente_id_cliente) {
    return res.status(403).json({ error: 'Acesso negado a esta apólice.' });
  }

  const { id_seguradora, valor_segurado, vigencia_inicio, vigencia_fim, coberturas, valor_premio } = req.body || {};
  if (db.temHtmlInseguro([id_seguradora, vigencia_inicio, vigencia_fim, coberturas])) {
    return res.status(400).json({ error: 'Caracteres HTML (< ou >) não são permitidos.' });
  }

  const segId = typeof id_seguradora === 'string' && id_seguradora.trim() ? id_seguradora.trim() : atual.id_seguradora;
  const seg = db.get('SELECT id_seguradora FROM SEGURADORA WHERE id_seguradora = ?', segId);
  if (!seg) return res.status(400).json({ error: 'Seguradora não encontrada.' });

  const valor = valor_segurado !== undefined ? Number(valor_segurado) : Number(atual.valor_segurado);
  if (!Number.isFinite(valor) || valor <= 0) {
    return res.status(400).json({ error: 'Valor segurado inválido.' });
  }

  const premio =
    valor_premio !== undefined && valor_premio !== '' && Number.isFinite(Number(valor_premio))
      ? Number(valor_premio)
      : atual.valor_premio;

  db.transaction(() => {
    db.run(
      `UPDATE APOLICE
       SET id_seguradora = ?, valor_segurado = ?, vigencia_inicio = ?, vigencia_fim = ?, coberturas = ?, valor_premio = ?
       WHERE id_apolice = ?`,
      segId,
      valor,
      typeof vigencia_inicio === 'string' && vigencia_inicio.trim() ? vigencia_inicio.trim() : atual.vigencia_inicio,
      typeof vigencia_fim === 'string' && vigencia_fim.trim() ? vigencia_fim.trim() : atual.vigencia_fim,
      typeof coberturas === 'string' && coberturas.trim() ? coberturas.trim().slice(0, 255) : atual.coberturas,
      premio,
      atual.id_apolice
    );
    db.registrarAuditoria({
      idUsuario: req.user.id_usuario,
      entidade: 'APOLICE',
      idRegistro: atual.id_apolice,
      acao: 'ATUALIZAR',
    });
  });

  res.json(db.get(`${SELECT_APOLICE} WHERE a.id_apolice = ?`, atual.id_apolice));
});

module.exports = { categoriasRouter, seguradorasRouter, apolicesRouter };
