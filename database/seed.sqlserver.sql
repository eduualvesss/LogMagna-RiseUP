-- ============================================================================
-- Seed inicial do Banco Magna (Microsoft SQL Server / T-SQL)
-- Senha padrao dos usuarios de demonstracao: logmagna123
-- ============================================================================
USE Magna;
GO

SET NOCOUNT ON;
BEGIN TRANSACTION;

-- 1. USUARIO
INSERT INTO USUARIO (id_usuario, nome_completo, email_corporativo, senha_hash, perfil, data_cadastro, ativo, cliente_id_cliente) VALUES ('USR-001', 'Administrador LogMagna', 'admin@logmagna.com', 'scrypt$lm-seed-USR-001$75b8295475c6b77dd2346df79f1b8a8c5c62c4b7e1394513867b497f7a431bef', 'admin', '2026-09-01T09:00:00', 1, NULL);
INSERT INTO USUARIO (id_usuario, nome_completo, email_corporativo, senha_hash, perfil, data_cadastro, ativo, cliente_id_cliente) VALUES ('USR-002', 'Cliente Demonstração', 'cliente@logmagna.com', 'scrypt$lm-seed-USR-002$96d7d5ecab86eecd4730291aae6d170db6a35cc21acb5901937b183401037070', 'cliente', '2026-09-10T14:20:00', 1, NULL);
INSERT INTO USUARIO (id_usuario, nome_completo, email_corporativo, senha_hash, perfil, data_cadastro, ativo, cliente_id_cliente) VALUES ('USR-003', 'Marina Souza Lima', 'marina.souza@logmagna.com', 'scrypt$lm-seed-USR-003$8f8e5c967777ca7ddcb813e6944e915593d101461231841caae4f5ab21b3b737', 'cliente', '2026-09-18T11:05:00', 1, NULL);

-- 2. CLIENTE
INSERT INTO CLIENTE (id_cliente, id_usuario, data_nascimento, nome_completo, tipo_vinculo, frequencia_compra, faixa_gasto_medio) VALUES ('CLI-001', 'USR-001', '1988-04-12', 'Administrador LogMagna', 'Corporativo', 'Semanal', 'Acima de R$ 5.000');
UPDATE USUARIO SET cliente_id_cliente = 'CLI-001' WHERE id_usuario = 'USR-001';
INSERT INTO CLIENTE (id_cliente, id_usuario, data_nascimento, nome_completo, tipo_vinculo, frequencia_compra, faixa_gasto_medio) VALUES ('CLI-002', 'USR-002', '1994-08-23', 'Cliente Demonstração', 'Pessoa Física', 'Mensal', 'R$ 1.500 a R$ 5.000');
UPDATE USUARIO SET cliente_id_cliente = 'CLI-002' WHERE id_usuario = 'USR-002';
INSERT INTO CLIENTE (id_cliente, id_usuario, data_nascimento, nome_completo, tipo_vinculo, frequencia_compra, faixa_gasto_medio) VALUES ('CLI-003', 'USR-003', '1991-11-05', 'Marina Souza Lima', 'MEI / Pequeno Negócio', 'Quinzenal', 'R$ 1.500 a R$ 5.000');
UPDATE USUARIO SET cliente_id_cliente = 'CLI-003' WHERE id_usuario = 'USR-003';

-- 3. CATEGORIA_PRODUTO
INSERT INTO CATEGORIA_PRODUTO (id_categoria, descricao) VALUES ('CAT-001', 'Eletrônicos');
INSERT INTO CATEGORIA_PRODUTO (id_categoria, descricao) VALUES ('CAT-002', 'Informática');
INSERT INTO CATEGORIA_PRODUTO (id_categoria, descricao) VALUES ('CAT-003', 'Áudio e Vídeo');
INSERT INTO CATEGORIA_PRODUTO (id_categoria, descricao) VALUES ('CAT-004', 'Fotografia');
INSERT INTO CATEGORIA_PRODUTO (id_categoria, descricao) VALUES ('CAT-005', 'Games e Consoles');
INSERT INTO CATEGORIA_PRODUTO (id_categoria, descricao) VALUES ('CAT-006', 'Acessórios e Periféricos');

-- 4. SEGURADORA
INSERT INTO SEGURADORA (id_seguradora, razao_social, contato) VALUES ('SEG-001', 'Magna Proteção Seguros S.A.', 'sinistros@magnaseguros.com.br');
INSERT INTO SEGURADORA (id_seguradora, razao_social, contato) VALUES ('SEG-002', 'Atlântico Carga Segura Ltda.', 'atendimento@atlanticocarga.com.br');
INSERT INTO SEGURADORA (id_seguradora, razao_social, contato) VALUES ('SEG-003', 'Horizonte Garantia Logística S.A.', '0800-772-9010');

-- 5. PEDIDO
INSERT INTO PEDIDO (id_pedido, id_cliente, data_compra, valor_declarado, status, retido_analise, motivo_retencao, id_categoria, nome_produto, loja) VALUES ('LM-2026-001', 'CLI-002', '2026-10-06T09:15:00', 4200, 'Em trânsito', 0, NULL, 'CAT-002', 'Notebook Dell Inspiron', 'Dell Oficial');
INSERT INTO PEDIDO (id_pedido, id_cliente, data_compra, valor_declarado, status, retido_analise, motivo_retencao, id_categoria, nome_produto, loja) VALUES ('LM-2026-002', 'CLI-002', '2026-10-07T11:30:00', 2000, 'Aguardando', 1, 'Conferência documental de nota fiscal', 'CAT-003', 'Fone Sony WH-1000XM5', 'Sony Store BR');
INSERT INTO PEDIDO (id_pedido, id_cliente, data_compra, valor_declarado, status, retido_analise, motivo_retencao, id_categoria, nome_produto, loja) VALUES ('LM-2026-003', 'CLI-002', '2026-10-01T14:00:00', 1800, 'Entregue', 0, NULL, 'CAT-004', 'Câmera Canon EOS R50', 'Canon Direct');
INSERT INTO PEDIDO (id_pedido, id_cliente, data_compra, valor_declarado, status, retido_analise, motivo_retencao, id_categoria, nome_produto, loja) VALUES ('LM-2026-004', 'CLI-002', '2026-10-06T10:30:00', 3500, 'Em trânsito', 0, NULL, 'CAT-001', 'Smartphone Samsung Galaxy S24', 'Samsung Shop');
INSERT INTO PEDIDO (id_pedido, id_cliente, data_compra, valor_declarado, status, retido_analise, motivo_retencao, id_categoria, nome_produto, loja) VALUES ('LM-2026-005', 'CLI-002', '2026-10-07T10:30:00', 1400, 'Em trânsito', 0, NULL, 'CAT-002', 'Monitor LG UltraWide 29"', 'Kabum Tech');
INSERT INTO PEDIDO (id_pedido, id_cliente, data_compra, valor_declarado, status, retido_analise, motivo_retencao, id_categoria, nome_produto, loja) VALUES ('LM-2026-006', 'CLI-002', '2026-10-01T10:30:00', 650, 'Em trânsito', 1, 'Divergência de peso na triagem', 'CAT-006', 'Teclado Mecânico Keychron K2', 'Keychron Brasil');
INSERT INTO PEDIDO (id_pedido, id_cliente, data_compra, valor_declarado, status, retido_analise, motivo_retencao, id_categoria, nome_produto, loja) VALUES ('LM-2026-007', 'CLI-002', '2026-10-02T10:30:00', 550, 'Em trânsito', 0, NULL, 'CAT-006', 'Mouse Logitech MX Master 3S', 'Logitech Store');
INSERT INTO PEDIDO (id_pedido, id_cliente, data_compra, valor_declarado, status, retido_analise, motivo_retencao, id_categoria, nome_produto, loja) VALUES ('LM-2026-008', 'CLI-002', '2026-10-06T10:30:00', 4800, 'Entregue', 0, NULL, 'CAT-001', 'Tablet iPad Air', 'Apple Reseller');
INSERT INTO PEDIDO (id_pedido, id_cliente, data_compra, valor_declarado, status, retido_analise, motivo_retencao, id_categoria, nome_produto, loja) VALUES ('LM-2026-009', 'CLI-003', '2026-10-08T10:30:00', 2300, 'Em trânsito', 0, NULL, 'CAT-001', 'Smartwatch Garmin Forerunner', 'Garmin BR');
INSERT INTO PEDIDO (id_pedido, id_cliente, data_compra, valor_declarado, status, retido_analise, motivo_retencao, id_categoria, nome_produto, loja) VALUES ('LM-2026-010', 'CLI-003', '2026-10-03T10:30:00', 900, 'Entregue', 0, NULL, 'CAT-003', 'Caixa de Som JBL Charge 5', 'JBL Oficial');
INSERT INTO PEDIDO (id_pedido, id_cliente, data_compra, valor_declarado, status, retido_analise, motivo_retencao, id_categoria, nome_produto, loja) VALUES ('LM-2026-011', 'CLI-003', '2026-10-06T10:30:00', 3700, 'Em trânsito', 0, NULL, 'CAT-005', 'Console PlayStation 5', 'PlayStation Direct');
INSERT INTO PEDIDO (id_pedido, id_cliente, data_compra, valor_declarado, status, retido_analise, motivo_retencao, id_categoria, nome_produto, loja) VALUES ('LM-2026-012', 'CLI-003', '2026-10-01T10:30:00', 1100, 'Entregue', 0, NULL, 'CAT-002', 'Impressora HP LaserJet', 'HP Brasil');

-- 6. APOLICE
INSERT INTO APOLICE (id_apolice, id_seguradora, valor_segurado, vigencia_inicio, vigencia_fim, coberturas, valor_premio) VALUES ('APL-2026-001', 'SEG-001', 4200, '2026-10-01', '2027-09-30', 'Roubo, extravio e avaria no transporte', 84);
INSERT INTO APOLICE (id_apolice, id_seguradora, valor_segurado, vigencia_inicio, vigencia_fim, coberturas, valor_premio) VALUES ('APL-2026-002', 'SEG-002', 2000, '2026-10-01', '2027-09-30', 'Roubo, extravio e avaria no transporte', 40);
INSERT INTO APOLICE (id_apolice, id_seguradora, valor_segurado, vigencia_inicio, vigencia_fim, coberturas, valor_premio) VALUES ('APL-2026-003', 'SEG-001', 1800, '2026-10-01', '2027-09-30', 'Roubo, extravio e avaria no transporte', 36);
INSERT INTO APOLICE (id_apolice, id_seguradora, valor_segurado, vigencia_inicio, vigencia_fim, coberturas, valor_premio) VALUES ('APL-2026-004', 'SEG-001', 3500, '2026-10-01', '2027-09-30', 'Roubo, extravio e avaria no transporte', 70);
INSERT INTO APOLICE (id_apolice, id_seguradora, valor_segurado, vigencia_inicio, vigencia_fim, coberturas, valor_premio) VALUES ('APL-2026-005', 'SEG-002', 1400, '2026-10-01', '2027-09-30', 'Roubo, extravio e avaria no transporte', 28);
INSERT INTO APOLICE (id_apolice, id_seguradora, valor_segurado, vigencia_inicio, vigencia_fim, coberturas, valor_premio) VALUES ('APL-2026-006', 'SEG-003', 650, '2026-10-01', '2027-09-30', 'Roubo, extravio e avaria no transporte', 13);
INSERT INTO APOLICE (id_apolice, id_seguradora, valor_segurado, vigencia_inicio, vigencia_fim, coberturas, valor_premio) VALUES ('APL-2026-007', 'SEG-001', 550, '2026-10-01', '2027-09-30', 'Roubo, extravio e avaria no transporte', 11);
INSERT INTO APOLICE (id_apolice, id_seguradora, valor_segurado, vigencia_inicio, vigencia_fim, coberturas, valor_premio) VALUES ('APL-2026-008', 'SEG-002', 4800, '2026-10-01', '2027-09-30', 'Roubo, extravio e avaria no transporte', 96);
INSERT INTO APOLICE (id_apolice, id_seguradora, valor_segurado, vigencia_inicio, vigencia_fim, coberturas, valor_premio) VALUES ('APL-2026-009', 'SEG-003', 2300, '2026-10-01', '2027-09-30', 'Roubo, extravio e avaria no transporte', 46);
INSERT INTO APOLICE (id_apolice, id_seguradora, valor_segurado, vigencia_inicio, vigencia_fim, coberturas, valor_premio) VALUES ('APL-2026-010', 'SEG-001', 900, '2026-10-01', '2027-09-30', 'Roubo, extravio e avaria no transporte', 18);
INSERT INTO APOLICE (id_apolice, id_seguradora, valor_segurado, vigencia_inicio, vigencia_fim, coberturas, valor_premio) VALUES ('APL-2026-011', 'SEG-002', 3700, '2026-10-01', '2027-09-30', 'Roubo, extravio e avaria no transporte', 74);
INSERT INTO APOLICE (id_apolice, id_seguradora, valor_segurado, vigencia_inicio, vigencia_fim, coberturas, valor_premio) VALUES ('APL-2026-012', 'SEG-003', 1100, '2026-10-01', '2027-09-30', 'Roubo, extravio e avaria no transporte', 22);

-- 7. REMESSA
INSERT INTO REMESSA (id_remessa, codigo_rastreio, data_envio, previsao_entrega, status_entrega, id_pedido, id_apolice, transportadora, origem, destino, cep_destino) VALUES ('REM-2026-001', 'BR123456789SP', '2026-10-06T09:15:00', '2026-10-08T18:00:00', 'Em trânsito', 'LM-2026-001', 'APL-2026-001', 'Correios SEDEX', 'Campinas, SP', 'São Paulo, SP', '01310-100');
INSERT INTO REMESSA (id_remessa, codigo_rastreio, data_envio, previsao_entrega, status_entrega, id_pedido, id_apolice, transportadora, origem, destino, cep_destino) VALUES ('REM-2026-002', 'BR987654321SP', '2026-10-07T11:30:00', '2026-10-12T18:00:00', 'Aguardando', 'LM-2026-002', 'APL-2026-002', 'LogMagna Express', 'Curitiba, PR', 'São Paulo, SP', '04543-011');
INSERT INTO REMESSA (id_remessa, codigo_rastreio, data_envio, previsao_entrega, status_entrega, id_pedido, id_apolice, transportadora, origem, destino, cep_destino) VALUES ('REM-2026-003', 'BR555444333SP', '2026-10-01T14:00:00', '2026-10-05T18:00:00', 'Entregue', 'LM-2026-003', 'APL-2026-003', 'Correios SEDEX', 'Rio de Janeiro, RJ', 'São Paulo, SP', '01415-001');
INSERT INTO REMESSA (id_remessa, codigo_rastreio, data_envio, previsao_entrega, status_entrega, id_pedido, id_apolice, transportadora, origem, destino, cep_destino) VALUES ('REM-2026-004', 'BR656627696SP', '2026-10-06T10:30:00', '2026-10-10T18:00:00', 'Em trânsito', 'LM-2026-004', 'APL-2026-004', 'LogMagna Express', 'Belo Horizonte, MG', 'São Paulo, SP', '05425-070');
INSERT INTO REMESSA (id_remessa, codigo_rastreio, data_envio, previsao_entrega, status_entrega, id_pedido, id_apolice, transportadora, origem, destino, cep_destino) VALUES ('REM-2026-005', 'BR821267829SP', '2026-10-07T10:30:00', '2026-10-11T18:00:00', 'Em trânsito', 'LM-2026-005', 'APL-2026-005', 'Correios SEDEX', 'Curitiba, PR', 'São Paulo, SP', '01311-200');
INSERT INTO REMESSA (id_remessa, codigo_rastreio, data_envio, previsao_entrega, status_entrega, id_pedido, id_apolice, transportadora, origem, destino, cep_destino) VALUES ('REM-2026-006', 'BR657622533SP', '2026-10-01T10:30:00', '2026-10-05T18:00:00', 'Em trânsito', 'LM-2026-006', 'APL-2026-006', 'LogMagna Express', 'Rio de Janeiro, RJ', 'São Paulo, SP', '04094-050');
INSERT INTO REMESSA (id_remessa, codigo_rastreio, data_envio, previsao_entrega, status_entrega, id_pedido, id_apolice, transportadora, origem, destino, cep_destino) VALUES ('REM-2026-007', 'BR397954488SP', '2026-10-02T10:30:00', '2026-10-06T18:00:00', 'Em trânsito', 'LM-2026-007', 'APL-2026-007', 'Correios SEDEX', 'Belo Horizonte, MG', 'São Paulo, SP', '01310-200');
INSERT INTO REMESSA (id_remessa, codigo_rastreio, data_envio, previsao_entrega, status_entrega, id_pedido, id_apolice, transportadora, origem, destino, cep_destino) VALUES ('REM-2026-008', 'BR101558391SP', '2026-10-06T10:30:00', '2026-10-10T18:00:00', 'Entregue', 'LM-2026-008', 'APL-2026-008', 'LogMagna Express', 'Belo Horizonte, MG', 'São Paulo, SP', '04538-132');
INSERT INTO REMESSA (id_remessa, codigo_rastreio, data_envio, previsao_entrega, status_entrega, id_pedido, id_apolice, transportadora, origem, destino, cep_destino) VALUES ('REM-2026-009', 'BR958063828SP', '2026-10-08T10:30:00', '2026-10-12T18:00:00', 'Em trânsito', 'LM-2026-009', 'APL-2026-009', 'Correios SEDEX', 'Curitiba, PR', 'Recife, PE', '22041-001');
INSERT INTO REMESSA (id_remessa, codigo_rastreio, data_envio, previsao_entrega, status_entrega, id_pedido, id_apolice, transportadora, origem, destino, cep_destino) VALUES ('REM-2026-010', 'BR346686184SP', '2026-10-03T10:30:00', '2026-10-07T18:00:00', 'Entregue', 'LM-2026-010', 'APL-2026-010', 'LogMagna Express', 'Goiânia, GO', 'Recife, PE', '30130-010');
INSERT INTO REMESSA (id_remessa, codigo_rastreio, data_envio, previsao_entrega, status_entrega, id_pedido, id_apolice, transportadora, origem, destino, cep_destino) VALUES ('REM-2026-011', 'BR858205574SP', '2026-10-06T10:30:00', '2026-10-10T18:00:00', 'Em trânsito', 'LM-2026-011', 'APL-2026-011', 'Correios SEDEX', 'Belo Horizonte, MG', 'Recife, PE', '40020-000');
INSERT INTO REMESSA (id_remessa, codigo_rastreio, data_envio, previsao_entrega, status_entrega, id_pedido, id_apolice, transportadora, origem, destino, cep_destino) VALUES ('REM-2026-012', 'BR136724489SP', '2026-10-01T10:30:00', '2026-10-05T18:00:00', 'Entregue', 'LM-2026-012', 'APL-2026-012', 'LogMagna Express', 'Rio de Janeiro, RJ', 'Recife, PE', '50010-000');

-- 8. EVENTO_RASTREIO
INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao) VALUES ('EVT-001-1', 'REM-2026-001', '2026-10-06T09:42:00', 'Pacote postado', 'Agência • Campinas, SP');
INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao) VALUES ('EVT-001-2', 'REM-2026-001', '2026-10-07T22:40:00', 'Pacote em trânsito', 'Unidade de tratamento • Campinas, SP');
INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao) VALUES ('EVT-001-3', 'REM-2026-001', '2026-10-08T08:15:00', 'Pacote saiu para entrega', 'Centro de distribuição • São Paulo, SP');
INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao) VALUES ('EVT-002-1', 'REM-2026-002', '2026-10-06T18:40:00', 'Pacote postado', 'Agência • Curitiba, PR');
INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao) VALUES ('EVT-003-1', 'REM-2026-003', '2026-10-06T20:37:00', 'Pacote postado', 'Agência • Rio de Janeiro, RJ');
INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao) VALUES ('EVT-003-2', 'REM-2026-003', '2026-10-07T16:24:00', 'Pacote em trânsito', 'Unidade de tratamento • Rio de Janeiro');
INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao) VALUES ('EVT-003-3', 'REM-2026-003', '2026-10-08T08:50:00', 'Pacote saiu para entrega', 'Centro de distribuição • São Paulo, SP');
INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao) VALUES ('EVT-003-4', 'REM-2026-003', '2026-10-09T10:49:00', 'Pacote entregue', 'Endereço do destinatário • São Paulo, SP');
INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao) VALUES ('EVT-004-1', 'REM-2026-004', '2026-10-13T11:30:00', 'Pacote postado', 'Agência • Belo Horizonte, MG');
INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao) VALUES ('EVT-004-2', 'REM-2026-004', '2026-10-14T10:50:00', 'Pacote em trânsito', 'Unidade de tratamento • Belo Horizonte');
INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao) VALUES ('EVT-004-3', 'REM-2026-004', '2026-10-15T15:45:00', 'Pacote saiu para entrega', 'Centro de distribuição • São Paulo, SP');
INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao) VALUES ('EVT-005-1', 'REM-2026-005', '2026-10-12T15:28:00', 'Pacote postado', 'Agência • Curitiba, PR');
INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao) VALUES ('EVT-005-2', 'REM-2026-005', '2026-10-13T14:42:00', 'Pacote em trânsito', 'Unidade de tratamento • Curitiba');
INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao) VALUES ('EVT-005-3', 'REM-2026-005', '2026-10-14T17:33:00', 'Pacote saiu para entrega', 'Centro de distribuição • São Paulo, SP');
INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao) VALUES ('EVT-006-1', 'REM-2026-006', '2026-10-11T20:25:00', 'Pacote postado', 'Agência • Rio de Janeiro, RJ');
INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao) VALUES ('EVT-006-2', 'REM-2026-006', '2026-10-12T08:17:00', 'Pacote em trânsito', 'Unidade de tratamento • Rio de Janeiro');
INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao) VALUES ('EVT-006-3', 'REM-2026-006', '2026-10-13T09:49:00', 'Pacote saiu para entrega', 'Centro de distribuição • São Paulo, SP');
INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao) VALUES ('EVT-007-1', 'REM-2026-007', '2026-10-14T10:16:00', 'Pacote postado', 'Agência • Belo Horizonte, MG');
INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao) VALUES ('EVT-007-2', 'REM-2026-007', '2026-10-15T14:34:00', 'Pacote em trânsito', 'Unidade de tratamento • Belo Horizonte');
INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao) VALUES ('EVT-007-3', 'REM-2026-007', '2026-10-16T11:48:00', 'Pacote saiu para entrega', 'Centro de distribuição • São Paulo, SP');
INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao) VALUES ('EVT-008-1', 'REM-2026-008', '2026-10-14T08:49:00', 'Pacote postado', 'Agência • Belo Horizonte, MG');
INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao) VALUES ('EVT-008-2', 'REM-2026-008', '2026-10-15T16:46:00', 'Pacote em trânsito', 'Unidade de tratamento • Belo Horizonte');
INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao) VALUES ('EVT-008-3', 'REM-2026-008', '2026-10-16T11:34:00', 'Pacote saiu para entrega', 'Centro de distribuição • São Paulo, SP');
INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao) VALUES ('EVT-008-4', 'REM-2026-008', '2026-10-17T15:10:00', 'Pacote entregue', 'Endereço do destinatário • São Paulo, SP');
INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao) VALUES ('EVT-009-1', 'REM-2026-009', '2026-10-14T19:49:00', 'Pacote postado', 'Agência • Curitiba, PR');
INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao) VALUES ('EVT-009-2', 'REM-2026-009', '2026-10-15T18:11:00', 'Pacote em trânsito', 'Unidade de tratamento • Curitiba');
INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao) VALUES ('EVT-009-3', 'REM-2026-009', '2026-10-16T20:48:00', 'Pacote saiu para entrega', 'Centro de distribuição • Recife, PE');
INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao) VALUES ('EVT-010-1', 'REM-2026-010', '2026-10-08T13:10:00', 'Pacote postado', 'Agência • Goiânia, GO');
INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao) VALUES ('EVT-010-2', 'REM-2026-010', '2026-10-09T11:43:00', 'Pacote em trânsito', 'Unidade de tratamento • Goiânia');
INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao) VALUES ('EVT-010-3', 'REM-2026-010', '2026-10-10T19:32:00', 'Pacote saiu para entrega', 'Centro de distribuição • Recife, PE');
INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao) VALUES ('EVT-010-4', 'REM-2026-010', '2026-10-11T10:13:00', 'Pacote entregue', 'Endereço do destinatário • Recife, PE');
INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao) VALUES ('EVT-011-1', 'REM-2026-011', '2026-10-08T20:44:00', 'Pacote postado', 'Agência • Belo Horizonte, MG');
INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao) VALUES ('EVT-011-2', 'REM-2026-011', '2026-10-09T10:23:00', 'Pacote em trânsito', 'Unidade de tratamento • Belo Horizonte');
INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao) VALUES ('EVT-011-3', 'REM-2026-011', '2026-10-10T17:45:00', 'Pacote saiu para entrega', 'Centro de distribuição • Recife, PE');
INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao) VALUES ('EVT-012-1', 'REM-2026-012', '2026-10-03T15:48:00', 'Pacote postado', 'Agência • Rio de Janeiro, RJ');
INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao) VALUES ('EVT-012-2', 'REM-2026-012', '2026-10-04T08:32:00', 'Pacote em trânsito', 'Unidade de tratamento • Rio de Janeiro');
INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao) VALUES ('EVT-012-3', 'REM-2026-012', '2026-10-05T09:35:00', 'Pacote saiu para entrega', 'Centro de distribuição • Recife, PE');
INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao) VALUES ('EVT-012-4', 'REM-2026-012', '2026-10-06T15:18:00', 'Pacote entregue', 'Endereço do destinatário • Recife, PE');

-- 9. OCORRENCIA
INSERT INTO OCORRENCIA (id_ocorrencia, id_remessa, tipo, data_ocorrencia, descricao) VALUES ('OCO-001', 'REM-2026-002', 'Retenção fiscal', '2026-10-08T10:15:00', 'Volume retido temporariamente para conferência da nota fiscal declarada.');
INSERT INTO OCORRENCIA (id_ocorrencia, id_remessa, tipo, data_ocorrencia, descricao) VALUES ('OCO-002', 'REM-2026-003', 'Avaria na embalagem', '2026-10-05T16:40:00', 'Caixa externa chegou com amassado lateral; conteúdo preservado com proteção.');
INSERT INTO OCORRENCIA (id_ocorrencia, id_remessa, tipo, data_ocorrencia, descricao) VALUES ('OCO-003', 'REM-2026-006', 'Atraso operacional', '2026-10-09T13:20:00', 'Atraso na transferência rodoviária entre centros de distribuição.');
INSERT INTO OCORRENCIA (id_ocorrencia, id_remessa, tipo, data_ocorrencia, descricao) VALUES ('OCO-004', 'REM-2026-011', 'Extravio parcial', '2026-10-10T09:05:00', 'Item acessório não localizado na conferência do centro de destino.');

-- 10. NOTIFICACAO
INSERT INTO NOTIFICACAO (id_notificacao, cliente_id_cliente, tipo, canal, data_envio, lida, id_ocorrencia) VALUES ('NOT-001', 'CLI-002', 'Ocorrência de envio', 'Painel Web', '2026-10-08T10:16:00', 0, 'OCO-001');
INSERT INTO NOTIFICACAO (id_notificacao, cliente_id_cliente, tipo, canal, data_envio, lida, id_ocorrencia) VALUES ('NOT-002', 'CLI-002', 'Sinistro atualizado', 'E-mail', '2026-10-08T15:30:00', 0, 'OCO-002');
INSERT INTO NOTIFICACAO (id_notificacao, cliente_id_cliente, tipo, canal, data_envio, lida, id_ocorrencia) VALUES ('NOT-003', 'CLI-002', 'Aviso de atraso', 'WhatsApp', '2026-10-09T13:25:00', 1, 'OCO-003');
INSERT INTO NOTIFICACAO (id_notificacao, cliente_id_cliente, tipo, canal, data_envio, lida, id_ocorrencia) VALUES ('NOT-004', 'CLI-002', 'Atualização de rastreio', 'Painel Web', '2026-10-08T08:16:00', 1, NULL);
INSERT INTO NOTIFICACAO (id_notificacao, cliente_id_cliente, tipo, canal, data_envio, lida, id_ocorrencia) VALUES ('NOT-005', 'CLI-003', 'Extravio reportado', 'E-mail', '2026-10-10T09:10:00', 0, 'OCO-004');

-- 11. SINISTRO
INSERT INTO SINISTRO (id_sinistro, data_abertura, status, valor_indenizado, data_encerramento, etapa_mais_dificil, motivo_nao_acionamento, ocorrencia_id_ocorrencia, id_apolice) VALUES ('SIN-001', '2026-10-08T11:00:00', 'Em análise', NULL, NULL, 'Envio da nota fiscal e fotos detalhadas', NULL, 'OCO-001', 'APL-2026-002');
INSERT INTO SINISTRO (id_sinistro, data_abertura, status, valor_indenizado, data_encerramento, etapa_mais_dificil, motivo_nao_acionamento, ocorrencia_id_ocorrencia, id_apolice) VALUES ('SIN-002', '2026-10-06T09:30:00', 'Indenizado', 450, '2026-10-11T17:00:00', 'Comprovação do valor de reparo', NULL, 'OCO-002', 'APL-2026-003');
INSERT INTO SINISTRO (id_sinistro, data_abertura, status, valor_indenizado, data_encerramento, etapa_mais_dificil, motivo_nao_acionamento, ocorrencia_id_ocorrencia, id_apolice) VALUES ('SIN-003', '2026-10-10T14:00:00', 'Não acionado', 0, '2026-10-12T10:00:00', 'Localização do protocolo da transportadora', 'Cliente optou por reenvio direto pela loja', 'OCO-004', 'APL-2026-011');

-- 12. DOCUMENTO
INSERT INTO DOCUMENTO (id_documento, id_sinistro, tipo, arquivo, data_envio, validado) VALUES ('DOC-001', 'SIN-001', 'Nota Fiscal', 'nf-fone-sony-wh1000xm5.pdf', '2026-10-08T11:20:00.000Z', 1);
INSERT INTO DOCUMENTO (id_documento, id_sinistro, tipo, arquivo, data_envio, validado) VALUES ('DOC-002', 'SIN-001', 'Comprovante de Retenção', 'termo-conferencia-sefaz.pdf', '2026-10-08T11:25:00.000Z', 0);
INSERT INTO DOCUMENTO (id_documento, id_sinistro, tipo, arquivo, data_envio, validado) VALUES ('DOC-003', 'SIN-002', 'Fotos da Avaria', 'embalagem-canon-r50.jpg', '2026-10-06T10:00:00.000Z', 1);
INSERT INTO DOCUMENTO (id_documento, id_sinistro, tipo, arquivo, data_envio, validado) VALUES ('DOC-004', 'SIN-002', 'Laudo Técnico', 'orcamento-reparo-canon.pdf', '2026-10-07T09:15:00.000Z', 1);

-- 13. ATENDIMENTO
INSERT INTO ATENDIMENTO (id_atendimento, cliente_id_cliente, canal, data_hora, assunto, resolvido, exigiu_repetir_informacao, atendido_por, id_pedido) VALUES ('ATD-001', 'CLI-002', 'Chat Web', '2026-10-08T10:45:00', 'Dúvida sobre retenção do pedido LM-2026-002', 0, 'Não', 'Ana Paula (Suporte N1)', 'LM-2026-002');
INSERT INTO ATENDIMENTO (id_atendimento, cliente_id_cliente, canal, data_hora, assunto, resolvido, exigiu_repetir_informacao, atendido_por, id_pedido) VALUES ('ATD-002', 'CLI-002', 'E-mail', '2026-10-06T14:10:00', 'Envio de documentos do sinistro SIN-002', 1, 'Sim, uma vez', 'Carlos Mendes (Sinistros)', 'LM-2026-003');
INSERT INTO ATENDIMENTO (id_atendimento, cliente_id_cliente, canal, data_hora, assunto, resolvido, exigiu_repetir_informacao, atendido_por, id_pedido) VALUES ('ATD-003', 'CLI-002', 'Telefone', '2026-10-09T14:00:00', 'Atualização de previsão de entrega', 1, 'Não', 'Ana Paula (Suporte N1)', 'LM-2026-001');
INSERT INTO ATENDIMENTO (id_atendimento, cliente_id_cliente, canal, data_hora, assunto, resolvido, exigiu_repetir_informacao, atendido_por, id_pedido) VALUES ('ATD-004', 'CLI-003', 'WhatsApp', '2026-10-10T11:30:00', 'Orientação sobre extravio parcial', 1, 'Não', 'Carlos Mendes (Sinistros)', 'LM-2026-011');

-- 14. FEEDBACK
INSERT INTO FEEDBACK (id_feedback, data, cliente_id_cliente, relato_problema, solucao_esperada, nivel_compreensao_seguro, momento_conhecimento_seguro, aceita_assistente_virtual) VALUES ('FDB-001', '2026-10-07T18:00:00', 'CLI-002', 'Falta de clareza inicial sobre quais documentos anexar no sinistro.', 'Checklist automático de documentos por tipo de ocorrência.', 'Alto', 'No checkout da compra', 'Sim');
INSERT INTO FEEDBACK (id_feedback, data, cliente_id_cliente, relato_problema, solucao_esperada, nivel_compreensao_seguro, momento_conhecimento_seguro, aceita_assistente_virtual) VALUES ('FDB-002', '2026-10-09T16:20:00', 'CLI-002', 'Demora para atualizar o status após postagem na agência.', 'Notificações em tempo real no painel e por e-mail.', 'Médio', 'Ao rastrear a encomenda', 'Sim, para triagem inicial');
INSERT INTO FEEDBACK (id_feedback, data, cliente_id_cliente, relato_problema, solucao_esperada, nivel_compreensao_seguro, momento_conhecimento_seguro, aceita_assistente_virtual) VALUES ('FDB-003', '2026-10-12T10:30:00', 'CLI-003', 'Dúvida sobre cobertura em caso de extravio parcial de acessórios.', 'Resumo direto das coberturas da apólice dentro do pedido.', 'Baixo', 'Após a ocorrência no transporte', 'Não, prefiro atendente humano');

-- 15. AUDITORIA
INSERT INTO AUDITORIA (id_log, id_usuario, entidade, id_registro, acao, data_hora) VALUES ('LOG-001', 'USR-001', 'SISTEMA', 'MAGNA-DB', 'SEED_INICIAL', '2026-10-01T08:00:00');
INSERT INTO AUDITORIA (id_log, id_usuario, entidade, id_registro, acao, data_hora) VALUES ('LOG-002', 'USR-002', 'PEDIDO', 'LM-2026-001', 'CRIAR', '2026-10-06T09:15:00');
INSERT INTO AUDITORIA (id_log, id_usuario, entidade, id_registro, acao, data_hora) VALUES ('LOG-003', 'USR-002', 'SINISTRO', 'SIN-002', 'CRIAR', '2026-10-06T09:30:00');
INSERT INTO AUDITORIA (id_log, id_usuario, entidade, id_registro, acao, data_hora) VALUES ('LOG-004', 'USR-001', 'SINISTRO', 'SIN-002', 'ATUALIZAR', '2026-10-11T17:00:00');

-- 16. UNIDADE
INSERT INTO UNIDADE (nome, tipo, cidade, estado, status, version) VALUES ('Matriz Recife', 'Matriz', 'Recife', 'PE', 'ativa', 1);
INSERT INTO UNIDADE (nome, tipo, cidade, estado, status, version) VALUES ('CD Suape', 'Centro de distribuição', 'Ipojuca', 'PE', 'ativa', 1);
INSERT INTO UNIDADE (nome, tipo, cidade, estado, status, version) VALUES ('Filial Salvador', 'Filial', 'Salvador', 'BA', 'ativa', 1);
INSERT INTO UNIDADE (nome, tipo, cidade, estado, status, version) VALUES ('Filial Fortaleza', 'Filial', 'Fortaleza', 'CE', 'inativa', 1);
INSERT INTO UNIDADE (nome, tipo, cidade, estado, status, version) VALUES ('Filial Campinas', 'Filial', 'Campinas', 'SP', 'inativa', 1);
INSERT INTO UNIDADE (nome, tipo, cidade, estado, status, version) VALUES ('CD Curitiba', 'Centro de distribuição', 'Curitiba', 'PR', 'ativa', 1);
INSERT INTO UNIDADE (nome, tipo, cidade, estado, status, version) VALUES ('Filial Rio de Janeiro', 'Filial', 'Rio de Janeiro', 'RJ', 'inativa', 1);
INSERT INTO UNIDADE (nome, tipo, cidade, estado, status, version) VALUES ('CD Belo Horizonte', 'Centro de distribuição', 'Belo Horizonte', 'MG', 'ativa', 1);
INSERT INTO UNIDADE (nome, tipo, cidade, estado, status, version) VALUES ('Filial Porto Alegre', 'Filial', 'Porto Alegre', 'RS', 'ativa', 1);
INSERT INTO UNIDADE (nome, tipo, cidade, estado, status, version) VALUES ('CD Recife', 'Centro de distribuição', 'Recife', 'PE', 'inativa', 1);

COMMIT TRANSACTION;
GO