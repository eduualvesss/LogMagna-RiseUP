'use client';

import { useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowRight, PackageSearch, Search, Truck } from 'lucide-react';
import { usePublicTracking } from '@/hooks/useTracking';
import { formatarDataExtenso, formatarDataHora, statusBadgeVariant } from '@/lib/format';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton, Spinner } from '@/components/ui/Loading';
import { Logo } from '@/components/ui/Logo';

function PublicTrackingContent({ initialCode }: { initialCode: string }) {
  const [code, setCode] = useState(initialCode);
  const { data, loading, erro, buscar } = usePublicTracking(initialCode);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void buscar(code);
  }

  return (
    <div className="min-h-screen bg-[#f8faf9] flex flex-col">
      <nav className="bg-[#11221a] text-white border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo className="w-8 h-8 text-emerald-300" />
            <span className="font-bold text-lg tracking-wide">LogMagna</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/login" className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition">
              Entrar
            </Link>
            <Link href="/cadastro" className="px-4 py-2 rounded-lg bg-[#2d5a42] hover:bg-[#3a7054] transition">
              Criar conta
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10 w-full flex-1 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Rastreamento público de encomendas</h1>
          <p className="text-sm text-slate-500 mt-1">
            Consulte a situação atual e a linha do tempo do transporte utilizando o código da remessa.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Informe o código de rastreio (ex.: LM123456789BR)"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#1a3326]"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="px-5 py-2.5 bg-[#1a3326] text-white rounded-xl text-sm font-medium hover:bg-[#274837] disabled:opacity-60 inline-flex items-center gap-2"
          >
            {loading ? <Spinner size={15} /> : <ArrowRight size={16} />}
            {loading ? 'Consultando...' : 'Rastrear'}
          </button>
        </form>

        {erro && <Alert variant="error">{erro}</Alert>}

        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        )}

        {!loading && !data && !erro && (
          <EmptyState
            icon={PackageSearch}
            title="Pronto para consultar"
            description="Digite acima o código de rastreio informado no seu pedido para acompanhar todas as etapas da entrega."
          />
        )}

        {!loading && data && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#e8f0eb] text-[#1a3326]">
                    <Truck size={20} />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Código {data.codigo_rastreio}</div>
                    <h2 className="text-lg font-bold text-slate-900">{data.status_entrega}</h2>
                  </div>
                </div>
                <Badge variant={statusBadgeVariant(data.status_entrega, data.retido_analise)}>
                  {data.retido_analise ? 'Retido em análise' : data.status_entrega}
                </Badge>
              </div>

              {data.retido_analise && (
                <Alert variant="warning" className="mb-4">
                  <span className="font-medium">Remessa em conferência operacional.</span>{' '}
                  Para detalhes adicionais, acesse sua conta.
                </Alert>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-sm">
                <div>
                  <span className="text-xs text-slate-400 block">Transportadora</span>
                  <span className="font-medium text-slate-800">{data.transportadora}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Origem</span>
                  <span className="font-medium text-slate-800">{data.origem}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Destino</span>
                  <span className="font-medium text-slate-800">{data.destino}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Previsão de entrega</span>
                  <span className="font-medium text-slate-800">{formatarDataExtenso(data.previsao_entrega)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <h3 className="font-bold text-base text-slate-900 mb-6">Histórico de movimentações</h3>
              <div className="space-y-6 relative pl-4 border-l-2 border-slate-100 ml-2">
                {data.eventos.map((ev, i) => {
                  const atual = i === 0;
                  return (
                    <div key={ev.id_evento} style={{ '--i': i } as CSSProperties} className="stagger relative pl-6">
                      <div className={`absolute -left-[21px] top-1 w-3.5 h-3.5 rounded-full border-2 ${atual ? 'bg-[#1a3326] border-[#1a3326]' : 'bg-white border-slate-300'}`} />
                      <div className="flex flex-wrap justify-between items-start gap-2">
                        <div>
                          <div className={`text-sm font-semibold ${atual ? 'text-[#1a3326]' : 'text-slate-900'}`}>{ev.descricao}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{ev.localizacao || data.origem}</div>
                        </div>
                        <span className="text-xs text-slate-400 tabular-nums">{formatarDataHora(ev.data_hora)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {data.ocorrencias.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <h3 className="font-bold text-base text-slate-900 mb-4 flex items-center gap-2">
                  <AlertTriangle size={17} className="text-amber-600" /> Ocorrências informadas
                </h3>
                <div className="space-y-2.5">
                  {data.ocorrencias.map((oc) => (
                    <div key={oc.id_ocorrencia} className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/70 text-xs">
                      <div className="flex justify-between font-semibold text-amber-900">
                        <span>{oc.tipo}</span>
                        <span>{formatarDataHora(oc.data_ocorrencia)}</span>
                      </div>
                      <p className="text-amber-800 mt-1">{oc.descricao}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function PublicTrackingView() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code')?.trim().toUpperCase() || '';
  return <PublicTrackingContent key={initialCode} initialCode={initialCode} />;
}
