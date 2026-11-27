const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const IS_PROD = process.env.NODE_ENV === 'production';
const IS_VERCEL = Boolean(process.env.VERCEL);
const PORT = Number(process.env.PORT) || 3001;
const DB_PATH =
  process.env.DB_PATH ||
  (IS_VERCEL ? path.join(os.tmpdir(), 'magna.db') : path.join(__dirname, '..', 'data', 'magna.db'));

const CLIENT_ORIGINS = (process.env.CLIENT_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function carregarAuthSecret() {
  if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.trim()) {
    return process.env.AUTH_SECRET.trim();
  }
  if (IS_PROD && !IS_VERCEL) {
    console.error('AUTH_SECRET nao definido. Defina uma chave forte para iniciar em producao.');
    process.exit(1);
  }
  if (IS_VERCEL) {
    console.warn('AUTH_SECRET nao definido no ambiente Vercel; usando chave temporaria.');
    return crypto.randomBytes(32).toString('hex');
  }
  if (DB_PATH === ':memory:') {
    return crypto.randomBytes(32).toString('hex');
  }
  const secretFile = path.join(path.dirname(DB_PATH), '.auth_secret');
  try {
    fs.mkdirSync(path.dirname(secretFile), { recursive: true });
    if (fs.existsSync(secretFile)) {
      const existente = fs.readFileSync(secretFile, 'utf8').trim();
      if (existente) return existente;
    }
    const gerado = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(secretFile, gerado, 'utf8');
    return gerado;
  } catch {
    return crypto.randomBytes(32).toString('hex');
  }
}

const AUTH_SECRET = carregarAuthSecret();

module.exports = {
  IS_PROD,
  IS_VERCEL,
  PORT,
  DB_PATH,
  CLIENT_ORIGINS,
  AUTH_SECRET,
};
