'use client';

import { useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, FileWarning, Laptop, MapPin, PackageSearch, Search, Truck } from 'lucide-react';
import { useNotificacoesHeader } from '@/hooks/notificacoes-context';
import { usePedidos } from '@/hooks/usePedidos';
import { usePrivateTracking } from '@/hooks/useTracking';
import { brl, formatarDataExtenso, formatarDataHora, statusBadgeVariant } from '@/lib/format';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton, Spinner } from '@/components/ui/Loading';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';

function PrivateTrackingContent({ initialCode }: { initialCode: string }) {
  const { refreshNotificacoes } = useNotificacoesHeader();
  const { pedidos } = usePedidos();
  const [code, setCode] = useState(initialCode);
  const { data, loading, erro, buscar, registrarEvento, registrarOcorrencia } = usePrivateTracking(initialCode);

  const [modalEvento, setModalEvento] = useState(false);
  const [evtDesc, setEvtDesc] = useState('');
  const [evtLoc, setEvtLoc] = useState('');
  const [evtStatus, setEvtStatus] = useState('');

  const [modalOcorrencia, setModalOcorrencia] = useState(false);
  const [ocoTipo, setOcoTipo] = useState('Atraso operacional');
  const [ocoDesc, setOcoDesc] = useState('');

  const [actionMsg, setActionMsg] = useState('');
  const [actionErro, setActionErro] = useState('');
  const [saving, setSaving] = useState(false);

  const codigosRapidos = pedidos.filter((p) => p.codigo_rastreio).slice(0, 5);

  async function handleRegistrarEvento(e: FormEvent) {
    e.preventDefault();
    if (!data?.id_remessa || !evtDesc.trim()) return;
    setSaving(true);
    setActionErro('');
    setActionMsg('');
    try {
      await registrarEvento(data.id_remessa, {
        descricao: evtDesc.trim(),
        localizacao: evtLoc.trim() || data.destino || undefined,
        status_entrega: evtStatus || undefined,
      });
      setEvtDesc('');
      setEvtLoc('');
      setEvtStatus('');
      setModalEvento(false);
      setActionMsg('Movimentação adicionada ao histórico da remessa.');
    } catch (err) {
      setActionErro(err instanceof Error ? err.message : 'Erro ao registrar evento.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRegistrarOcorrencia(e: FormEvent) {
    e.preventDefault();
    if (!data?.id_remessa || !ocoDesc.trim()) return;
    setSaving(true);
    setActionErro('');
    setActionMsg('');
    try {
      await registrarOcorrencia({
        id_remessa: data.id_remessa,
        tipo: ocoTipo,
        descricao: ocoDesc.trim(),
      });
      setOcoDesc('');
      setModalOcorrencia(false);
      setActionMsg('Ocorrência registrada e notificação gerada automaticamente.');
      await refreshNotificacoes();
    } catch (err) {
      setActionErro(err instanceof Error ? err.message : 'Erro ao registrar ocorrência.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rastrear encomenda"
        description="Acompanhe movimentações, atualize etapas de entrega e registre ocorrências."
        actions={
          data?.id_remessa ? (
            <>
              <button
                type="button"
                onClick={() => { setActionErro(''); setModalOcorrencia(true); }}
                className="px-4 py-2 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs font-semibold hover:bg-amber-100 inline-flex items-center gap-1.5"
              >
                <FileWarning size={15} /> Reportar ocorrência
              </button>
              <button
                type="button"
                onClick={() => { setActionErro(''); setModalEvento(true); }}
                className="px-4 py-2 rounded-xl bg-[#1a3326] text-white text-xs font-semibold hover:bg-[#274837] inline-flex items-center gap-1.5"
              >
                <MapPin size={15} /> Nova movimentação
              </button>
            </>
          ) : undefined
        }
      />

      <form
        onSubmit={(e) => { e.preventDefault(); void buscar(code); }}
        className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3"
      >
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#1a3326]"
              placeholder="Digite o código de rastreio do pedido"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="bg-[#1a3326] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#274837] disabled:opacity-60 inline-flex items-center gap-2"
          >
            {loading ? <Spinner size={15} /> : <ArrowRight size={16} />}
            {loading ? 'Consultando...' : 'Rastrear'}
          </button>
        </div>

        {codigosRapidos.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400">Pedidos recentes:</span>
            {codigosRapidos.map((p) => (
              <button
                key={p.id_pedido}
                type="button"
                onClick={() => {
                  const c = p.codigo_rastreio || '';
                  setCode(c);
                  void buscar(c);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#e8f0eb] text-slate-700 hover:text-[#1a3326] font-medium transition"
              >
                {p.codigo_rastreio} • {p.nome_produto}
              </button>
            ))}
          </div>
        )}
      </form>

      {erro && <Alert variant="error">{erro}</Alert>}
      {actionErro && <Alert variant="error">{actionErro}</Alert>}
      {actionMsg && <Alert variant="success">{actionMsg}</Alert>}

      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-72 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      )}

      {!loading && !data && !erro && (
        <EmptyState
          icon={PackageSearch}
          title="Selecione ou informe um código de rastreio"
          description="Use a barra acima ou clique em um dos seus pedidos recentes para acompanhar os eventos de entrega."
        />
      )}

      {!loading && data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#e8f0eb] text-[#1a3326]"><Truck size={20} /></div>
                  <div>
                    <div className="text-xs text-slate-500">Remessa {data.id_remessa}</div>
                    <h2 className="text-lg font-bold text-slate-900">{data.status_entrega || data.status}</h2>
                  </div>
                </div>
                <Badge variant={statusBadgeVariant(data.status_entrega || data.status, data.retido_analise)}>
                  {data.codigo_rastreio}
                </Badge>
              </div>
              <p className="text-sm text-slate-600">
                Previsão de entrega: <strong className="text-slate-900">{formatarDataExtenso(data.previsao_entrega)}</strong>
              </p>
              {data.retido_analise && (
                <Alert variant="warning" className="mt-4">
                  Pedido retido em análise: {data.motivo_retencao || 'Em conferência documental'}
                </Alert>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <h3 className="font-bold text-base text-slate-900 mb-6">Histórico de movimentações</h3>
              <div className="space-y-7 relative pl-4 border-l-2 border-slate-100 ml-2">
                {data.eventos.map((ev, i) => {
                  const atual = i === 0;
                  return (
                    <div key={ev.id_evento} style={{ '--i': i } as CSSProperties} className="stagger relative pl-6">
                      <div className={`absolute -left-[21px] top-1 w-3.5 h-3.5 rounded-full border-2 ${atual ? 'bg-[#1a3326] border-[#1a3326]' : 'bg-white border-slate-300'}`} />
                      <div className="flex flex-wrap justify-between items-start gap-3">
                        <div>
                          <div className={`text-sm font-semibold ${atual ? 'text-[#1a3326]' : 'text-slate-900'}`}>{ev.descricao}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{ev.localizacao || data.origem || 'Brasil'}</div>
                        </div>
                        <span className="text-xs text-slate-400 tabular-nums">{formatarDataHora(ev.data_hora)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-base text-slate-900">Ocorrências registradas</h3>
                <Link href="/sinistros" className="text-xs font-semibold text-[#1a3326] hover:underline">
                  Gerenciar sinistros →
                </Link>
              </div>
              {data.ocorrencias.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhuma ocorrência registrada para esta remessa.</p>
              ) : (
                <div className="space-y-2.5">
                  {data.ocorrencias.map((oc) => (
                    <div key={oc.id_ocorrencia} className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/70 text-xs">
                      <div className="flex justify-between font-semibold text-amber-900">
                        <span>{oc.id_ocorrencia} • {oc.tipo}</span>
                        <span>{formatarDataHora(oc.data_ocorrencia)}</span>
                      </div>
                      <p className="text-amber-800 mt-1">{oc.descricao}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs h-fit">
            <h3 className="font-bold text-base text-slate-900 mb-4">Detalhes do pedido</h3>
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
              <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600"><Laptop size={19} /></div>
              <div className="min-w-0">
                <div className="font-semibold text-sm text-slate-900 truncate">{data.nome_produto}</div>
                <div className="text-xs text-slate-400">{data.categoria_descricao || 'Categoria geral'}</div>
              </div>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between gap-2"><span className="text-slate-500">Pedido</span><span className="font-semibold text-slate-900">{data.id_pedido}</span></div>
              <div className="flex justify-between gap-2"><span className="text-slate-500">Transportadora</span><span className="font-medium">{data.transportadora || 'LogMagna Express'}</span></div>
              <div className="flex justify-between gap-2"><span className="text-slate-500">Origem</span><span className="font-medium text-right">{data.origem || '—'}</span></div>
              <div className="flex justify-between gap-2"><span className="text-slate-500">Destino</span><span className="font-medium text-right">{data.destino || '—'}</span></div>
              <div className="flex justify-between gap-2"><span className="text-slate-500">Apólice</span><span className="font-medium">{data.id_apolice || '—'}</span></div>
              <div className="flex justify-between gap-2"><span className="text-slate-500">Seguradora</span><span className="font-medium text-right">{data.seguradora_razao_social || '—'}</span></div>
              <div className="flex justify-between gap-2 pt-2 border-t border-slate-100">
                <span className="text-slate-500">Valor declarado</span>
                <span className="font-bold text-slate-900 tabular-nums">{brl(data.valor_declarado)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal open={modalEvento} onClose={() => setModalEvento(false)} title="Registrar movimentação">
        <form onSubmit={handleRegistrarEvento} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Descrição da movimentação *</label>
            <input
              type="text"
              value={evtDesc}
              onChange={(e) => setEvtDesc(e.target.value)}
              placeholder="Ex.: Objeto encaminhado para unidade de destino"
              className="w-full border border-slate-200 rounded-xl p-2.5 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Localização</label>
            <input
              type="text"
              value={evtLoc}
              onChange={(e) => setEvtLoc(e.target.value)}
              placeholder="Ex.: Centro de Distribuição São Paulo, SP"
              className="w-full border border-slate-200 rounded-xl p-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Atualizar status da entrega</label>
            <select value={evtStatus} onChange={(e) => setEvtStatus(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white">
              <option value="">Manter status atual</option>
              <option value="Aguardando">Aguardando</option>
              <option value="Em trânsito">Em trânsito</option>
              <option value="Entregue">Entregue</option>
              <option value="Retido">Retido</option>
            </select>
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button type="button" onClick={() => setModalEvento(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-sm">Cancelar</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-[#1a3326] text-white rounded-xl text-sm font-medium inline-flex items-center gap-2">
              {saving && <Spinner size={14} />} Salvar evento
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={modalOcorrencia} onClose={() => setModalOcorrencia(false)} title="Reportar ocorrência no transporte">
        <form onSubmit={handleRegistrarOcorrencia} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tipo de ocorrência *</label>
            <select value={ocoTipo} onChange={(e) => setOcoTipo(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white">
              <option value="Atraso operacional">Atraso operacional</option>
              <option value="Avaria na embalagem">Avaria na embalagem</option>
              <option value="Retenção fiscal">Retenção fiscal</option>
              <option value="Extravio parcial">Extravio parcial</option>
              <option value="Extravio total">Extravio total</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Descrição detalhada *</label>
            <input
              type="text"
              value={ocoDesc}
              onChange={(e) => setOcoDesc(e.target.value)}
              placeholder="Descreva o ocorrido com a remessa"
              className="w-full border border-slate-200 rounded-xl p-2.5 text-sm"
              required
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button type="button" onClick={() => setModalOcorrencia(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-sm">Cancelar</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-amber-700 text-white rounded-xl text-sm font-medium inline-flex items-center gap-2">
              {saving && <Spinner size={14} />} Registrar ocorrência
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function TrackingView() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code')?.trim().toUpperCase() || '';
  return <PrivateTrackingContent key={initialCode} initialCode={initialCode} />;
}
