'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell, Building2, ClipboardList, FileWarning, LayoutDashboard,
  LogOut, Menu, MessageSquare, PackageSearch, PlusCircle, Shield,
  ShieldCheck, X
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/hooks/auth-context';
import { useNotificacoesHeader } from '@/hooks/notificacoes-context';
import { Logo } from '@/components/ui/Logo';

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  adminOnly?: boolean;
}

interface NavGroup {
  titulo: string;
  itens: NavItem[];
}

const TITULOS_ROTAS: Record<string, string> = {
  '/dashboard': 'Visão geral',
  '/services': 'Pedidos e seguros',
  '/tracking': 'Rastreamento',
  '/add': 'Novo pedido',
  '/apolices': 'Apólices e seguradoras',
  '/sinistros': 'Sinistros e ocorrências',
  '/atendimentos': 'Atendimentos e feedback',
  '/notificacoes': 'Notificações',
  '/unidades': 'Unidades logísticas',
  '/auditoria': 'Conta e administração',
};

function iniciais(nome: string): string {
  return (nome || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();
  const { naoLidas } = useNotificacoesHeader();
  const [menuAberto, setMenuAberto] = useState(false);

  const grupos: NavGroup[] = [
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
      titulo: 'Atendimento e Gestão',
      itens: [
        { path: '/atendimentos', label: 'Atendimentos e feedback', icon: MessageSquare },
        { path: '/notificacoes', label: 'Notificações', icon: Bell, badge: naoLidas },
        { path: '/unidades', label: 'Unidades logísticas', icon: Building2, adminOnly: true },
        {
          path: '/auditoria',
          label: isAdmin ? 'Administração e conta' : 'Minha conta e logs',
          icon: ClipboardList,
        },
      ],
    },
  ];

  const tituloAtual = TITULOS_ROTAS[pathname] || 'Área do cliente';

  const conteudoSidebar = (
    <div className="flex flex-col h-full bg-[#11221a] text-white">
      <div className="h-16 px-5 flex items-center justify-between border-b border-white/10 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={() => setMenuAberto(false)}>
          <Logo className="w-8 h-8 text-emerald-300" />
          <span className="text-base font-bold tracking-wider">LOGMAGNA</span>
        </Link>
        <button
          type="button"
          onClick={() => setMenuAberto(false)}
          className="lg:hidden p-1.5 rounded-lg text-slate-300 hover:bg-white/10"
          aria-label="Fechar menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {grupos.map((grupo) => {
          const itensVisiveis = grupo.itens.filter((item) => !item.adminOnly || isAdmin);
          if (!itensVisiveis.length) return null;
          return (
            <div key={grupo.titulo}>
              <div className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {grupo.titulo}
              </div>
              <div className="space-y-0.5">
                {itensVisiveis.map((item) => {
                  const ativo = pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setMenuAberto(false)}
                      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                        ativo
                          ? 'bg-[#234234] text-white shadow-xs'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <item.icon size={17} className="shrink-0 opacity-90" />
                        <span className="truncate">{item.label}</span>
                      </span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="px-1.5 py-0.5 min-w-[20px] text-center text-[11px] font-bold rounded-full bg-amber-400 text-[#11221a] tabular-nums">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="p-3.5 border-t border-white/10 shrink-0">
        <Link
          href="/auditoria"
          onClick={() => setMenuAberto(false)}
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition"
        >
          <div className="w-8 h-8 rounded-full bg-[#234234] text-emerald-200 flex items-center justify-center text-xs font-bold shrink-0">
            {user ? iniciais(user.nome_completo) : 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{user?.nome_completo}</p>
            <p className="text-[11px] text-slate-400 capitalize truncate">
              {user?.perfil === 'admin' ? 'Administrador' : 'Cliente'}
            </p>
          </div>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8faf9] flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:block w-60 fixed inset-y-0 left-0 z-30">
        {conteudoSidebar}
      </aside>

      {/* Drawer Mobile */}
      {menuAberto && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-950/50" onClick={() => setMenuAberto(false)} />
          <aside className="relative w-64 max-w-[85vw] h-full z-10 shadow-2xl">
            {conteudoSidebar}
          </aside>
        </div>
      )}

      {/* Área principal */}
      <div className="lg:pl-60 flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMenuAberto(true)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              aria-label="Abrir menu"
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2 text-sm truncate">
              <span className="text-slate-400 hidden sm:inline">LogMagna</span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="font-semibold text-slate-900 truncate">{tituloAtual}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href="/add"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a3326] text-white text-xs font-medium hover:bg-[#274837] transition"
            >
              <PlusCircle size={14} /> Novo pedido
            </Link>

            <Link
              href="/notificacoes"
              aria-label="Notificações"
              className="relative p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            >
              <Bell size={17} />
              {naoLidas > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-[#11221a] text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {naoLidas}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              <LogOut size={15} /> <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto animate-fade-in-up">
          {children}
        </main>
      </div>
    </div>
  );
}
