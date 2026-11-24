const express = require('express');
const db = require('../../db');

const notificacoesRouter = express.Router();
const atendimentosRouter = express.Router();
const feedbacksRouter = express.Router();

// ---------------- NOTIFICACAO ----------------

notificacoesRouter.get('/', (req, res) => {
  const conds = [];
  const params = [];

  if (!req.user.isAdmin) {
    conds.push('n.cliente_id_cliente = ?');
    params.push(req.user.cliente_id_cliente || '__sem_cliente__');
  } else if (typeof req.query.cliente === 'string' && req.query.cliente.trim()) {
    conds.push('n.cliente_id_cliente = ?');
    params.push(req.query.cliente.trim());
  }

  if (req.query.lida === '0' || req.query.lida === 'false') {
    conds.push('n.lida = 0');
  } else if (req.query.lida === '1' || req.query.lida === 'true') {
    conds.push('n.lida = 1');
  }

  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const items = db.all(
    `SELECT n.id_notificacao, n.cliente_id_cliente, c.nome_completo AS cliente_nome,
            n.tipo, n.canal, n.data_envio, n.lida, n.id_ocorrencia,
            o.tipo AS ocorrencia_tipo, o.descricao AS ocorrencia_descricao
     FROM NOTIFICACAO n
     INNER JOIN CLIENTE c ON c.id_cliente = n.cliente_id_cliente
     LEFT JOIN OCORRENCIA o ON o.id_ocorrencia = n.id_ocorrencia
     ${where}
     ORDER BY n.data_envio DESC`,
    ...params
  );

  const countWhere = req.user.isAdmin ? 'WHERE lida = 0' : 'WHERE cliente_id_cliente = ? AND lida = 0';
  const countParams = req.user.isAdmin ? [] : [req.user.cliente_id_cliente || '__sem_cliente__'];
  const naoLidasRow = db.get(`SELECT COUNT(*) AS n FROM NOTIFICACAO ${countWhere}`, ...countParams);

  res.json({
    items: items.map((n) => ({ ...n, lida: Boolean(n.lida) })),
    naoLidas: naoLidasRow?.n || 0,
  });
});

notificacoesRouter.post('/', (req, res) => {
  const { cliente_id_cliente, tipo, canal, id_ocorrencia } = req.body || {};
  if (typeof tipo !== 'string' || !tipo.trim() || typeof canal !== 'string' || !canal.trim()) {
    return res.status(400).json({ error: 'Tipo e canal da notificação são obrigatórios.' });
  }
  if (db.temHtmlInseguro([cliente_id_cliente, tipo, canal, id_ocorrencia])) {
    return res.status(400).json({ error: 'Caracteres HTML (< ou >) não são permitidos.' });
  }

  if (
    typeof cliente_id_cliente === 'string' &&
    cliente_id_cliente.trim() &&
    cliente_id_cliente.trim() !== req.user.cliente_id_cliente &&
    !req.user.isAdmin
  ) {
    return res.status(403).json({ error: 'Apenas administradores podem notificar outros clientes.' });
  }

  const clienteAlvo =
    req.user.isAdmin && typeof cliente_id_cliente === 'string' && cliente_id_cliente.trim()
      ? cliente_id_cliente.trim()
      : req.user.cliente_id_cliente;

  if (!clienteAlvo) return res.status(400).json({ error: 'Cliente de destino não informado.' });
  const cli = db.get('SELECT id_cliente FROM CLIENTE WHERE id_cliente = ?', clienteAlvo);
  if (!cli) return res.status(400).json({ error: 'Cliente não encontrado.' });

  let ocId = null;
  if (typeof id_ocorrencia === 'string' && id_ocorrencia.trim()) {
    const oc = db.get('SELECT id_ocorrencia FROM OCORRENCIA WHERE id_ocorrencia = ?', id_ocorrencia.trim());
    if (!oc) return res.status(400).json({ error: 'Ocorrência informada não encontrada.' });
    ocId = oc.id_ocorrencia;
  }

  const idNot = db.gerarId('NOT');
  db.transaction(() => {
    db.run(
      `INSERT INTO NOTIFICACAO (id_notificacao, cliente_id_cliente, tipo, canal, data_envio, lida, id_ocorrencia)
       VALUES (?, ?, ?, ?, ?, 0, ?)`,
      idNot,
      clienteAlvo,
      tipo.trim().slice(0, 50),
      canal.trim().slice(0, 50),
      db.agoraIso(),
      ocId
    );
    db.registrarAuditoria({
      idUsuario: req.user.id_usuario,
      entidade: 'NOTIFICACAO',
      idRegistro: idNot,
      acao: 'CRIAR',
    });
  });

  const criada = db.get('SELECT * FROM NOTIFICACAO WHERE id_notificacao = ?', idNot);
  res.status(201).json({ ...criada, lida: Boolean(criada.lida) });
});

notificacoesRouter.patch('/:id/lida', (req, res) => {
  const atual = db.get('SELECT * FROM NOTIFICACAO WHERE id_notificacao = ?', req.params.id);
  if (!atual) return res.status(404).json({ error: 'Notificação não encontrada.' });
  if (!req.user.isAdmin && atual.cliente_id_cliente !== req.user.cliente_id_cliente) {
    return res.status(403).json({ error: 'Acesso negado a esta notificação.' });
  }

  const lidaVal = req.body && req.body.lida !== undefined ? (req.body.lida ? 1 : 0) : 1;
  db.transaction(() => {
    db.run('UPDATE NOTIFICACAO SET lida = ? WHERE id_notificacao = ?', lidaVal, atual.id_notificacao);
    db.registrarAuditoria({
      idUsuario: req.user.id_usuario,
      entidade: 'NOTIFICACAO',
      idRegistro: atual.id_notificacao,
      acao: lidaVal ? 'MARCAR_LIDA' : 'MARCAR_NAO_LIDA',
    });
  });

  const updated = db.get('SELECT * FROM NOTIFICACAO WHERE id_notificacao = ?', atual.id_notificacao);
  res.json({ ...updated, lida: Boolean(updated.lida) });
});

notificacoesRouter.post('/marcar-todas-lidas', (req, res) => {
  db.transaction(() => {
    if (req.user.isAdmin) {
      db.run('UPDATE NOTIFICACAO SET lida = 1 WHERE lida = 0');
    } else {
      db.run(
        'UPDATE NOTIFICACAO SET lida = 1 WHERE cliente_id_cliente = ? AND lida = 0',
        req.user.cliente_id_cliente || '__sem_cliente__'
      );
    }
    db.registrarAuditoria({
      idUsuario: req.user.id_usuario,
      entidade: 'NOTIFICACAO',
      idRegistro: req.user.cliente_id_cliente || req.user.id_usuario,
      acao: 'MARCAR_TODAS_LIDAS',
    });
  });
  res.json({ ok: true });
});

notificacoesRouter.delete('/:id', (req, res) => {
  const atual = db.get('SELECT * FROM NOTIFICACAO WHERE id_notificacao = ?', req.params.id);
  if (!atual) return res.status(404).json({ error: 'Notificação não encontrada.' });
  if (!req.user.isAdmin && atual.cliente_id_cliente !== req.user.cliente_id_cliente) {
    return res.status(403).json({ error: 'Acesso negado a esta notificação.' });
  }

  db.transaction(() => {
    db.run('DELETE FROM NOTIFICACAO WHERE id_notificacao = ?', atual.id_notificacao);
    db.registrarAuditoria({
      idUsuario: req.user.id_usuario,
      entidade: 'NOTIFICACAO',
      idRegistro: atual.id_notificacao,
      acao: 'EXCLUIR',
    });
  });

  res.status(204).end();
});

// ---------------- ATENDIMENTO ----------------

const SELECT_ATENDIMENTO = `
  SELECT
    a.id_atendimento,
    a.cliente_id_cliente,
    c.nome_completo AS cliente_nome,
    a.canal,
    a.data_hora,
    a.assunto,
    a.resolvido,
    a.exigiu_repetir_informacao,
    a.atendido_por,
    a.id_pedido,
    p.nome_produto
  FROM ATENDIMENTO a
  INNER JOIN CLIENTE c ON c.id_cliente = a.cliente_id_cliente
  LEFT JOIN PEDIDO p ON p.id_pedido = a.id_pedido
`;

atendimentosRouter.get('/', (req, res) => {
  const conds = [];
  const params = [];
  if (!req.user.isAdmin) {
    conds.push('a.cliente_id_cliente = ?');
    params.push(req.user.cliente_id_cliente || '__sem_cliente__');
  }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const rows = db.all(`${SELECT_ATENDIMENTO} ${where} ORDER BY a.data_hora DESC`, ...params);
  res.json(rows.map((r) => ({ ...r, resolvido: Boolean(r.resolvido) })));
});

atendimentosRouter.post('/', (req, res) => {
  const { canal, assunto, resolvido, exigiu_repetir_informacao, atendido_por, id_pedido, cliente_id_cliente } =
    req.body || {};

  if (typeof canal !== 'string' || !canal.trim() || typeof assunto !== 'string' || !assunto.trim()) {
    return res.status(400).json({ error: 'Canal e assunto do atendimento são obrigatórios.' });
  }
  if (db.temHtmlInseguro([canal, assunto, exigiu_repetir_informacao, atendido_por, id_pedido, cliente_id_cliente])) {
    return res.status(400).json({ error: 'Caracteres HTML (< ou >) não são permitidos.' });
  }

  const idCliente =
    req.user.isAdmin && typeof cliente_id_cliente === 'string' && cliente_id_cliente.trim()
      ? cliente_id_cliente.trim()
      : req.user.cliente_id_cliente;
  if (!idCliente) return res.status(400).json({ error: 'Perfil de cliente não encontrado.' });

  let pedidoId = null;
  if (typeof id_pedido === 'string' && id_pedido.trim()) {
    const ped = db.get('SELECT id_pedido, id_cliente FROM PEDIDO WHERE id_pedido = ?', id_pedido.trim());
    if (!ped) return res.status(400).json({ error: 'Pedido informado não encontrado.' });
    if (!req.user.isAdmin && ped.id_cliente !== idCliente) {
      return res.status(403).json({ error: 'O pedido informado não pertence ao seu usuário.' });
    }
    pedidoId = ped.id_pedido;
  }

  const idAtd = db.gerarId('ATD');
  db.transaction(() => {
    db.run(
      `INSERT INTO ATENDIMENTO (
         id_atendimento, cliente_id_cliente, canal, data_hora, assunto, resolvido,
         exigiu_repetir_informacao, atendido_por, id_pedido
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      idAtd,
      idCliente,
      canal.trim().slice(0, 50),
      db.agoraIso(),
      assunto.trim().slice(0, 120),
      resolvido ? 1 : 0,
      typeof exigiu_repetir_informacao === 'string' && exigiu_repetir_informacao.trim()
        ? exigiu_repetir_informacao.trim().slice(0, 50)
        : 'Não',
      typeof atendido_por === 'string' && atendido_por.trim() ? atendido_por.trim().slice(0, 120) : 'Equipe LogMagna',
      pedidoId
    );
    db.registrarAuditoria({
      idUsuario: req.user.id_usuario,
      entidade: 'ATENDIMENTO',
      idRegistro: idAtd,
      acao: 'CRIAR',
    });
  });

  const criado = db.get(`${SELECT_ATENDIMENTO} WHERE a.id_atendimento = ?`, idAtd);
  res.status(201).json({ ...criado, resolvido: Boolean(criado.resolvido) });
});

atendimentosRouter.patch('/:id', (req, res) => {
  const atual = db.get(`${SELECT_ATENDIMENTO} WHERE a.id_atendimento = ?`, req.params.id);
  if (!atual) return res.status(404).json({ error: 'Atendimento não encontrado.' });
  if (!req.user.isAdmin && atual.cliente_id_cliente !== req.user.cliente_id_cliente) {
    return res.status(403).json({ error: 'Acesso negado a este atendimento.' });
  }

  const { resolvido, exigiu_repetir_informacao, atendido_por, assunto } = req.body || {};
  if (db.temHtmlInseguro([exigiu_repetir_informacao, atendido_por, assunto])) {
    return res.status(400).json({ error: 'Caracteres HTML (< ou >) não são permitidos.' });
  }

  const novoResolvido = resolvido !== undefined ? (resolvido ? 1 : 0) : atual.resolvido;
  db.transaction(() => {
    db.run(
      `UPDATE ATENDIMENTO
       SET resolvido = ?, exigiu_repetir_informacao = ?, atendido_por = ?, assunto = ?
       WHERE id_atendimento = ?`,
      novoResolvido,
      typeof exigiu_repetir_informacao === 'string' && exigiu_repetir_informacao.trim()
        ? exigiu_repetir_informacao.trim().slice(0, 50)
        : atual.exigiu_repetir_informacao,
      typeof atendido_por === 'string' && atendido_por.trim()
        ? atendido_por.trim().slice(0, 120)
        : atual.atendido_por,
      typeof assunto === 'string' && assunto.trim() ? assunto.trim().slice(0, 120) : atual.assunto,
      atual.id_atendimento
    );
    db.registrarAuditoria({
      idUsuario: req.user.id_usuario,
      entidade: 'ATENDIMENTO',
      idRegistro: atual.id_atendimento,
      acao: 'ATUALIZAR',
    });
  });

  const updated = db.get(`${SELECT_ATENDIMENTO} WHERE a.id_atendimento = ?`, atual.id_atendimento);
  res.json({ ...updated, resolvido: Boolean(updated.resolvido) });
});

// ---------------- FEEDBACK ----------------

feedbacksRouter.get('/', (req, res) => {
  const conds = [];
  const params = [];
  if (!req.user.isAdmin) {
    conds.push('f.cliente_id_cliente = ?');
    params.push(req.user.cliente_id_cliente || '__sem_cliente__');
  }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const rows = db.all(
    `SELECT f.*, c.nome_completo AS cliente_nome
     FROM FEEDBACK f
     INNER JOIN CLIENTE c ON c.id_cliente = f.cliente_id_cliente
     ${where}
     ORDER BY f.data DESC`,
    ...params
  );
  res.json(rows);
});

feedbacksRouter.post('/', (req, res) => {
  const {
    relato_problema,
    solucao_esperada,
    nivel_compreensao_seguro,
    momento_conhecimento_seguro,
    aceita_assistente_virtual,
  } = req.body || {};

  if (typeof relato_problema !== 'string' || !relato_problema.trim()) {
    return res.status(400).json({ error: 'Descreva o relato do problema ou experiência.' });
  }
  if (
    db.temHtmlInseguro([
      relato_problema,
      solucao_esperada,
      nivel_compreensao_seguro,
      momento_conhecimento_seguro,
      aceita_assistente_virtual,
    ])
  ) {
    return res.status(400).json({ error: 'Caracteres HTML (< ou >) não são permitidos.' });
  }

  const idCliente = req.user.cliente_id_cliente;
  if (!idCliente) return res.status(400).json({ error: 'Perfil de cliente não encontrado.' });

  const idFdb = db.gerarId('FDB');
  db.transaction(() => {
    db.run(
      `INSERT INTO FEEDBACK (
         id_feedback, data, cliente_id_cliente, relato_problema, solucao_esperada,
         nivel_compreensao_seguro, momento_conhecimento_seguro, aceita_assistente_virtual
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      idFdb,
      db.agoraIso(),
      idCliente,
      relato_problema.trim().slice(0, 255),
      typeof solucao_esperada === 'string' ? solucao_esperada.trim().slice(0, 255) : '',
      typeof nivel_compreensao_seguro === 'string' ? nivel_compreensao_seguro.trim().slice(0, 50) : 'Médio',
      typeof momento_conhecimento_seguro === 'string' ? momento_conhecimento_seguro.trim().slice(0, 120) : 'No checkout da compra',
      typeof aceita_assistente_virtual === 'string' ? aceita_assistente_virtual.trim().slice(0, 50) : 'Sim'
    );
    db.registrarAuditoria({
      idUsuario: req.user.id_usuario,
      entidade: 'FEEDBACK',
      idRegistro: idFdb,
      acao: 'CRIAR',
    });
  });

  const criado = db.get(
    `SELECT f.*, c.nome_completo AS cliente_nome
     FROM FEEDBACK f
     INNER JOIN CLIENTE c ON c.id_cliente = f.cliente_id_cliente
     WHERE f.id_feedback = ?`,
    idFdb
  );
  res.status(201).json(criado);
});

module.exports = { notificacoesRouter, atendimentosRouter, feedbacksRouter };
