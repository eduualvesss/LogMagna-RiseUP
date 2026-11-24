'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { ReactNode, ChangeEvent, FormEvent, CSSProperties } from 'react';
import { Spinner, Skeleton, TableSkeleton, PageSkeleton } from './components/Loading';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { authFetch, clearSession, useRequireAuth } from './lib/auth';
import { API_URL } from './lib/config';
import { brl, formatarData, formatarDataExtenso, formatarDataHora } from './lib/format';
import type { User } from './lib/auth';
import {
  LayoutDashboard, ShieldCheck, PackageSearch, PlusCircle,
  Truck, Box, CheckCircle, Info, ArrowRight, Search,
  Laptop, Headphones, Camera, Leaf, ChevronRight, LogOut,
  Bell, FileWarning, MessageSquare, ClipboardList, Building2,
  AlertTriangle, X, Shield, Calendar, MapPin
} from 'lucide-react';
import boxesImg from './assets/boxes.jpg';

// --- TIPOS ---

export interface PedidoItem {
  id: string;
  id_pedido: string;
  id_cliente: string;
  cliente_nome?: string;
  name: string;
  nome_produto: string;
  value: number;
  valor_declarado: number;
  cost: number;
  valor_premio: number;
  status: string;
  retido_analise: boolean;
  motivo_retencao: string | null;
  id_categoria: string | null;
  categoria_descricao?: string | null;
  loja: string | null;
  store: string;
  data_compra: string;
  data_envio?: string | null;
  purchaseDate: string;
  id_remessa: string | null;
  tracking: string;
  codigo_rastreio: string | null;
  previsao_entrega: string | null;
  status_entrega: string | null;
  transportadora: string | null;
  origin: string;
  origem: string | null;
  destination: string;
  destino: string | null;
  cep: string;
  cep_destino: string | null;
  id_apolice: string | null;
  id_seguradora: string | null;
  valor_segurado: number;
  vigencia_inicio?: string | null;
  vigencia_fim?: string | null;
  coberturas?: string | null;
  seguradora_razao_social?: string | null;
  seguradora_contato?: string | null;
}

interface TrackingEvent {
  id_evento?: string;
  status: string;
  location: string;
  date: string;
  data_hora?: string;
  current?: boolean;
}

interface OcorrenciaResumo {
  id_ocorrencia: string;
  id_remessa: string;
  tipo: string;
  data_ocorrencia: string;
  descricao: string;
  codigo_rastreio?: string;
  id_pedido?: string;
  nome_produto?: string;
}

interface TrackingData extends PedidoItem {
  ocorrencias: OcorrenciaResumo[];
  history: TrackingEvent[];
}

interface DashboardResponse {
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

interface Categoria {
  id_categoria: string;
  descricao: string;
}

interface Seguradora {
  id_seguradora: string;
  razao_social: string;
  contato: string | null;
}

type ProductForm = {
  name: string;
  id_categoria: string;
  value: string;
  store: string;
  purchaseDate: string;
  id_seguradora: string;
  coberturas: string;
  transportadora: string;
  tracking: string;
  origin: string;
  cep: string;
  destination: string;
};

// --- CONTEXTOS E HELPERS ---

const UserContext = createContext<User | null>(null);
const NotifContext = createContext<{ naoLidas: number; refreshNotificacoes: () => void }>({
  naoLidas: 0,
  refreshNotificacoes: () => {},
});

export const useUser = () => useContext(UserContext);
export const useNotificacoesHeader = () => useContext(NotifContext);

const iniciais = (nome: string) =>
  nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

const saudacao = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
};

function statusBadgeClass(status: string, retido?: boolean): string {
  if (retido) return 'bg-amber-100 text-amber-800';
  if (status === 'Em trânsito') return 'bg-green-100 text-green-800';
  if (status === 'Entregue') return 'bg-gray-100 text-gray-800';
  if (status === 'Retido') return 'bg-amber-100 text-amber-800';
  if (status === 'Cancelado') return 'bg-red-100 text-red-800';
  return 'bg-yellow-50 text-yellow-800';
}

export const Logo = ({ className = 'w-10 h-10 text-[#3f6b4d]' }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <path d="M70 14 A38 38 0 1 0 70 86" />
    <path d="M36 33 H66 L61 56 M63 38 H77 C84 38 88 44 88 49 L85 58 H82 M36 58 H62" />
    <circle cx="43" cy="58" r="7" />
    <circle cx="73" cy="58" r="7" />
    <path d="M28 40 H38 M26 47 H38 M24 54 H38" />
  </svg>
);

const Sidebar = () => {
  const pathname = usePathname();
  const user = useUser();
  const { naoLidas } = useNotificacoesHeader();

  const grupos = [
    {
      titulo: 'Operação',
      itens: [
        { path: '/dashboard', label: 'Visão geral', icon: LayoutDashboard },
        { path: '/services', label: 'Pedidos e seguros', icon: ShieldCheck },
        { path: '/tracking', label: 'Rastrear encomenda', icon: PackageSearch },
        { path: '/add', label: 'Novo pedido', icon: PlusCircle },
      ],
    },
    {
      titulo: 'Proteção',
      itens: [
        { path: '/apolices', label: 'Apólices e seguradoras', icon: Shield },
        { path: '/sinistros', label: 'Sinistros e ocorrências', icon: FileWarning },
      ],
    },
    {
      titulo: 'Gestão e Suporte',
      itens: [
        { path: '/atendimentos', label: 'Atendimentos e feedback', icon: MessageSquare },
        { path: '/notificacoes', label: 'Notificações', icon: Bell, badge: naoLidas },
        { path: '/unidades', label: 'Unidades logísticas', icon: Building2 },
        { path: '/auditoria', label: 'Auditoria e conta', icon: ClipboardList },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-[#1a3326] text-white flex flex-col h-screen fixed left-0 top-0 z-20">
      <div className="p-6 pb-4 flex items-center gap-3 shrink-0">
        <Logo className="w-9 h-9 text-white" />
        <span className="text-xl font-bold tracking-wider">LOGMAGNA</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 pb-4 space-y-5">
        {grupos.map((grupo) => (
          <div key={grupo.titulo}>
            <div className="px-3 mb-1.5 text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
              {grupo.titulo}
            </div>
            <div className="space-y-1">
              {grupo.itens.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive ? 'bg-[#2d4a3e] text-white' : 'text-gray-300 hover:bg-[#2d4a3e]/50'
                    }`}
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <item.icon size={18} className="shrink-0" />
                      <span className="text-sm font-medium truncate">{item.label}</span>
                    </span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-400 text-[#1a3326]">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700 flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-full bg-[#2d4a3e] flex items-center justify-center text-xs font-bold shrink-0">
          {user ? iniciais(user.nome) : ''}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{user?.nome}</p>
          <p className="text-xs text-gray-400 capitalize truncate">
            {user?.papel} • {user?.cliente_id_cliente || user?.id}
          </p>
        </div>
      </div>
    </aside>
  );
};

const TopBar = ({ title, user }: { title: string; user: User }) => {
  const router = useRouter();
  const { naoLidas } = useNotificacoesHeader();
  const sair = () => {
    clearSession();
    router.replace('/login');
  };

  return (
    <header className="bg-[#1a3326] h-16 flex items-center justify-between px-8 text-white sticky top-0 z-10">
      <div className="flex items-center gap-2 text-sm text-gray-300">
        <span>Plataforma Magna</span>
        <span>/</span>
        <span className="text-white font-medium">{title}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="hidden sm:inline-block px-3 py-1 bg-[#2d4a3e] rounded-full text-xs border border-gray-600">
          Banco Magna • SQLite
        </span>
        <Link
          href="/notificacoes"
          aria-label="Notificações"
          className="relative p-2 rounded-lg hover:bg-white/10 transition text-gray-200"
        >
          <Bell size={18} />
          {naoLidas > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-[#1a3326] text-[10px] font-bold flex items-center justify-center">
              {naoLidas}
            </span>
          )}
        </Link>
        <span className="text-sm text-gray-200 hidden md:inline">{user.nome}</span>
        <button onClick={sair} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border border-gray-600 hover:bg-white/10 transition">
          <LogOut size={16} /> Sair
        </button>
      </div>
    </header>
  );
};

export const Layout = ({ children, title }: { children: ReactNode; title: string }) => {
  const user = useRequireAuth();
  const [naoLidas, setNaoLidas] = useState(0);

  const refreshNotificacoes = useCallback(() => {
    authFetch(`${API_URL}/notificacoes?lida=0`)
      .then((res) => (res.ok ? res.json() : { naoLidas: 0 }))
      .then((data) => setNaoLidas(Number(data?.naoLidas || 0)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user) refreshNotificacoes();
  }, [user, refreshNotificacoes]);

  if (!user) return <PageSkeleton />;

  return (
    <UserContext.Provider value={user}>
      <NotifContext.Provider value={{ naoLidas, refreshNotificacoes }}>
        <div className="flex bg-[#f4f6f5] min-h-screen">
          <Sidebar />
          <div className="ml-64 flex-1 flex flex-col min-w-0">
            <TopBar title={title} user={user} />
            <main className="p-8 flex-1 overflow-y-auto animate-fade-in-up">
              {children}
            </main>
            <footer className="p-5 text-center text-xs text-gray-500 border-t border-gray-200 bg-white">
              LogMagna • Banco relacional Magna (16 tabelas) integrado via API REST Express + SQLite
            </footer>
          </div>
        </div>
      </NotifContext.Provider>
    </UserContext.Provider>
  );
};

// --- PÁGINAS ---

const DashboardContent = () => {
  const user = useUser();
  const [dash, setDash] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch(`${API_URL}/dashboard`)
      .then((res) => res.json())
      .then((data) => setDash(data))
      .catch((err: Error) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const t = dash?.totais;
  const proxima = dash?.proximaEntrega ?? null;
  const ocorrencias = dash?.ultimasOcorrencias ?? [];

  return (
    <>
      <div className="mb-8 flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{saudacao()}, {user?.nome.split(' ')[0]}.</h1>
          <p className="text-gray-500 mt-1">
            {user?.papel === 'admin'
              ? 'Visão consolidada de todos os clientes, pedidos, apólices e sinistros no banco Magna.'
              : 'Acompanhe seus pedidos, apólices de seguro, remessas e ocorrências em tempo real.'}
          </p>
        </div>
        <Link href="/add" className="bg-[#1a3326] text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-[#2d4a3e] transition text-sm font-medium">
          <PlusCircle size={18} /> Cadastrar pedido
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {
            label: 'Pedidos ativos',
            value: String(t?.totalPedidos ?? 0),
            sub: `${t?.entregues ?? 0} entregues • ${t?.retidosAnalise ?? 0} retidos`,
            icon: ShieldCheck,
          },
          {
            label: 'Valor segurado',
            value: brl(t?.valorDeclaradoTotal ?? 0),
            sub: `Prêmios: ${brl(t?.valorPremioTotal ?? 0)}`,
            icon: Box,
          },
          {
            label: 'Entregas pendentes',
            value: String((t?.emTransito ?? 0) + (t?.aguardando ?? 0)),
            sub: `${t?.emTransito ?? 0} em trânsito • ${t?.aguardando ?? 0} aguardando`,
            icon: Truck,
          },
          {
            label: 'Sinistros e ocorrências',
            value: String(t?.sinistrosAtivos ?? 0),
            sub: `${t?.ocorrenciasTotal ?? 0} ocorrências • ${t?.notificacoesNaoLidas ?? 0} avisos novos`,
            icon: FileWarning,
          },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <span className="text-sm text-gray-500 font-medium">{stat.label}</span>
              <stat.icon size={20} className="text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {loading ? <Skeleton className="h-9 w-32" /> : stat.value}
            </div>
            <div className="text-xs text-gray-400">{loading ? <Skeleton className="h-4 w-40 mt-1" /> : stat.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Next Delivery */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-gray-900">Sua próxima entrega</h3>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadgeClass(proxima?.status || '', proxima?.retido_analise)}`}>
              {proxima ? (proxima.retido_analise ? 'Retido em análise' : proxima.status) : '—'}
            </span>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gray-50 rounded-lg"><Laptop size={24} className="text-gray-600" /></div>
            <div>
              <h4 className="font-bold text-gray-900">
                {loading ? 'Carregando...' : proxima?.name ?? 'Nenhuma entrega pendente'}
              </h4>
              <p className="text-xs text-gray-500">
                {proxima ? `${proxima.id_pedido} • ${proxima.codigo_rastreio || 'Sem rastreio'} • ${proxima.seguradora_razao_social || ''}` : ''}
              </p>
            </div>
          </div>

          <div className="relative flex items-center justify-between mb-6 px-4">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -z-10" />
            <div className="bg-white px-2 text-sm font-medium text-gray-700">{proxima?.origin ?? '—'}</div>
            <Truck size={20} className="text-[#1a3326] bg-white p-1 rounded-full" />
            <div className="bg-white px-2 text-sm font-medium text-gray-700">{proxima?.destination ?? '—'}</div>
          </div>

          <div className="flex flex-wrap justify-between items-center gap-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500">Previsão de entrega</p>
              <p className="font-bold text-gray-900">
                {proxima?.previsao_entrega ? formatarDataExtenso(proxima.previsao_entrega) : '—'}
              </p>
            </div>
            <Link
              href={proxima?.tracking ? `/tracking?code=${encodeURIComponent(proxima.tracking)}` : '/tracking'}
              className="border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
            >
              Ver rastreio <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* CTA Card */}
        <div className="bg-[#e8f0eb] p-6 rounded-xl flex flex-col justify-center">
          <Leaf size={32} className="text-[#1a3326] mb-4" />
          <h3 className="text-xl font-bold text-[#1a3326] mb-2">Nova compra ou sinistro?<br />Tudo integrado.</h3>
          <p className="text-sm text-gray-600 mb-6">
            Cada pedido cadastrado gera automaticamente uma apólice, remessa rastreável e evento inicial no banco Magna.
          </p>
          <div className="space-y-2">
            <Link href="/add" className="bg-[#1a3326] text-white px-4 py-2.5 rounded-lg text-center text-sm font-medium hover:bg-[#2d4a3e] transition flex items-center justify-center gap-2">
              <PlusCircle size={18} /> Cadastrar novo pedido
            </Link>
            <Link href="/sinistros" className="bg-white text-[#1a3326] border border-[#1a3326]/20 px-4 py-2.5 rounded-lg text-center text-sm font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2">
              <FileWarning size={18} /> Gerenciar sinistros
            </Link>
          </div>
        </div>
      </div>

      {/* Últimas Ocorrências */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-gray-900">Ocorrências recentes no transporte</h3>
          <Link href="/sinistros" className="text-sm text-[#3f6b4d] font-medium hover:text-[#1a3326] flex items-center gap-1">
            Ver todas <ChevronRight size={16} />
          </Link>
        </div>
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : ocorrencias.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhuma ocorrência registrada até o momento.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {ocorrencias.map((oc) => (
              <div key={oc.id_ocorrencia} className="py-3 flex flex-wrap justify-between items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs font-medium rounded bg-amber-100 text-amber-800">{oc.tipo}</span>
                    <span className="text-sm font-medium text-gray-900">{oc.nome_produto || oc.id_pedido}</span>
                    <span className="text-xs text-gray-400">({oc.codigo_rastreio})</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{oc.descricao}</p>
                </div>
                <span className="text-xs text-gray-400">{formatarDataHora(oc.data_ocorrencia)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export const Dashboard = () => (
  <Layout title="Visão geral">
    <DashboardContent />
  </Layout>
);

export const Services = () => {
  const [products, setProducts] = useState<PedidoItem[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState<'todos' | 'ativos' | 'entregues' | 'retidos'>('todos');
  const [busca, setBusca] = useState('');
  const [filtroCat, setFiltroCat] = useState('');
  const [selecionado, setSelecionado] = useState<PedidoItem | null>(null);
  const [editStatus, setEditStatus] = useState('Aguardando');
  const [editRetido, setEditRetido] = useState(false);
  const [editMotivo, setEditMotivo] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erroModal, setErroModal] = useState('');

  const carregar = useCallback(() => {
    setLoading(true);
    Promise.all([
      authFetch(`${API_URL}/pedidos`).then((r) => r.json()),
      authFetch(`${API_URL}/categorias`).then((r) => r.json()),
    ])
      .then(([peds, cats]) => {
        setProducts(Array.isArray(peds) ? peds : []);
        setCategorias(Array.isArray(cats) ? cats : []);
      })
      .catch((err: Error) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const abrirDetalhe = (p: PedidoItem) => {
    setSelecionado(p);
    setEditStatus(p.status);
    setEditRetido(Boolean(p.retido_analise));
    setEditMotivo(p.motivo_retencao || '');
    setErroModal('');
  };

  const salvarAlteracaoPedido = async (e: FormEvent) => {
    e.preventDefault();
    if (!selecionado) return;
    setSalvando(true);
    setErroModal('');
    try {
      const resp = await authFetch(`${API_URL}/pedidos/${selecionado.id_pedido}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editStatus,
          retido_analise: editRetido,
          motivo_retencao: editRetido ? editMotivo : '',
        }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || 'Erro ao atualizar pedido.');
      setSelecionado(null);
      carregar();
    } catch (err) {
      setErroModal(err instanceof Error ? err.message : 'Falha ao atualizar.');
    } finally {
      setSalvando(false);
    }
  };

  const termo = busca.trim().toLowerCase();
  const filtrados = products.filter((p) => {
    if (aba === 'ativos' && p.status === 'Entregue') return false;
    if (aba === 'entregues' && p.status !== 'Entregue') return false;
    if (aba === 'retidos' && !p.retido_analise) return false;
    if (filtroCat && p.id_categoria !== filtroCat) return false;
    if (termo) {
      const alvo = `${p.id_pedido} ${p.name} ${p.tracking} ${p.loja || ''} ${p.seguradora_razao_social || ''}`.toLowerCase();
      if (!alvo.includes(termo)) return false;
    }
    return true;
  });

  const totalValor = filtrados.reduce((s, p) => s + p.value, 0);
  const totalCusto = filtrados.reduce((s, p) => s + p.cost, 0);

  return (
    <Layout title="Pedidos e seguros">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pedidos e seguros contratados</h1>
          <p className="text-gray-500 mt-1">Consulte seus pedidos, apólices vinculadas, categorias e status de retenção.</p>
        </div>
        <Link href="/add" className="bg-[#1a3326] text-white px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-[#2d4a3e] transition">
          <PlusCircle size={18} /> Cadastrar pedido
        </Link>
      </div>

      <div className="bg-[#e8f0eb] p-4 rounded-xl flex flex-wrap justify-between items-center gap-4 mb-6 border border-green-100">
        <div className="flex items-center gap-2 text-[#1a3326] font-medium">
          <ShieldCheck size={20} />
          {loading ? <Skeleton className="h-5 w-48" /> : `${filtrados.length} pedido(s) exibido(s) de ${products.length}`}
        </div>
        <div className="text-sm text-gray-600">
          {loading ? (
            <Skeleton className="h-5 w-56" />
          ) : (
            <>Valor declarado: <span className="font-bold">{brl(totalValor)}</span> • Prêmios: <span className="font-bold">{brl(totalCusto)}</span></>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-wrap gap-4 text-sm font-medium text-gray-500">
            {[
              { id: 'todos', label: `Todos (${products.length})` },
              { id: 'ativos', label: `Ativos (${products.filter((p) => p.status !== 'Entregue').length})` },
              { id: 'entregues', label: `Entregues (${products.filter((p) => p.status === 'Entregue').length})` },
              { id: 'retidos', label: `Retidos em análise (${products.filter((p) => p.retido_analise).length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setAba(tab.id as typeof aba)}
                className={`pb-1 transition ${aba === tab.id ? 'text-[#1a3326] border-b-2 border-[#1a3326] font-semibold' : 'hover:text-gray-900'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={filtroCat}
              onChange={(e) => setFiltroCat(e.target.value)}
              aria-label="Filtrar por categoria"
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#1a3326]"
            >
              <option value="">Todas as categorias</option>
              {categorias.map((c) => (
                <option key={c.id_categoria} value={c.id_categoria}>{c.descricao}</option>
              ))}
            </select>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar produto, ID ou rastreio"
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1a3326]"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="p-4">Produto / Pedido</th>
                <th className="p-4">Categoria / Loja</th>
                <th className="p-4">Valor / Prêmio</th>
                <th className="p-4">Apólice / Seguradora</th>
                <th className="p-4">Entrega / Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            {loading ? (
              <TableSkeleton rows={5} cols={6} />
            ) : filtrados.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-gray-500">
                    Nenhum pedido encontrado para os filtros atuais.
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-gray-100">
                {filtrados.map((p, i) => (
                  <tr key={p.id_pedido} style={{ '--i': i } as CSSProperties} className="stagger hover:bg-gray-50 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                          {p.name.includes('Notebook') ? <Laptop size={18} /> : p.name.includes('Fone') ? <Headphones size={18} /> : <Camera size={18} />}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{p.name}</div>
                          <div className="text-xs text-gray-500">
                            {p.id_pedido} • {p.tracking || 'Sem código'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      <div>{p.categoria_descricao || '—'}</div>
                      <div className="text-xs text-gray-400">{p.loja || 'Loja não informada'}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{brl(p.value)}</div>
                      <div className="text-xs text-gray-500">Prêmio: {brl(p.cost)}</div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      <div className="font-medium text-gray-800">{p.id_apolice || 'Sem apólice'}</div>
                      <div className="text-xs text-gray-400">{p.seguradora_razao_social || '—'}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col items-start gap-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadgeClass(p.status)}`}>
                          {p.status}
                        </span>
                        {p.retido_analise && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800 flex items-center gap-1">
                            <AlertTriangle size={11} /> Retido p/ análise
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => abrirDetalhe(p)}
                        className="text-xs font-medium text-[#1a3326] hover:underline mr-3"
                      >
                        Gerenciar
                      </button>
                      {p.tracking && (
                        <Link
                          href={`/tracking?code=${encodeURIComponent(p.tracking)}`}
                          className="text-xs font-medium text-[#3f6b4d] hover:underline"
                        >
                          Rastrear
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
      </div>

      {/* Modal de Gerenciamento do Pedido */}
      {selecionado && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-fade-in" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-lg w-full p-6 animate-pop-in">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selecionado.name}</h2>
                <p className="text-xs text-gray-500">
                  Pedido {selecionado.id_pedido} • Cliente: {selecionado.cliente_nome || selecionado.id_cliente}
                </p>
              </div>
              <button onClick={() => setSelecionado(null)} className="text-gray-400 hover:text-gray-700" aria-label="Fechar">
                <X size={20} />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 text-xs space-y-1.5 mb-5">
              <div className="flex justify-between"><span className="text-gray-500">Rastreio:</span><span className="font-medium">{selecionado.tracking}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Rota:</span><span className="font-medium">{selecionado.origin} → {selecionado.destination}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Apólice:</span><span className="font-medium">{selecionado.id_apolice} ({selecionado.seguradora_razao_social})</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Coberturas:</span><span className="font-medium">{selecionado.coberturas}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Compra / Previsão:</span><span className="font-medium">{formatarData(selecionado.data_compra)} / {formatarData(selecionado.previsao_entrega)}</span></div>
            </div>

            <form onSubmit={salvarAlteracaoPedido} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status do pedido e entrega</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-white focus:outline-none focus:border-[#1a3326]"
                >
                  <option value="Aguardando">Aguardando</option>
                  <option value="Em trânsito">Em trânsito</option>
                  <option value="Entregue">Entregue</option>
                  <option value="Retido">Retido</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editRetido}
                  onChange={(e) => setEditRetido(e.target.checked)}
                  className="accent-[#1a3326] w-4 h-4"
                />
                Marcar pedido como retido para análise
              </label>

              {editRetido && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Motivo da retenção</label>
                  <input
                    type="text"
                    value={editMotivo}
                    onChange={(e) => setEditMotivo(e.target.value)}
                    placeholder="Ex.: Conferência de nota fiscal ou divergência de peso"
                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#1a3326]"
                  />
                </div>
              )}

              {erroModal && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs">{erroModal}</div>}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setSelecionado(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                  Fechar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-4 py-2 bg-[#1a3326] text-white rounded-lg text-sm font-medium hover:bg-[#2d4a3e] disabled:opacity-70 flex items-center gap-2"
                >
                  {salvando && <Spinner size={14} />} Salvar alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export const Tracking = () => {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code')?.trim().toUpperCase() || 'BR123456789SP';

  const [code, setCode] = useState(initialCode);
  const [data, setData] = useState<TrackingData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Formulários operacionais na tela de rastreio
  const [evtDesc, setEvtDesc] = useState('');
  const [evtLoc, setEvtLoc] = useState('');
  const [evtStatus, setEvtStatus] = useState('');
  const [ocoTipo, setOcoTipo] = useState('Atraso operacional');
  const [ocoDesc, setOcoDesc] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [savingAction, setSavingAction] = useState(false);

  const buscarPorCodigo = useCallback((codigoAlvo: string) => {
    const limpo = codigoAlvo.trim();
    if (!limpo) return;
    setError('');
    setLoading(true);
    fetch(`${API_URL}/tracking/${encodeURIComponent(limpo)}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Erro ao rastrear.');
        setData(json);
      })
      .catch((err: Error) => {
        setData(null);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setCode(initialCode);
    buscarPorCodigo(initialCode);
  }, [initialCode, buscarPorCodigo]);

  const registrarEvento = async (e: FormEvent) => {
    e.preventDefault();
    if (!data?.id_remessa || !evtDesc.trim()) return;
    setSavingAction(true);
    setActionMsg('');
    try {
      const resp = await authFetch(`${API_URL}/remessas/${data.id_remessa}/eventos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descricao: evtDesc.trim(),
          localizacao: evtLoc.trim() || data.destination,
          status_entrega: evtStatus || undefined,
        }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || 'Erro ao registrar movimentação.');
      setEvtDesc('');
      setEvtLoc('');
      setEvtStatus('');
      setActionMsg('Movimentação registrada no histórico da remessa.');
      buscarPorCodigo(data.codigo_rastreio || code);
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : 'Erro ao salvar evento.');
    } finally {
      setSavingAction(false);
    }
  };

  const registrarOcorrencia = async (e: FormEvent) => {
    e.preventDefault();
    if (!data?.id_remessa || !ocoDesc.trim()) return;
    setSavingAction(true);
    setActionMsg('');
    try {
      const resp = await authFetch(`${API_URL}/ocorrencias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_remessa: data.id_remessa,
          tipo: ocoTipo,
          descricao: ocoDesc.trim(),
        }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || 'Erro ao registrar ocorrência.');
      setOcoDesc('');
      setActionMsg('Ocorrência registrada e notificação gerada para o cliente.');
      buscarPorCodigo(data.codigo_rastreio || code);
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : 'Erro ao salvar ocorrência.');
    } finally {
      setSavingAction(false);
    }
  };

  return (
    <Layout title="Rastrear encomenda">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Rastrear encomenda</h1>
        <p className="text-gray-500 mt-1">Consulte remessas, eventos de rastreio, ocorrências e apólice vinculada no banco Magna.</p>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); buscarPorCodigo(code); }}
        className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-8 flex flex-wrap gap-4"
      >
        <div className="flex-1 min-w-[240px] relative">
          <label className="block text-xs font-medium text-gray-700 mb-1">Código de rastreio</label>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a3326]"
              placeholder="Ex: BR123456789SP"
            />
          </div>
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#1a3326] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#2d4a3e] disabled:opacity-70 disabled:cursor-wait transition flex items-center gap-2 h-[46px]"
          >
            {loading ? <Spinner /> : <ArrowRight size={18} />} {loading ? 'Rastreando...' : 'Rastrear encomenda'}
          </button>
        </div>
      </form>

      {error && <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
      {actionMsg && <div className="mb-6 p-4 rounded-lg bg-[#e8f0eb] text-[#1a3326] text-sm animate-pop-in">{actionMsg}</div>}

      {loading && (
        <div className="grid grid-cols-3 gap-6" aria-busy="true">
          <div className="col-span-2 space-y-6">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-72 w-full" />
          </div>
          <Skeleton className="h-72 w-full" />
        </div>
      )}

      {!loading && data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#e8f0eb] p-6 rounded-xl border border-green-100">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-3">
                  <Truck className="text-[#1a3326]" />
                  <h2 className="text-xl font-bold text-[#1a3326]">
                    Status atual: {data.status_entrega || data.status}
                  </h2>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white text-[#1a3326]">
                  {data.codigo_rastreio}
                </span>
              </div>
              <p className="text-sm text-gray-700 ml-9">
                Previsão de entrega: <strong>{formatarDataExtenso(data.previsao_entrega)}</strong>
              </p>
              {data.retido_analise && (
                <div className="mt-3 ml-9 p-2.5 rounded-lg bg-amber-100 text-amber-900 text-xs flex items-center gap-2">
                  <AlertTriangle size={15} />
                  <span>Pedido retido em análise: {data.motivo_retencao || 'Em conferência documental'}</span>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-3 ml-9">
                Última atualização: {data.history[0]?.date || formatarDataHora(data.data_envio)} • Remessa {data.id_remessa}
              </p>
            </div>

            {/* Timeline de EVENTO_RASTREIO */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-lg mb-6">Histórico de movimentações (EVENTO_RASTREIO)</h3>
              <div className="space-y-8 relative pl-4 border-l-2 border-gray-100 ml-2">
                {data.history.map((h, i) => (
                  <div key={h.id_evento || i} style={{ '--i': i } as CSSProperties} className="stagger relative pl-6">
                    <div className={`absolute -left-[21px] top-1 w-4 h-4 rounded-full border-2 ${h.current ? 'bg-[#1a3326] border-[#1a3326]' : 'bg-white border-gray-300'}`} />
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className={`font-medium ${h.current ? 'text-[#1a3326]' : 'text-gray-900'}`}>{h.status}</h4>
                        <p className="text-sm text-gray-500">{h.location}</p>
                        {h.current && <span className="inline-block mt-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Última atualização</span>}
                      </div>
                      <span className="text-sm text-gray-400 shrink-0">{h.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ocorrências da remessa */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Ocorrências registradas</h3>
                <Link href="/sinistros" className="text-xs font-medium text-[#3f6b4d] hover:underline">
                  Abrir painel de sinistros →
                </Link>
              </div>
              {data.ocorrencias.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhuma ocorrência registrada para esta remessa.</p>
              ) : (
                <div className="space-y-3">
                  {data.ocorrencias.map((oc) => (
                    <div key={oc.id_ocorrencia} className="p-3 rounded-lg bg-amber-50 border border-amber-100 text-sm">
                      <div className="flex justify-between font-medium text-amber-900">
                        <span>{oc.id_ocorrencia} • {oc.tipo}</span>
                        <span className="text-xs">{formatarDataHora(oc.data_ocorrencia)}</span>
                      </div>
                      <p className="text-xs text-amber-800 mt-1">{oc.descricao}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-lg mb-4">Detalhes da encomenda</h3>
              <div className="flex items-center gap-3 mb-5 pb-5 border-b border-gray-100">
                <Laptop className="text-gray-600 shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">{data.name}</div>
                  <div className="text-xs text-gray-400">{data.categoria_descricao || 'Categoria geral'}</div>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-2"><span className="text-gray-500">Pedido</span><span className="font-medium">{data.id_pedido}</span></div>
                <div className="flex justify-between gap-2"><span className="text-gray-500">Transportadora</span><span className="font-medium">{data.transportadora || 'LogMagna Express'}</span></div>
                <div className="flex justify-between gap-2"><span className="text-gray-500">Origem</span><span className="font-medium text-right">{data.origin}</span></div>
                <div className="flex justify-between gap-2"><span className="text-gray-500">Destino</span><span className="font-medium text-right">{data.destination}</span></div>
                <div className="flex justify-between gap-2"><span className="text-gray-500">Apólice</span><span className="font-medium">{data.id_apolice || '—'}</span></div>
                <div className="flex justify-between gap-2"><span className="text-gray-500">Seguradora</span><span className="font-medium text-right">{data.seguradora_razao_social || '—'}</span></div>
                <div className="flex justify-between gap-2"><span className="text-gray-500">Valor declarado</span><span className="font-bold">{brl(data.value)}</span></div>
              </div>
            </div>

            {/* Form: Nova movimentação */}
            <form onSubmit={registrarEvento} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
              <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <MapPin size={16} className="text-[#1a3326]" /> Registrar movimentação
              </h4>
              <input
                type="text"
                value={evtDesc}
                onChange={(e) => setEvtDesc(e.target.value)}
                placeholder="Ex.: Chegou ao centro de distribuição"
                className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:border-[#1a3326]"
                required
              />
              <input
                type="text"
                value={evtLoc}
                onChange={(e) => setEvtLoc(e.target.value)}
                placeholder="Localização (ex.: CD Recife, PE)"
                className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:border-[#1a3326]"
              />
              <select
                value={evtStatus}
                onChange={(e) => setEvtStatus(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2 text-sm bg-white focus:outline-none focus:border-[#1a3326]"
              >
                <option value="">Manter status atual</option>
                <option value="Aguardando">Atualizar para: Aguardando</option>
                <option value="Em trânsito">Atualizar para: Em trânsito</option>
                <option value="Entregue">Atualizar para: Entregue</option>
                <option value="Retido">Atualizar para: Retido</option>
              </select>
              <button
                type="submit"
                disabled={savingAction}
                className="w-full bg-[#1a3326] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#2d4a3e] disabled:opacity-70"
              >
                Adicionar evento
              </button>
            </form>

            {/* Form: Reportar ocorrência */}
            <form onSubmit={registrarOcorrencia} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
              <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <FileWarning size={16} className="text-amber-700" /> Reportar ocorrência
              </h4>
              <select
                value={ocoTipo}
                onChange={(e) => setOcoTipo(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2 text-sm bg-white focus:outline-none focus:border-[#1a3326]"
              >
                <option value="Atraso operacional">Atraso operacional</option>
                <option value="Avaria na embalagem">Avaria na embalagem</option>
                <option value="Retenção fiscal">Retenção fiscal</option>
                <option value="Extravio">Extravio</option>
              </select>
              <input
                type="text"
                value={ocoDesc}
                onChange={(e) => setOcoDesc(e.target.value)}
                placeholder="Descreva o problema ocorrido"
                className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:border-[#1a3326]"
                required
              />
              <button
                type="submit"
                disabled={savingAction}
                className="w-full border border-amber-700 text-amber-800 py-2 rounded-lg text-sm font-medium hover:bg-amber-50 disabled:opacity-70"
              >
                Registrar ocorrência
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export const AddProduct = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [seguradoras, setSeguradoras] = useState<Seguradora[]>([]);
  const [form, setForm] = useState<ProductForm>(() => ({
    name: 'Mouse Logitech MX Master 3S',
    id_categoria: '',
    value: '550',
    store: 'Logitech Store',
    purchaseDate: new Date().toISOString().slice(0, 10),
    id_seguradora: '',
    coberturas: 'Roubo, extravio e avaria no transporte',
    transportadora: 'LogMagna Express',
    tracking: '',
    origin: 'Campinas, SP',
    cep: '01310-100',
    destination: 'São Paulo / SP',
  }));
  const [criado, setCriado] = useState<PedidoItem | null>(null);
  const [msg, setMsg] = useState('');
  const [erro, setErro] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      authFetch(`${API_URL}/categorias`).then((r) => r.json()),
      authFetch(`${API_URL}/seguradoras`).then((r) => r.json()),
    ])
      .then(([cats, segs]) => {
        const listaCats = Array.isArray(cats) ? cats : [];
        const listaSegs = Array.isArray(segs) ? segs : [];
        setCategorias(listaCats);
        setSeguradoras(listaSegs);
        setForm((prev) => ({
          ...prev,
          id_categoria: prev.id_categoria || listaCats[0]?.id_categoria || '',
          id_seguradora: prev.id_seguradora || listaSegs[0]?.id_seguradora || '',
        }));
      })
      .catch(() => {});
  }, []);

  const set = (k: keyof ProductForm) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const num = Number(String(form.value).replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;

  const submit = () => {
    setMsg('');
    setErro('');
    setSubmitting(true);
    authFetch(`${API_URL}/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        destination: form.destination.replace(/\s*\/\s*/, ', ').trim(),
        value: num,
      }),
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Falha ao cadastrar.');
        setCriado(json);
        setMsg(`Pedido ${json.id_pedido} gravado com apólice ${json.id_apolice} e rastreio ${json.codigo_rastreio}.`);
      })
      .catch((err: Error) => setErro(err.message || 'Falha ao cadastrar.'))
      .finally(() => setSubmitting(false));
  };

  return (
    <Layout title="Cadastrar pedido">
      <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cadastrar novo pedido e apólice</h1>
          <p className="text-gray-500 mt-1">Preencha os dados da compra, escolha a categoria e a seguradora da proteção.</p>
        </div>
        <span className="text-sm text-gray-500">Persistência transacional em PEDIDO + APOLICE + REMESSA</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form className="lg:col-span-2 space-y-6" onSubmit={(e) => { e.preventDefault(); if (!submitting) submit(); }}>
          {/* Dados do Produto */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-lg flex items-center gap-2"><Box size={20} /> Dados do produto</h2>
              <span className="text-xs text-gray-400">* Obrigatórios</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do produto *</label>
                <input type="text" value={form.name} onChange={set('name')} className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-[#1a3326]" required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                  <select value={form.id_categoria} onChange={set('id_categoria')} className="w-full border border-gray-200 rounded-lg p-2.5 bg-white focus:outline-none focus:border-[#1a3326]">
                    {categorias.map((c) => (
                      <option key={c.id_categoria} value={c.id_categoria}>{c.descricao}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor declarado (R$) *</label>
                  <input type="text" value={form.value} onChange={set('value')} className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-[#1a3326]" required />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loja / vendedor *</label>
                  <input type="text" value={form.store} onChange={set('store')} className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-[#1a3326]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data da compra *</label>
                  <input type="date" value={form.purchaseDate} onChange={set('purchaseDate')} className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-[#1a3326]" />
                </div>
              </div>
            </div>
          </div>

          {/* Dados do Seguro / Apólice */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h2 className="font-bold text-lg flex items-center gap-2 mb-5"><Shield size={20} /> Seguro e apólice</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seguradora *</label>
                <select value={form.id_seguradora} onChange={set('id_seguradora')} className="w-full border border-gray-200 rounded-lg p-2.5 bg-white focus:outline-none focus:border-[#1a3326]">
                  {seguradoras.map((s) => (
                    <option key={s.id_seguradora} value={s.id_seguradora}>{s.razao_social}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coberturas incluídas *</label>
                <input type="text" value={form.coberturas} onChange={set('coberturas')} className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-[#1a3326]" />
              </div>
            </div>
          </div>

          {/* Informações de Envio */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h2 className="font-bold text-lg flex items-center gap-2 mb-6"><Truck size={20} /> Informações de envio</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transportadora *</label>
                <select value={form.transportadora} onChange={set('transportadora')} className="w-full border border-gray-200 rounded-lg p-2.5 bg-white focus:outline-none focus:border-[#1a3326]">
                  <option value="LogMagna Express">LogMagna Express</option>
                  <option value="Correios SEDEX">Correios SEDEX</option>
                  <option value="Jadlog Rodoviário">Jadlog Rodoviário</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código de rastreio (opcional)</label>
                <input type="text" value={form.tracking} onChange={set('tracking')} placeholder="Gerado automaticamente se vazio" className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-[#1a3326]" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Origem *</label>
                <input type="text" value={form.origin} onChange={set('origin')} className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-[#1a3326]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CEP de destino *</label>
                <input type="text" value={form.cep} onChange={set('cep')} className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-[#1a3326]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cidade / UF *</label>
                <input type="text" value={form.destination} onChange={set('destination')} className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-[#1a3326]" />
              </div>
            </div>
          </div>

          {erro && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm animate-pop-in">{erro}</div>}
          {msg && (
            <div className="p-4 rounded-lg bg-[#e8f0eb] text-[#1a3326] text-sm animate-pop-in space-y-2">
              <div className="font-medium">{msg}</div>
              {criado && (
                <div className="flex flex-wrap gap-4 text-xs">
                  <Link href="/services" className="underline font-semibold">Ver em Pedidos e seguros →</Link>
                  {criado.codigo_rastreio && (
                    <Link href={`/tracking?code=${encodeURIComponent(criado.codigo_rastreio)}`} className="underline font-semibold">
                      Acompanhar rastreio ({criado.codigo_rastreio}) →
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Link href="/dashboard" className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50">Voltar</Link>
            <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-[#1a3326] text-white rounded-lg font-medium hover:bg-[#2d4a3e] disabled:opacity-70 disabled:cursor-wait transition flex items-center gap-2">
              {submitting ? <Spinner /> : <CheckCircle size={18} />} {submitting ? 'Salvando no banco...' : 'Registrar pedido e apólice'}
            </button>
          </div>
        </form>

        {/* Sidebar Resumo */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm sticky top-24">
            <h3 className="font-bold text-lg mb-4">Resumo da operação</h3>
            <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mb-4">Emissão automática de apólice</span>

            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                <Box size={20} />
              </div>
              <div>
                <div className="font-bold text-sm">{form.name || 'Novo produto'}</div>
                <div className="text-xs text-gray-500">
                  {categorias.find((c) => c.id_categoria === form.id_categoria)?.descricao || 'Categoria'}
                </div>
              </div>
            </div>

            <div className="space-y-3 text-sm mb-6">
              <div className="flex justify-between"><span className="text-gray-500">Valor declarado</span><span className="font-medium">{brl(num)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Taxa da proteção</span><span className="font-medium">2% sobre valor</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Origem</span><span className="font-medium">{form.origin}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Destino</span><span className="font-medium">{form.destination}</span></div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Valor do prêmio da apólice</p>
              <div className="text-3xl font-bold text-gray-900">{brl(num * 0.02)}</div>
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <Calendar size={12} /> Vigência de 12 meses a partir da compra
              </p>
            </div>
          </div>

          <div className="bg-[#e8f0eb] p-6 rounded-xl border border-green-100">
            <Leaf className="text-[#1a3326] mb-2" />
            <h4 className="font-bold text-[#1a3326] mb-2">Tudo registrado no banco Magna.</h4>
            <p className="text-xs text-gray-600">
              Ao confirmar, o sistema cria simultaneamente a apólice, o pedido, a remessa, o primeiro evento de rastreio, a notificação e o log de auditoria.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export const LandingPage = () => (
  <div className="min-h-screen bg-[#f4f6f5] font-sans">
    <nav className="bg-[#1a3326] text-white p-4 flex justify-between items-center px-8">
      <div className="flex items-center gap-2">
        <Logo className="w-8 h-8 text-white" />
        <span className="font-bold text-lg">LogMagna</span>
      </div>
      <div className="hidden sm:flex gap-6 text-sm">
        <a href="#fluxo" className="hover:text-gray-300">Como funciona</a>
        <Link href="/tracking" className="hover:text-gray-300">Rastrear pacote</Link>
      </div>
      <div className="flex gap-3">
        <Link href="/login" className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-white/10 transition text-sm">Entrar</Link>
        <Link href="/cadastro" className="px-4 py-2 bg-[#4a6b56] rounded-lg hover:bg-[#5c826a] transition text-sm">Criar cadastro</Link>
      </div>
    </nav>

    <header className="max-w-6xl mx-auto px-8 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <div className="animate-fade-in-up">
        <span className="bg-[#1a3326] text-white text-xs px-3 py-1 rounded-full uppercase tracking-wider font-bold">Suas compras, mais organizadas.</span>
        <h1 className="text-5xl font-bold text-[#1a3326] mt-6 mb-6 leading-tight">Mais cuidado com o que chega até você.</h1>
        <p className="text-gray-600 text-lg mb-8">
          Plataforma integrada de pedidos, apólices de seguro, rastreamento de remessas, ocorrências, sinistros e atendimento ao cliente.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link href="/dashboard" className="bg-[#1a3326] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#2d4a3e] flex items-center gap-2">
            <ArrowRight size={18} /> Acessar área do cliente
          </Link>
          <Link href="/cadastro" className="bg-white text-[#1a3326] border border-gray-200 px-6 py-3 rounded-lg font-medium hover:bg-gray-50">
            Criar meu cadastro
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-6 flex items-center gap-2">
          <Info size={14} /> Persistência real no banco Magna com 16 tabelas integradas.
        </p>
      </div>
      <div className="relative animate-pop-in" style={{ animationDelay: '150ms' }}>
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 absolute -bottom-10 -left-10 z-10 max-w-xs hidden sm:block">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg text-[#1a3326]"><Box size={20} /></div>
            <span className="font-bold text-sm">Cada compra, bem acompanhada.</span>
          </div>
          <p className="text-xs text-gray-500">Do pedido à entrega, apólice e sinistro no mesmo painel.</p>
        </div>
        <div className="rounded-3xl h-96 w-full overflow-hidden">
          <img src={boxesImg.src} alt="Encomendas empilhadas" className="w-full h-full object-cover" />
        </div>
      </div>
    </header>

    <section id="fluxo" className="bg-white py-20 border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-8">
        <div className="flex justify-between items-end mb-12">
          <h2 className="text-3xl font-bold text-[#1a3326]">Da sua compra à sua porta. Sem complicar.</h2>
          <span className="text-xs font-bold text-[#4a6b56] uppercase tracking-widest">Fluxo completo</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { icon: Box, title: 'Cadastre seu pedido', desc: 'Registre produto, categoria, valor declarado, seguradora e dados de envio em uma única transação.' },
            { icon: ShieldCheck, title: 'Acompanhe apólices e sinistros', desc: 'Consulte vigências, coberturas, abra sinistros a partir de ocorrências e valide documentos.' },
            { icon: PackageSearch, title: 'Rastreie cada etapa', desc: 'Visualize eventos em tempo real, notificações automáticas e histórico de atendimentos.' }
          ].map((item, i) => (
            <div key={i} style={{ '--i': i } as CSSProperties} className="stagger hover-lift relative">
              <span className="absolute -top-4 -right-2 text-6xl font-bold text-gray-100 -z-10">0{i + 1}</span>
              <item.icon size={32} className="text-[#1a3326] mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <footer className="bg-[#1a3326] text-white py-8 px-8">
      <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4 text-sm">
        <div className="font-bold">LogMagna / mais perto.</div>
        <div className="text-gray-400 text-xs max-w-md text-center">
          Sistema integrado ao Banco Magna • Gestão logística, apólices e sinistros.
        </div>
        <div className="text-gray-400 text-xs">© 2026 LogMagna</div>
      </div>
    </footer>
  </div>
);
