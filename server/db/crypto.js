const crypto = require('crypto');

/**
 * Gera hash scrypt no formato `scrypt$<salt>$<hex>`.
 * Aceita salt fixo opcional para seeds deterministicas.
 */
function hashSenha(senha, saltFixo) {
  const salt = saltFixo || crypto.randomBytes(16).toString('hex');
  const derivado = crypto.scryptSync(String(senha), salt, 32).toString('hex');
  return `scrypt$${salt}$${derivado}`;
}

/**
 * Compara senha em texto plano contra hash armazenado usando tempo constante.
 */
function verificarSenha(tentativa, hashSalvo) {
  if (typeof tentativa !== 'string' || typeof hashSalvo !== 'string') return false;
  const partes = hashSalvo.split('$');
  if (partes.length !== 3 || partes[0] !== 'scrypt') return false;
  const [, salt, hexEsperado] = partes;
  try {
    const esperado = Buffer.from(hexEsperado, 'hex');
    const calculado = crypto.scryptSync(tentativa, salt, 32);
    if (esperado.length !== calculado.length) return false;
    return crypto.timingSafeEqual(calculado, esperado);
  } catch {
    return false;
  }
}

module.exports = { hashSenha, verificarSenha };
