const express = require("express");
const router = express.Router();
const seed = require('./seeds');

// Dados em memória vindos da seed (server/seeds). Troque por banco quando a equipe definir.
let unidades = seed.unidades.map((u) => ({ ...u, version: u.version ?? 1 }));
let proximoId = Math.max(...unidades.map((u) => u.id)) + 1;

const TIPOS = ["Matriz", "Filial", "Centro de distribuição"];
const STATUS = ["ativa", "inativa"];
const TAG_HTML = /[<>]/;

function validar(corpo) {
  const { nome, tipo, cidade, estado, status } = corpo || {};
  const textos = [nome, cidade, estado];
  if (textos.some((v) => typeof v !== "string")) return "Nome, cidade e estado devem ser texto.";
  if (textos.some((v) => TAG_HTML.test(v))) return "Caracteres HTML (< ou >) não são permitidos.";
  const nomeLimpo = nome.trim();
  const cidadeLimpa = cidade.trim();
  const ufLimpa = estado.trim();
  if (!nomeLimpo) return "O nome é obrigatório.";
  if (nomeLimpo.length > 120) return "O nome deve ter no máximo 120 caracteres.";
  if (!TIPOS.includes(tipo)) return "Tipo inválido.";
  if (!cidadeLimpa) return "A cidade é obrigatória.";
  if (cidadeLimpa.length > 80) return "A cidade deve ter no máximo 80 caracteres.";
  if (!/^[A-Za-z]{2}$/.test(ufLimpa)) return "Informe o estado com 2 letras válidas (ex.: PE).";
  if (!STATUS.includes(status)) return "Status inválido.";
  return null;
}

// GET /api/unidades?busca=recife&status=ativa
router.get("/", (req, res) => {
  const busca = typeof req.query.busca === "string" ? req.query.busca : "";
  const status = typeof req.query.status === "string" ? req.query.status : "";
  const termo = busca.toLowerCase();

  const resultado = unidades.filter((u) => {
    const bateBusca =
      !termo ||
      u.nome.toLowerCase().includes(termo) ||
      u.cidade.toLowerCase().includes(termo);
    const bateStatus = !status || u.status === status;
    return bateBusca && bateStatus;
  });

  res.json(resultado);
});

// GET /api/unidades/:id
router.get("/:id", (req, res) => {
  const unidade = unidades.find((u) => u.id === Number(req.params.id));
  if (!unidade) return res.status(404).json({ erro: "Unidade não encontrada." });
  res.json(unidade);
});

// POST /api/unidades
router.post("/", (req, res) => {
  const erro = validar(req.body);
  if (erro) return res.status(400).json({ erro });

  const { nome, tipo, cidade, estado, status } = req.body;
  const nova = {
    id: proximoId++,
    nome: nome.trim(),
    tipo,
    cidade: cidade.trim(),
    estado: estado.trim().toUpperCase(),
    status,
    version: 1,
  };
  unidades.push(nova);
  res.status(201).json(nova);
});

// PUT /api/unidades/:id
router.put("/:id", (req, res) => {
  const indice = unidades.findIndex((u) => u.id === Number(req.params.id));
  if (indice === -1) return res.status(404).json({ erro: "Unidade não encontrada." });

  const erro = validar(req.body);
  if (erro) return res.status(400).json({ erro });

  const atual = unidades[indice];
  if (req.body.version !== undefined && Number(req.body.version) !== atual.version) {
    return res.status(409).json({
      erro: "Conflito de edição: esta unidade foi alterada por outro operador. Recarregue os dados.",
    });
  }

  const { nome, tipo, cidade, estado, status } = req.body;
  unidades[indice] = {
    ...atual,
    nome: nome.trim(),
    tipo,
    cidade: cidade.trim(),
    estado: estado.trim().toUpperCase(),
    status,
    version: (atual.version || 1) + 1,
  };
  res.json(unidades[indice]);
});

// DELETE /api/unidades/:id
router.delete("/:id", (req, res) => {
  const existe = unidades.some((u) => u.id === Number(req.params.id));
  if (!existe) return res.status(404).json({ erro: "Unidade não encontrada." });

  unidades = unidades.filter((u) => u.id !== Number(req.params.id));
  res.status(204).end();
});

module.exports = router;
