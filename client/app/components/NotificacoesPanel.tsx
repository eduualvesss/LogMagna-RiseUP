'use client';

import { useEffect, useState, useCallback } from 'react';
import type { FormEvent } from 'react';
import { Bell, Check, CheckCheck, Plus } from 'lucide-react';
import { authFetch } from '../lib/auth';
import { API_URL } from '../lib/config';
import { formatarDataHora } from '../lib/format';
import { useNotificacoesHeader, useUser } from '../screens';
import { Skeleton, Spinner } from './Loading';

interface NotificacaoItem {
  id_notificacao: string;
  cliente_id_cliente: string;
  cliente_nome?: string;
  tipo: string;
  canal: string;
  data_envio: string;
  lida: boolean;
  id_ocorrencia: string | null;
  ocorrencia_tipo?: string | null;
  ocorrencia_descricao?: string | null;
}

export default function NotificacoesPanel() {
  const user = useUser();
  const { refreshNotificacoes } = useNotificacoesHeader();
  const [items, setItems] = useState<NotificacaoItem[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [filtro, setFiltro] = useState<'todas' | 'nao_lidas'>('todas');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  // Form nova notificação (admin/demo)
  const [formAberto, setFormAberto] = useState(false);
  const [tipo, setTipo] = useState('Aviso operacional');
  const [canal, setCanal] = useState('Painel Web');
  const [clienteAlvo, setClienteAlvo] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(() => {
    setLoading(true);
    setErro('');
    const qs = filtro === 'nao_lidas' ? '?lida=0' : '';
    authFetch(`${API_URL}/notificacoes${qs}`)
      .then((r) => r.json())
      .then((data) => {
        setItems(Array.isArray(data?.items) ? data.items : []);
        setNaoLidas(Number(data?.naoLidas || 0));
      })
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar notificações.'))
      .finally(() => setLoading(false));
  }, [filtro]);

  useEffect(() => { carregar(); }, [carregar]);

  async function alternarLida(n: NotificacaoItem) {
    try {
      const resp = await authFetch(`${API_URL}/notificacoes/${n.id_notificacao}/lida`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lida: !n.lida }),
      });
      if (!resp.ok) throw new Error('Erro ao atualizar notificação.');
      carregar();
      refreshNotificacoes();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao atualizar.');
    }
  }

  async function marcarTodasLidas() {
    try {
      const resp = await authFetch(`${API_URL}/notificacoes/marcar-todas-lidas`, { method: 'POST' });
      if (!resp.ok) throw new Error('Erro ao marcar todas como lidas.');
      carregar();
      refreshNotificacoes();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao marcar todas.');
    }
  }

  async function criarNotificacao(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    try {
      const resp = await authFetch(`${API_URL}/notificacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          canal,
          cliente_id_cliente: clienteAlvo.trim() || undefined,
        }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || 'Erro ao criar notificação.');
      setFormAberto(false);
      setClienteAlvo('');
      carregar();
      refreshNotificacoes();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao criar notificação.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notificações</h1>
          <p className="text-gray-500 mt-1">Avisos de cadastro, movimentações e ocorrências disparados pelo sistema.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {naoLidas > 0 && (
            <button onClick={marcarTodasLidas} className="border border-gray-300 bg-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
              <CheckCheck size={16} /> Marcar todas como lidas
            </button>
          )}
          <button onClick={() => setFormAberto((v) => !v)} className="bg-[#1a3326] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2d4a3e] flex items-center gap-2">
            <Plus size={16} /> Nova notificação
          </button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-gray-200 text-sm font-medium">
        <button
          onClick={() => setFiltro('todas')}
          className={`pb-3 px-1 border-b-2 transition ${filtro === 'todas' ? 'border-[#1a3326] text-[#1a3326] font-semibold' : 'border-transparent text-gray-500'}`}
        >
          Todas
        </button>
        <button
          onClick={() => setFiltro('nao_lidas')}
          className={`pb-3 px-1 border-b-2 transition ${filtro === 'nao_lidas' ? 'border-[#1a3326] text-[#1a3326] font-semibold' : 'border-transparent text-gray-500'}`}
        >
          Não lidas ({naoLidas})
        </button>
      </div>

      {erro && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{erro}</div>}

      {formAberto && (
        <form onSubmit={criarNotificacao} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 animate-pop-in">
          <h2 className="font-bold text-lg text-gray-900">Disparar notificação</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tipo *</label>
              <input type="text" value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Canal *</label>
              <select value={canal} onChange={(e) => setCanal(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-white">
                <option value="Painel Web">Painel Web</option>
                <option value="E-mail">E-mail</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="SMS">SMS</option>
              </select>
            </div>
            {user?.papel === 'admin' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">ID do Cliente (opcional)</label>
                <input type="text" value={clienteAlvo} onChange={(e) => setClienteAlvo(e.target.value)} placeholder="Ex.: CLI-002" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setFormAberto(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancelar</button>
            <button type="submit" disabled={salvando} className="px-4 py-2 bg-[#1a3326] text-white rounded-lg text-sm font-medium flex items-center gap-2">
              {salvando && <Spinner size={14} />} Enviar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white p-10 rounded-xl border border-gray-100 text-center text-sm text-gray-500">
          Nenhuma notificação encontrada.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <div
              key={n.id_notificacao}
              className={`p-5 rounded-xl border transition flex flex-wrap justify-between items-center gap-4 ${
                n.lida ? 'bg-white border-gray-100' : 'bg-[#e8f0eb]/60 border-green-200'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-lg ${n.lida ? 'bg-gray-100 text-gray-500' : 'bg-[#1a3326] text-white'}`}>
                  <Bell size={18} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-gray-900">{n.tipo}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{n.canal}</span>
                    {!n.lida && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">Nova</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {n.id_notificacao} • {n.cliente_nome || n.cliente_id_cliente} • {formatarDataHora(n.data_envio)}
                  </p>
                  {n.id_ocorrencia && (
                    <p className="text-xs text-[#1a3326] mt-1">
                      Vinculada à ocorrência <strong>{n.id_ocorrencia}</strong> ({n.ocorrencia_tipo}): {n.ocorrencia_descricao}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => alternarLida(n)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
              >
                <Check size={14} /> {n.lida ? 'Marcar como não lida' : 'Marcar como lida'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
