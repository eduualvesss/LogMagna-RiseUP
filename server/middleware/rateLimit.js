function criarRateLimit({
  janelaMs = 60 * 1000,
  maxTentativas = 20,
  mensagem = 'Muitas requisições. Aguarde alguns segundos e tente novamente.',
} = {}) {
  const registros = new Map();

  const timer = setInterval(() => {
    const agora = Date.now();
    for (const [chave, reg] of registros.entries()) {
      if (agora - reg.inicio >= janelaMs) registros.delete(chave);
    }
  }, janelaMs);
  if (typeof timer.unref === 'function') timer.unref();

  return {
    middleware(req, res, next) {
      const agora = Date.now();
      const chave = req.ip || 'unknown';
      const reg = registros.get(chave);
      if (reg && agora - reg.inicio < janelaMs && reg.n >= maxTentativas) {
        const retry = Math.ceil((janelaMs - (agora - reg.inicio)) / 1000);
        res.set('Retry-After', String(retry));
        return res.status(429).json({ error: `${mensagem} (${retry}s)` });
      }
      next();
    },
    registrarTentativa(req) {
      const agora = Date.now();
      const chave = req.ip || 'unknown';
      const reg = registros.get(chave);
      if (!reg || agora - reg.inicio >= janelaMs) {
        registros.set(chave, { inicio: agora, n: 1 });
      } else {
        reg.n += 1;
      }
    },
    limparTentativas(req) {
      registros.delete(req.ip || 'unknown');
    },
  };
}

module.exports = { criarRateLimit };
