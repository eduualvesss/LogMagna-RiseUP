const express = require('express');
const db = require('../db');

const router = express.Router();

const STATUS_VALIDOS = ['Aguardando', 'Em trânsito', 'Entregue', 'Retido', 'Cancelado'];

function parseDataCompra(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return db.agoraIso();
  const s = raw.trim();
  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  if (br) {
    return `${br[3]}-${br[2]}-${br[1]}T12:00:00.000Z`;
  }
  const parsed = Date.parse(s);
  if (!Number.isNaN(parsed)) return new Date(parsed).toISOString();
  return db.agoraIso();
}

function adicionarDiasIso(iso, dias) {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString();
}

function formatarDataEventoBr(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso || '');
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)} • ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

function gerarCodigoRastreioUnico() {
  for (let i = 0; i < 10; i++) {
    const num = Math.floor(100000000 + Math.random() * 900000000);
    const code = `BR${num}SP`;
    const jaExiste = db.get('SELECT id_remessa FROM REMESSA WHERE UPPER(codigo_rastreio) = ?', code);
    if (!jaExiste) return code;
  }
  return `BR${Date.now().toString().slice(-9)}SP`;
}

const SELECT_PEDIDO = `
  SELECT
    p.id_pedido,
    p.id_cliente,
    c.nome_completo AS cliente_nome,
    p.data_compra,
    p.valor_declarado,
    p.status,
    p.retido_analise,
    p.motivo_retencao,
    p.id_categoria,
    cat.descricao AS categoria_descricao,
    p.nome_produto,
    p.loja,
    r.id_remessa,
    r.codigo_rastreio,
    r.data_envio,
    r.previsao_entrega,
    r.status_entrega,
    r.transportadora,
    r.origem,
    r.destino,
    r.cep_destino,
    a.id_apolice,
    a.id_seguradora,
    a.valor_segurado,
    a.valor_premio,
    a.vigencia_inicio,
    a.vigencia_fim,
    a.coberturas,
    s.razao_social AS seguradora_razao_social,
    s.contato AS seguradora_contato
  FROM PEDIDO p
  INNER JOIN CLIENTE c ON c.id_cliente = p.id_cliente
  LEFT JOIN CATEGORIA_PRODUTO cat ON cat.id_categoria = p.id_categoria
  LEFT JOIN REMESSA r ON r.id_pedido = p.id_pedido
  LEFT JOIN APOLICE a ON a.id_apolice = r.id_apolice
  LEFT JOIN SEGURADORA s ON s.id_seguradora = a.id_seguradora
`;

function mapPedidoRow(row) {
  const valor = Number(row.valor_declarado || 0);
  const premio = row.valor_premio != null ? Number(row.valor_premio) : +(valor * db.RATE).toFixed(2);
  const nome = row.nome_produto || `Pedido ${row.id_pedido}`;
  return {
    ...row,
    retido_analise: Boolean(row.retido_analise),
    valor_declarado: valor,
    valor_segurado: row.valor_segurado != null ? Number(row.valor_segurado) : valor,
    valor_premio: premio,
    // Aliases de compatibilidade com o frontend existente
    id: row.id_pedido,
    name: nome,
    value: valor,
    cost: premio,
    status: row.status,
    tracking: row.codigo_rastreio || '',
    origin: row.origem || 'Centro Logístico',
    destination: row.destino || 'São Paulo, SP',
    store: row.loja || '',
    purchaseDate: row.data_compra,
    cep: row.cep_destino || '',
  };
}

// GET /api/pedidos (e /api/products)
router.get('/', (req, res) => {
  const busca = typeof req.query.busca === 'string' ? req.query.busca.trim().toLowerCase() : '';
  const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
  const categoria = typeof req.query.categoria === 'string' ? req.query.categoria.trim() : '';
  const retido = typeof req.query.retido === 'string' ? req.query.retido.trim() : '';

  const conds = [];
  const params = [];

  if (!req.user.isAdmin) {
    conds.push('p.id_cliente = ?');
    params.push(req.user.cliente_id_cliente || '__sem_cliente__');
  }
  if (busca) {
    conds.push(
      '(LOWER(p.id_pedido) LIKE ? OR LOWER(COALESCE(p.nome_produto, \'\')) LIKE ? OR LOWER(COALESCE(r.codigo_rastreio, \'\')) LIKE ? OR LOWER(COALESCE(p.loja, \'\')) LIKE ?)'
    );
    params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`, `%${busca}%`);
  }
  if (status) {
    conds.push('p.status = ?');
    params.push(status);
  }
  if (categoria) {
    conds.push('p.id_categoria = ?');
    params.push(categoria);
  }
  if (retido === '1' || retido === 'true') {
    conds.push('p.retido_analise = 1');
  }

  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const rows = db.all(`${SELECT_PEDIDO} ${where} ORDER BY p.data_compra DESC, p.id_pedido DESC`, ...params);
  res.json(rows.map(mapPedidoRow));
});

// GET /api/pedidos/:id
router.get('/:id', (req, res) => {
  const row = db.get(`${SELECT_PEDIDO} WHERE p.id_pedido = ?`, req.params.id);
  if (!row) return res.status(404).json({ error: 'Pedido não encontrado.' });
  if (!req.user.isAdmin && row.id_cliente !== req.user.cliente_id_cliente) {
    return res.status(403).json({ error: 'Acesso negado a este pedido.' });
  }

  const eventos = row.id_remessa
    ? db.all(
        `SELECT id_evento, id_remessa, data_hora, descricao, localizacao
         FROM EVENTO_RASTREIO
         WHERE id_remessa = ?
         ORDER BY data_hora DESC`,
        row.id_remessa
      )
    : [];

  const ocorrencias = row.id_remessa
    ? db.all(
        `SELECT id_ocorrencia, id_remessa, tipo, data_ocorrencia, descricao
         FROM OCORRENCIA
         WHERE id_remessa = ?
         ORDER BY data_ocorrencia DESC`,
        row.id_remessa
      )
    : [];

  res.json({ ...mapPedidoRow(row), eventos, ocorrencias });
});

// POST /api/pedidos (e /api/products)
router.post('/', (req, res) => {
  const body = req.body || {};
  const nomeBruto = body.name ?? body.nome_produto;
  const valorBruto = body.value ?? body.valor_declarado;
  const store = body.store ?? body.loja ?? '';
  const destination = body.destination ?? body.destino ?? 'São Paulo, SP';
  const origin = body.origin ?? body.origem ?? 'Centro Logístico • São Paulo, SP';
  const trackingRaw = body.tracking ?? body.codigo_rastreio ?? '';
  const purchaseDate = body.purchaseDate ?? body.data_compra ?? '';
  const cep = body.cep ?? body.cep_destino ?? '';
  const transportadora = body.transportadora ?? 'LogMagna Express';
  const coberturas = body.coberturas ?? 'Roubo, extravio e avaria no transporte';

  const num = Number(valorBruto);
  if (typeof nomeBruto !== 'string' || !nomeBruto.trim() || !Number.isFinite(num) || num <= 0) {
    return res.status(400).json({ error: 'Nome e valor válidos são obrigatórios.' });
  }
  const nome = nomeBruto.trim();
  if (nome.length > 120) {
    return res.status(400).json({ error: 'O nome do produto deve ter no máximo 120 caracteres.' });
  }

  const camposTexto = [
    nome,
    store,
    destination,
    origin,
    trackingRaw,
    purchaseDate,
    cep,
    transportadora,
    coberturas,
  ].filter((v) => typeof v === 'string');

  if (db.temHtmlInseguro(camposTexto)) {
    return res.status(400).json({ error: 'Caracteres HTML (< ou >) não são permitidos.' });
  }

  let idCliente = req.user.cliente_id_cliente;
  if (req.user.isAdmin && typeof body.id_cliente === 'string' && body.id_cliente.trim()) {
    const cliExiste = db.get('SELECT id_cliente FROM CLIENTE WHERE id_cliente = ?', body.id_cliente.trim());
    if (!cliExiste) return res.status(400).json({ error: 'Cliente informado não encontrado.' });
    idCliente = cliExiste.id_cliente;
  }
  if (!idCliente) {
    return res.status(400).json({ error: 'Usuário sem perfil de cliente associado.' });
  }

  let idCategoria = null;
  if (typeof body.id_categoria === 'string' && body.id_categoria.trim()) {
    const cat = db.get('SELECT id_categoria FROM CATEGORIA_PRODUTO WHERE id_categoria = ?', body.id_categoria.trim());
    if (!cat) return res.status(400).json({ error: 'Categoria de produto não encontrada.' });
    idCategoria = cat.id_categoria;
  } else {
    const catPadrao = db.get('SELECT id_categoria FROM CATEGORIA_PRODUTO ORDER BY id_categoria LIMIT 1');
    idCategoria = catPadrao ? catPadrao.id_categoria : null;
  }

  let idSeguradora = null;
  if (typeof body.id_seguradora === 'string' && body.id_seguradora.trim()) {
    const seg = db.get('SELECT id_seguradora FROM SEGURADORA WHERE id_seguradora = ?', body.id_seguradora.trim());
    if (!seg) return res.status(400).json({ error: 'Seguradora não encontrada.' });
    idSeguradora = seg.id_seguradora;
  } else {
    const segPadrao = db.get('SELECT id_seguradora FROM SEGURADORA ORDER BY id_seguradora LIMIT 1');
    idSeguradora = segPadrao ? segPadrao.id_seguradora : null;
  }
  if (!idSeguradora) {
    return res.status(400).json({ error: 'Nenhuma seguradora cadastrada para emitir a apólice.' });
  }

  let codigoRastreio = typeof trackingRaw === 'string' ? trackingRaw.trim().toUpperCase() : '';
  if (codigoRastreio) {
    if (codigoRastreio.length > 50) {
      return res.status(400).json({ error: 'O código de rastreio deve ter no máximo 50 caracteres.' });
    }
    const duplicado = db.get('SELECT id_remessa FROM REMESSA WHERE UPPER(codigo_rastreio) = ?', codigoRastreio);
    if (duplicado) {
      return res.status(409).json({ error: 'Já existe uma remessa cadastrada com este código de rastreio.' });
    }
  } else {
    codigoRastreio = gerarCodigoRastreioUnico();
  }

  const dataCompraIso = parseDataCompra(purchaseDate);
  const previsaoIso = body.previsao_entrega
    ? parseDataCompra(body.previsao_entrega)
    : adicionarDiasIso(dataCompraIso, 5);
  const vigenciaInicio = dataCompraIso.slice(0, 10);
  const vigenciaFim = adicionarDiasIso(dataCompraIso, 365).slice(0, 10);
  const premio = +(num * db.RATE).toFixed(2);

  const idPedido = db.gerarId('LM-2026');
  const idApolice = db.gerarId('APL');
  const idRemessa = db.gerarId('REM');
  const idEvento = db.gerarId('EVT');
  const idNotificacao = db.gerarId('NOT');

  db.transaction(() => {
    db.run(
      `INSERT INTO APOLICE (id_apolice, id_seguradora, valor_segurado, vigencia_inicio, vigencia_fim, coberturas, valor_premio)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      idApolice,
      idSeguradora,
      num,
      vigenciaInicio,
      vigenciaFim,
      String(coberturas).trim().slice(0, 255),
      premio
    );

    db.run(
      `INSERT INTO PEDIDO (id_pedido, id_cliente, data_compra, valor_declarado, status, retido_analise, motivo_retencao, id_categoria, nome_produto, loja)
       VALUES (?, ?, ?, ?, 'Aguardando', 0, NULL, ?, ?, ?)`,
      idPedido,
      idCliente,
      dataCompraIso,
      num,
      idCategoria,
      nome,
      typeof store === 'string' ? store.trim().slice(0, 120) : ''
    );

    db.run(
      `INSERT INTO REMESSA (id_remessa, codigo_rastreio, data_envio, previsao_entrega, status_entrega, id_pedido, id_apolice, transportadora, origem, destino, cep_destino)
       VALUES (?, ?, ?, ?, 'Aguardando', ?, ?, ?, ?, ?, ?)`,
      idRemessa,
      codigoRastreio,
      dataCompraIso,
      previsaoIso,
      idPedido,
      idApolice,
      String(transportadora).trim().slice(0, 120) || 'LogMagna Express',
      String(origin).trim().slice(0, 120) || 'Centro Logístico',
      String(destination).trim().slice(0, 120) || 'São Paulo, SP',
      typeof cep === 'string' ? cep.trim().slice(0, 20) : ''
    );

    db.run(
      `INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao)
       VALUES (?, ?, ?, ?, ?)`,
      idEvento,
      idRemessa,
      dataCompraIso,
      'Pedido registrado e aguardando postagem',
      String(origin).trim().slice(0, 120) || 'Centro Logístico'
    );

    db.run(
      `INSERT INTO NOTIFICACAO (id_notificacao, cliente_id_cliente, tipo, canal, data_envio, lida, id_ocorrencia)
       VALUES (?, ?, 'Pedido cadastrado', 'Painel Web', ?, 0, NULL)`,
      idNotificacao,
      idCliente,
      db.agoraIso()
    );

    db.registrarAuditoria({
      idUsuario: req.user.id_usuario,
      entidade: 'PEDIDO',
      idRegistro: idPedido,
      acao: 'CRIAR',
    });
  });

  const criado = db.get(`${SELECT_PEDIDO} WHERE p.id_pedido = ?`, idPedido);
  res.status(201).json(mapPedidoRow(criado));
});

// PATCH /api/pedidos/:id
router.patch('/:id', (req, res) => {
  const atual = db.get(`${SELECT_PEDIDO} WHERE p.id_pedido = ?`, req.params.id);
  if (!atual) return res.status(404).json({ error: 'Pedido não encontrado.' });
  if (!req.user.isAdmin && atual.id_cliente !== req.user.cliente_id_cliente) {
    return res.status(403).json({ error: 'Acesso negado a este pedido.' });
  }

  const { status, status_entrega, retido_analise, motivo_retencao, previsao_entrega } = req.body || {};
  if (db.temHtmlInseguro([status, status_entrega, motivo_retencao, previsao_entrega])) {
    return res.status(400).json({ error: 'Caracteres HTML (< ou >) não são permitidos.' });
  }

  const novoStatus = typeof status === 'string' && status.trim() ? status.trim() : atual.status;
  if (!STATUS_VALIDOS.includes(novoStatus)) {
    return res.status(400).json({ error: 'Status de pedido inválido.' });
  }

  const novoStatusEntrega =
    typeof status_entrega === 'string' && status_entrega.trim()
      ? status_entrega.trim()
      : status
        ? novoStatus
        : atual.status_entrega;

  const novoRetido =
    retido_analise !== undefined ? (retido_analise ? 1 : 0) : atual.retido_analise ? 1 : 0;

  const novoMotivo =
    motivo_retencao !== undefined
      ? typeof motivo_retencao === 'string' && motivo_retencao.trim()
        ? motivo_retencao.trim().slice(0, 255)
        : null
      : novoRetido
        ? atual.motivo_retencao
        : null;

  const novaPrevisao =
    typeof previsao_entrega === 'string' && previsao_entrega.trim()
      ? parseDataCompra(previsao_entrega)
      : atual.previsao_entrega;

  db.transaction(() => {
    db.run(
      `UPDATE PEDIDO
       SET status = ?, retido_analise = ?, motivo_retencao = ?
       WHERE id_pedido = ?`,
      novoStatus,
      novoRetido,
      novoMotivo,
      atual.id_pedido
    );

    if (atual.id_remessa) {
      db.run(
        `UPDATE REMESSA
         SET status_entrega = ?, previsao_entrega = ?
         WHERE id_remessa = ?`,
        novoStatusEntrega,
        novaPrevisao,
        atual.id_remessa
      );

      if (novoStatus !== atual.status) {
        db.run(
          `INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao)
           VALUES (?, ?, ?, ?, ?)`,
          db.gerarId('EVT'),
          atual.id_remessa,
          db.agoraIso(),
          `Status atualizado para: ${novoStatus}`,
          atual.destino || 'Centro de operações LogMagna'
        );
      }
    }

    db.registrarAuditoria({
      idUsuario: req.user.id_usuario,
      entidade: 'PEDIDO',
      idRegistro: atual.id_pedido,
      acao: 'ATUALIZAR',
    });
  });

  const atualizado = db.get(`${SELECT_PEDIDO} WHERE p.id_pedido = ?`, atual.id_pedido);
  res.json(mapPedidoRow(atualizado));
});

// GET /api/tracking/:code
function trackingHandler(req, res) {
  const code = String(req.params.code || '').trim().toUpperCase();
  if (!code) return res.status(400).json({ error: 'Informe o código de rastreio.' });

  const row = db.get(`${SELECT_PEDIDO} WHERE UPPER(r.codigo_rastreio) = ?`, code);
  if (!row) return res.status(404).json({ error: 'Código de rastreio não encontrado.' });

  const eventos = db.all(
    `SELECT id_evento, id_remessa, data_hora, descricao, localizacao
     FROM EVENTO_RASTREIO
     WHERE id_remessa = ?
     ORDER BY data_hora DESC, id_evento DESC`,
    row.id_remessa
  );

  const ocorrencias = db.all(
    `SELECT id_ocorrencia, id_remessa, tipo, data_ocorrencia, descricao
     FROM OCORRENCIA
     WHERE id_remessa = ?
     ORDER BY data_ocorrencia DESC`,
    row.id_remessa
  );

  const history = eventos.length
    ? eventos.map((e, i) => ({
        id_evento: e.id_evento,
        status: e.descricao,
        location: e.localizacao || row.origem || 'Brasil',
        date: formatarDataEventoBr(e.data_hora),
        data_hora: e.data_hora,
        current: i === 0,
      }))
    : [
        {
          status: row.status_entrega || row.status,
          location: row.origem || 'Centro Logístico',
          date: formatarDataEventoBr(row.data_envio || row.data_compra),
          data_hora: row.data_envio || row.data_compra,
          current: true,
        },
      ];

  res.json({
    ...mapPedidoRow(row),
    eventos,
    ocorrencias,
    history,
  });
}

// POST /api/remessas/:id/eventos
function criarEventoRemessaHandler(req, res) {
  const idRemessa = req.params.id;
  const remessa = db.get(
    `SELECT r.*, p.id_cliente
     FROM REMESSA r
     INNER JOIN PEDIDO p ON p.id_pedido = r.id_pedido
     WHERE r.id_remessa = ?`,
    idRemessa
  );
  if (!remessa) return res.status(404).json({ error: 'Remessa não encontrada.' });
  if (!req.user.isAdmin && remessa.id_cliente !== req.user.cliente_id_cliente) {
    return res.status(403).json({ error: 'Acesso negado a esta remessa.' });
  }

  const { descricao, localizacao, data_hora, status_entrega } = req.body || {};
  if (typeof descricao !== 'string' || !descricao.trim()) {
    return res.status(400).json({ error: 'Descrição da movimentação é obrigatória.' });
  }
  if (db.temHtmlInseguro([descricao, localizacao, data_hora, status_entrega])) {
    return res.status(400).json({ error: 'Caracteres HTML (< ou >) não são permitidos.' });
  }

  const idEvento = db.gerarId('EVT');
  const dataIso = parseDataCompra(data_hora);
  const novoStatus =
    typeof status_entrega === 'string' && status_entrega.trim() ? status_entrega.trim() : null;

  if (novoStatus && !STATUS_VALIDOS.includes(novoStatus)) {
    return res.status(400).json({ error: 'Status de entrega inválido.' });
  }

  db.transaction(() => {
    db.run(
      `INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao)
       VALUES (?, ?, ?, ?, ?)`,
      idEvento,
      idRemessa,
      dataIso,
      descricao.trim().slice(0, 255),
      typeof localizacao === 'string' && localizacao.trim() ? localizacao.trim().slice(0, 120) : 'Em trânsito'
    );

    if (novoStatus) {
      db.run('UPDATE REMESSA SET status_entrega = ? WHERE id_remessa = ?', novoStatus, idRemessa);
      db.run('UPDATE PEDIDO SET status = ? WHERE id_pedido = ?', novoStatus, remessa.id_pedido);
    }

    db.registrarAuditoria({
      idUsuario: req.user.id_usuario,
      entidade: 'REMESSA',
      idRegistro: idRemessa,
      acao: 'EVENTO_RASTREIO',
    });
  });

  const evento = db.get('SELECT * FROM EVENTO_RASTREIO WHERE id_evento = ?', idEvento);
  res.status(201).json(evento);
}

module.exports = {
  router,
  trackingHandler,
  criarEventoRemessaHandler,
  SELECT_PEDIDO,
  mapPedidoRow,
};
