export type PerfilUsuario = 'admin' | 'cliente';

export interface User {
  id_usuario: string;
  nome_completo: string;
  email_corporativo: string;
  perfil: PerfilUsuario | string;
  ativo: boolean;
  data_cadastro: string;
  cliente_id_cliente: string | null;
}

export interface ClientePerfil {
  id_cliente: string;
  id_usuario: string;
  data_nascimento: string | null;
  nome_completo: string;
  tipo_vinculo: string | null;
  frequencia_compra: string | null;
  faixa_gasto_medio: string | null;
}

export interface Session {
  token: string;
  user: User;
}

export interface SetupStatus {
  needsSetup: boolean;
}

export interface RegisterPayload {
  nome_completo: string;
  email_corporativo: string;
  password: string;
  data_nascimento?: string;
  tipo_vinculo?: string;
  frequencia_compra?: string;
  faixa_gasto_medio?: string;
}

export interface UpdateProfilePayload {
  nome_completo: string;
  data_nascimento?: string;
  tipo_vinculo?: string;
  frequencia_compra?: string;
  faixa_gasto_medio?: string;
}

export interface ChangePasswordPayload {
  senha_atual: string;
  nova_senha: string;
}

export interface PedidoItem {
  id_pedido: string;
  id_cliente: string;
  cliente_nome: string;
  data_compra: string;
  valor_declarado: number;
  status: string;
  retido_analise: boolean;
  motivo_retencao: string | null;
  id_categoria: string | null;
  categoria_descricao: string | null;
  nome_produto: string;
  loja: string | null;
  id_remessa: string | null;
  codigo_rastreio: string | null;
  data_envio: string | null;
  previsao_entrega: string | null;
  status_entrega: string | null;
  transportadora: string | null;
  origem: string | null;
  destino: string | null;
  cep_destino: string | null;
  id_apolice: string | null;
  id_seguradora: string | null;
  valor_segurado: number;
  valor_premio: number;
  vigencia_inicio: string | null;
  vigencia_fim: string | null;
  coberturas: string | null;
  seguradora_razao_social: string | null;
  seguradora_contato: string | null;
}

export interface CreatePedidoPayload {
  nome_produto: string;
  id_categoria?: string;
  valor_declarado: number;
  loja?: string;
  data_compra?: string;
  id_seguradora?: string;
  coberturas?: string;
  transportadora?: string;
  codigo_rastreio?: string;
  origem?: string;
  cep_destino?: string;
  destino?: string;
  id_cliente?: string;
}

export interface UpdatePedidoPayload {
  status?: string;
  status_entrega?: string;
  retido_analise?: boolean;
  motivo_retencao?: string;
  previsao_entrega?: string;
}

export interface EventoRastreioItem {
  id_evento: string;
  id_remessa: string;
  data_hora: string;
  descricao: string;
  localizacao: string | null;
}

export interface OcorrenciaResumo {
  id_ocorrencia: string;
  id_remessa?: string;
  tipo: string;
  data_ocorrencia: string;
  descricao: string;
  codigo_rastreio?: string;
  id_pedido?: string;
  nome_produto?: string;
}

export interface PublicTrackingData {
  codigo_rastreio: string;
  status_entrega: string;
  retido_analise: boolean;
  data_envio: string | null;
  previsao_entrega: string | null;
  transportadora: string;
  origem: string;
  destino: string;
  eventos: EventoRastreioItem[];
  ocorrencias: OcorrenciaResumo[];
}

export interface TrackingData extends PedidoItem {
  eventos: EventoRastreioItem[];
  ocorrencias: OcorrenciaResumo[];
}

export interface DashboardResponse {
  totais: {
    totalPedidos: number;
    valorDeclaradoTotal: number;
    valorPremioTotal: number;
    emTransito: number;
    aguardando: number;
    entregues: number;
    retidosAnalise: number;
    ocorrenciasTotal: number;
    sinistrosAtivos: number;
    notificacoesNaoLidas: number;
  };
  proximaEntrega: PedidoItem | null;
  ultimasOcorrencias: OcorrenciaResumo[];
}

export interface CategoriaItem {
  id_categoria: string;
  descricao: string;
  total_pedidos?: number;
}

export interface SeguradoraItem {
  id_seguradora: string;
  razao_social: string;
  contato: string | null;
  total_apolices?: number;
}

export interface ApoliceItem {
  id_apolice: string;
  id_seguradora: string;
  seguradora_razao_social: string;
  seguradora_contato: string | null;
  valor_segurado: number;
  valor_premio: number | null;
  vigencia_inicio: string;
  vigencia_fim: string;
  coberturas: string;
  id_remessa: string | null;
  codigo_rastreio: string | null;
  id_pedido: string | null;
  nome_produto: string | null;
  cliente_nome?: string | null;
}

export interface DocumentoItem {
  id_documento: string;
  id_sinistro: string;
  tipo: string;
  arquivo: string;
  data_envio: string;
  validado: boolean;
}

export interface SinistroItem {
  id_sinistro: string;
  data_abertura: string;
  status: string;
  valor_indenizado: number | null;
  data_encerramento: string | null;
  etapa_mais_dificil: string | null;
  motivo_nao_acionamento: string | null;
  ocorrencia_id_ocorrencia: string;
  id_apolice: string;
  ocorrencia_tipo: string;
  ocorrencia_descricao: string;
  codigo_rastreio: string;
  id_pedido: string;
  nome_produto: string | null;
  cliente_nome: string;
  valor_segurado: number;
  seguradora_razao_social: string;
  documentos: DocumentoItem[];
}

export interface OcorrenciaItem {
  id_ocorrencia: string;
  id_remessa: string;
  tipo: string;
  data_ocorrencia: string;
  descricao: string;
  codigo_rastreio: string;
  id_apolice: string | null;
  id_pedido: string;
  nome_produto: string | null;
  cliente_nome: string;
}

export interface AtendimentoItem {
  id_atendimento: string;
  cliente_id_cliente: string;
  cliente_nome: string;
  canal: string;
  data_hora: string;
  assunto: string;
  resolvido: boolean;
  exigiu_repetir_informacao: string | null;
  atendido_por: string | null;
  id_pedido: string | null;
  nome_produto: string | null;
}

export interface FeedbackItem {
  id_feedback: string;
  data: string;
  cliente_id_cliente: string;
  cliente_nome: string;
  relato_problema: string | null;
  solucao_esperada: string | null;
  nivel_compreensao_seguro: string | null;
  momento_conhecimento_seguro: string | null;
  aceita_assistente_virtual: string | null;
}

export interface NotificacaoItem {
  id_notificacao: string;
  cliente_id_cliente: string;
  cliente_nome?: string;
  tipo: string;
  canal: string;
  data_envio: string;
  lida: boolean;
  id_ocorrencia: string | null;
  ocorrencia_tipo?: string | null;
  ocorrencia_descricao?: string | null;
}

export interface NotificacoesResponse {
  items: NotificacaoItem[];
  naoLidas: number;
}

export interface UnidadeItem {
  id_unidade: number;
  nome: string;
  tipo: string;
  cidade: string;
  estado: string;
  status: string;
  version: number;
}

export interface LogAuditoria {
  id_log: string;
  id_usuario: string;
  entidade: string;
  id_registro: string;
  acao: string;
  data_hora: string;
  usuario_nome: string;
  usuario_email: string;
  usuario_perfil: string;
}

export interface UsuarioAdminItem {
  id_usuario: string;
  nome_completo: string;
  email_corporativo: string;
  perfil: string;
  data_cadastro: string;
  ativo: boolean;
  cliente_id_cliente: string | null;
  id_cliente: string | null;
  data_nascimento: string | null;
  tipo_vinculo: string | null;
  frequencia_compra: string | null;
  faixa_gasto_medio: string | null;
}

export interface CreateUserPayload {
  nome_completo: string;
  email_corporativo: string;
  password: string;
  perfil: 'admin' | 'cliente';
  tipo_vinculo?: string;
}
