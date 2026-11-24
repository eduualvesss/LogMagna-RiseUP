const express = require('express');
const db = require('../db');
const { SELECT_PEDIDO, mapPedidoRow } = require('./pedidos');

const router = express.Router();

// GET /api/dashboard
router.get('/', (req, res) => {
  const filtroCliente = req.user.isAdmin ? '' : 'WHERE p.id_cliente = ?';
  const params = req.user.isAdmin ? [] : [req.user.cliente_id_cliente || '__sem_cliente__'];

  const pedidos = db
    .all(`${SELECT_PEDIDO} ${filtroCliente} ORDER BY p.data_compra DESC`, ...params)
    .map(mapPedidoRow);

  const totalPedidos = pedidos.length;
  const valorDeclaradoTotal = +pedidos.reduce((acc, p) => acc + p.value, 0).toFixed(2);
  const valorPremioTotal = +pedidos.reduce((acc, p) => acc + p.cost, 0).toFixed(2);
  const emTransito = pedidos.filter((p) => p.status === 'Em trânsito');
  const aguardando = pedidos.filter((p) => p.status === 'Aguardando');
  const entregues = pedidos.filter((p) => p.status === 'Entregue');
  const retidosAnalise = pedidos.filter((p) => p.retido_analise);

  const proximaEntrega =
    emTransito.slice().sort((a, b) => String(a.previsao_entrega || '').localeCompare(String(b.previsao_entrega || '')))[0] ||
    aguardando[0] ||
    null;

  const ocorrenciasCond = req.user.isAdmin ? '' : 'WHERE p.id_cliente = ?';
  const ultimasOcorrencias = db.all(
    `SELECT o.id_ocorrencia, o.id_remessa, o.tipo, o.data_ocorrencia, o.descricao,
            r.codigo_rastreio, p.id_pedido, p.nome_produto
     FROM OCORRENCIA o
     INNER JOIN REMESSA r ON r.id_remessa = o.id_remessa
     INNER JOIN PEDIDO p ON p.id_pedido = r.id_pedido
     ${ocorrenciasCond}
     ORDER BY o.data_ocorrencia DESC
     LIMIT 5`,
    ...params
  );

  const totalOcorrenciasRow = db.get(
    `SELECT COUNT(*) AS n
     FROM OCORRENCIA o
     INNER JOIN REMESSA r ON r.id_remessa = o.id_remessa
     INNER JOIN PEDIDO p ON p.id_pedido = r.id_pedido
     ${ocorrenciasCond}`,
    ...params
  );

  const sinistrosAtivosRow = db.get(
    `SELECT COUNT(*) AS n
     FROM SINISTRO s
     INNER JOIN OCORRENCIA o ON o.id_ocorrencia = s.ocorrencia_id_ocorrencia
     INNER JOIN REMESSA r ON r.id_remessa = o.id_remessa
     INNER JOIN PEDIDO p ON p.id_pedido = r.id_pedido
     ${ocorrenciasCond ? `${ocorrenciasCond} AND` : 'WHERE'} s.status NOT IN ('Indenizado', 'Não acionado', 'Encerrado')`,
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
      totalPedidos,
      valorDeclaradoTotal,
      valorPremioTotal,
      emTransito: emTransito.length,
      aguardando: aguardando.length,
      entregues: entregues.length,
      retidosAnalise: retidosAnalise.length,
      ocorrenciasTotal: totalOcorrenciasRow?.n || 0,
      sinistrosAtivos: sinistrosAtivosRow?.n || 0,
      notificacoesNaoLidas: notifNaoLidasRow?.n || 0,
    },
    proximaEntrega,
    ultimasOcorrencias,
    ultimasNotificacoes: ultimasNotificacoes.map((n) => ({ ...n, lida: Boolean(n.lida) })),
  });
});

module.exports = router;
