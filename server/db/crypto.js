const crypto = require('crypto');

/**
 * Valida politica minima de senha forte (>= 8 caracteres, ao menos 1 letra e 1 numero).
 */
function validarForcaSenha(senha) {
  if (typeof senha !== 'string') return 'Informe uma senha válida.';
  if (senha.length < 8) return 'A senha deve ter pelo menos 8 caracteres.';
  if (senha.length > 128) return 'A senha deve ter no máximo 128 caracteres.';
  if (!/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(senha) || !/\d/.test(senha)) {
    return 'A senha deve conter pelo menos uma letra e um número.';
  }
  return null;
}

/**
 * Gera hash scrypt no formato `scrypt$<salt>$<hex>`.
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

module.exports = { validarForcaSenha, hashSenha, verificarSenha };
