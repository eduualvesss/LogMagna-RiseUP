// Seeds deterministicas para mockar o sistema.
// Mesma SEED => mesmos dados em toda execucao (mude com SEED=123 npm run dev).
const SEED = Number(process.env.SEED) || 2026;

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(SEED);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const between = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
const pad = (n, l = 2) => String(n).padStart(l, '0');

const RATE = 0.02;
const STATUS = ['Em trânsito', 'Aguardando', 'Entregue'];
const CIDADES = [
  ['Campinas', 'SP'], ['Curitiba', 'PR'], ['Rio de Janeiro', 'RJ'], ['Belo Horizonte', 'MG'],
  ['Porto Alegre', 'RS'], ['Recife', 'PE'], ['Salvador', 'BA'], ['Goiânia', 'GO'],
];
const CATALOGO = [
  ['Notebook Dell Inspiron', 4200], ['Fone Sony WH-1000XM5', 2000], ['Câmera Canon EOS R50', 1800],
  ['Smartphone Samsung Galaxy S24', 3500], ['Monitor LG UltraWide 29"', 1400], ['Teclado Mecânico Keychron K2', 650],
  ['Mouse Logitech MX Master 3S', 550], ['Tablet iPad Air', 4800], ['Smartwatch Garmin Forerunner', 2300],
  ['Caixa de Som JBL Charge 5', 900], ['Console PlayStation 5', 3700], ['Impressora HP LaserJet', 1100],
];

// Os 3 primeiros produtos sao fixos (usados nas demos); o resto e gerado pela seed.
const FIXOS = [
  { id: 'LM-2026-001', name: 'Notebook Dell Inspiron', value: 4200, status: 'Em trânsito', tracking: 'BR123456789SP', origin: 'Campinas, SP', destination: 'São Paulo, SP' },
  { id: 'LM-2026-002', name: 'Fone Sony WH-1000XM5', value: 2000, status: 'Aguardando', tracking: 'BR987654321SP', origin: 'Curitiba, PR', destination: 'São Paulo, SP' },
  { id: 'LM-2026-003', name: 'Câmera Canon EOS R50', value: 1800, status: 'Entregue', tracking: 'BR555444333SP', origin: 'Rio de Janeiro, RJ', destination: 'São Paulo, SP' },
];

const gerados = CATALOGO.slice(3).map(([name, value], i) => {
  const [cidade, uf] = pick(CIDADES);
  return {
    id: `LM-2026-${pad(i + 4, 3)}`,
    name,
    value,
    status: pick(STATUS),
    tracking: `BR${between(100000000, 999999999)}SP`,
    origin: `${cidade}, ${uf}`,
    destination: 'São Paulo, SP',
  };
});

const products = [...FIXOS, ...gerados].map((p) => ({ ...p, cost: +(p.value * RATE).toFixed(2) }));

function historicoPara(p) {
  const [cidade] = p.origin.split(',');
  const etapas = [
    ['Pacote postado', `Agência • ${p.origin}`],
    ['Pacote em trânsito', `Unidade de tratamento • ${cidade}`],
    ['Pacote saiu para entrega', 'Centro de distribuição • São Paulo, SP'],
    ['Pacote entregue', 'Endereço do destinatário • São Paulo, SP'],
  ];
  const ate = p.status === 'Aguardando' ? 1 : p.status === 'Em trânsito' ? 3 : 4;
  const dia = between(1, 20);
  return etapas.slice(0, ate).map(([status, location], i) => ({
    status, location, date: `${pad(dia + i)}/10 • ${pad(between(7, 21))}:${pad(between(0, 59))}`,
  })).reverse().map((e, i) => ({ ...e, current: i === 0 }));
}

const history = Object.fromEntries(products.map((p) => [p.tracking, historicoPara(p)]));
// Mantem o historico original da demo principal.
history['BR123456789SP'] = [
  { status: 'Pacote saiu para entrega', location: 'Centro de distribuição • São Paulo, SP', date: '08/10 • 08:15', current: true },
  { status: 'Pacote em trânsito', location: 'Unidade de tratamento • Campinas, SP', date: '07/10 • 22:40' },
  { status: 'Pacote postado', location: 'Agência • Campinas, SP', date: '06/10 • 09:42' },
];

const unidades = [
  { id: 1, nome: 'Matriz Recife', tipo: 'Matriz', cidade: 'Recife', estado: 'PE', status: 'ativa' },
  { id: 2, nome: 'CD Suape', tipo: 'Centro de distribuição', cidade: 'Ipojuca', estado: 'PE', status: 'ativa' },
  { id: 3, nome: 'Filial Salvador', tipo: 'Filial', cidade: 'Salvador', estado: 'BA', status: 'ativa' },
  { id: 4, nome: 'Filial Fortaleza', tipo: 'Filial', cidade: 'Fortaleza', estado: 'CE', status: 'inativa' },
  ...CIDADES.slice(0, 6).map(([cidade, estado], i) => ({
    id: i + 5,
    nome: `${i % 2 ? 'CD' : 'Filial'} ${cidade}`,
    tipo: i % 2 ? 'Centro de distribuição' : 'Filial',
    cidade,
    estado,
    status: rand() > 0.25 ? 'ativa' : 'inativa',
  })),
];

// Usuarios de demonstracao (senha: logmagna123). Hash scrypt com salt fixo da seed.
const crypto = require('crypto');
const hash = (senha, salt) => crypto.scryptSync(senha, salt, 32).toString('hex');
const criarUsuario = (id, nome, email, papel, senha) => {
  const salt = `lm-seed-${id}`;
  const senhaHash = hash(senha, salt);
  return {
    id, nome, email, papel,
    checkPassword: (tentativa) => {
      const a = Buffer.from(hash(tentativa, salt), 'hex');
      return crypto.timingSafeEqual(a, Buffer.from(senhaHash, 'hex'));
    },
  };
};
const users = [
  criarUsuario(1, 'Administrador LogMagna', 'admin@logmagna.com', 'admin', 'logmagna123'),
  criarUsuario(2, 'Cliente Demonstração', 'cliente@logmagna.com', 'cliente', 'logmagna123'),
];

module.exports = { RATE, products, history, unidades, users };
