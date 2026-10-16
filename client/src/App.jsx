import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShieldCheck, PackageSearch, PlusCircle,
  Truck, Box, CheckCircle, Clock, Info, ArrowRight, Search,
  Laptop, Headphones, Camera, Leaf, ChevronRight
} from 'lucide-react';
import boxesImg from './assets/boxes.jpg';

// --- COMPONENTES VISUAIS ---

// Logo SVG (Fundo transparente, cores corrigidas)
const Logo = ({ className = "w-10 h-10 text-[#3f6b4d]" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <path d="M70 14 A38 38 0 1 0 70 86" />
    <path d="M36 33 H66 L61 56 M63 38 H77 C84 38 88 44 88 49 L85 58 H82 M36 58 H62" />
    <circle cx="43" cy="58" r="7" />
    <circle cx="73" cy="58" r="7" />
    <path d="M28 40 H38 M26 47 H38 M24 54 H38" />
  </svg>
);

const Sidebar = () => {
  const location = useLocation();
  const menuItems = [
    { path: '/dashboard', label: 'Visão geral', icon: LayoutDashboard },
    { path: '/services', label: 'Serviços contratados', icon: ShieldCheck },
    { path: '/tracking', label: 'Rastrear encomenda', icon: PackageSearch },
    { path: '/add', label: 'Cadastrar produto', icon: PlusCircle },
  ];

  return (
    <aside className="w-64 bg-[#1a3326] text-white flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6 flex items-center gap-3 mb-8">
        <Logo className="w-10 h-10 text-white" />
        <span className="text-xl font-bold tracking-wider">LOGMAGNA</span>
      </div>

      <div className="px-4 mb-2 text-xs text-gray-400 uppercase font-semibold">Área do Cliente</div>
      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-[#2d4a3e] text-white' : 'text-gray-300 hover:bg-[#2d4a3e]/50'
                }`}
            >
              <item.icon size={20} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 m-4 bg-[#2d4a3e] rounded-xl">
        <Leaf size={20} className="text-green-300 mb-2" />
        <h4 className="font-bold text-sm">Tudo em um só lugar.</h4>
        <p className="text-xs text-gray-300 mt-1">Organize suas compras e acompanhe cada entrega.</p>
      </div>

      <div className="p-4 border-t border-gray-700 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-xs font-bold">AS</div>
        <div>
          <p className="text-sm font-medium">Ana Silva</p>
          <p className="text-xs text-gray-400">Conta demonstrativa</p>
        </div>
      </div>
    </aside>
  );
};

const TopBar = ({ title, subtitle }) => (
  <header className="bg-[#1a3326] h-16 flex items-center justify-between px-8 text-white sticky top-0 z-10">
    <div className="flex items-center gap-2 text-sm text-gray-300">
      <span>Área do cliente</span>
      <span>/</span>
      <span className="text-white font-medium">{title}</span>
    </div>
    <div className="flex items-center gap-4">
      <span className="px-3 py-1 bg-[#2d4a3e] rounded-full text-xs border border-gray-600">Ambiente de demonstração</span>
    </div>
  </header>
);

const Layout = ({ children, title }) => (
  <div className="flex bg-[#f4f6f5] min-h-screen">
    <Sidebar />
    <div className="ml-64 flex-1 flex flex-col">
      <TopBar title={title} />
      <main className="p-8 flex-1 overflow-y-auto">
        {children}
      </main>
      <footer className="p-6 text-center text-xs text-gray-500 border-t border-gray-200 bg-white">
        Protótipo estático • Dados e valores fictícios. Nenhuma contratação ou cobertura de seguro real.
      </footer>
    </div>
  </div>
);

// --- PÁGINAS ---

const Dashboard = () => (
  <Layout title="Visão geral">
    <div className="mb-8 flex justify-between items-end">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bom dia, Ana.</h1>
        <p className="text-gray-500 mt-1">Suas compras e encomendas, com uma visão mais tranquila.</p>
      </div>
      <Link to="/add" className="bg-[#1a3326] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#2d4a3e] transition">
        <PlusCircle size={18} /> Cadastrar produto
      </Link>
    </div>

    {/* Stats Cards */}
    <div className="grid grid-cols-4 gap-6 mb-8">
      {[
        { label: 'Serviços ativos', value: '3', sub: 'Registros demonstrativos', icon: ShieldCheck },
        { label: 'Valor dos produtos', value: 'R$ 8.000,00', sub: 'Soma dos 3 produtos', icon: Box },
        { label: 'Entregas pendentes', value: '2', sub: '1 em trânsito • 1 aguardando', icon: Truck },
        { label: 'Custo simulado', value: 'R$ 160,00', sub: 'Total por envio • sem cobrança', icon: PackageSearch },
      ].map((stat, i) => (
        <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm text-gray-500 font-medium">{stat.label}</span>
            <stat.icon size={20} className="text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
          <div className="text-xs text-gray-400">{stat.sub}</div>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-3 gap-6">
      {/* Next Delivery */}
      <div className="col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg text-gray-900">Sua próxima entrega</h3>
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">Em trânsito</span>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gray-50 rounded-lg"><Laptop size={24} className="text-gray-600" /></div>
          <div>
            <h4 className="font-bold text-gray-900">Notebook Dell Inspiron</h4>
            <p className="text-xs text-gray-500">LM-2026-001 • BR123456789SP</p>
          </div>
        </div>

        <div className="relative flex items-center justify-between mb-6 px-4">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -z-10"></div>
          <div className="bg-white px-2 text-sm font-medium text-gray-700">Campinas, SP</div>
          <Truck size={20} className="text-[#1a3326] bg-white p-1 rounded-full" />
          <div className="bg-white px-2 text-sm font-medium text-gray-700">São Paulo, SP</div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-500">Previsão de entrega</p>
            <p className="font-bold text-gray-900">08 de outubro de 2026</p>
          </div>
          <Link to="/tracking" className="border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
            Ver rastreio <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* CTA Card */}
      <div className="bg-[#e8f0eb] p-6 rounded-xl flex flex-col justify-center">
        <Leaf size={32} className="text-[#1a3326] mb-4" />
        <h3 className="text-xl font-bold text-[#1a3326] mb-2">Uma nova compra?<br />Comece por aqui.</h3>
        <p className="text-sm text-gray-600 mb-6">Adicione seu produto e confira o resumo de valores antes de concluir o cadastro demonstrativo.</p>
        <Link to="/add" className="bg-[#1a3326] text-white px-4 py-3 rounded-lg text-center font-medium hover:bg-[#2d4a3e] transition flex items-center justify-center gap-2">
          <PlusCircle size={18} /> Cadastrar novo produto
        </Link>
      </div>
    </div>
  </Layout>
);

const Services = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/products')
      .then(res => res.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  }, []);

  return (
    <Layout title="Serviços contratados">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Serviços contratados</h1>
          <p className="text-gray-500 mt-1">Consulte seus produtos e os registros de seguros demonstrativos.</p>
        </div>
        <Link to="/add" className="bg-[#1a3326] text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <PlusCircle size={18} /> Cadastrar produto
        </Link>
      </div>

      <div className="bg-[#e8f0eb] p-4 rounded-xl flex justify-between items-center mb-6 border border-green-100">
        <div className="flex items-center gap-2 text-[#1a3326] font-medium">
          <ShieldCheck size={20} /> 3 serviços ativos na demonstração
        </div>
        <div className="text-sm text-gray-600">
          Produtos: <span className="font-bold">R$ 8.000,00</span> • Custo: <span className="font-bold">R$ 160,00</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <div className="flex gap-4 text-sm font-medium text-gray-500">
            <button className="text-[#1a3326] border-b-2 border-[#1a3326] pb-1">Todos (3)</button>
            <button className="hover:text-gray-900">Ativos (3)</button>
            <button className="hover:text-gray-900">Arquivados (0)</button>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar produto ou registro" className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1a3326]" />
          </div>
        </div>

        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="p-4">Produto / Registro</th>
              <th className="p-4">Valor do Produto</th>
              <th className="p-4">Custo Simulado</th>
              <th className="p-4">Entrega</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 transition">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                      {p.name.includes('Notebook') ? <Laptop size={18} /> : p.name.includes('Fone') ? <Headphones size={18} /> : <Camera size={18} />}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-500">{p.id} • Seguro de encomenda</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 font-medium text-gray-900">R$ {p.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td className="p-4 text-gray-600">R$ {p.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.status === 'Em trânsito' ? 'bg-green-100 text-green-800' :
                      p.status === 'Entregue' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-50 text-yellow-800'
                    }`}>
                    {p.status}
                  </span>
                </td>
                <td className="p-4 text-right"><ChevronRight size={16} className="text-gray-400" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

const Tracking = () => {
  const [code, setCode] = useState('BR123456789SP');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = () => {
    setError('');
    fetch(`http://localhost:3001/api/tracking/${encodeURIComponent(code.trim())}`)
      .then(async res => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Erro ao rastrear.');
        setData(json);
      })
      .catch(err => { setData(null); setError(err.message); });
  };

  useEffect(() => { handleSearch(); // eslint-disable-next-line
  }, []);

  return (
    <Layout title="Rastrear encomenda">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Rastrear encomenda</h1>
        <p className="text-gray-500 mt-1">Acompanhe o caminho da sua compra e as últimas movimentações.</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-8 flex gap-4">
        <div className="flex-1 relative">
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
          <button onClick={handleSearch} className="bg-[#1a3326] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#2d4a3e] flex items-center gap-2 h-[46px]">
            <ArrowRight size={18} /> Rastrear encomenda
          </button>
        </div>
      </div>

      {error && <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

      {data && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="bg-[#e8f0eb] p-6 rounded-xl border border-green-100">
              <div className="flex items-center gap-3 mb-2">
                <Truck className="text-[#1a3326]" />
                <h2 className="text-xl font-bold text-[#1a3326]">Sua encomenda está a caminho.</h2>
              </div>
              <p className="text-sm text-gray-600 ml-9">Previsão de entrega: 08 de outubro de 2026</p>
              <p className="text-xs text-gray-400 mt-4 ml-9">Última atualização em 06/10/2026 às 09:42 • Dados simulados</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-lg mb-6">Histórico de movimentações</h3>
              <div className="space-y-8 relative pl-4 border-l-2 border-gray-100 ml-2">
                {data.history.map((h, i) => (
                  <div key={i} className="relative pl-6">
                    <div className={`absolute -left-[21px] top-1 w-4 h-4 rounded-full border-2 ${h.current ? 'bg-[#1a3326] border-[#1a3326]' : 'bg-white border-gray-300'}`}></div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className={`font-medium ${h.current ? 'text-[#1a3326]' : 'text-gray-900'}`}>{h.status}</h4>
                        <p className="text-sm text-gray-500">{h.location}</p>
                        {h.current && <span className="inline-block mt-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Última atualização</span>}
                      </div>
                      <span className="text-sm text-gray-400">{h.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-lg mb-4">Detalhes da encomenda</h3>
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                <Laptop className="text-gray-600" />
                <span className="font-medium">{data.name}</span>
              </div>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Registro</span><span className="font-medium">{data.id}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Transportadora</span><span className="font-medium">Correios (demo)</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Origem</span><span className="font-medium">{data.origin}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Destino</span><span className="font-medium">{data.destination}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Valor do produto</span><span className="font-bold">R$ {data.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

const AddProduct = () => {
  const [form, setForm] = useState({ name: 'Mouse Logitech MX Master 3S', value: '350', store: 'Loja Exemplo', tracking: '' });
  const [msg, setMsg] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const num = Number(String(form.value).replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
  const brl = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const submit = () => {
    setMsg('');
    fetch('http://localhost:3001/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, value: num }),
    })
      .then(async res => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setMsg(`Produto ${json.id} cadastrado com sucesso (demo).`);
      })
      .catch(err => setMsg(err.message || 'Falha ao cadastrar.'));
  };

  return (
  <Layout title="Cadastrar produto">
    <div className="flex justify-between items-end mb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cadastrar novo produto</h1>
        <p className="text-gray-500 mt-1">Preencha os dados da compra e revise o resumo demonstrativo.</p>
      </div>
      <span className="text-sm text-gray-500">Rascunho • não cadastrado</span>
    </div>

    <div className="grid grid-cols-3 gap-8">
      <div className="col-span-2 space-y-6">
        {/* Dados do Produto */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-lg flex items-center gap-2"><Box size={20} /> Dados do produto</h2>
            <span className="text-xs text-gray-400">* Obrigatórios</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do produto *</label>
              <input type="text" value={form.name} onChange={set('name')} className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-[#1a3326]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                <select className="w-full border border-gray-200 rounded-lg p-2.5 bg-white focus:outline-none focus:border-[#1a3326]">
                  <option>Eletrônicos</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor da compra *</label>
                <input type="text" value={form.value} onChange={set('value')} className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-[#1a3326]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loja / vendedor *</label>
                <input type="text" value={form.store} onChange={set('store')} className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-[#1a3326]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data da compra *</label>
                <input type="text" defaultValue="06/10/2026" className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-[#1a3326]" />
              </div>
            </div>
          </div>
        </div>

        {/* Informações de Envio */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="font-bold text-lg flex items-center gap-2 mb-6"><Truck size={20} /> Informações de envio</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transportadora *</label>
              <select className="w-full border border-gray-200 rounded-lg p-2.5 bg-white focus:outline-none focus:border-[#1a3326]">
                <option>Correios (demo)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código de rastreio (opcional)</label>
              <input type="text" value={form.tracking} onChange={set('tracking')} placeholder="Ainda não informado" className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-[#1a3326]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CEP de destino *</label>
              <input type="text" defaultValue="01310-100" className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-[#1a3326]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade / UF *</label>
              <input type="text" defaultValue="São Paulo / SP" className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-[#1a3326]" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" defaultChecked className="rounded border-gray-300 text-[#1a3326] focus:ring-[#1a3326]" />
          Estou ciente de que este cadastro é demonstrativo e não gera contratação real.
        </div>

        {msg && <div className="p-3 rounded-lg bg-[#e8f0eb] text-[#1a3326] text-sm">{msg}</div>}
        <div className="flex justify-between pt-4">
          <Link to="/dashboard" className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50">Cancelar</Link>
          <button onClick={submit} className="px-6 py-2 bg-[#1a3326] text-white rounded-lg font-medium hover:bg-[#2d4a3e] flex items-center gap-2">
            <CheckCircle size={18} /> Cadastrar produto (demo)
          </button>
        </div>
      </div>

      {/* Sidebar Resumo */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm sticky top-24">
          <h3 className="font-bold text-lg mb-4">Resumo do cadastro</h3>
          <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mb-4">Seguro de encomenda • demo</span>

          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
              <Box size={20} />
            </div>
            <div>
              <div className="font-bold text-sm">{form.name}</div>
              <div className="text-xs text-gray-500">Novo registro • LM-2026-004</div>
            </div>
          </div>

          <div className="space-y-3 text-sm mb-6">
            <div className="flex justify-between"><span className="text-gray-500">Valor do produto</span><span className="font-medium">{brl(num)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Taxa ilustrativa</span><span className="font-medium">2% por envio</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Destino</span><span className="font-medium">São Paulo, SP</span></div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Custo simulado deste envio</p>
            <div className="text-3xl font-bold text-gray-900">{brl(num * 0.02)}</div>
            <p className="text-xs text-gray-400 mt-1">{brl(num)} × 2% • Nenhum valor será cobrado.</p>
          </div>
        </div>

        <div className="bg-[#e8f0eb] p-6 rounded-xl border border-green-100">
          <Leaf className="text-[#1a3326] mb-2" />
          <h4 className="font-bold text-[#1a3326] mb-2">Revise com tranquilidade.</h4>
          <p className="text-xs text-gray-600">Este produto ainda não faz parte dos seus 3 serviços ativos. O resumo é apenas uma prévia.</p>
        </div>
      </div>
    </div>
  </Layout>
  );
};

const LandingPage = () => (
  <div className="min-h-screen bg-[#f4f6f5] font-sans">
    <nav className="bg-[#1a3326] text-white p-4 flex justify-between items-center px-8">
      <div className="flex items-center gap-2">
        <Logo className="w-8 h-8 text-white" />
        <span className="font-bold text-lg">LogMagna</span>
      </div>
      <div className="flex gap-6 text-sm">
        <a href="#" className="hover:text-gray-300">Como funciona</a>
        <a href="#" className="hover:text-gray-300">Sobre a LogMagna</a>
      </div>
      <div className="flex gap-3">
        <Link to="/dashboard" className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-white/10 transition">Área do cliente</Link>
        <Link to="/add" className="px-4 py-2 bg-[#4a6b56] rounded-lg hover:bg-[#5c826a] transition">Criar cadastro</Link>
      </div>
    </nav>

    <header className="max-w-6xl mx-auto px-8 py-20 grid grid-cols-2 gap-12 items-center">
      <div>
        <span className="bg-[#1a3326] text-white text-xs px-3 py-1 rounded-full uppercase tracking-wider font-bold">Suas compras, mais organizadas.</span>
        <h1 className="text-5xl font-bold text-[#1a3326] mt-6 mb-6 leading-tight">Mais cuidado com o que chega até você.</h1>
        <p className="text-gray-600 text-lg mb-8">Uma nova forma de gerenciar seguros de encomendas e compras online. Cadastre seus produtos, visualize seus serviços e acompanhe cada entrega em um só lugar.</p>
        <div className="flex gap-4">
          <Link to="/dashboard" className="bg-[#1a3326] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#2d4a3e] flex items-center gap-2">
            <ArrowRight size={18} /> Conhecer a área do cliente
          </Link>
          <Link to="/add" className="bg-white text-[#1a3326] border border-gray-200 px-6 py-3 rounded-lg font-medium hover:bg-gray-50">
            Criar meu cadastro
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-6 flex items-center gap-2"><Info size={14} /> Apresentação demonstrativa. Não comercializa seguros.</p>
      </div>
      <div className="relative">
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 absolute -bottom-10 -left-10 z-10 max-w-xs">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg text-[#1a3326]"><Box size={20} /></div>
            <span className="font-bold text-sm">Cada compra, bem acompanhada.</span>
          </div>
          <p className="text-xs text-gray-500">Do cadastro à entrega, tudo no seu painel.</p>
        </div>
        <div className="rounded-3xl h-96 w-full overflow-hidden">
          <img src={boxesImg} alt="Encomendas empilhadas" className="w-full h-full object-cover" />
        </div>
      </div>
    </header>

    <section className="bg-white py-20 border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-8">
        <div className="flex justify-between items-end mb-12">
          <h2 className="text-3xl font-bold text-[#1a3326]">Da sua compra à sua porta. Sem complicar.</h2>
          <span className="text-xs font-bold text-[#4a6b56] uppercase tracking-widest">Um fluxo simples</span>
        </div>
        <div className="grid grid-cols-3 gap-12">
          {[
            { icon: Box, title: 'Cadastre sua compra', desc: 'Reúna os dados do produto, o valor da compra e as informações da encomenda.' },
            { icon: ShieldCheck, title: 'Organize seus serviços', desc: 'Consulte os registros de seguros e os valores ilustrativos em um painel simples.' },
            { icon: PackageSearch, title: 'Acompanhe o caminho', desc: 'Visualize o status do envio e o histórico de movimentações até a entrega.' }
          ].map((item, i) => (
            <div key={i} className="relative">
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
      <div className="max-w-6xl mx-auto flex justify-between items-center text-sm">
        <div className="font-bold">LogMagna / mais perto.</div>
        <div className="text-gray-400 text-xs max-w-md text-center">
          Protótipo de apresentação • Dados fictícios e sem validade contratual.
        </div>
        <div className="text-gray-400 text-xs">© 2026 LogMagna</div>
      </div>
    </footer>
  </div>
);

// --- APP PRINCIPAL ---

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/services" element={<Services />} />
        <Route path="/tracking" element={<Tracking />} />
        <Route path="/add" element={<AddProduct />} />
      </Routes>
    </Router>
  );
}

export default App;