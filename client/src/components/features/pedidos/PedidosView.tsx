'use client';

import { useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, Camera, Headphones, Laptop, PlusCircle, Search, ShieldCheck, Trash2
} from 'lucide-react';
import { usePedidos } from '@/hooks/usePedidos';
import { brl, formatarData, statusBadgeVariant } from '@/lib/format';
import type { PedidoItem } from '@/types';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton, Spinner, TableSkeleton } from '@/components/ui/Loading';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs } from '@/components/ui/Tabs';

export default function PedidosView() {
  const { pedidos, categorias, loading, erro, atualizarPedido, excluirPedido } = usePedidos();
  const [aba, setAba] = useState<'todos' | 'ativos' | 'entregues' | 'retidos'>('todos');
  const [busca, setBusca] = useState('');
  const [filtroCat, setFiltroCat] = useState('');
  const [msg, setMsg] = useState('');
  const [erroAcao, setErroAcao] = useState('');

  const [selecionado, setSelecionado] = useState<PedidoItem | null>(null);
  const [pedidoExcluir, setPedidoExcluir] = useState<PedidoItem | null>(null);
  const [editStatus, setEditStatus] = useState('Aguardando');
  const [editRetido, setEditRetido] = useState(false);
  const [editMotivo, setEditMotivo] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erroModal, setErroModal] = useState('');

  function abrirDetalhe(p: PedidoItem) {
    setSelecionado(p);
    setEditStatus(p.status);
    setEditRetido(Boolean(p.retido_analise));
    setEditMotivo(p.motivo_retencao || '');
    setErroModal('');
  }

  async function salvarAlteracao(e: FormEvent) {
    e.preventDefault();
    if (!selecionado) return;
    setSalvando(true);
    setErroModal('');
    setMsg('');
    try {
      await atualizarPedido(selecionado.id_pedido, {
        status: editStatus,
        retido_analise: editRetido,
        motivo_retencao: editRetido ? editMotivo : '',
      });
      setMsg(`Pedido ${selecionado.id_pedido} atualizado.`);
      setSelecionado(null);
    } catch (err) {
      setErroModal(err instanceof Error ? err.message : 'Falha ao atualizar pedido.');
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarExcluirPedido() {
    if (!pedidoExcluir) return;
    setSalvando(true);
    setErroAcao('');
    setMsg('');
    try {
      await excluirPedido(pedidoExcluir.id_pedido);
      setMsg(`Pedido ${pedidoExcluir.id_pedido} excluído.`);
      setPedidoExcluir(null);
    } catch (err) {
      setErroAcao(err instanceof Error ? err.message : 'Não foi possível excluir o pedido.');
      setPedidoExcluir(null);
    } finally {
      setSalvando(false);
    }
  }

  const termo = busca.trim().toLowerCase();
  const filtrados = pedidos.filter((p) => {
    if (aba === 'ativos' && (p.status === 'Entregue' || p.status === 'Cancelado')) return false;
    if (aba === 'entregues' && p.status !== 'Entregue') return false;
    if (aba === 'retidos' && !p.retido_analise) return false;
    if (filtroCat && p.id_categoria !== filtroCat) return false;
    if (termo) {
      const alvo = `${p.id_pedido} ${p.nome_produto} ${p.codigo_rastreio || ''} ${p.loja || ''} ${p.seguradora_razao_social || ''}`.toLowerCase();
      if (!alvo.includes(termo)) return false;
    }
    return true;
  });

  const totalValor = filtrados.reduce((s, p) => s + p.valor_declarado, 0);
  const totalPremio = filtrados.reduce((s, p) => s + p.valor_premio, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pedidos e seguros"
        description="Consulte pedidos, apólices emitidas, categorias e status de retenção."
        actions={
          <Link
            href="/add"
            className="bg-[#1a3326] text-white px-4 py-2.5 rounded-xl inline-flex items-center gap-2 text-sm font-medium hover:bg-[#274837] transition"
          >
            <PlusCircle size={17} /> Novo pedido
          </Link>
        }
      />

      {(erro || erroAcao) && <Alert variant="error">{erro || erroAcao}</Alert>}
      {msg && <Alert variant="success">{msg}</Alert>}

      <div className="bg-[#e8f0eb] px-5 py-3.5 rounded-2xl border border-[#d4e3da] flex flex-wrap justify-between items-center gap-3 text-sm">
        <div className="flex items-center gap-2 text-[#1a3326] font-semibold">
          <ShieldCheck size={18} />
          {loading ? <Skeleton className="h-4 w-44" /> : `${filtrados.length} pedido(s) exibido(s) de ${pedidos.length}`}
        </div>
        <div className="text-slate-700 tabular-nums">
          {loading ? (
            <Skeleton className="h-4 w-52" />
          ) : (
            <>Valor declarado: <strong>{brl(totalValor)}</strong> • Prêmios: <strong>{brl(totalPremio)}</strong></>
          )}
        </div>
      </div>

      <Tabs
        value={aba}
        onChange={setAba}
        items={[
          { id: 'todos', label: 'Todos', count: pedidos.length },
          { id: 'ativos', label: 'Ativos', count: pedidos.filter((p) => p.status !== 'Entregue' && p.status !== 'Cancelado').length },
          { id: 'entregues', label: 'Entregues', count: pedidos.filter((p) => p.status === 'Entregue').length },
          { id: 'retidos', label: 'Retidos', count: pedidos.filter((p) => p.retido_analise).length },
        ]}
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar produto, ID do pedido, loja ou código de rastreio"
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#1a3326]"
          />
        </div>
        <select
          value={filtroCat}
          onChange={(e) => setFiltroCat(e.target.value)}
          aria-label="Filtrar por categoria"
          className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#1a3326]"
        >
          <option value="">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c.id_categoria} value={c.id_categoria}>{c.descricao}</option>
          ))}
        </select>
      </div>

      {!loading && pedidos.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Nenhum pedido cadastrado"
          description="Registre o primeiro pedido para emitir automaticamente sua apólice de seguro e código de rastreio."
          action={
            <Link
              href="/add"
              className="bg-[#1a3326] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#274837] inline-flex items-center gap-2"
            >
              <PlusCircle size={16} /> Cadastrar pedido
            </Link>
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-xs text-slate-500 uppercase border-b border-slate-200/70">
              <tr>
                <th className="px-5 py-3.5">Produto / Pedido</th>
                <th className="px-5 py-3.5">Categoria / Loja</th>
                <th className="px-5 py-3.5">Valor / Prêmio</th>
                <th className="px-5 py-3.5">Apólice / Seguradora</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            {loading ? (
              <TableSkeleton rows={5} cols={6} />
            ) : filtrados.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-slate-500">
                    Nenhum pedido encontrado para os filtros selecionados.
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-slate-100">
                {filtrados.map((p, i) => (
                  <tr key={p.id_pedido} style={{ '--i': i } as CSSProperties} className="stagger hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-xl text-slate-600 shrink-0">
                          {p.nome_produto.includes('Notebook') ? <Laptop size={17} /> : p.nome_produto.includes('Fone') ? <Headphones size={17} /> : <Camera size={17} />}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{p.nome_produto}</div>
                          <div className="text-xs text-slate-500">
                            {p.id_pedido} • {p.codigo_rastreio || 'Sem código'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      <div>{p.categoria_descricao || '—'}</div>
                      <div className="text-xs text-slate-400">{p.loja || 'Loja não informada'}</div>
                    </td>
                    <td className="px-5 py-4 tabular-nums">
                      <div className="font-semibold text-slate-900">{brl(p.valor_declarado)}</div>
                      <div className="text-xs text-slate-500">Prêmio: {brl(p.valor_premio)}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-800">{p.id_apolice || 'Sem apólice'}</div>
                      <div className="text-xs text-slate-400">{p.seguradora_razao_social || '—'}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col items-start gap-1">
                        <Badge variant={statusBadgeVariant(p.status)}>{p.status}</Badge>
                        {p.retido_analise && (
                          <Badge variant="warning">
                            <AlertTriangle size={11} /> Retido
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap space-x-3">
                      <button onClick={() => abrirDetalhe(p)} className="text-xs font-semibold text-[#1a3326] hover:underline">
                        Gerenciar
                      </button>
                      {p.codigo_rastreio && (
                        <Link href={`/tracking?code=${encodeURIComponent(p.codigo_rastreio)}`} className="text-xs font-semibold text-emerald-700 hover:underline">
                          Rastrear
                        </Link>
                      )}
                      <button
                        onClick={() => setPedidoExcluir(p)}
                        className="text-xs font-medium text-red-600 hover:underline inline-flex items-center gap-0.5"
                        title="Excluir pedido (sem ocorrências/atendimentos)"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
      )}

      <Modal
        open={Boolean(selecionado)}
        onClose={() => setSelecionado(null)}
        title={selecionado?.nome_produto || 'Gerenciar pedido'}
        subtitle={selecionado ? `Pedido ${selecionado.id_pedido} • Cliente: ${selecionado.cliente_nome}` : undefined}
      >
        {selecionado && (
          <div className="space-y-5">
            <div className="bg-slate-50 rounded-xl p-4 text-xs space-y-1.5 border border-slate-100">
              <div className="flex justify-between"><span className="text-slate-500">Rastreio:</span><span className="font-semibold">{selecionado.codigo_rastreio || '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Rota:</span><span className="font-medium">{selecionado.origem || '—'} → {selecionado.destino || '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Apólice:</span><span className="font-medium">{selecionado.id_apolice || '—'} ({selecionado.seguradora_razao_social || '—'})</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Coberturas:</span><span className="font-medium">{selecionado.coberturas || '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Compra / Previsão:</span><span className="font-medium">{formatarData(selecionado.data_compra)} / {formatarData(selecionado.previsao_entrega)}</span></div>
            </div>

            <form onSubmit={salvarAlteracao} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Status do pedido e entrega</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white focus:outline-none focus:border-[#1a3326]"
                >
                  <option value="Aguardando">Aguardando</option>
                  <option value="Em trânsito">Em trânsito</option>
                  <option value="Entregue">Entregue</option>
                  <option value="Retido">Retido</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editRetido}
                  onChange={(e) => setEditRetido(e.target.checked)}
                  className="accent-[#1a3326] w-4 h-4 rounded"
                />
                Marcar pedido como retido para análise
              </label>

              {editRetido && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Motivo da retenção</label>
                  <input
                    type="text"
                    value={editMotivo}
                    onChange={(e) => setEditMotivo(e.target.value)}
                    placeholder="Ex.: Conferência de nota fiscal"
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:border-[#1a3326]"
                  />
                </div>
              )}

              {erroModal && <Alert variant="error">{erroModal}</Alert>}

              <div className="flex justify-end gap-2.5 pt-2">
                <button type="button" onClick={() => setSelecionado(null)} className="px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 hover:bg-slate-50">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-4 py-2 bg-[#1a3326] text-white rounded-xl text-sm font-medium hover:bg-[#274837] disabled:opacity-70 inline-flex items-center gap-2"
                >
                  {salvando && <Spinner size={14} />} Salvar alterações
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(pedidoExcluir)}
        onClose={() => setPedidoExcluir(null)}
        title="Confirmar exclusão"
      >
        <p className="text-sm text-slate-600">
          Deseja excluir o pedido <strong className="text-slate-900">{pedidoExcluir?.nome_produto}</strong> ({pedidoExcluir?.id_pedido})?
          Essa ação também remove a remessa e a apólice sem vínculo.
        </p>
        <div className="mt-5 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={() => setPedidoExcluir(null)}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={salvando}
            onClick={confirmarExcluirPedido}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {salvando && <Spinner size={14} />} Excluir pedido
          </button>
        </div>
      </Modal>
    </div>
  );
}
