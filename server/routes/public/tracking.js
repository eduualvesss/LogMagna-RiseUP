const express = require('express');
const db = require('../../db');
const { criarRateLimit } = require('../../middleware/rateLimit');

const router = express.Router();

const limiteTracking = criarRateLimit({
  janelaMs: 60 * 1000,
  maxTentativas: 60,
  mensagem: 'Muitas consultas de rastreio. Aguarde um momento',
});

// GET /api/tracking/:code — consulta publica segura (sem PII ou dados financeiros/apolice)
router.get('/:code', limiteTracking.middleware, (req, res) => {
  limiteTracking.registrarTentativa(req);
  const code = String(req.params.code || '').trim().toUpperCase();
  if (!code || code.length > 50) {
    return res.status(400).json({ error: 'Informe um código de rastreio válido.' });
  }

  const row = db.get(
    `SELECT
       r.id_remessa,
       r.codigo_rastreio,
       r.data_envio,
       r.previsao_entrega,
       r.status_entrega,
       r.transportadora,
       r.origem,
       r.destino,
       p.status,
       p.retido_analise,
       p.data_compra
     FROM REMESSA r
     INNER JOIN PEDIDO p ON p.id_pedido = r.id_pedido
     WHERE UPPER(r.codigo_rastreio) = ?`,
    code
  );

  if (!row) return res.status(404).json({ error: 'Código de rastreio não encontrado.' });

  const eventosDb = db.all(
    `SELECT id_evento, id_remessa, data_hora, descricao, localizacao
     FROM EVENTO_RASTREIO
     WHERE id_remessa = ?
     ORDER BY data_hora DESC, id_evento DESC`,
    row.id_remessa
  );

  const eventos = eventosDb.length
    ? eventosDb
    : [
        {
          id_evento: 'EVT-INICIAL',
          id_remessa: row.id_remessa,
          data_hora: row.data_envio || row.data_compra,
          descricao: row.status_entrega || row.status,
          localizacao: row.origem || 'Centro Logístico',
        },
      ];

  const ocorrencias = db.all(
    `SELECT id_ocorrencia, tipo, data_ocorrencia, descricao
     FROM OCORRENCIA
     WHERE id_remessa = ?
     ORDER BY data_ocorrencia DESC`,
    row.id_remessa
  );

  res.json({
    codigo_rastreio: row.codigo_rastreio,
    status_entrega: row.status_entrega || row.status,
    retido_analise: Boolean(row.retido_analise),
    data_envio: row.data_envio,
    previsao_entrega: row.previsao_entrega,
    transportadora: row.transportadora || 'LogMagna Express',
    origem: row.origem || 'Centro Logístico',
    destino: row.destino || 'Destino não informado',
    eventos,
    ocorrencias,
  });
});

module.exports = router;
