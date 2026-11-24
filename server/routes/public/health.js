const express = require('express');
const db = require('../../db');

const router = express.Router();

router.get('/health', (req, res) => {
  const tabelas = db.all(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );
  res.json({
    ok: true,
    status: 'operational',
    tables: tabelas.length,
  });
});

module.exports = router;
