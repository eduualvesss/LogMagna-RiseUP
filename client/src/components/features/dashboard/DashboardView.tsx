'use client';

import Link from 'next/link';
import {
  ArrowRight, Box, ChevronRight, FileWarning, Laptop, PlusCircle, ShieldCheck, Truck
} from 'lucide-react';
import { useAuth } from '@/hooks/auth-context';
import { useDashboard } from '@/hooks/useDashboard';
import { brl, formatarDataExtenso, formatarDataHora, statusBadgeVariant } from '@/lib/format';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Loading';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';

function saudacao(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

export default function DashboardView() {
  const { user, isAdmin } = useAuth();
  const { data, loading, erro } = useDashboard();

  const t = data?.totais;
  const proxima = data?.proximaEntrega ?? null;
  const ocorrencias = data?.ultimasOcorrencias ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${saudacao()}, ${(user?.nome_completo || 'Usuário').split(' ')[0]}.`}
        description={
          isAdmin
            ? 'Visão consolidada de pedidos, apólices, remessas e sinistros da operação.'
            : 'Acompanhe seus pedidos, coberturas de seguro, entregas e ocorrências em tempo real.'
        }
        actions={
          <Link
            href="/add"
            className="bg-[#1a3326] text-white px-4 py-2.5 rounded-xl inline-flex items-center gap-2 hover:bg-[#274837] transition text-sm font-medium"
          >
            <PlusCircle size={17} /> Novo pedido
          </Link>
        }
      />

      {erro && <Alert variant="error">{erro}</Alert>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Pedidos registrados"
          value={String(t?.totalPedidos ?? 0)}
          sub={`${t?.entregues ?? 0} entregues • ${t?.retidosAnalise ?? 0} retidos`}
          icon={ShieldCheck}
          loading={loading}
          tone="emerald"
        />
        <StatCard
          label="Valor segurado"
          value={brl(t?.valorDeclaradoTotal ?? 0)}
          sub={`Prêmios: ${brl(t?.valorPremioTotal ?? 0)}`}
          icon={Box}
          loading={loading}
        />
        <StatCard
          label="Entregas pendentes"
          value={String((t?.emTransito ?? 0) + (t?.aguardando ?? 0))}
          sub={`${t?.emTransito ?? 0} em trânsito • ${t?.aguardando ?? 0} aguardando`}
          icon={Truck}
          loading={loading}
        />
        <StatCard
          label="Sinistros ativos"
          value={String(t?.sinistrosAtivos ?? 0)}
          sub={`${t?.ocorrenciasTotal ?? 0} ocorrências • ${t?.notificacoesNaoLidas ?? 0} avisos`}
          icon={FileWarning}
          loading={loading}
          tone={(t?.sinistrosAtivos ?? 0) > 0 ? 'amber' : 'default'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-bold text-base text-slate-900">Próxima entrega</h2>
            {proxima && (
              <Badge variant={statusBadgeVariant(proxima.status, proxima.retido_analise)}>
                {proxima.retido_analise ? 'Retido em análise' : proxima.status}
              </Badge>
            )}
          </div>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : proxima ? (
            <>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-slate-100 rounded-xl text-slate-700">
                  <Laptop size={22} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 truncate">{proxima.nome_produto}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {proxima.id_pedido} • {proxima.codigo_rastreio || 'Sem rastreio'} • {proxima.seguradora_razao_social || 'Sem seguradora'}
                  </p>
                </div>
              </div>

              <div className="relative flex items-center justify-between mb-6 px-3 py-2 bg-slate-50 rounded-xl">
                <span className="text-xs sm:text-sm font-medium text-slate-700">{proxima.origem || 'Origem'}</span>
                <Truck size={18} className="text-[#1a3326] shrink-0 mx-2" />
                <span className="text-xs sm:text-sm font-medium text-slate-700 text-right">{proxima.destino || 'Destino'}</span>
              </div>

              <div className="flex flex-wrap justify-between items-center gap-4 pt-4 border-t border-slate-100">
                <div>
                  <p className="text-xs text-slate-500">Previsão de entrega</p>
                  <p className="font-semibold text-slate-900 text-sm">
                    {proxima.previsao_entrega ? formatarDataExtenso(proxima.previsao_entrega) : 'Não informada'}
                  </p>
                </div>
                <Link
                  href={proxima.codigo_rastreio ? `/tracking?code=${encodeURIComponent(proxima.codigo_rastreio)}` : '/tracking'}
                  className="border border-slate-200 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5 transition"
                >
                  Acompanhar rastreio <ArrowRight size={15} />
                </Link>
              </div>
            </>
          ) : (
            <EmptyState
              icon={Truck}
              title="Nenhuma entrega em andamento"
              description="Cadastre seu primeiro pedido para gerar automaticamente a remessa rastreável e a apólice de seguro."
              action={
                <Link
                  href="/add"
                  className="bg-[#1a3326] text-white px-4 py-2 rounded-xl text-xs font-medium hover:bg-[#274837] inline-flex items-center gap-1.5"
                >
                  <PlusCircle size={15} /> Cadastrar pedido
                </Link>
              }
            />
          )}
        </div>

        <div className="bg-[#e8f0eb] p-6 rounded-2xl border border-[#d4e3da] flex flex-col justify-between">
          <div>
            <span className="inline-block px-2.5 py-1 rounded-full bg-white text-[#1a3326] text-[11px] font-semibold mb-4">
              Atalhos operacionais
            </span>
            <h2 className="text-xl font-bold text-[#11221a] mb-2">
              Centralize envios e sinistros.
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed mb-6">
              Cada pedido emite apólice vinculada e habilita acompanhamento completo de ocorrências, documentos e suporte.
            </p>
          </div>
          <div className="space-y-2.5">
            <Link
              href="/add"
              className="w-full bg-[#1a3326] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#274837] transition flex items-center justify-center gap-2"
            >
              <PlusCircle size={17} /> Cadastrar novo pedido
            </Link>
            <Link
              href="/sinistros"
              className="w-full bg-white text-[#1a3326] border border-[#1a3326]/15 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition flex items-center justify-center gap-2"
            >
              <FileWarning size={17} /> Gerenciar sinistros
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-base text-slate-900">Ocorrências recentes no transporte</h2>
          <Link href="/sinistros" className="text-xs text-[#1a3326] font-semibold hover:underline inline-flex items-center gap-1">
            Ver todas <ChevronRight size={15} />
          </Link>
        </div>

        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : ocorrencias.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma ocorrência registrada até o momento.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {ocorrencias.map((oc) => (
              <div key={oc.id_ocorrencia} className="py-3.5 flex flex-wrap justify-between items-center gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="warning">{oc.tipo}</Badge>
                    <span className="text-sm font-semibold text-slate-900">{oc.nome_produto || oc.id_pedido}</span>
                    {oc.codigo_rastreio && <span className="text-xs text-slate-400">({oc.codigo_rastreio})</span>}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{oc.descricao}</p>
                </div>
                <span className="text-xs text-slate-400 tabular-nums">{formatarDataHora(oc.data_ocorrencia)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
