'use client';

import { useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Box, CheckCircle2, PackageSearch, Search, ShieldCheck, Truck } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/hooks/auth-context';
import boxesImg from '@/assets/boxes.jpg';

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [codigo, setCodigo] = useState('');

  function buscarRastreio(e: FormEvent) {
    e.preventDefault();
    const limpo = codigo.trim().toUpperCase();
    router.push(limpo ? `/rastrear?code=${encodeURIComponent(limpo)}` : '/rastrear');
  }

  return (
    <div className="min-h-screen bg-[#f8faf9] text-slate-900 flex flex-col">
      <nav className="bg-[#11221a] text-white border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo className="w-8 h-8 text-emerald-300" />
            <span className="font-bold text-lg tracking-wide">LogMagna</span>
          </Link>

          <div className="hidden md:flex items-center gap-7 text-sm text-slate-300">
            <a href="#como-funciona" className="hover:text-white transition">Como funciona</a>
            <Link href="/rastrear" className="hover:text-white transition">Rastrear encomenda</Link>
          </div>

          <div className="flex items-center gap-2.5">
            {user ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition inline-flex items-center gap-1.5"
              >
                Acessar painel <ArrowRight size={15} />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 text-sm font-medium transition"
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  className="px-4 py-2 rounded-lg bg-[#2d5a42] hover:bg-[#3a7054] text-white text-sm font-medium transition"
                >
                  Criar conta
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <header className="max-w-6xl mx-auto px-6 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
        <div className="animate-fade-in-up">
          <span className="inline-flex items-center gap-1.5 bg-[#e8f0eb] text-[#1a3326] text-xs px-3 py-1 rounded-full font-semibold tracking-wide">
            <ShieldCheck size={14} /> Logística protegida e rastreável
          </span>

          <h1 className="text-4xl sm:text-5xl font-bold text-[#11221a] mt-5 mb-5 leading-tight tracking-tight">
            Proteção e controle total do pedido à entrega.
          </h1>

          <p className="text-slate-600 text-lg leading-relaxed mb-7">
            Centralize pedidos, emissão de apólices de seguro, rastreamento em tempo real, gestão de ocorrências, sinistros e atendimento ao cliente em uma única plataforma.
          </p>

          {/* Barra de rastreio público rápido */}
          <form onSubmit={buscarRastreio} className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-2 mb-6">
            <div className="relative flex-1">
              <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Digite o código de rastreio para consultar"
                className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl focus:outline-none text-slate-900"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#1a3326] hover:bg-[#274837] text-white text-sm font-medium transition inline-flex items-center justify-center gap-2 shrink-0"
            >
              <PackageSearch size={16} /> Rastrear
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <Link
              href={user ? '/dashboard' : '/cadastro'}
              className="text-[#1a3326] font-semibold hover:underline inline-flex items-center gap-1.5"
            >
              {user ? 'Ir para minha área' : 'Começar agora'} <ArrowRight size={15} />
            </Link>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 text-xs inline-flex items-center gap-1">
              <CheckCircle2 size={14} className="text-emerald-600" /> Rastreamento público sem necessidade de login
            </span>
          </div>
        </div>

        <div className="relative animate-pop-in" style={{ animationDelay: '120ms' }}>
          <div className="rounded-3xl h-[380px] w-full overflow-hidden shadow-xl border border-slate-200/70">
            <img src={boxesImg.src} alt="Encomendas organizadas para envio" className="w-full h-full object-cover" />
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-100 absolute -bottom-6 left-6 right-6 sm:right-auto sm:max-w-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#e8f0eb] rounded-xl text-[#1a3326]">
                <Truck size={20} />
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900">Visibilidade ponta a ponta</div>
                <p className="text-xs text-slate-500">Apólices, eventos e sinistros integrados</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section id="como-funciona" className="bg-white py-20 border-t border-slate-200/80 mt-6">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-bold text-[#2d5a42] uppercase tracking-widest">Fluxo integrado</span>
            <h2 className="text-3xl font-bold text-[#11221a] mt-2">
              Da emissão da apólice à resolução de sinistros.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Box,
                title: 'Registro com proteção automática',
                desc: 'Cada pedido cadastrado vincula categoria, transportadora, remessa rastreável e apólice emitida com vigência definida.',
              },
              {
                icon: PackageSearch,
                title: 'Rastreamento e alertas',
                desc: 'Acompanhe movimentações no painel privado ou via consulta pública, com notificações automáticas em cada ocorrência.',
              },
              {
                icon: ShieldCheck,
                title: 'Sinistros e auditoria',
                desc: 'Abra sinistros diretamente de ocorrências, anexe e valide documentos comprobatórios e mantenha trilha completa de auditoria.',
              },
            ].map((item, i) => (
              <div
                key={item.title}
                style={{ '--i': i } as CSSProperties}
                className="stagger hover-lift p-6 rounded-2xl border border-slate-200/80 bg-[#f8faf9]"
              >
                <div className="w-11 h-11 rounded-xl bg-[#1a3326] text-white flex items-center justify-center mb-4">
                  <item.icon size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[#11221a] text-slate-300 py-8 px-6 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4 text-xs">
          <div className="font-semibold text-white">LogMagna • Gestão Logística e Seguros</div>
          <div>© 2026 LogMagna. Todos os direitos reservados.</div>
        </div>
      </footer>
    </div>
  );
}
