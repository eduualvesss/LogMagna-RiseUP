-- ============================================================================
-- Banco de Dados: Magna (LogMagna)
-- Alvo: Microsoft SQL Server (T-SQL)
-- Baseado no DDL original com correcoes tecnicas e campos complementares
-- preservando todas as 15 tabelas e nomes de colunas originais + UNIDADE.
-- ============================================================================

IF DB_ID('Magna') IS NULL
BEGIN
  CREATE DATABASE Magna;
END;
GO

USE Magna;
GO

-- 1. USUARIO
-- Correcao: senha_hash ampliado para VARCHAR(255), nome_completo/email_corporativo ampliados
-- e email_corporativo definido como UNIQUE para autenticacao segura.
CREATE TABLE USUARIO (
  id_usuario VARCHAR(50) NOT NULL,
  nome_completo VARCHAR(120) NOT NULL,
  email_corporativo VARCHAR(120) NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  perfil VARCHAR(50) NOT NULL DEFAULT 'cliente',
  data_cadastro DATETIME NOT NULL DEFAULT GETDATE(),
  ativo BIT NOT NULL DEFAULT 1,
  cliente_id_cliente VARCHAR(50) NULL,
  CONSTRAINT pk_usuario PRIMARY KEY (id_usuario),
  CONSTRAINT uq_usuario_email UNIQUE (email_corporativo)
);
GO

-- 2. CLIENTE
CREATE TABLE CLIENTE (
  id_cliente VARCHAR(50) NOT NULL,
  id_usuario VARCHAR(50) NOT NULL,
  data_nascimento DATE NULL,
  nome_completo VARCHAR(120) NOT NULL,
  tipo_vinculo VARCHAR(50) NULL,
  frequencia_compra VARCHAR(50) NULL,
  faixa_gasto_medio VARCHAR(50) NULL,
  CONSTRAINT pk_cliente PRIMARY KEY (id_cliente),
  CONSTRAINT fk_cliente_usuario FOREIGN KEY (id_usuario) REFERENCES USUARIO (id_usuario),
  CONSTRAINT uq_cliente_usuario UNIQUE (id_usuario)
);
GO

-- 3. CATEGORIA_PRODUTO
CREATE TABLE CATEGORIA_PRODUTO (
  id_categoria VARCHAR(50) NOT NULL,
  descricao VARCHAR(255) NOT NULL,
  CONSTRAINT pk_categoria_produto PRIMARY KEY (id_categoria)
);
GO

-- 4. PEDIDO
-- Complemento: id_categoria (FK -> CATEGORIA_PRODUTO), nome_produto e loja.
CREATE TABLE PEDIDO (
  id_pedido VARCHAR(50) NOT NULL,
  id_cliente VARCHAR(50) NOT NULL,
  data_compra DATETIME NOT NULL DEFAULT GETDATE(),
  valor_declarado DECIMAL(12,2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Aguardando',
  retido_analise BIT NOT NULL DEFAULT 0,
  motivo_retencao VARCHAR(255) NULL,
  id_categoria VARCHAR(50) NULL,
  nome_produto VARCHAR(120) NULL,
  loja VARCHAR(120) NULL,
  CONSTRAINT pk_pedido PRIMARY KEY (id_pedido),
  CONSTRAINT fk_pedido_cliente FOREIGN KEY (id_cliente) REFERENCES CLIENTE (id_cliente),
  CONSTRAINT fk_pedido_categoria FOREIGN KEY (id_categoria) REFERENCES CATEGORIA_PRODUTO (id_categoria)
);
GO

-- 5. SEGURADORA
CREATE TABLE SEGURADORA (
  id_seguradora VARCHAR(50) NOT NULL,
  razao_social VARCHAR(120) NOT NULL,
  contato VARCHAR(120) NULL,
  CONSTRAINT pk_seguradora PRIMARY KEY (id_seguradora)
);
GO

-- 6. APOLICE
-- Complemento: valor_premio para armazenar o custo da protecao simulada/contratada.
CREATE TABLE APOLICE (
  id_apolice VARCHAR(50) NOT NULL,
  id_seguradora VARCHAR(50) NOT NULL,
  valor_segurado DECIMAL(12,2) NOT NULL,
  vigencia_inicio DATE NOT NULL,
  vigencia_fim DATE NOT NULL,
  coberturas VARCHAR(255) NOT NULL,
  valor_premio DECIMAL(12,2) NULL,
  CONSTRAINT pk_apolice PRIMARY KEY (id_apolice),
  CONSTRAINT fk_apolice_seguradora FOREIGN KEY (id_seguradora) REFERENCES SEGURADORA (id_seguradora)
);
GO

-- 7. REMESSA
-- Complemento: transportadora, origem, destino e cep_destino.
CREATE TABLE REMESSA (
  id_remessa VARCHAR(50) NOT NULL,
  codigo_rastreio VARCHAR(50) NOT NULL,
  data_envio DATETIME NULL,
  previsao_entrega DATETIME NULL,
  status_entrega VARCHAR(50) NOT NULL DEFAULT 'Aguardando',
  id_pedido VARCHAR(50) NOT NULL,
  id_apolice VARCHAR(50) NULL,
  transportadora VARCHAR(120) NULL,
  origem VARCHAR(120) NULL,
  destino VARCHAR(120) NULL,
  cep_destino VARCHAR(20) NULL,
  CONSTRAINT pk_remessa PRIMARY KEY (id_remessa),
  CONSTRAINT fk_remessa_pedido FOREIGN KEY (id_pedido) REFERENCES PEDIDO (id_pedido),
  CONSTRAINT fk_remessa_apolice FOREIGN KEY (id_apolice) REFERENCES APOLICE (id_apolice)
);
GO

-- 8. EVENTO_RASTREIO
CREATE TABLE EVENTO_RASTREIO (
  id_evento VARCHAR(50) NOT NULL,
  id_remessa VARCHAR(50) NOT NULL,
  data_hora DATETIME NOT NULL DEFAULT GETDATE(),
  descricao VARCHAR(255) NOT NULL,
  localizacao VARCHAR(120) NULL,
  CONSTRAINT pk_evento_rastreio PRIMARY KEY (id_evento),
  CONSTRAINT fk_evento_remessa FOREIGN KEY (id_remessa) REFERENCES REMESSA (id_remessa)
);
GO

-- 9. OCORRENCIA
CREATE TABLE OCORRENCIA (
  id_ocorrencia VARCHAR(50) NOT NULL,
  id_remessa VARCHAR(50) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  data_ocorrencia DATETIME NOT NULL DEFAULT GETDATE(),
  descricao VARCHAR(255) NOT NULL,
  CONSTRAINT pk_ocorrencia PRIMARY KEY (id_ocorrencia),
  CONSTRAINT fk_ocorrencia_remessa FOREIGN KEY (id_remessa) REFERENCES REMESSA (id_remessa)
);
GO

-- 10. NOTIFICACAO
CREATE TABLE NOTIFICACAO (
  id_notificacao VARCHAR(50) NOT NULL,
  cliente_id_cliente VARCHAR(50) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  canal VARCHAR(50) NOT NULL,
  data_envio DATETIME NOT NULL DEFAULT GETDATE(),
  lida BIT NOT NULL DEFAULT 0,
  id_ocorrencia VARCHAR(50) NULL,
  CONSTRAINT pk_notificacao PRIMARY KEY (id_notificacao),
  CONSTRAINT fk_notificacao_cliente FOREIGN KEY (cliente_id_cliente) REFERENCES CLIENTE (id_cliente),
  CONSTRAINT fk_notificacao_ocorrencia FOREIGN KEY (id_ocorrencia) REFERENCES OCORRENCIA (id_ocorrencia)
);
GO

-- 11. ATENDIMENTO
CREATE TABLE ATENDIMENTO (
  id_atendimento VARCHAR(50) NOT NULL,
  cliente_id_cliente VARCHAR(50) NOT NULL,
  canal VARCHAR(50) NOT NULL,
  data_hora DATETIME NOT NULL DEFAULT GETDATE(),
  assunto VARCHAR(120) NOT NULL,
  resolvido BIT NOT NULL DEFAULT 0,
  exigiu_repetir_informacao VARCHAR(50) NULL,
  atendido_por VARCHAR(120) NULL,
  id_pedido VARCHAR(50) NULL,
  CONSTRAINT pk_atendimento PRIMARY KEY (id_atendimento),
  CONSTRAINT fk_atendimento_cliente FOREIGN KEY (cliente_id_cliente) REFERENCES CLIENTE (id_cliente),
  CONSTRAINT fk_atendimento_pedido FOREIGN KEY (id_pedido) REFERENCES PEDIDO (id_pedido)
);
GO

-- 12. FEEDBACK
CREATE TABLE FEEDBACK (
  id_feedback VARCHAR(50) NOT NULL,
  data DATETIME NOT NULL DEFAULT GETDATE(),
  cliente_id_cliente VARCHAR(50) NOT NULL,
  relato_problema VARCHAR(255) NULL,
  solucao_esperada VARCHAR(255) NULL,
  nivel_compreensao_seguro VARCHAR(50) NULL,
  momento_conhecimento_seguro VARCHAR(120) NULL,
  aceita_assistente_virtual VARCHAR(50) NULL,
  CONSTRAINT pk_feedback PRIMARY KEY (id_feedback),
  CONSTRAINT fk_feedback_cliente FOREIGN KEY (cliente_id_cliente) REFERENCES CLIENTE (id_cliente)
);
GO

-- 13. AUDITORIA
-- Correcao: removido UNIQUE (id_usuario) indevido do DDL original para permitir multiplos logs por usuario.
CREATE TABLE AUDITORIA (
  id_log VARCHAR(50) NOT NULL,
  id_usuario VARCHAR(50) NOT NULL,
  entidade VARCHAR(50) NOT NULL,
  id_registro VARCHAR(50) NOT NULL,
  acao VARCHAR(50) NOT NULL,
  data_hora DATETIME NOT NULL DEFAULT GETDATE(),
  CONSTRAINT pk_auditoria PRIMARY KEY (id_log),
  CONSTRAINT fk_auditoria_usuario FOREIGN KEY (id_usuario) REFERENCES USUARIO (id_usuario)
);
GO

-- 14. SINISTRO
CREATE TABLE SINISTRO (
  id_sinistro VARCHAR(50) NOT NULL,
  data_abertura DATETIME NOT NULL DEFAULT GETDATE(),
  status VARCHAR(50) NOT NULL DEFAULT 'Em análise',
  valor_indenizado DECIMAL(12,2) NULL,
  data_encerramento DATETIME NULL,
  etapa_mais_dificil VARCHAR(120) NULL,
  motivo_nao_acionamento VARCHAR(255) NULL,
  ocorrencia_id_ocorrencia VARCHAR(50) NOT NULL,
  id_apolice VARCHAR(50) NOT NULL,
  CONSTRAINT pk_sinistro PRIMARY KEY (id_sinistro),
  CONSTRAINT fk_sinistro_ocorrencia FOREIGN KEY (ocorrencia_id_ocorrencia) REFERENCES OCORRENCIA (id_ocorrencia),
  CONSTRAINT fk_sinistro_apolice FOREIGN KEY (id_apolice) REFERENCES APOLICE (id_apolice)
);
GO

-- 15. DOCUMENTO
-- Nota: data_envio mantido como VARCHAR(50) conforme DDL original (compativel com formato ISO).
CREATE TABLE DOCUMENTO (
  id_documento VARCHAR(50) NOT NULL,
  id_sinistro VARCHAR(50) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  arquivo VARCHAR(255) NOT NULL,
  data_envio VARCHAR(50) NOT NULL,
  validado BIT NOT NULL DEFAULT 0,
  CONSTRAINT pk_documento PRIMARY KEY (id_documento),
  CONSTRAINT fk_documento_sinistro FOREIGN KEY (id_sinistro) REFERENCES SINISTRO (id_sinistro)
);
GO

-- 16. UNIDADE (Tabela de unidades logisticas existente no sistema)
CREATE TABLE UNIDADE (
  id_unidade INT IDENTITY(1,1) NOT NULL,
  nome VARCHAR(120) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  cidade VARCHAR(80) NOT NULL,
  estado CHAR(2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ativa',
  version INT NOT NULL DEFAULT 1,
  CONSTRAINT pk_unidade PRIMARY KEY (id_unidade)
);
GO

-- Indices para chaves estrangeiras e consultas frequentes
CREATE INDEX ix_pedido_cliente ON PEDIDO (id_cliente);
CREATE INDEX ix_pedido_categoria ON PEDIDO (id_categoria);
CREATE INDEX ix_apolice_seguradora ON APOLICE (id_seguradora);
CREATE INDEX ix_remessa_codigo_rastreio ON REMESSA (codigo_rastreio);
CREATE INDEX ix_remessa_pedido ON REMESSA (id_pedido);
CREATE INDEX ix_remessa_apolice ON REMESSA (id_apolice);
CREATE INDEX ix_evento_remessa ON EVENTO_RASTREIO (id_remessa, data_hora);
CREATE INDEX ix_ocorrencia_remessa ON OCORRENCIA (id_remessa);
CREATE INDEX ix_notificacao_cliente ON NOTIFICACAO (cliente_id_cliente, lida);
CREATE INDEX ix_atendimento_cliente ON ATENDIMENTO (cliente_id_cliente);
CREATE INDEX ix_feedback_cliente ON FEEDBACK (cliente_id_cliente);
CREATE INDEX ix_auditoria_usuario ON AUDITORIA (id_usuario, data_hora);
CREATE INDEX ix_sinistro_ocorrencia ON SINISTRO (ocorrencia_id_ocorrencia);
CREATE INDEX ix_sinistro_apolice ON SINISTRO (id_apolice);
CREATE INDEX ix_documento_sinistro ON DOCUMENTO (id_sinistro);
GO
