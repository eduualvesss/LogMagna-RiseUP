const db = require('./index');
const { bootstrapCatalogo } = require('./bootstrap');

const TABELAS_TRANSACIONAIS = [
  'DOCUMENTO',
  'SINISTRO',
  'NOTIFICACAO',
  'OCORRENCIA',
  'EVENTO_RASTREIO',
  'REMESSA',
  'APOLICE',
  'ATENDIMENTO',
  'FEEDBACK',
  'PEDIDO',
  'AUDITORIA',
  'CLIENTE',
  'USUARIO',
  'UNIDADE',
  'CATEGORIA_PRODUTO',
  'SEGURADORA',
];

function resetarBanco({ manterCatalogo = true } = {}) {
  db.transaction(() => {
    for (const tabela of TABELAS_TRANSACIONAIS) {
      db.run(`DELETE FROM ${tabela}`);
    }
    db.run("DELETE FROM sqlite_sequence WHERE name = 'UNIDADE'");
  });

  if (manterCatalogo) {
    bootstrapCatalogo(db);
  }
}

if (require.main === module) {
  resetarBanco({ manterCatalogo: true });
  console.log(`Banco resetado com sucesso (${db.dbPath}). Usuarios: 0 | Catalogo pronto.`);
  db.sqlite.close();
}

module.exports = { resetarBanco };
