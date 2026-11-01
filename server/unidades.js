const express = require("express");
const router = express.Router();

// Dados em memória (temporário).
// Quando a equipe definir o banco de dados, troque este array por consultas ao banco.
let unidades = [
  { id: 1, nome: "Matriz Recife", tipo: "Matriz", cidade: "Recife", estado: "PE", status: "ativa" },
  { id: 2, nome: "CD Suape", tipo: "Centro de distribuição", cidade: "Ipojuca", estado: "PE", status: "ativa" },
  { id: 3, nome: "Filial Salvador", tipo: "Filial", cidade: "Salvador", estado: "BA", status: "ativa" },
  { id: 4, nome: "Filial Fortaleza", tipo: "Filial", cidade: "Fortaleza", estado: "CE", status: "inativa" },
];
let proximoId = 5;

const TIPOS = ["Matriz", "Filial", "Centro de distribuição"];
const STATUS = ["ativa", "inativa"];

function validar(corpo) {
  const { nome, tipo, cidade, estado, status } = corpo;
  if (!nome || !nome.trim()) return "O nome é obrigatório.";
  if (!TIPOS.includes(tipo)) return "Tipo inválido.";
  if (!cidade || !cidade.trim()) return "A cidade é obrigatória.";
  if (!estado || estado.trim().length !== 2) return "Informe o estado com 2 letras (ex.: PE).";
  if (!STATUS.includes(status)) return "Status inválido.";
  return null;
}

// GET /api/unidades?busca=recife&status=ativa
router.get("/", (req, res) => {
  const { busca = "", status = "" } = req.query;
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

  const { nome, tipo, cidade, estado, status } = req.body;
  unidades[indice] = {
    ...unidades[indice],
    nome: nome.trim(),
    tipo,
    cidade: cidade.trim(),
    estado: estado.trim().toUpperCase(),
    status,
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
