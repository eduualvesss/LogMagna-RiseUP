const express = require('express');
const db = require('../../db');

const ocorrenciasRouter = express.Router();
const sinistrosRouter = express.Router();
const documentosRouter = express.Router();

const STATUS_ENCERRADOS = ['Indenizado', 'Não acionado', 'Negado', 'Encerrado'];

function normalizarStatusSinistro(raw, fallback) {
  const s = typeof raw === 'string' && raw.trim() ? raw.trim().slice(0, 50) : fallback;
  if (s === 'Em Análise') return 'Em análise';
  return s;
}

// ---------------- OCORRENCIA ----------------

const SELECT_OCORRENCIA = `
  SELECT
    o.id_ocorrencia,
    o.id_remessa,
    o.tipo,
    o.data_ocorrencia,
    o.descricao,
    r.codigo_rastreio,
    r.id_apolice,
    p.id_pedido,
    p.id_cliente,
    p.nome_produto,
    c.nome_completo AS cliente_nome
  FROM OCORRENCIA o
  INNER JOIN REMESSA r ON r.id_remessa = o.id_remessa
  INNER JOIN PEDIDO p ON p.id_pedido = r.id_pedido
  INNER JOIN CLIENTE c ON c.id_cliente = p.id_cliente
`;

ocorrenciasRouter.get('/', (req, res) => {
  const conds = [];
  const params = [];
  if (!req.user.isAdmin) {
    conds.push('p.id_cliente = ?');
    params.push(req.user.cliente_id_cliente || '__sem_cliente__');
  }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const rows = db.all(`${SELECT_OCORRENCIA} ${where} ORDER BY o.data_ocorrencia DESC`, ...params);
  res.json(rows);
});

ocorrenciasRouter.post('/', (req, res) => {
  const { id_remessa, tipo, descricao, data_ocorrencia } = req.body || {};
  if (typeof id_remessa !== 'string' || !id_remessa.trim() || typeof tipo !== 'string' || !tipo.trim() || typeof descricao !== 'string' || !descricao.trim()) {
    return res.status(400).json({ error: 'Remessa, tipo e descrição da ocorrência são obrigatórios.' });
  }
  if (db.temHtmlInseguro([id_remessa, tipo, descricao, data_ocorrencia])) {
    return res.status(400).json({ error: 'Caracteres HTML (< ou >) não são permitidos.' });
  }

  const remessa = db.get(
    `SELECT r.id_remessa, p.id_pedido, p.id_cliente
     FROM REMESSA r
     INNER JOIN PEDIDO p ON p.id_pedido = r.id_pedido
     WHERE r.id_remessa = ?`,
    id_remessa.trim()
  );
  if (!remessa) return res.status(404).json({ error: 'Remessa não encontrada.' });
  if (!req.user.isAdmin && remessa.id_cliente !== req.user.cliente_id_cliente) {
    return res.status(403).json({ error: 'Acesso negado a esta remessa.' });
  }

  const idOcorrencia = db.gerarId('OCO');
  const idNotificacao = db.gerarId('NOT');
  const agora = typeof data_ocorrencia === 'string' && data_ocorrencia.trim() ? data_ocorrencia.trim() : db.agoraIso();

  db.transaction(() => {
    db.run(
      `INSERT INTO OCORRENCIA (id_ocorrencia, id_remessa, tipo, data_ocorrencia, descricao)
       VALUES (?, ?, ?, ?, ?)`,
      idOcorrencia,
      remessa.id_remessa,
      tipo.trim().slice(0, 50),
      agora,
      descricao.trim().slice(0, 255)
    );

    db.run(
      `INSERT INTO NOTIFICACAO (id_notificacao, cliente_id_cliente, tipo, canal, data_envio, lida, id_ocorrencia)
       VALUES (?, ?, ?, 'Painel Web', ?, 0, ?)`,
      idNotificacao,
      remessa.id_cliente,
      `Ocorrência: ${tipo.trim().slice(0, 35)}`,
      db.agoraIso(),
      idOcorrencia
    );

    db.registrarAuditoria({
      idUsuario: req.user.id_usuario,
      entidade: 'OCORRENCIA',
      idRegistro: idOcorrencia,
      acao: 'CRIAR',
    });
  });

  res.status(201).json(db.get(`${SELECT_OCORRENCIA} WHERE o.id_ocorrencia = ?`, idOcorrencia));
});

// ---------------- SINISTRO ----------------

const SELECT_SINISTRO = `
  SELECT
    s.id_sinistro,
    s.data_abertura,
    s.status,
    s.valor_indenizado,
    s.data_encerramento,
    s.etapa_mais_dificil,
    s.motivo_nao_acionamento,
    s.ocorrencia_id_ocorrencia,
    s.id_apolice,
    o.tipo AS ocorrencia_tipo,
    o.descricao AS ocorrencia_descricao,
    o.data_ocorrencia,
    r.id_remessa,
    r.codigo_rastreio,
    p.id_pedido,
    p.id_cliente,
    p.nome_produto,
    c.nome_completo AS cliente_nome,
    a.valor_segurado,
    a.coberturas,
    seg.razao_social AS seguradora_razao_social
  FROM SINISTRO s
  INNER JOIN OCORRENCIA o ON o.id_ocorrencia = s.ocorrencia_id_ocorrencia
  INNER JOIN REMESSA r ON r.id_remessa = o.id_remessa
  INNER JOIN PEDIDO p ON p.id_pedido = r.id_pedido
  INNER JOIN CLIENTE c ON c.id_cliente = p.id_cliente
  INNER JOIN APOLICE a ON a.id_apolice = s.id_apolice
  INNER JOIN SEGURADORA seg ON seg.id_seguradora = a.id_seguradora
`;

function anexarDocumentos(sinistros) {
  if (!sinistros.length) return [];
  const ids = sinistros.map((s) => s.id_sinistro);
  const placeholders = ids.map(() => '?').join(', ');
  const todosDocs = db.all(
    `SELECT id_documento, id_sinistro, tipo, arquivo, data_envio, validado
     FROM DOCUMENTO
     WHERE id_sinistro IN (${placeholders})
     ORDER BY data_envio DESC`,
    ...ids
  );

  const docsPorSinistro = new Map();
  for (const d of todosDocs) {
    const lista = docsPorSinistro.get(d.id_sinistro) || [];
    lista.push({ ...d, validado: Boolean(d.validado) });
    docsPorSinistro.set(d.id_sinistro, lista);
  }

  return sinistros.map((s) => ({
    ...s,
    valor_indenizado: s.valor_indenizado != null ? Number(s.valor_indenizado) : null,
    documentos: docsPorSinistro.get(s.id_sinistro) || [],
  }));
}

sinistrosRouter.get('/', (req, res) => {
  const conds = [];
  const params = [];
  if (!req.user.isAdmin) {
    conds.push('p.id_cliente = ?');
    params.push(req.user.cliente_id_cliente || '__sem_cliente__');
  }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const rows = db.all(`${SELECT_SINISTRO} ${where} ORDER BY s.data_abertura DESC`, ...params);
  res.json(anexarDocumentos(rows));
});

sinistrosRouter.post('/', (req, res) => {
  const {
    ocorrencia_id_ocorrencia,
    id_apolice,
    status,
    valor_indenizado,
    etapa_mais_dificil,
    motivo_nao_acionamento,
  } = req.body || {};

  if (typeof ocorrencia_id_ocorrencia !== 'string' || !ocorrencia_id_ocorrencia.trim()) {
    return res.status(400).json({ error: 'Informe a ocorrência vinculada ao sinistro.' });
  }
  if (db.temHtmlInseguro([ocorrencia_id_ocorrencia, id_apolice, status, etapa_mais_dificil, motivo_nao_acionamento])) {
    return res.status(400).json({ error: 'Caracteres HTML (< ou >) não são permitidos.' });
  }

  const ocorrencia = db.get(
    `SELECT o.id_ocorrencia, r.id_apolice AS remessa_apolice, p.id_cliente
     FROM OCORRENCIA o
     INNER JOIN REMESSA r ON r.id_remessa = o.id_remessa
     INNER JOIN PEDIDO p ON p.id_pedido = r.id_pedido
     WHERE o.id_ocorrencia = ?`,
    ocorrencia_id_ocorrencia.trim()
  );
  if (!ocorrencia) return res.status(404).json({ error: 'Ocorrência não encontrada.' });
  if (!req.user.isAdmin && ocorrencia.id_cliente !== req.user.cliente_id_cliente) {
    return res.status(403).json({ error: 'Acesso negado a esta ocorrência.' });
  }

  const apoliceFinal =
    typeof id_apolice === 'string' && id_apolice.trim() ? id_apolice.trim() : ocorrencia.remessa_apolice;
  if (!apoliceFinal) {
    return res.status(400).json({ error: 'Não há apólice vinculada à remessa; informe o id_apolice.' });
  }
  const apoliceExiste = db.get('SELECT id_apolice FROM APOLICE WHERE id_apolice = ?', apoliceFinal);
  if (!apoliceExiste) return res.status(400).json({ error: 'Apólice informada não encontrada.' });

  const idSinistro = db.gerarId('SIN');
  const agora = db.agoraIso();
  const statusFinal = normalizarStatusSinistro(status, 'Em análise');
  const valorNum =
    valor_indenizado !== undefined && valor_indenizado !== null && valor_indenizado !== ''
      ? Number(valor_indenizado)
      : null;

  if (valorNum !== null && (!Number.isFinite(valorNum) || valorNum < 0)) {
    return res.status(400).json({ error: 'Valor indenizado inválido.' });
  }

  db.transaction(() => {
    db.run(
      `INSERT INTO SINISTRO (
         id_sinistro, data_abertura, status, valor_indenizado, data_encerramento,
         etapa_mais_dificil, motivo_nao_acionamento, ocorrencia_id_ocorrencia, id_apolice
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      idSinistro,
      agora,
      statusFinal,
      valorNum,
      STATUS_ENCERRADOS.includes(statusFinal) ? agora : null,
      typeof etapa_mais_dificil === 'string' && etapa_mais_dificil.trim() ? etapa_mais_dificil.trim().slice(0, 120) : null,
      typeof motivo_nao_acionamento === 'string' && motivo_nao_acionamento.trim() ? motivo_nao_acionamento.trim().slice(0, 255) : null,
      ocorrencia.id_ocorrencia,
      apoliceFinal
    );

    db.run(
      `INSERT INTO NOTIFICACAO (id_notificacao, cliente_id_cliente, tipo, canal, data_envio, lida, id_ocorrencia)
       VALUES (?, ?, 'Sinistro aberto', 'Painel Web', ?, 0, ?)`,
      db.gerarId('NOT'),
      ocorrencia.id_cliente,
      agora,
      ocorrencia.id_ocorrencia
    );

    db.registrarAuditoria({
      idUsuario: req.user.id_usuario,
      entidade: 'SINISTRO',
      idRegistro: idSinistro,
      acao: 'CRIAR',
    });
  });

  const criado = db.get(`${SELECT_SINISTRO} WHERE s.id_sinistro = ?`, idSinistro);
  res.status(201).json(anexarDocumentos([criado])[0]);
});

sinistrosRouter.put('/:id', (req, res) => {
  const atual = db.get(`${SELECT_SINISTRO} WHERE s.id_sinistro = ?`, req.params.id);
  if (!atual) return res.status(404).json({ error: 'Sinistro não encontrado.' });
  if (!req.user.isAdmin && atual.id_cliente !== req.user.cliente_id_cliente) {
    return res.status(403).json({ error: 'Acesso negado a este sinistro.' });
  }

  const { status, valor_indenizado, data_encerramento, etapa_mais_dificil, motivo_nao_acionamento } = req.body || {};
  if (db.temHtmlInseguro([status, data_encerramento, etapa_mais_dificil, motivo_nao_acionamento])) {
    return res.status(400).json({ error: 'Caracteres HTML (< ou >) não são permitidos.' });
  }

  const novoStatus = normalizarStatusSinistro(status, atual.status);
  const valorNum =
    valor_indenizado === undefined
      ? atual.valor_indenizado
      : valor_indenizado === null || valor_indenizado === ''
        ? null
        : Number(valor_indenizado);

  if (valorNum !== null && (!Number.isFinite(valorNum) || valorNum < 0)) {
    return res.status(400).json({ error: 'Valor indenizado inválido.' });
  }

  let encerramento = atual.data_encerramento;
  if (typeof data_encerramento === 'string') {
    encerramento = data_encerramento.trim() || null;
  } else if (STATUS_ENCERRADOS.includes(novoStatus)) {
    if (!encerramento) encerramento = db.agoraIso();
  } else {
    encerramento = null;
  }

  db.transaction(() => {
    db.run(
      `UPDATE SINISTRO
       SET status = ?, valor_indenizado = ?, data_encerramento = ?, etapa_mais_dificil = ?, motivo_nao_acionamento = ?
       WHERE id_sinistro = ?`,
      novoStatus,
      valorNum,
      encerramento,
      etapa_mais_dificil !== undefined
        ? typeof etapa_mais_dificil === 'string' && etapa_mais_dificil.trim()
          ? etapa_mais_dificil.trim().slice(0, 120)
          : null
        : atual.etapa_mais_dificil,
      motivo_nao_acionamento !== undefined
        ? typeof motivo_nao_acionamento === 'string' && motivo_nao_acionamento.trim()
          ? motivo_nao_acionamento.trim().slice(0, 255)
          : null
        : atual.motivo_nao_acionamento,
      atual.id_sinistro
    );

    db.registrarAuditoria({
      idUsuario: req.user.id_usuario,
      entidade: 'SINISTRO',
      idRegistro: atual.id_sinistro,
      acao: 'ATUALIZAR',
    });
  });

  const atualizado = db.get(`${SELECT_SINISTRO} WHERE s.id_sinistro = ?`, atual.id_sinistro);
  res.json(anexarDocumentos([atualizado])[0]);
});

// ---------------- DOCUMENTO ----------------

function buscarSinistroComEscopo(idSinistro, user) {
  const sin = db.get(
    `SELECT s.id_sinistro, p.id_cliente
     FROM SINISTRO s
     INNER JOIN OCORRENCIA o ON o.id_ocorrencia = s.ocorrencia_id_ocorrencia
     INNER JOIN REMESSA r ON r.id_remessa = o.id_remessa
     INNER JOIN PEDIDO p ON p.id_pedido = r.id_pedido
     WHERE s.id_sinistro = ?`,
    idSinistro
  );
  if (!sin) return { erro: 404, msg: 'Sinistro não encontrado.' };
  if (!user.isAdmin && sin.id_cliente !== user.cliente_id_cliente) {
    return { erro: 403, msg: 'Acesso negado a este sinistro.' };
  }
  return { sin };
}

sinistrosRouter.get('/:id/documentos', (req, res) => {
  const check = buscarSinistroComEscopo(req.params.id, req.user);
  if (check.erro) return res.status(check.erro).json({ error: check.msg });
  const docs = db.all('SELECT * FROM DOCUMENTO WHERE id_sinistro = ? ORDER BY data_envio DESC', req.params.id);
  res.json(docs.map((d) => ({ ...d, validado: Boolean(d.validado) })));
});

sinistrosRouter.post('/:id/documentos', (req, res) => {
  const check = buscarSinistroComEscopo(req.params.id, req.user);
  if (check.erro) return res.status(check.erro).json({ error: check.msg });

  const { tipo, arquivo, validado } = req.body || {};
  if (typeof tipo !== 'string' || !tipo.trim() || typeof arquivo !== 'string' || !arquivo.trim()) {
    return res.status(400).json({ error: 'Tipo e nome/caminho do arquivo são obrigatórios.' });
  }
  if (db.temHtmlInseguro([tipo, arquivo])) {
    return res.status(400).json({ error: 'Caracteres HTML (< ou >) não são permitidos.' });
  }

  const idDoc = db.gerarId('DOC');
  const agora = db.agoraIso();
  const validadoVal = req.user.isAdmin && validado ? 1 : 0;

  db.transaction(() => {
    db.run(
      `INSERT INTO DOCUMENTO (id_documento, id_sinistro, tipo, arquivo, data_envio, validado)
       VALUES (?, ?, ?, ?, ?, ?)`,
      idDoc,
      req.params.id,
      tipo.trim().slice(0, 50),
      arquivo.trim().slice(0, 255),
      agora,
      validadoVal
    );
    db.registrarAuditoria({
      idUsuario: req.user.id_usuario,
      entidade: 'DOCUMENTO',
      idRegistro: idDoc,
      acao: 'CRIAR',
    });
  });

  const doc = db.get('SELECT * FROM DOCUMENTO WHERE id_documento = ?', idDoc);
  res.status(201).json({ ...doc, validado: Boolean(doc.validado) });
});

documentosRouter.patch('/:id', (req, res) => {
  const doc = db.get(
    `SELECT d.*, p.id_cliente
     FROM DOCUMENTO d
     INNER JOIN SINISTRO s ON s.id_sinistro = d.id_sinistro
     INNER JOIN OCORRENCIA o ON o.id_ocorrencia = s.ocorrencia_id_ocorrencia
     INNER JOIN REMESSA r ON r.id_remessa = o.id_remessa
     INNER JOIN PEDIDO p ON p.id_pedido = r.id_pedido
     WHERE d.id_documento = ?`,
    req.params.id
  );
  if (!doc) return res.status(404).json({ error: 'Documento não encontrado.' });
  if (!req.user.isAdmin && doc.id_cliente !== req.user.cliente_id_cliente) {
    return res.status(403).json({ error: 'Acesso negado a este documento.' });
  }

  const { validado, tipo, arquivo } = req.body || {};
  if (validado !== undefined && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Apenas administradores podem validar ou invalidar documentos.' });
  }
  if (db.temHtmlInseguro([tipo, arquivo])) {
    return res.status(400).json({ error: 'Caracteres HTML (< ou >) não são permitidos.' });
  }

  const novoValidado = validado !== undefined ? (validado ? 1 : 0) : doc.validado;
  const novoTipo = typeof tipo === 'string' && tipo.trim() ? tipo.trim().slice(0, 50) : doc.tipo;
  const novoArquivo = typeof arquivo === 'string' && arquivo.trim() ? arquivo.trim().slice(0, 255) : doc.arquivo;

  db.transaction(() => {
    db.run(
      'UPDATE DOCUMENTO SET validado = ?, tipo = ?, arquivo = ? WHERE id_documento = ?',
      novoValidado,
      novoTipo,
      novoArquivo,
      doc.id_documento
    );
    db.registrarAuditoria({
      idUsuario: req.user.id_usuario,
      entidade: 'DOCUMENTO',
      idRegistro: doc.id_documento,
      acao: validado !== undefined ? (novoValidado ? 'VALIDAR' : 'INVALIDAR') : 'ATUALIZAR',
    });
  });

  const atualizado = db.get('SELECT * FROM DOCUMENTO WHERE id_documento = ?', doc.id_documento);
  res.json({ ...atualizado, validado: Boolean(atualizado.validado) });
});

documentosRouter.delete('/:id', (req, res) => {
  const doc = db.get(
    `SELECT d.id_documento, p.id_cliente
     FROM DOCUMENTO d
     INNER JOIN SINISTRO s ON s.id_sinistro = d.id_sinistro
     INNER JOIN OCORRENCIA o ON o.id_ocorrencia = s.ocorrencia_id_ocorrencia
     INNER JOIN REMESSA r ON r.id_remessa = o.id_remessa
     INNER JOIN PEDIDO p ON p.id_pedido = r.id_pedido
     WHERE d.id_documento = ?`,
    req.params.id
  );
  if (!doc) return res.status(404).json({ error: 'Documento não encontrado.' });
  if (!req.user.isAdmin && doc.id_cliente !== req.user.cliente_id_cliente) {
    return res.status(403).json({ error: 'Acesso negado a este documento.' });
  }

  db.transaction(() => {
    db.run('DELETE FROM DOCUMENTO WHERE id_documento = ?', doc.id_documento);
    db.registrarAuditoria({
      idUsuario: req.user.id_usuario,
      entidade: 'DOCUMENTO',
      idRegistro: doc.id_documento,
      acao: 'EXCLUIR',
    });
  });

  res.status(204).end();
});

module.exports = { ocorrenciasRouter, sinistrosRouter, documentosRouter };
