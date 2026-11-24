const express = require('express');
const healthRoutes = require('./health');
const authPublicRoutes = require('./auth');
const trackingPublicRoutes = require('./tracking');

const router = express.Router();

router.use('/', healthRoutes);
router.use('/auth', authPublicRoutes);
router.use('/tracking', trackingPublicRoutes);

module.exports = router;
