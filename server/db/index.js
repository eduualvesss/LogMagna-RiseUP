const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');
const { DB_PATH } = require('../config/env');
const { bootstrapCatalogo, RATE } = require('./bootstrap');
const { SCHEMA_SQL } = require('./schema');

const isMemory = DB_PATH === ':memory:';
const IS_BLOB_ENABLED = !isMemory && Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const BLOB_KEY = process.env.DB_BLOB_KEY || 'magna/magna.db';

function abrirBanco() {
  if (!isMemory) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  }
  const conn = new DatabaseSync(DB_PATH);
  conn.exec('PRAGMA foreign_keys = ON;');
  conn.exec('PRAGMA busy_timeout = 5000;');
  conn.exec('PRAGMA temp_store = MEMORY;');
  conn.exec('PRAGMA cache_size = -16000;');

  if (!isMemory) {
    if (IS_BLOB_ENABLED) {
      conn.exec('PRAGMA journal_mode = DELETE;');
      conn.exec('PRAGMA synchronous = FULL;');
    } else {
      conn.exec('PRAGMA journal_mode = WAL;');
      conn.exec('PRAGMA synchronous = NORMAL;');
    }
  }

  conn.exec(SCHEMA_SQL);

  const connHelpers = {
    get: (sql, ...params) => {
      const row = conn.prepare(sql).get(...params);
      return row ? { ...row } : null;
    },
    run: (sql, ...params) => conn.prepare(sql).run(...params),
    transaction: (fn) => {
      conn.exec('BEGIN');
      try {
        const res = fn();
        conn.exec('COMMIT');
        return res;
      } catch (err) {
        try {
          conn.exec('ROLLBACK');
        } catch {
          // ignora erro de rollback se a transacao ja foi abortada
        }
        throw err;
      }
    },
  };
  bootstrapCatalogo(connHelpers);
  return conn;
}

let sqlite = abrirBanco();
let dirty = false;
let inTx = false;
let dirtyBeforeTx = false;
let initialSynced = false;
let currentEtag = null;
let lastCheckAt = 0;
let syncQueue = Promise.resolve();

const all = (sql, ...params) => sqlite.prepare(sql).all(...params).map((row) => ({ ...row }));
const get = (sql, ...params) => {
  const row = sqlite.prepare(sql).get(...params);
  return row ? { ...row } : null;
};
const run = (sql, ...params) => {
  const result = sqlite.prepare(sql).run(...params);
  dirty = true;
  return result;
};

function transaction(fn) {
  const prevInTx = inTx;
  if (!prevInTx) {
    inTx = true;
    dirtyBeforeTx = dirty;
  }
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
    if (!prevInTx) {
      dirty = dirtyBeforeTx;
    }
    throw err;
  } finally {
    if (!prevInTx) {
      inTx = false;
    }
  }
}

function garantirBancoAberto() {
  if (!sqlite || !sqlite.isOpen) {
    sqlite = abrirBanco();
  }
}

async function syncBeforeRequest(isWrite = false) {
  if (!IS_BLOB_ENABLED) return;
  syncQueue = syncQueue.then(async () => {
    if (initialSynced && !isWrite && Date.now() - lastCheckAt < 1500) {
      return;
    }
    try {
      const { get: blobGet, put: blobPut } = await import('@vercel/blob');
      let remote = null;
      try {
        remote = await blobGet(BLOB_KEY, {
          access: 'private',
          ifNoneMatch: currentEtag || undefined,
          useCache: false,
        });
      } catch (err) {
        if (err && err.name === 'BlobNotFoundError') {
          remote = null;
        } else {
          throw err;
        }
      }

      if (remote && remote.statusCode === 304) {
        lastCheckAt = Date.now();
        initialSynced = true;
        return;
      }

      if (remote && remote.statusCode === 200 && remote.stream) {
        const arrayBuf = await new Response(remote.stream).arrayBuffer();
        const buf = Buffer.from(arrayBuf);
        if (sqlite && sqlite.isOpen) sqlite.close();
        fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
        fs.writeFileSync(DB_PATH, buf);
        sqlite = abrirBanco();
        dirty = false;
        currentEtag = remote.blob?.etag || null;
        initialSynced = true;
        lastCheckAt = Date.now();
        return;
      }

      if (!remote) {
        if (sqlite && sqlite.isOpen) sqlite.close();
        const buf = fs.readFileSync(DB_PATH);
        sqlite = abrirBanco();
        const up = await blobPut(BLOB_KEY, buf, {
          access: 'private',
          addRandomSuffix: false,
          allowOverwrite: true,
          contentType: 'application/x-sqlite3',
        });
        currentEtag = up.etag || null;
        dirty = false;
        initialSynced = true;
        lastCheckAt = Date.now();
      }
    } catch (err) {
      console.error('Aviso ao sincronizar SQLite com Vercel Blob:', err);
      garantirBancoAberto();
    }
  });
  return syncQueue;
}

async function flushAfterRequest() {
  if (!IS_BLOB_ENABLED || !dirty) return;
  syncQueue = syncQueue.then(async () => {
    if (!dirty) return;
    dirty = false;
    try {
      if (sqlite && sqlite.isOpen) sqlite.close();
      const buf = fs.readFileSync(DB_PATH);
      sqlite = abrirBanco();
      const { put: blobPut } = await import('@vercel/blob');
      const up = await blobPut(BLOB_KEY, buf, {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/x-sqlite3',
      });
      currentEtag = up.etag || null;
      lastCheckAt = Date.now();
    } catch (err) {
      dirty = true;
      console.error('Erro ao persistir SQLite no Vercel Blob:', err);
      garantirBancoAberto();
    }
  });
  return syncQueue;
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
  get sqlite() {
    return sqlite;
  },
  isDirty: () => dirty,
  syncBeforeRequest,
  flushAfterRequest,
  all,
  get,
  run,
  transaction,
  gerarId,
  agoraIso,
  temHtmlInseguro,
  registrarAuditoria,
};

module.exports = api;
