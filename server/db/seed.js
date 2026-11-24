const { hashSenha } = require('./crypto');

const RATE = 0.02;

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gerarDadosSeed() {
  const SEED = Number(process.env.SEED) || 2026;
  const rand = mulberry32(SEED);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const between = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
  const pad = (n, l = 2) => String(n).padStart(l, '0');

  const usuarios = [
    {
      id_usuario: 'USR-001',
      nome_completo: 'Administrador LogMagna',
      email_corporativo: 'admin@logmagna.com',
      senha_hash: hashSenha('logmagna123', 'lm-seed-USR-001'),
      perfil: 'admin',
      data_cadastro: '2026-09-01T09:00:00.000Z',
      ativo: 1,
      cliente_id_cliente: 'CLI-001',
    },
    {
      id_usuario: 'USR-002',
      nome_completo: 'Cliente Demonstração',
      email_corporativo: 'cliente@logmagna.com',
      senha_hash: hashSenha('logmagna123', 'lm-seed-USR-002'),
      perfil: 'cliente',
      data_cadastro: '2026-09-10T14:20:00.000Z',
      ativo: 1,
      cliente_id_cliente: 'CLI-002',
    },
    {
      id_usuario: 'USR-003',
      nome_completo: 'Marina Souza Lima',
      email_corporativo: 'marina.souza@logmagna.com',
      senha_hash: hashSenha('logmagna123', 'lm-seed-USR-003'),
      perfil: 'cliente',
      data_cadastro: '2026-09-18T11:05:00.000Z',
      ativo: 1,
      cliente_id_cliente: 'CLI-003',
    },
  ];

  const clientes = [
    {
      id_cliente: 'CLI-001',
      id_usuario: 'USR-001',
      data_nascimento: '1988-04-12',
      nome_completo: 'Administrador LogMagna',
      tipo_vinculo: 'Corporativo',
      frequencia_compra: 'Semanal',
      faixa_gasto_medio: 'Acima de R$ 5.000',
    },
    {
      id_cliente: 'CLI-002',
      id_usuario: 'USR-002',
      data_nascimento: '1994-08-23',
      nome_completo: 'Cliente Demonstração',
      tipo_vinculo: 'Pessoa Física',
      frequencia_compra: 'Mensal',
      faixa_gasto_medio: 'R$ 1.500 a R$ 5.000',
    },
    {
      id_cliente: 'CLI-003',
      id_usuario: 'USR-003',
      data_nascimento: '1991-11-05',
      nome_completo: 'Marina Souza Lima',
      tipo_vinculo: 'MEI / Pequeno Negócio',
      frequencia_compra: 'Quinzenal',
      faixa_gasto_medio: 'R$ 1.500 a R$ 5.000',
    },
  ];

  const categorias = [
    { id_categoria: 'CAT-001', descricao: 'Eletrônicos' },
    { id_categoria: 'CAT-002', descricao: 'Informática' },
    { id_categoria: 'CAT-003', descricao: 'Áudio e Vídeo' },
    { id_categoria: 'CAT-004', descricao: 'Fotografia' },
    { id_categoria: 'CAT-005', descricao: 'Games e Consoles' },
    { id_categoria: 'CAT-006', descricao: 'Acessórios e Periféricos' },
  ];

  const seguradoras = [
    { id_seguradora: 'SEG-001', razao_social: 'Magna Proteção Seguros S.A.', contato: 'sinistros@magnaseguros.com.br' },
    { id_seguradora: 'SEG-002', razao_social: 'Atlântico Carga Segura Ltda.', contato: 'atendimento@atlanticocarga.com.br' },
    { id_seguradora: 'SEG-003', razao_social: 'Horizonte Garantia Logística S.A.', contato: '0800-772-9010' },
  ];

  const CIDADES = [
    ['Campinas', 'SP'], ['Curitiba', 'PR'], ['Rio de Janeiro', 'RJ'], ['Belo Horizonte', 'MG'],
    ['Porto Alegre', 'RS'], ['Recife', 'PE'], ['Salvador', 'BA'], ['Goiânia', 'GO'],
  ];

  const STATUS_LIST = ['Em trânsito', 'Aguardando', 'Entregue'];

  const CATALOGO = [
    ['Notebook Dell Inspiron', 4200, 'CAT-002', 'Dell Oficial', '01310-100'],
    ['Fone Sony WH-1000XM5', 2000, 'CAT-003', 'Sony Store BR', '04543-011'],
    ['Câmera Canon EOS R50', 1800, 'CAT-004', 'Canon Direct', '01415-001'],
    ['Smartphone Samsung Galaxy S24', 3500, 'CAT-001', 'Samsung Shop', '05425-070'],
    ['Monitor LG UltraWide 29"', 1400, 'CAT-002', 'Kabum Tech', '01311-200'],
    ['Teclado Mecânico Keychron K2', 650, 'CAT-006', 'Keychron Brasil', '04094-050'],
    ['Mouse Logitech MX Master 3S', 550, 'CAT-006', 'Logitech Store', '01310-200'],
    ['Tablet iPad Air', 4800, 'CAT-001', 'Apple Reseller', '04538-132'],
    ['Smartwatch Garmin Forerunner', 2300, 'CAT-001', 'Garmin BR', '22041-001'],
    ['Caixa de Som JBL Charge 5', 900, 'CAT-003', 'JBL Oficial', '30130-010'],
    ['Console PlayStation 5', 3700, 'CAT-005', 'PlayStation Direct', '40020-000'],
    ['Impressora HP LaserJet', 1100, 'CAT-002', 'HP Brasil', '50010-000'],
  ];

  const FIXOS = [
    {
      id_pedido: 'LM-2026-001',
      id_cliente: 'CLI-002',
      nome_produto: 'Notebook Dell Inspiron',
      id_categoria: 'CAT-002',
      loja: 'Dell Oficial',
      valor_declarado: 4200,
      status: 'Em trânsito',
      codigo_rastreio: 'BR123456789SP',
      origem: 'Campinas, SP',
      destino: 'São Paulo, SP',
      cep_destino: '01310-100',
      data_compra: '2026-10-06T09:15:00.000Z',
      previsao_entrega: '2026-10-08T18:00:00.000Z',
      retido_analise: 0,
      motivo_retencao: null,
      id_seguradora: 'SEG-001',
    },
    {
      id_pedido: 'LM-2026-002',
      id_cliente: 'CLI-002',
      nome_produto: 'Fone Sony WH-1000XM5',
      id_categoria: 'CAT-003',
      loja: 'Sony Store BR',
      valor_declarado: 2000,
      status: 'Aguardando',
      codigo_rastreio: 'BR987654321SP',
      origem: 'Curitiba, PR',
      destino: 'São Paulo, SP',
      cep_destino: '04543-011',
      data_compra: '2026-10-07T11:30:00.000Z',
      previsao_entrega: '2026-10-12T18:00:00.000Z',
      retido_analise: 1,
      motivo_retencao: 'Conferência documental de nota fiscal',
      id_seguradora: 'SEG-002',
    },
    {
      id_pedido: 'LM-2026-003',
      id_cliente: 'CLI-002',
      nome_produto: 'Câmera Canon EOS R50',
      id_categoria: 'CAT-004',
      loja: 'Canon Direct',
      valor_declarado: 1800,
      status: 'Entregue',
      codigo_rastreio: 'BR555444333SP',
      origem: 'Rio de Janeiro, RJ',
      destino: 'São Paulo, SP',
      cep_destino: '01415-001',
      data_compra: '2026-10-01T14:00:00.000Z',
      previsao_entrega: '2026-10-05T18:00:00.000Z',
      retido_analise: 0,
      motivo_retencao: null,
      id_seguradora: 'SEG-001',
    },
  ];

  const gerados = CATALOGO.slice(3).map(([nome, valor, idCat, loja, cep], i) => {
    const [cidade, uf] = pick(CIDADES);
    const status = pick(STATUS_LIST);
    const dia = pad(between(1, 9));
    const diaPrev = pad(Number(dia) + 4);
    const retido = i === 2 ? 1 : 0;
    return {
      id_pedido: `LM-2026-${pad(i + 4, 3)}`,
      id_cliente: i < 5 ? 'CLI-002' : 'CLI-003',
      nome_produto: nome,
      id_categoria: idCat,
      loja,
      valor_declarado: valor,
      status,
      codigo_rastreio: `BR${between(100000000, 999999999)}SP`,
      origem: `${cidade}, ${uf}`,
      destino: i < 5 ? 'São Paulo, SP' : 'Recife, PE',
      cep_destino: cep,
      data_compra: `2026-10-${dia}T10:30:00.000Z`,
      previsao_entrega: `2026-10-${diaPrev}T18:00:00.000Z`,
      retido_analise: retido,
      motivo_retencao: retido ? 'Divergência de peso na triagem' : null,
      id_seguradora: seguradoras[i % seguradoras.length].id_seguradora,
    };
  });

  const basePedidos = [...FIXOS, ...gerados];
  const pedidos = [];
  const apolices = [];
  const remessas = [];
  const eventos = [];

  basePedidos.forEach((item, idx) => {
    const numSeq = pad(idx + 1, 3);
    const idApolice = `APL-2026-${numSeq}`;
    const idRemessa = `REM-2026-${numSeq}`;
    const premio = +(item.valor_declarado * RATE).toFixed(2);

    pedidos.push({
      id_pedido: item.id_pedido,
      id_cliente: item.id_cliente,
      data_compra: item.data_compra,
      valor_declarado: item.valor_declarado,
      status: item.status,
      retido_analise: item.retido_analise,
      motivo_retencao: item.motivo_retencao,
      id_categoria: item.id_categoria,
      nome_produto: item.nome_produto,
      loja: item.loja,
    });

    apolices.push({
      id_apolice: idApolice,
      id_seguradora: item.id_seguradora,
      valor_segurado: item.valor_declarado,
      vigencia_inicio: '2026-10-01',
      vigencia_fim: '2027-09-30',
      coberturas: 'Roubo, extravio e avaria no transporte',
      valor_premio: premio,
    });

    remessas.push({
      id_remessa: idRemessa,
      codigo_rastreio: item.codigo_rastreio,
      data_envio: item.data_compra,
      previsao_entrega: item.previsao_entrega,
      status_entrega: item.status,
      id_pedido: item.id_pedido,
      id_apolice: idApolice,
      transportadora: idx % 2 === 0 ? 'Correios SEDEX' : 'LogMagna Express',
      origem: item.origem,
      destino: item.destino,
      cep_destino: item.cep_destino,
    });

    if (item.codigo_rastreio === 'BR123456789SP') {
      eventos.push(
        {
          id_evento: `EVT-${numSeq}-1`,
          id_remessa: idRemessa,
          data_hora: '2026-10-06T09:42:00.000Z',
          descricao: 'Pacote postado',
          localizacao: 'Agência • Campinas, SP',
        },
        {
          id_evento: `EVT-${numSeq}-2`,
          id_remessa: idRemessa,
          data_hora: '2026-10-07T22:40:00.000Z',
          descricao: 'Pacote em trânsito',
          localizacao: 'Unidade de tratamento • Campinas, SP',
        },
        {
          id_evento: `EVT-${numSeq}-3`,
          id_remessa: idRemessa,
          data_hora: '2026-10-08T08:15:00.000Z',
          descricao: 'Pacote saiu para entrega',
          localizacao: 'Centro de distribuição • São Paulo, SP',
        }
      );
    } else {
      const [cidade] = item.origem.split(',');
      const etapas = [
        ['Pacote postado', `Agência • ${item.origem}`],
        ['Pacote em trânsito', `Unidade de tratamento • ${cidade}`],
        ['Pacote saiu para entrega', `Centro de distribuição • ${item.destino}`],
        ['Pacote entregue', `Endereço do destinatário • ${item.destino}`],
      ];
      const ate = item.status === 'Aguardando' ? 1 : item.status === 'Em trânsito' ? 3 : 4;
      const dia = between(1, 15);
      etapas.slice(0, ate).forEach(([desc, loc], eIdx) => {
        eventos.push({
          id_evento: `EVT-${numSeq}-${eIdx + 1}`,
          id_remessa: idRemessa,
          data_hora: `2026-10-${pad(dia + eIdx)}T${pad(between(8, 20))}:${pad(between(10, 50))}:00.000Z`,
          descricao: desc,
          localizacao: loc,
        });
      });
    }
  });

  const ocorrencias = [
    {
      id_ocorrencia: 'OCO-001',
      id_remessa: 'REM-2026-002',
      tipo: 'Retenção fiscal',
      data_ocorrencia: '2026-10-08T10:15:00.000Z',
      descricao: 'Volume retido temporariamente para conferência da nota fiscal declarada.',
    },
    {
      id_ocorrencia: 'OCO-002',
      id_remessa: 'REM-2026-003',
      tipo: 'Avaria na embalagem',
      data_ocorrencia: '2026-10-05T16:40:00.000Z',
      descricao: 'Caixa externa chegou com amassado lateral; conteúdo preservado com proteção.',
    },
    {
      id_ocorrencia: 'OCO-003',
      id_remessa: 'REM-2026-006',
      tipo: 'Atraso operacional',
      data_ocorrencia: '2026-10-09T13:20:00.000Z',
      descricao: 'Atraso na transferência rodoviária entre centros de distribuição.',
    },
    {
      id_ocorrencia: 'OCO-004',
      id_remessa: 'REM-2026-011',
      tipo: 'Extravio parcial',
      data_ocorrencia: '2026-10-10T09:05:00.000Z',
      descricao: 'Item acessório não localizado na conferência do centro de destino.',
    },
  ];

  const notificacoes = [
    {
      id_notificacao: 'NOT-001',
      cliente_id_cliente: 'CLI-002',
      tipo: 'Ocorrência de envio',
      canal: 'Painel Web',
      data_envio: '2026-10-08T10:16:00.000Z',
      lida: 0,
      id_ocorrencia: 'OCO-001',
    },
    {
      id_notificacao: 'NOT-002',
      cliente_id_cliente: 'CLI-002',
      tipo: 'Sinistro atualizado',
      canal: 'E-mail',
      data_envio: '2026-10-08T15:30:00.000Z',
      lida: 0,
      id_ocorrencia: 'OCO-002',
    },
    {
      id_notificacao: 'NOT-003',
      cliente_id_cliente: 'CLI-002',
      tipo: 'Aviso de atraso',
      canal: 'WhatsApp',
      data_envio: '2026-10-09T13:25:00.000Z',
      lida: 1,
      id_ocorrencia: 'OCO-003',
    },
    {
      id_notificacao: 'NOT-004',
      cliente_id_cliente: 'CLI-002',
      tipo: 'Atualização de rastreio',
      canal: 'Painel Web',
      data_envio: '2026-10-08T08:16:00.000Z',
      lida: 1,
      id_ocorrencia: null,
    },
    {
      id_notificacao: 'NOT-005',
      cliente_id_cliente: 'CLI-003',
      tipo: 'Extravio reportado',
      canal: 'E-mail',
      data_envio: '2026-10-10T09:10:00.000Z',
      lida: 0,
      id_ocorrencia: 'OCO-004',
    },
  ];

  const sinistros = [
    {
      id_sinistro: 'SIN-001',
      data_abertura: '2026-10-08T11:00:00.000Z',
      status: 'Em análise',
      valor_indenizado: null,
      data_encerramento: null,
      etapa_mais_dificil: 'Envio da nota fiscal e fotos detalhadas',
      motivo_nao_acionamento: null,
      ocorrencia_id_ocorrencia: 'OCO-001',
      id_apolice: 'APL-2026-002',
    },
    {
      id_sinistro: 'SIN-002',
      data_abertura: '2026-10-06T09:30:00.000Z',
      status: 'Indenizado',
      valor_indenizado: 450.0,
      data_encerramento: '2026-10-11T17:00:00.000Z',
      etapa_mais_dificil: 'Comprovação do valor de reparo',
      motivo_nao_acionamento: null,
      ocorrencia_id_ocorrencia: 'OCO-002',
      id_apolice: 'APL-2026-003',
    },
    {
      id_sinistro: 'SIN-003',
      data_abertura: '2026-10-10T14:00:00.000Z',
      status: 'Não acionado',
      valor_indenizado: 0,
      data_encerramento: '2026-10-12T10:00:00.000Z',
      etapa_mais_dificil: 'Localização do protocolo da transportadora',
      motivo_nao_acionamento: 'Cliente optou por reenvio direto pela loja',
      ocorrencia_id_ocorrencia: 'OCO-004',
      id_apolice: 'APL-2026-011',
    },
  ];

  const documentos = [
    {
      id_documento: 'DOC-001',
      id_sinistro: 'SIN-001',
      tipo: 'Nota Fiscal',
      arquivo: 'nf-fone-sony-wh1000xm5.pdf',
      data_envio: '2026-10-08T11:20:00.000Z',
      validado: 1,
    },
    {
      id_documento: 'DOC-002',
      id_sinistro: 'SIN-001',
      tipo: 'Comprovante de Retenção',
      arquivo: 'termo-conferencia-sefaz.pdf',
      data_envio: '2026-10-08T11:25:00.000Z',
      validado: 0,
    },
    {
      id_documento: 'DOC-003',
      id_sinistro: 'SIN-002',
      tipo: 'Fotos da Avaria',
      arquivo: 'embalagem-canon-r50.jpg',
      data_envio: '2026-10-06T10:00:00.000Z',
      validado: 1,
    },
    {
      id_documento: 'DOC-004',
      id_sinistro: 'SIN-002',
      tipo: 'Laudo Técnico',
      arquivo: 'orcamento-reparo-canon.pdf',
      data_envio: '2026-10-07T09:15:00.000Z',
      validado: 1,
    },
  ];

  const atendimentos = [
    {
      id_atendimento: 'ATD-001',
      cliente_id_cliente: 'CLI-002',
      canal: 'Chat Web',
      data_hora: '2026-10-08T10:45:00.000Z',
      assunto: 'Dúvida sobre retenção do pedido LM-2026-002',
      resolvido: 0,
      exigiu_repetir_informacao: 'Não',
      atendido_por: 'Ana Paula (Suporte N1)',
      id_pedido: 'LM-2026-002',
    },
    {
      id_atendimento: 'ATD-002',
      cliente_id_cliente: 'CLI-002',
      canal: 'E-mail',
      data_hora: '2026-10-06T14:10:00.000Z',
      assunto: 'Envio de documentos do sinistro SIN-002',
      resolvido: 1,
      exigiu_repetir_informacao: 'Sim, uma vez',
      atendido_por: 'Carlos Mendes (Sinistros)',
      id_pedido: 'LM-2026-003',
    },
    {
      id_atendimento: 'ATD-003',
      cliente_id_cliente: 'CLI-002',
      canal: 'Telefone',
      data_hora: '2026-10-09T14:00:00.000Z',
      assunto: 'Atualização de previsão de entrega',
      resolvido: 1,
      exigiu_repetir_informacao: 'Não',
      atendido_por: 'Ana Paula (Suporte N1)',
      id_pedido: 'LM-2026-001',
    },
    {
      id_atendimento: 'ATD-004',
      cliente_id_cliente: 'CLI-003',
      canal: 'WhatsApp',
      data_hora: '2026-10-10T11:30:00.000Z',
      assunto: 'Orientação sobre extravio parcial',
      resolvido: 1,
      exigiu_repetir_informacao: 'Não',
      atendido_por: 'Carlos Mendes (Sinistros)',
      id_pedido: 'LM-2026-011',
    },
  ];

  const feedbacks = [
    {
      id_feedback: 'FDB-001',
      data: '2026-10-07T18:00:00.000Z',
      cliente_id_cliente: 'CLI-002',
      relato_problema: 'Falta de clareza inicial sobre quais documentos anexar no sinistro.',
      solucao_esperada: 'Checklist automático de documentos por tipo de ocorrência.',
      nivel_compreensao_seguro: 'Alto',
      momento_conhecimento_seguro: 'No checkout da compra',
      aceita_assistente_virtual: 'Sim',
    },
    {
      id_feedback: 'FDB-002',
      data: '2026-10-09T16:20:00.000Z',
      cliente_id_cliente: 'CLI-002',
      relato_problema: 'Demora para atualizar o status após postagem na agência.',
      solucao_esperada: 'Notificações em tempo real no painel e por e-mail.',
      nivel_compreensao_seguro: 'Médio',
      momento_conhecimento_seguro: 'Ao rastrear a encomenda',
      aceita_assistente_virtual: 'Sim, para triagem inicial',
    },
    {
      id_feedback: 'FDB-003',
      data: '2026-10-12T10:30:00.000Z',
      cliente_id_cliente: 'CLI-003',
      relato_problema: 'Dúvida sobre cobertura em caso de extravio parcial de acessórios.',
      solucao_esperada: 'Resumo direto das coberturas da apólice dentro do pedido.',
      nivel_compreensao_seguro: 'Baixo',
      momento_conhecimento_seguro: 'Após a ocorrência no transporte',
      aceita_assistente_virtual: 'Não, prefiro atendente humano',
    },
  ];

  const auditoria = [
    {
      id_log: 'LOG-001',
      id_usuario: 'USR-001',
      entidade: 'SISTEMA',
      id_registro: 'MAGNA-DB',
      acao: 'SEED_INICIAL',
      data_hora: '2026-10-01T08:00:00.000Z',
    },
    {
      id_log: 'LOG-002',
      id_usuario: 'USR-002',
      entidade: 'PEDIDO',
      id_registro: 'LM-2026-001',
      acao: 'CRIAR',
      data_hora: '2026-10-06T09:15:00.000Z',
    },
    {
      id_log: 'LOG-003',
      id_usuario: 'USR-002',
      entidade: 'SINISTRO',
      id_registro: 'SIN-002',
      acao: 'CRIAR',
      data_hora: '2026-10-06T09:30:00.000Z',
    },
    {
      id_log: 'LOG-004',
      id_usuario: 'USR-001',
      entidade: 'SINISTRO',
      id_registro: 'SIN-002',
      acao: 'ATUALIZAR',
      data_hora: '2026-10-11T17:00:00.000Z',
    },
  ];

  const unidades = [
    { nome: 'Matriz Recife', tipo: 'Matriz', cidade: 'Recife', estado: 'PE', status: 'ativa', version: 1 },
    { nome: 'CD Suape', tipo: 'Centro de distribuição', cidade: 'Ipojuca', estado: 'PE', status: 'ativa', version: 1 },
    { nome: 'Filial Salvador', tipo: 'Filial', cidade: 'Salvador', estado: 'BA', status: 'ativa', version: 1 },
    { nome: 'Filial Fortaleza', tipo: 'Filial', cidade: 'Fortaleza', estado: 'CE', status: 'inativa', version: 1 },
    ...CIDADES.slice(0, 6).map(([cidade, estado], i) => ({
      nome: `${i % 2 ? 'CD' : 'Filial'} ${cidade}`,
      tipo: i % 2 ? 'Centro de distribuição' : 'Filial',
      cidade,
      estado,
      status: rand() > 0.25 ? 'ativa' : 'inativa',
      version: 1,
    })),
  ];

  return {
    usuarios,
    clientes,
    categorias,
    seguradoras,
    pedidos,
    apolices,
    remessas,
    eventos,
    ocorrencias,
    notificacoes,
    sinistros,
    documentos,
    atendimentos,
    feedbacks,
    auditoria,
    unidades,
  };
}

function seedIfEmpty({ get, run, transaction }) {
  const existe = get('SELECT COUNT(*) AS total FROM USUARIO');
  if (existe && existe.total > 0) return false;

  const d = gerarDadosSeed();

  transaction(() => {
    for (const u of d.usuarios) {
      run(
        `INSERT INTO USUARIO (id_usuario, nome_completo, email_corporativo, senha_hash, perfil, data_cadastro, ativo, cliente_id_cliente)
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`,
        u.id_usuario,
        u.nome_completo,
        u.email_corporativo,
        u.senha_hash,
        u.perfil,
        u.data_cadastro,
        u.ativo
      );
    }

    for (const c of d.clientes) {
      run(
        `INSERT INTO CLIENTE (id_cliente, id_usuario, data_nascimento, nome_completo, tipo_vinculo, frequencia_compra, faixa_gasto_medio)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        c.id_cliente,
        c.id_usuario,
        c.data_nascimento,
        c.nome_completo,
        c.tipo_vinculo,
        c.frequencia_compra,
        c.faixa_gasto_medio
      );
      run('UPDATE USUARIO SET cliente_id_cliente = ? WHERE id_usuario = ?', c.id_cliente, c.id_usuario);
    }

    for (const cat of d.categorias) {
      run('INSERT INTO CATEGORIA_PRODUTO (id_categoria, descricao) VALUES (?, ?)', cat.id_categoria, cat.descricao);
    }

    for (const s of d.seguradoras) {
      run('INSERT INTO SEGURADORA (id_seguradora, razao_social, contato) VALUES (?, ?, ?)', s.id_seguradora, s.razao_social, s.contato);
    }

    for (const p of d.pedidos) {
      run(
        `INSERT INTO PEDIDO (id_pedido, id_cliente, data_compra, valor_declarado, status, retido_analise, motivo_retencao, id_categoria, nome_produto, loja)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        p.id_pedido,
        p.id_cliente,
        p.data_compra,
        p.valor_declarado,
        p.status,
        p.retido_analise,
        p.motivo_retencao,
        p.id_categoria,
        p.nome_produto,
        p.loja
      );
    }

    for (const a of d.apolices) {
      run(
        `INSERT INTO APOLICE (id_apolice, id_seguradora, valor_segurado, vigencia_inicio, vigencia_fim, coberturas, valor_premio)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        a.id_apolice,
        a.id_seguradora,
        a.valor_segurado,
        a.vigencia_inicio,
        a.vigencia_fim,
        a.coberturas,
        a.valor_premio
      );
    }

    for (const r of d.remessas) {
      run(
        `INSERT INTO REMESSA (id_remessa, codigo_rastreio, data_envio, previsao_entrega, status_entrega, id_pedido, id_apolice, transportadora, origem, destino, cep_destino)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        r.id_remessa,
        r.codigo_rastreio,
        r.data_envio,
        r.previsao_entrega,
        r.status_entrega,
        r.id_pedido,
        r.id_apolice,
        r.transportadora,
        r.origem,
        r.destino,
        r.cep_destino
      );
    }

    for (const e of d.eventos) {
      run(
        `INSERT INTO EVENTO_RASTREIO (id_evento, id_remessa, data_hora, descricao, localizacao)
         VALUES (?, ?, ?, ?, ?)`,
        e.id_evento,
        e.id_remessa,
        e.data_hora,
        e.descricao,
        e.localizacao
      );
    }

    for (const o of d.ocorrencias) {
      run(
        `INSERT INTO OCORRENCIA (id_ocorrencia, id_remessa, tipo, data_ocorrencia, descricao)
         VALUES (?, ?, ?, ?, ?)`,
        o.id_ocorrencia,
        o.id_remessa,
        o.tipo,
        o.data_ocorrencia,
        o.descricao
      );
    }

    for (const n of d.notificacoes) {
      run(
        `INSERT INTO NOTIFICACAO (id_notificacao, cliente_id_cliente, tipo, canal, data_envio, lida, id_ocorrencia)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        n.id_notificacao,
        n.cliente_id_cliente,
        n.tipo,
        n.canal,
        n.data_envio,
        n.lida,
        n.id_ocorrencia
      );
    }

    for (const s of d.sinistros) {
      run(
        `INSERT INTO SINISTRO (id_sinistro, data_abertura, status, valor_indenizado, data_encerramento, etapa_mais_dificil, motivo_nao_acionamento, ocorrencia_id_ocorrencia, id_apolice)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        s.id_sinistro,
        s.data_abertura,
        s.status,
        s.valor_indenizado,
        s.data_encerramento,
        s.etapa_mais_dificil,
        s.motivo_nao_acionamento,
        s.ocorrencia_id_ocorrencia,
        s.id_apolice
      );
    }

    for (const doc of d.documentos) {
      run(
        `INSERT INTO DOCUMENTO (id_documento, id_sinistro, tipo, arquivo, data_envio, validado)
         VALUES (?, ?, ?, ?, ?, ?)`,
        doc.id_documento,
        doc.id_sinistro,
        doc.tipo,
        doc.arquivo,
        doc.data_envio,
        doc.validado
      );
    }

    for (const at of d.atendimentos) {
      run(
        `INSERT INTO ATENDIMENTO (id_atendimento, cliente_id_cliente, canal, data_hora, assunto, resolvido, exigiu_repetir_informacao, atendido_por, id_pedido)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        at.id_atendimento,
        at.cliente_id_cliente,
        at.canal,
        at.data_hora,
        at.assunto,
        at.resolvido,
        at.exigiu_repetir_informacao,
        at.atendido_por,
        at.id_pedido
      );
    }

    for (const f of d.feedbacks) {
      run(
        `INSERT INTO FEEDBACK (id_feedback, data, cliente_id_cliente, relato_problema, solucao_esperada, nivel_compreensao_seguro, momento_conhecimento_seguro, aceita_assistente_virtual)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        f.id_feedback,
        f.data,
        f.cliente_id_cliente,
        f.relato_problema,
        f.solucao_esperada,
        f.nivel_compreensao_seguro,
        f.momento_conhecimento_seguro,
        f.aceita_assistente_virtual
      );
    }

    for (const log of d.auditoria) {
      run(
        `INSERT INTO AUDITORIA (id_log, id_usuario, entidade, id_registro, acao, data_hora)
         VALUES (?, ?, ?, ?, ?, ?)`,
        log.id_log,
        log.id_usuario,
        log.entidade,
        log.id_registro,
        log.acao,
        log.data_hora
      );
    }

    for (const un of d.unidades) {
      run(
        `INSERT INTO UNIDADE (nome, tipo, cidade, estado, status, version)
         VALUES (?, ?, ?, ?, ?, ?)`,
        un.nome,
        un.tipo,
        un.cidade,
        un.estado,
        un.status,
        un.version
      );
    }
  });

  return true;
}

module.exports = { RATE, gerarDadosSeed, seedIfEmpty };
