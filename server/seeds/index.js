// Re-exporta os dados e constantes da seed principal usada pelo banco SQLite (server/db/seed.js).
const { RATE, gerarDadosSeed, seedIfEmpty } = require('../db/seed');

module.exports = { RATE, gerarDadosSeed, seedIfEmpty };
