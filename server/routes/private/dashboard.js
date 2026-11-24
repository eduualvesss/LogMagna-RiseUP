const express = require('express');
const db = require('../../db');
const { SELECT_PEDIDO, mapPedidoRow } = require('./pedidos');

const router = express.Router();

// GET /api/dashboard
router.get('/', (req, res) => {
  const wherePedido = req.user.isAdmin ? '' : 'WHERE p.id_cliente = ?';
  const params = req.user.isAdmin ? [] : [req.user.cliente_id_cliente || '__sem_cliente__'];

  const resumo = db.get(
    `SELECT
       COUNT(*) AS totalPedidos,
       COALESCE(SUM(p.valor_declarado), 0) AS valorDeclaradoTotal,
       COALESCE(SUM(COALESCE(a.valor_premio, ROUND(p.valor_declarado * ?, 2))), 0) AS valorPremioTotal,
       COALESCE(SUM(CASE WHEN p.status = 'Em trânsito' THEN 1 ELSE 0 END), 0) AS emTransito,
       COALESCE(SUM(CASE WHEN p.status = 'Aguardando' THEN 1 ELSE 0 END), 0) AS aguardando,
       COALESCE(SUM(CASE WHEN p.status = 'Entregue' THEN 1 ELSE 0 END), 0) AS entregues,
       COALESCE(SUM(CASE WHEN p.retido_analise = 1 THEN 1 ELSE 0 END), 0) AS retidosAnalise
     FROM PEDIDO p
     LEFT JOIN REMESSA r ON r.id_pedido = p.id_pedido
     LEFT JOIN APOLICE a ON a.id_apolice = r.id_apolice
     ${wherePedido}`,
    db.RATE,
    ...params
  );

  const proximaRow = db.get(
    `${SELECT_PEDIDO}
     ${wherePedido ? `${wherePedido} AND` : 'WHERE'} p.status IN ('Em trânsito', 'Aguardando')
     ORDER BY CASE WHEN p.status = 'Em trânsito' THEN 0 ELSE 1 END,
              COALESCE(r.previsao_entrega, p.data_compra) ASC
     LIMIT 1`,
    ...params
  );

  const ultimasOcorrencias = db.all(
    `SELECT o.id_ocorrencia, o.id_remessa, o.tipo, o.data_ocorrencia, o.descricao,
            r.codigo_rastreio, p.id_pedido, p.nome_produto
     FROM OCORRENCIA o
     INNER JOIN REMESSA r ON r.id_remessa = o.id_remessa
     INNER JOIN PEDIDO p ON p.id_pedido = r.id_pedido
     ${wherePedido}
     ORDER BY o.data_ocorrencia DESC
     LIMIT 5`,
    ...params
  );

  const totalOcorrenciasRow = db.get(
    `SELECT COUNT(*) AS n
     FROM OCORRENCIA o
     INNER JOIN REMESSA r ON r.id_remessa = o.id_remessa
     INNER JOIN PEDIDO p ON p.id_pedido = r.id_pedido
     ${wherePedido}`,
    ...params
  );

  const sinistrosAtivosRow = db.get(
    `SELECT COUNT(*) AS n
     FROM SINISTRO s
     INNER JOIN OCORRENCIA o ON o.id_ocorrencia = s.ocorrencia_id_ocorrencia
     INNER JOIN REMESSA r ON r.id_remessa = o.id_remessa
     INNER JOIN PEDIDO p ON p.id_pedido = r.id_pedido
     ${wherePedido ? `${wherePedido} AND` : 'WHERE'} s.status NOT IN ('Indenizado', 'Não acionado', 'Encerrado')`,
    ...params
  );

  const notifCond = req.user.isAdmin ? '' : 'WHERE n.cliente_id_cliente = ?';
  const ultimasNotificacoes = db.all(
    `SELECT n.id_notificacao, n.cliente_id_cliente, n.tipo, n.canal, n.data_envio, n.lida, n.id_ocorrencia
     FROM NOTIFICACAO n
     ${notifCond}
     ORDER BY n.data_envio DESC
     LIMIT 5`,
    ...params
  );

  const notifNaoLidasRow = db.get(
    `SELECT COUNT(*) AS n
     FROM NOTIFICACAO n
     ${notifCond ? `${notifCond} AND` : 'WHERE'} n.lida = 0`,
    ...params
  );

  res.json({
    totais: {
      totalPedidos: Number(resumo?.totalPedidos || 0),
      valorDeclaradoTotal: +Number(resumo?.valorDeclaradoTotal || 0).toFixed(2),
      valorPremioTotal: +Number(resumo?.valorPremioTotal || 0).toFixed(2),
      emTransito: Number(resumo?.emTransito || 0),
      aguardando: Number(resumo?.aguardando || 0),
      entregues: Number(resumo?.entregues || 0),
      retidosAnalise: Number(resumo?.retidosAnalise || 0),
      ocorrenciasTotal: Number(totalOcorrenciasRow?.n || 0),
      sinistrosAtivos: Number(sinistrosAtivosRow?.n || 0),
      notificacoesNaoLidas: Number(notifNaoLidasRow?.n || 0),
    },
    proximaEntrega: proximaRow ? mapPedidoRow(proximaRow) : null,
    ultimasOcorrencias,
    ultimasNotificacoes: ultimasNotificacoes.map((n) => ({ ...n, lida: Boolean(n.lida) })),
  });
});

module.exports = router;
