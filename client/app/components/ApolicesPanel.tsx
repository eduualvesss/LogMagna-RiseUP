'use client';

import { useEffect, useState, useCallback } from 'react';
import type { FormEvent } from 'react';
import { Shield, Building, Plus, Pencil, Trash2 } from 'lucide-react';
import { authFetch } from '../lib/auth';
import { API_URL } from '../lib/config';
import { brl, formatarData } from '../lib/format';
import { Spinner, TableSkeleton } from './Loading';

interface Apolice {
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
}

interface Seguradora {
  id_seguradora: string;
  razao_social: string;
  contato: string | null;
  total_apolices?: number;
}

export default function ApolicesPanel() {
  const [aba, setAba] = useState<'apolices' | 'seguradoras'>('apolices');
  const [apolices, setApolices] = useState<Apolice[]>([]);
  const [seguradoras, setSeguradoras] = useState<Seguradora[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');

  // Form Apólice
  const [editApoliceId, setEditApoliceId] = useState<string | null>(null);
  const [formApoliceAberto, setFormApoliceAberto] = useState(false);
  const [apSegId, setApSegId] = useState('');
  const [apValor, setApValor] = useState('1500');
  const [apPremio, setApPremio] = useState('');
  const [apInicio, setApInicio] = useState(() => new Date().toISOString().slice(0, 10));
  const [apFim, setApFim] = useState(() => new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10));
  const [apCoberturas, setApCoberturas] = useState('Roubo, extravio e avaria no transporte');

  // Form Seguradora
  const [editSegId, setEditSegId] = useState<string | null>(null);
  const [formSegAberto, setFormSegAberto] = useState(false);
  const [segNome, setSegNome] = useState('');
  const [segContato, setSegContato] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(() => {
    setLoading(true);
    setErro('');
    Promise.all([
      authFetch(`${API_URL}/apolices`).then((r) => r.json()),
      authFetch(`${API_URL}/seguradoras`).then((r) => r.json()),
    ])
      .then(([aps, segs]) => {
        const listaAps = Array.isArray(aps) ? aps : [];
        const listaSegs = Array.isArray(segs) ? segs : [];
        setApolices(listaAps);
        setSeguradoras(listaSegs);
        if (!apSegId && listaSegs[0]) setApSegId(listaSegs[0].id_seguradora);
      })
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar apólices.'))
      .finally(() => setLoading(false));
  }, [apSegId]);

  useEffect(() => { carregar(); }, [carregar]);

  function abrirNovaApolice() {
    setEditApoliceId(null);
    setApSegId(seguradoras[0]?.id_seguradora || '');
    setApValor('1500');
    setApPremio('');
    setApInicio(new Date().toISOString().slice(0, 10));
    setApFim(new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10));
    setApCoberturas('Roubo, extravio e avaria no transporte');
    setFormApoliceAberto(true);
    setErro('');
    setMsg('');
  }

  function abrirEditarApolice(a: Apolice) {
    setEditApoliceId(a.id_apolice);
    setApSegId(a.id_seguradora);
    setApValor(String(a.valor_segurado));
    setApPremio(a.valor_premio != null ? String(a.valor_premio) : '');
    setApInicio(a.vigencia_inicio);
    setApFim(a.vigencia_fim);
    setApCoberturas(a.coberturas);
    setFormApoliceAberto(true);
    setErro('');
    setMsg('');
  }

  async function salvarApolice(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    setMsg('');
    try {
      const url = editApoliceId ? `${API_URL}/apolices/${editApoliceId}` : `${API_URL}/apolices`;
      const resp = await authFetch(url, {
        method: editApoliceId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_seguradora: apSegId,
          valor_segurado: Number(apValor),
          valor_premio: apPremio ? Number(apPremio) : undefined,
          vigencia_inicio: apInicio,
          vigencia_fim: apFim,
          coberturas: apCoberturas,
        }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || 'Erro ao salvar apólice.');
      setFormApoliceAberto(false);
      setMsg(editApoliceId ? `Apólice ${json.id_apolice} atualizada.` : `Apólice ${json.id_apolice} criada.`);
      carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao salvar apólice.');
    } finally {
      setSalvando(false);
    }
  }

  function abrirNovaSeguradora() {
    setEditSegId(null);
    setSegNome('');
    setSegContato('');
    setFormSegAberto(true);
    setErro('');
    setMsg('');
  }

  function abrirEditarSeguradora(s: Seguradora) {
    setEditSegId(s.id_seguradora);
    setSegNome(s.razao_social);
    setSegContato(s.contato || '');
    setFormSegAberto(true);
    setErro('');
    setMsg('');
  }

  async function salvarSeguradora(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    setMsg('');
    try {
      const url = editSegId ? `${API_URL}/seguradoras/${editSegId}` : `${API_URL}/seguradoras`;
      const resp = await authFetch(url, {
        method: editSegId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ razao_social: segNome, contato: segContato }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || 'Erro ao salvar seguradora.');
      setFormSegAberto(false);
      setMsg(`Seguradora ${json.razao_social} salva com sucesso.`);
      carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao salvar seguradora.');
    } finally {
      setSalvando(false);
    }
  }

  async function excluirSeguradora(s: Seguradora) {
    setErro('');
    setMsg('');
    try {
      const resp = await authFetch(`${API_URL}/seguradoras/${s.id_seguradora}`, { method: 'DELETE' });
      if (!resp.ok) {
        const json = await resp.json().catch(() => ({}));
        throw new Error(json.error || 'Não foi possível excluir a seguradora.');
      }
      setMsg(`Seguradora ${s.razao_social} removida.`);
      carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao excluir.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Apólices e seguradoras</h1>
          <p className="text-gray-500 mt-1">Gerencie coberturas, vigências, valores segurados e parceiros seguradores.</p>
        </div>
        <div className="flex gap-2">
          {aba === 'apolices' ? (
            <button onClick={abrirNovaApolice} className="bg-[#1a3326] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#2d4a3e] flex items-center gap-2">
              <Plus size={18} /> Nova apólice
            </button>
          ) : (
            <button onClick={abrirNovaSeguradora} className="bg-[#1a3326] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#2d4a3e] flex items-center gap-2">
              <Plus size={18} /> Nova seguradora
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 text-sm font-medium">
        <button
          onClick={() => setAba('apolices')}
          className={`pb-3 px-1 flex items-center gap-2 border-b-2 transition ${aba === 'apolices' ? 'border-[#1a3326] text-[#1a3326] font-semibold' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <Shield size={17} /> Apólices ({apolices.length})
        </button>
        <button
          onClick={() => setAba('seguradoras')}
          className={`pb-3 px-1 flex items-center gap-2 border-b-2 transition ${aba === 'seguradoras' ? 'border-[#1a3326] text-[#1a3326] font-semibold' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <Building size={17} /> Seguradoras ({seguradoras.length})
        </button>
      </div>

      {erro && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{erro}</div>}
      {msg && <div className="p-3 rounded-lg bg-[#e8f0eb] text-[#1a3326] text-sm animate-pop-in">{msg}</div>}

      {aba === 'apolices' && (
        <>
          {formApoliceAberto && (
            <form onSubmit={salvarApolice} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 animate-pop-in">
              <h2 className="font-bold text-lg text-gray-900">{editApoliceId ? `Editar apólice ${editApoliceId}` : 'Nova apólice'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Seguradora *</label>
                  <select value={apSegId} onChange={(e) => setApSegId(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-white">
                    {seguradoras.map((s) => (
                      <option key={s.id_seguradora} value={s.id_seguradora}>{s.razao_social}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Valor segurado (R$) *</label>
                  <input type="number" step="0.01" min="1" value={apValor} onChange={(e) => setApValor(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Prêmio (R$ — opcional, padrão 2%)</label>
                  <input type="number" step="0.01" min="0" value={apPremio} onChange={(e) => setApPremio(e.target.value)} placeholder="Automático (2%)" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Vigência início</label>
                  <input type="date" value={apInicio} onChange={(e) => setApInicio(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Vigência fim</label>
                  <input type="date" value={apFim} onChange={(e) => setApFim(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Coberturas *</label>
                  <input type="text" value={apCoberturas} onChange={(e) => setApCoberturas(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" required />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setFormApoliceAberto(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancelar</button>
                <button type="submit" disabled={salvando} className="px-4 py-2 bg-[#1a3326] text-white rounded-lg text-sm font-medium flex items-center gap-2">
                  {salvando && <Spinner size={14} />} Salvar apólice
                </button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="p-4">Apólice</th>
                  <th className="p-4">Seguradora</th>
                  <th className="p-4">Pedido / Rastreio</th>
                  <th className="p-4">Valor Segurado / Prêmio</th>
                  <th className="p-4">Vigência</th>
                  <th className="p-4">Coberturas</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              {loading ? (
                <TableSkeleton rows={5} cols={7} />
              ) : (
                <tbody className="divide-y divide-gray-100 text-sm">
                  {apolices.map((a) => (
                    <tr key={a.id_apolice} className="hover:bg-gray-50">
                      <td className="p-4 font-semibold text-gray-900">{a.id_apolice}</td>
                      <td className="p-4">
                        <div className="font-medium text-gray-800">{a.seguradora_razao_social}</div>
                        <div className="text-xs text-gray-400">{a.seguradora_contato}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-gray-800">{a.nome_produto || 'Avulsa'}</div>
                        <div className="text-xs text-gray-400">{a.id_pedido ? `${a.id_pedido} • ${a.codigo_rastreio}` : 'Sem remessa vinculada'}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-gray-900">{brl(a.valor_segurado)}</div>
                        <div className="text-xs text-gray-500">Prêmio: {brl(a.valor_premio ?? a.valor_segurado * 0.02)}</div>
                      </td>
                      <td className="p-4 text-xs text-gray-600 whitespace-nowrap">
                        {formatarData(a.vigencia_inicio)} até {formatarData(a.vigencia_fim)}
                      </td>
                      <td className="p-4 text-xs text-gray-600 max-w-xs">{a.coberturas}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => abrirEditarApolice(a)} className="text-[#1a3326] hover:underline text-xs font-medium inline-flex items-center gap-1">
                          <Pencil size={13} /> Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>
        </>
      )}

      {aba === 'seguradoras' && (
        <>
          {formSegAberto && (
            <form onSubmit={salvarSeguradora} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 animate-pop-in">
              <h2 className="font-bold text-lg text-gray-900">{editSegId ? `Editar seguradora ${editSegId}` : 'Nova seguradora'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Razão social *</label>
                  <input type="text" value={segNome} onChange={(e) => setSegNome(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Contato (e-mail ou telefone)</label>
                  <input type="text" value={segContato} onChange={(e) => setSegContato(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setFormSegAberto(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancelar</button>
                <button type="submit" disabled={salvando} className="px-4 py-2 bg-[#1a3326] text-white rounded-lg text-sm font-medium flex items-center gap-2">
                  {salvando && <Spinner size={14} />} Salvar seguradora
                </button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">Razão social</th>
                  <th className="p-4">Contato</th>
                  <th className="p-4">Apólices emitidas</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              {loading ? (
                <TableSkeleton rows={4} cols={5} />
              ) : (
                <tbody className="divide-y divide-gray-100 text-sm">
                  {seguradoras.map((s) => (
                    <tr key={s.id_seguradora} className="hover:bg-gray-50">
                      <td className="p-4 font-semibold text-gray-900">{s.id_seguradora}</td>
                      <td className="p-4 font-medium text-gray-900">{s.razao_social}</td>
                      <td className="p-4 text-gray-600">{s.contato || '—'}</td>
                      <td className="p-4 text-gray-600">{s.total_apolices ?? 0}</td>
                      <td className="p-4 text-right whitespace-nowrap space-x-3">
                        <button onClick={() => abrirEditarSeguradora(s)} className="text-[#1a3326] hover:underline text-xs font-medium inline-flex items-center gap-1">
                          <Pencil size={13} /> Editar
                        </button>
                        <button onClick={() => excluirSeguradora(s)} className="text-red-700 hover:underline text-xs font-medium inline-flex items-center gap-1">
                          <Trash2 size={13} /> Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>
        </>
      )}
    </div>
  );
}
