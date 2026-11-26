'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Building, Pencil, Plus, Shield, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/auth-context';
import { useApolices } from '@/hooks/useApolices';
import { brl, formatarData } from '@/lib/format';
import { segurosService } from '@/services/seguros.service';
import type { ApoliceItem, SeguradoraItem } from '@/types';
import { Alert } from '@/components/ui/Alert';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner, TableSkeleton } from '@/components/ui/Loading';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs } from '@/components/ui/Tabs';

export default function ApolicesView() {
  const { isAdmin } = useAuth();
  const { apolices, seguradoras, loading, erro, recarregar } = useApolices();
  const [aba, setAba] = useState<'apolices' | 'seguradoras'>('apolices');
  const [erroAcao, setErroAcao] = useState('');
  const [msg, setMsg] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Modal Apólice
  const [modalApolice, setModalApolice] = useState(false);
  const [editApoliceId, setEditApoliceId] = useState<string | null>(null);
  const [apSegId, setApSegId] = useState('');
  const [apValor, setApValor] = useState('');
  const [apPremio, setApPremio] = useState('');
  const [apInicio, setApInicio] = useState(() => new Date().toISOString().slice(0, 10));
  const [apFim, setApFim] = useState(() => new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10));
  const [apCoberturas, setApCoberturas] = useState('Roubo, extravio e avaria no transporte');

  // Modal Seguradora
  const [modalSeg, setModalSeg] = useState(false);
  const [editSegId, setEditSegId] = useState<string | null>(null);
  const [segNome, setSegNome] = useState('');
  const [segContato, setSegContato] = useState('');

  function abrirNovaApolice() {
    setEditApoliceId(null);
    setApSegId(seguradoras[0]?.id_seguradora || '');
    setApValor('');
    setApPremio('');
    setApInicio(new Date().toISOString().slice(0, 10));
    setApFim(new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10));
    setApCoberturas('Roubo, extravio e avaria no transporte');
    setErroAcao('');
    setModalApolice(true);
  }

  function abrirEditarApolice(a: ApoliceItem) {
    setEditApoliceId(a.id_apolice);
    setApSegId(a.id_seguradora);
    setApValor(String(a.valor_segurado));
    setApPremio(a.valor_premio != null ? String(a.valor_premio) : '');
    setApInicio(a.vigencia_inicio);
    setApFim(a.vigencia_fim);
    setApCoberturas(a.coberturas);
    setErroAcao('');
    setModalApolice(true);
  }

  async function salvarApolice(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErroAcao('');
    setMsg('');
    try {
      const payload = {
        id_seguradora: apSegId || seguradoras[0]?.id_seguradora || '',
        valor_segurado: Number(apValor),
        valor_premio: apPremio ? Number(apPremio) : undefined,
        vigencia_inicio: apInicio,
        vigencia_fim: apFim,
        coberturas: apCoberturas,
      };
      const salva = editApoliceId
        ? await segurosService.updateApolice(editApoliceId, payload)
        : await segurosService.createApolice(payload);
      setModalApolice(false);
      setMsg(editApoliceId ? `Apólice ${salva.id_apolice} atualizada.` : `Apólice ${salva.id_apolice} emitida.`);
      await recarregar();
    } catch (err) {
      setErroAcao(err instanceof Error ? err.message : 'Falha ao salvar apólice.');
    } finally {
      setSalvando(false);
    }
  }

  function abrirNovaSeguradora() {
    setEditSegId(null);
    setSegNome('');
    setSegContato('');
    setErroAcao('');
    setModalSeg(true);
  }

  function abrirEditarSeguradora(s: SeguradoraItem) {
    setEditSegId(s.id_seguradora);
    setSegNome(s.razao_social);
    setSegContato(s.contato || '');
    setErroAcao('');
    setModalSeg(true);
  }

  async function salvarSeguradora(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErroAcao('');
    setMsg('');
    try {
      const salva = editSegId
        ? await segurosService.updateSeguradora(editSegId, { razao_social: segNome, contato: segContato })
        : await segurosService.createSeguradora({ razao_social: segNome, contato: segContato });
      setModalSeg(false);
      setMsg(`Seguradora ${salva.razao_social} salva.`);
      await recarregar();
    } catch (err) {
      setErroAcao(err instanceof Error ? err.message : 'Falha ao salvar seguradora.');
    } finally {
      setSalvando(false);
    }
  }

  async function excluirSeguradora(s: SeguradoraItem) {
    setErroAcao('');
    setMsg('');
    try {
      await segurosService.deleteSeguradora(s.id_seguradora);
      setMsg(`Seguradora ${s.razao_social} removida.`);
      await recarregar();
    } catch (err) {
      setErroAcao(err instanceof Error ? err.message : 'Erro ao excluir seguradora.');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Apólices e seguradoras"
        description="Gerencie vigências, coberturas contratadas, valores segurados e seguradoras parceiras."
        actions={
          aba === 'apolices' ? (
            <button
              type="button"
              onClick={abrirNovaApolice}
              className="bg-[#1a3326] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#274837] inline-flex items-center gap-2"
            >
              <Plus size={17} /> Nova apólice
            </button>
          ) : isAdmin ? (
            <button
              type="button"
              onClick={abrirNovaSeguradora}
              className="bg-[#1a3326] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#274837] inline-flex items-center gap-2"
            >
              <Plus size={17} /> Nova seguradora
            </button>
          ) : undefined
        }
      />

      <Tabs
        value={aba}
        onChange={setAba}
        items={[
          { id: 'apolices', label: 'Apólices', count: apolices.length, icon: Shield },
          { id: 'seguradoras', label: 'Seguradoras', count: seguradoras.length, icon: Building },
        ]}
      />

      {(erro || erroAcao) && <Alert variant="error">{erro || erroAcao}</Alert>}
      {msg && <Alert variant="success">{msg}</Alert>}

      {aba === 'apolices' && (
        !loading && apolices.length === 0 ? (
          <EmptyState
            icon={Shield}
            title="Nenhuma apólice emitida"
            description="Cadastre um pedido ou emita uma apólice avulsa para visualizar vigências e coberturas aqui."
            action={
              <button
                type="button"
                onClick={abrirNovaApolice}
                className="bg-[#1a3326] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#274837]"
              >
                Emitir apólice
              </button>
            }
          />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-xs text-slate-500 uppercase border-b border-slate-200/70">
                <tr>
                  <th className="px-5 py-3.5">Apólice</th>
                  <th className="px-5 py-3.5">Seguradora</th>
                  <th className="px-5 py-3.5">Pedido / Rastreio</th>
                  <th className="px-5 py-3.5">Valor Segurado / Prêmio</th>
                  <th className="px-5 py-3.5">Vigência</th>
                  <th className="px-5 py-3.5">Coberturas</th>
                  <th className="px-5 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              {loading ? (
                <TableSkeleton rows={4} cols={7} />
              ) : (
                <tbody className="divide-y divide-slate-100">
                  {apolices.map((a) => (
                    <tr key={a.id_apolice} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4 font-semibold text-slate-900">{a.id_apolice}</td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-800">{a.seguradora_razao_social}</div>
                        <div className="text-xs text-slate-400">{a.seguradora_contato || '—'}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-slate-800">{a.nome_produto || 'Avulsa'}</div>
                        <div className="text-xs text-slate-400">
                          {a.id_pedido ? `${a.id_pedido} • ${a.codigo_rastreio}` : 'Sem remessa vinculada'}
                        </div>
                      </td>
                      <td className="px-5 py-4 tabular-nums">
                        <div className="font-semibold text-slate-900">{brl(a.valor_segurado)}</div>
                        <div className="text-xs text-slate-500">Prêmio: {brl(a.valor_premio ?? a.valor_segurado * 0.02)}</div>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600 whitespace-nowrap">
                        {formatarData(a.vigencia_inicio)} até {formatarData(a.vigencia_fim)}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600 max-w-xs">{a.coberturas}</td>
                      <td className="px-5 py-4 text-right">
                        <button onClick={() => abrirEditarApolice(a)} className="text-[#1a3326] hover:underline text-xs font-semibold inline-flex items-center gap-1">
                          <Pencil size={13} /> Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>
        )
      )}

      {aba === 'seguradoras' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-xs text-slate-500 uppercase border-b border-slate-200/70">
              <tr>
                <th className="px-5 py-3.5">Código</th>
                <th className="px-5 py-3.5">Razão social</th>
                <th className="px-5 py-3.5">Contato</th>
                <th className="px-5 py-3.5">Apólices emitidas</th>
                {isAdmin && <th className="px-5 py-3.5 text-right">Ações</th>}
              </tr>
            </thead>
            {loading ? (
              <TableSkeleton rows={3} cols={isAdmin ? 5 : 4} />
            ) : (
              <tbody className="divide-y divide-slate-100">
                {seguradoras.map((s) => (
                  <tr key={s.id_seguradora} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4 font-mono text-xs text-slate-700">{s.id_seguradora}</td>
                    <td className="px-5 py-4 font-semibold text-slate-900">{s.razao_social}</td>
                    <td className="px-5 py-4 text-slate-600">{s.contato || '—'}</td>
                    <td className="px-5 py-4 text-slate-600 tabular-nums">{s.total_apolices ?? 0}</td>
                    {isAdmin && (
                      <td className="px-5 py-4 text-right whitespace-nowrap space-x-3">
                        <button onClick={() => abrirEditarSeguradora(s)} className="text-[#1a3326] hover:underline text-xs font-semibold inline-flex items-center gap-1">
                          <Pencil size={13} /> Editar
                        </button>
                        <button onClick={() => void excluirSeguradora(s)} className="text-red-600 hover:underline text-xs font-semibold inline-flex items-center gap-1">
                          <Trash2 size={13} /> Excluir
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
      )}

      <Modal
        open={modalApolice}
        onClose={() => setModalApolice(false)}
        title={editApoliceId ? `Editar apólice ${editApoliceId}` : 'Emitir nova apólice'}
      >
        <form onSubmit={salvarApolice} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Seguradora *</label>
            <select value={apSegId} onChange={(e) => setApSegId(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white">
              {seguradoras.map((s) => (
                <option key={s.id_seguradora} value={s.id_seguradora}>{s.razao_social}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Valor segurado (R$) *</label>
              <input type="number" step="0.01" min="1" value={apValor} onChange={(e) => setApValor(e.target.value)} placeholder="Ex.: 1500.00" className="w-full border border-slate-200 rounded-xl p-2.5 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Prêmio (R$ — opcional)</label>
              <input type="number" step="0.01" min="0" value={apPremio} onChange={(e) => setApPremio(e.target.value)} placeholder="Calculado (2%) se vazio" className="w-full border border-slate-200 rounded-xl p-2.5 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Início da vigência</label>
              <input type="date" value={apInicio} onChange={(e) => setApInicio(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Fim da vigência</label>
              <input type="date" value={apFim} onChange={(e) => setApFim(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm" required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Coberturas *</label>
            <input type="text" value={apCoberturas} onChange={(e) => setApCoberturas(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm" required />
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button type="button" onClick={() => setModalApolice(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-sm">Cancelar</button>
            <button type="submit" disabled={salvando} className="px-4 py-2 bg-[#1a3326] text-white rounded-xl text-sm font-medium inline-flex items-center gap-2">
              {salvando && <Spinner size={14} />} Salvar apólice
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={modalSeg}
        onClose={() => setModalSeg(false)}
        title={editSegId ? `Editar seguradora ${editSegId}` : 'Nova seguradora parceira'}
      >
        <form onSubmit={salvarSeguradora} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Razão social *</label>
            <input type="text" value={segNome} onChange={(e) => setSegNome(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Contato (e-mail ou telefone)</label>
            <input type="text" value={segContato} onChange={(e) => setSegContato(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm" />
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button type="button" onClick={() => setModalSeg(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-sm">Cancelar</button>
            <button type="submit" disabled={salvando} className="px-4 py-2 bg-[#1a3326] text-white rounded-xl text-sm font-medium inline-flex items-center gap-2">
              {salvando && <Spinner size={14} />} Salvar seguradora
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
