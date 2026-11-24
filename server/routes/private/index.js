const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const accountRoutes = require('./account');
const dashboardRoutes = require('./dashboard');
const { router: pedidosRoutes, criarEventoRemessaHandler } = require('./pedidos');
const unidadesRoutes = require('./unidades');
const { categoriasRouter, seguradorasRouter, apolicesRouter } = require('./seguros');
const { ocorrenciasRouter, sinistrosRouter, documentosRouter } = require('./sinistros');
const { notificacoesRouter, atendimentosRouter, feedbacksRouter } = require('./suporte');
const { auditoriaRouter, usuariosRouter } = require('./admin');

const router = express.Router();

// Todas as rotas privadas exigem token valido
router.use(requireAuth);

router.use('/auth', accountRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/pedidos', pedidosRoutes);
router.post('/remessas/:id/eventos', criarEventoRemessaHandler);
router.use('/unidades', unidadesRoutes);
router.use('/categorias', categoriasRouter);
router.use('/seguradoras', seguradorasRouter);
router.use('/apolices', apolicesRouter);
router.use('/ocorrencias', ocorrenciasRouter);
router.use('/sinistros', sinistrosRouter);
router.use('/documentos', documentosRouter);
router.use('/notificacoes', notificacoesRouter);
router.use('/atendimentos', atendimentosRouter);
router.use('/feedbacks', feedbacksRouter);
router.use('/auditoria', auditoriaRouter);
router.use('/usuarios', usuariosRouter);

module.exports = router;
