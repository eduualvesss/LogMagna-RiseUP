const RATE = 0.02;

const CATEGORIAS_PADRAO = [
  { id_categoria: 'CAT-001', descricao: 'Eletrônicos' },
  { id_categoria: 'CAT-002', descricao: 'Informática' },
  { id_categoria: 'CAT-003', descricao: 'Áudio e Vídeo' },
  { id_categoria: 'CAT-004', descricao: 'Fotografia' },
  { id_categoria: 'CAT-005', descricao: 'Games e Consoles' },
  { id_categoria: 'CAT-006', descricao: 'Acessórios e Periféricos' },
];

const SEGURADORAS_PADRAO = [
  {
    id_seguradora: 'SEG-001',
    razao_social: 'Magna Proteção Seguros S.A.',
    contato: 'sinistros@magnaseguros.com.br',
  },
  {
    id_seguradora: 'SEG-002',
    razao_social: 'Atlântico Carga Segura Ltda.',
    contato: 'atendimento@atlanticocarga.com.br',
  },
];

/**
 * Garante apenas o catalogo minimo (categorias e seguradoras) para o primeiro uso,
 * sem criar usuarios, pedidos ou dados ficticios.
 */
function bootstrapCatalogo({ get, run, transaction }) {
  const catRow = get('SELECT COUNT(*) AS n FROM CATEGORIA_PRODUTO');
  const segRow = get('SELECT COUNT(*) AS n FROM SEGURADORA');

  if ((catRow?.n || 0) > 0 && (segRow?.n || 0) > 0) return;

  transaction(() => {
    if ((catRow?.n || 0) === 0) {
      for (const c of CATEGORIAS_PADRAO) {
        run('INSERT INTO CATEGORIA_PRODUTO (id_categoria, descricao) VALUES (?, ?)', c.id_categoria, c.descricao);
      }
    }
    if ((segRow?.n || 0) === 0) {
      for (const s of SEGURADORAS_PADRAO) {
        run('INSERT INTO SEGURADORA (id_seguradora, razao_social, contato) VALUES (?, ?, ?)', s.id_seguradora, s.razao_social, s.contato);
      }
    }
  });
}

module.exports = { RATE, CATEGORIAS_PADRAO, SEGURADORAS_PADRAO, bootstrapCatalogo };
