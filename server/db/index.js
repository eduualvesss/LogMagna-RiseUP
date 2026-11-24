const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');
const { DB_PATH } = require('../config/env');
const { bootstrapCatalogo, RATE } = require('./bootstrap');

const isMemory = DB_PATH === ':memory:';

if (!isMemory) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

const sqlite = new DatabaseSync(DB_PATH);
sqlite.exec('PRAGMA foreign_keys = ON;');
sqlite.exec('PRAGMA busy_timeout = 5000;');
sqlite.exec('PRAGMA temp_store = MEMORY;');
sqlite.exec('PRAGMA cache_size = -16000;');

if (!isMemory) {
  sqlite.exec('PRAGMA journal_mode = WAL;');
  sqlite.exec('PRAGMA synchronous = NORMAL;');
}

const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sqlite.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf8');
sqlite.exec(schemaSql);

const all = (sql, ...params) => sqlite.prepare(sql).all(...params).map((row) => ({ ...row }));
const get = (sql, ...params) => {
  const row = sqlite.prepare(sql).get(...params);
  return row ? { ...row } : null;
};
const run = (sql, ...params) => sqlite.prepare(sql).run(...params);

function transaction(fn) {
  sqlite.exec('BEGIN');
  try {
    const resultado = fn();
    sqlite.exec('COMMIT');
    return resultado;
  } catch (err) {
    try {
      sqlite.exec('ROLLBACK');
    } catch {
      // ignora erro de rollback se a transacao ja foi abortada
    }
    throw err;
  }
}

function gerarId(prefixo) {
  return `${prefixo}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

const agoraIso = () => new Date().toISOString();

function temHtmlInseguro(valores) {
  return valores.some((v) => typeof v === 'string' && /[<>]/.test(v));
}

function registrarAuditoria({ idUsuario, entidade, idRegistro, acao, dataHora }) {
  if (!idUsuario) return null;
  const idLog = gerarId('LOG');
  run(
    `INSERT INTO AUDITORIA (id_log, id_usuario, entidade, id_registro, acao, data_hora)
     VALUES (?, ?, ?, ?, ?, ?)`,
    idLog,
    String(idUsuario),
    String(entidade),
    String(idRegistro),
    String(acao),
    dataHora || agoraIso()
  );
  return idLog;
}

const api = {
  dbPath: DB_PATH,
  RATE,
  sqlite,
  all,
  get,
  run,
  transaction,
  gerarId,
  agoraIso,
  temHtmlInseguro,
  registrarAuditoria,
};

bootstrapCatalogo(api);

module.exports = api;
