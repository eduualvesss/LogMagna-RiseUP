const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const IS_PROD = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3001;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'magna.db');

const CLIENT_ORIGINS = (process.env.CLIENT_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function carregarAuthSecret() {
  if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.trim()) {
    return process.env.AUTH_SECRET.trim();
  }
  if (IS_PROD) {
    console.error('AUTH_SECRET nao definido. Defina uma chave forte para iniciar em producao.');
    process.exit(1);
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
  PORT,
  DB_PATH,
  CLIENT_ORIGINS,
  AUTH_SECRET,
};
