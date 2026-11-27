const fs = require('fs');
const path = require('path');

const EMBEDDED_SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

-- 1. USUARIO
CREATE TABLE IF NOT EXISTS USUARIO (
  id_usuario TEXT PRIMARY KEY,
  nome_completo TEXT NOT NULL,
  email_corporativo TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  perfil TEXT NOT NULL DEFAULT 'cliente',
  data_cadastro TEXT NOT NULL,
  ativo INTEGER NOT NULL DEFAULT 1,
  cliente_id_cliente TEXT
);

-- 2. CLIENTE
CREATE TABLE IF NOT EXISTS CLIENTE (
  id_cliente TEXT PRIMARY KEY,
  id_usuario TEXT NOT NULL UNIQUE,
  data_nascimento TEXT,
  nome_completo TEXT NOT NULL,
  tipo_vinculo TEXT,
  frequencia_compra TEXT,
  faixa_gasto_medio TEXT,
  FOREIGN KEY (id_usuario) REFERENCES USUARIO (id_usuario)
);

-- 3. CATEGORIA_PRODUTO
CREATE TABLE IF NOT EXISTS CATEGORIA_PRODUTO (
  id_categoria TEXT PRIMARY KEY,
  descricao TEXT NOT NULL
);

-- 4. PEDIDO
CREATE TABLE IF NOT EXISTS PEDIDO (
  id_pedido TEXT PRIMARY KEY,
  id_cliente TEXT NOT NULL,
  data_compra TEXT NOT NULL,
  valor_declarado REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'Aguardando',
  retido_analise INTEGER NOT NULL DEFAULT 0,
  motivo_retencao TEXT,
  id_categoria TEXT,
  nome_produto TEXT,
  loja TEXT,
  FOREIGN KEY (id_cliente) REFERENCES CLIENTE (id_cliente),
  FOREIGN KEY (id_categoria) REFERENCES CATEGORIA_PRODUTO (id_categoria)
);

-- 5. SEGURADORA
CREATE TABLE IF NOT EXISTS SEGURADORA (
  id_seguradora TEXT PRIMARY KEY,
  razao_social TEXT NOT NULL,
  contato TEXT
);

-- 6. APOLICE
CREATE TABLE IF NOT EXISTS APOLICE (
  id_apolice TEXT PRIMARY KEY,
  id_seguradora TEXT NOT NULL,
  valor_segurado REAL NOT NULL,
  vigencia_inicio TEXT NOT NULL,
  vigencia_fim TEXT NOT NULL,
  coberturas TEXT NOT NULL,
  valor_premio REAL,
  FOREIGN KEY (id_seguradora) REFERENCES SEGURADORA (id_seguradora)
);

-- 7. REMESSA
CREATE TABLE IF NOT EXISTS REMESSA (
  id_remessa TEXT PRIMARY KEY,
  codigo_rastreio TEXT NOT NULL,
  data_envio TEXT,
  previsao_entrega TEXT,
  status_entrega TEXT NOT NULL DEFAULT 'Aguardando',
  id_pedido TEXT NOT NULL,
  id_apolice TEXT,
  transportadora TEXT,
  origem TEXT,
  destino TEXT,
  cep_destino TEXT,
  FOREIGN KEY (id_pedido) REFERENCES PEDIDO (id_pedido),
  FOREIGN KEY (id_apolice) REFERENCES APOLICE (id_apolice)
);

-- 8. EVENTO_RASTREIO
CREATE TABLE IF NOT EXISTS EVENTO_RASTREIO (
  id_evento TEXT PRIMARY KEY,
  id_remessa TEXT NOT NULL,
  data_hora TEXT NOT NULL,
  descricao TEXT NOT NULL,
  localizacao TEXT,
  FOREIGN KEY (id_remessa) REFERENCES REMESSA (id_remessa)
);

-- 9. OCORRENCIA
CREATE TABLE IF NOT EXISTS OCORRENCIA (
  id_ocorrencia TEXT PRIMARY KEY,
  id_remessa TEXT NOT NULL,
  tipo TEXT NOT NULL,
  data_ocorrencia TEXT NOT NULL,
  descricao TEXT NOT NULL,
  FOREIGN KEY (id_remessa) REFERENCES REMESSA (id_remessa)
);

-- 10. NOTIFICACAO
CREATE TABLE IF NOT EXISTS NOTIFICACAO (
  id_notificacao TEXT PRIMARY KEY,
  cliente_id_cliente TEXT NOT NULL,
  tipo TEXT NOT NULL,
  canal TEXT NOT NULL,
  data_envio TEXT NOT NULL,
  lida INTEGER NOT NULL DEFAULT 0,
  id_ocorrencia TEXT,
  FOREIGN KEY (cliente_id_cliente) REFERENCES CLIENTE (id_cliente),
  FOREIGN KEY (id_ocorrencia) REFERENCES OCORRENCIA (id_ocorrencia)
);

-- 11. ATENDIMENTO
CREATE TABLE IF NOT EXISTS ATENDIMENTO (
  id_atendimento TEXT PRIMARY KEY,
  cliente_id_cliente TEXT NOT NULL,
  canal TEXT NOT NULL,
  data_hora TEXT NOT NULL,
  assunto TEXT NOT NULL,
  resolvido INTEGER NOT NULL DEFAULT 0,
  exigiu_repetir_informacao TEXT,
  atendido_por TEXT,
  id_pedido TEXT,
  FOREIGN KEY (cliente_id_cliente) REFERENCES CLIENTE (id_cliente),
  FOREIGN KEY (id_pedido) REFERENCES PEDIDO (id_pedido)
);

-- 12. FEEDBACK
CREATE TABLE IF NOT EXISTS FEEDBACK (
  id_feedback TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  cliente_id_cliente TEXT NOT NULL,
  relato_problema TEXT,
  solucao_esperada TEXT,
  nivel_compreensao_seguro TEXT,
  momento_conhecimento_seguro TEXT,
  aceita_assistente_virtual TEXT,
  FOREIGN KEY (cliente_id_cliente) REFERENCES CLIENTE (id_cliente)
);

-- 13. AUDITORIA
CREATE TABLE IF NOT EXISTS AUDITORIA (
  id_log TEXT PRIMARY KEY,
  id_usuario TEXT NOT NULL,
  entidade TEXT NOT NULL,
  id_registro TEXT NOT NULL,
  acao TEXT NOT NULL,
  data_hora TEXT NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES USUARIO (id_usuario)
);

-- 14. SINISTRO
CREATE TABLE IF NOT EXISTS SINISTRO (
  id_sinistro TEXT PRIMARY KEY,
  data_abertura TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Em análise',
  valor_indenizado REAL,
  data_encerramento TEXT,
  etapa_mais_dificil TEXT,
  motivo_nao_acionamento TEXT,
  ocorrencia_id_ocorrencia TEXT NOT NULL,
  id_apolice TEXT NOT NULL,
  FOREIGN KEY (ocorrencia_id_ocorrencia) REFERENCES OCORRENCIA (id_ocorrencia),
  FOREIGN KEY (id_apolice) REFERENCES APOLICE (id_apolice)
);

-- 15. DOCUMENTO
CREATE TABLE IF NOT EXISTS DOCUMENTO (
  id_documento TEXT PRIMARY KEY,
  id_sinistro TEXT NOT NULL,
  tipo TEXT NOT NULL,
  arquivo TEXT NOT NULL,
  data_envio TEXT NOT NULL,
  validado INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (id_sinistro) REFERENCES SINISTRO (id_sinistro)
);

-- 16. UNIDADE
CREATE TABLE IF NOT EXISTS UNIDADE (
  id_unidade INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativa',
  version INTEGER NOT NULL DEFAULT 1
);

-- Indices
CREATE INDEX IF NOT EXISTS ix_pedido_cliente ON PEDIDO (id_cliente);
CREATE INDEX IF NOT EXISTS ix_pedido_categoria ON PEDIDO (id_categoria);
CREATE INDEX IF NOT EXISTS ix_apolice_seguradora ON APOLICE (id_seguradora);
CREATE INDEX IF NOT EXISTS ix_remessa_codigo_rastreio ON REMESSA (codigo_rastreio);
CREATE INDEX IF NOT EXISTS ix_remessa_pedido ON REMESSA (id_pedido);
CREATE INDEX IF NOT EXISTS ix_remessa_apolice ON REMESSA (id_apolice);
CREATE INDEX IF NOT EXISTS ix_evento_remessa ON EVENTO_RASTREIO (id_remessa, data_hora);
CREATE INDEX IF NOT EXISTS ix_ocorrencia_remessa ON OCORRENCIA (id_remessa);
CREATE INDEX IF NOT EXISTS ix_notificacao_cliente ON NOTIFICACAO (cliente_id_cliente, lida);
CREATE INDEX IF NOT EXISTS ix_atendimento_cliente ON ATENDIMENTO (cliente_id_cliente);
CREATE INDEX IF NOT EXISTS ix_feedback_cliente ON FEEDBACK (cliente_id_cliente);
CREATE INDEX IF NOT EXISTS ix_auditoria_usuario ON AUDITORIA (id_usuario, data_hora);
CREATE INDEX IF NOT EXISTS ix_sinistro_ocorrencia ON SINISTRO (ocorrencia_id_ocorrencia);
CREATE INDEX IF NOT EXISTS ix_sinistro_apolice ON SINISTRO (id_apolice);
CREATE INDEX IF NOT EXISTS ix_documento_sinistro ON DOCUMENTO (id_sinistro);
`;

const diskSchemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sqlite.sql');
const SCHEMA_SQL = fs.existsSync(diskSchemaPath) ? fs.readFileSync(diskSchemaPath, 'utf8') : EMBEDDED_SCHEMA_SQL;

module.exports = { SCHEMA_SQL };
