'use client';

import { useEffect, useState, useCallback } from 'react';
import type { FormEvent } from 'react';
import { MessageSquare, Star, Plus, CheckCircle } from 'lucide-react';
import { authFetch } from '../lib/auth';
import { API_URL } from '../lib/config';
import { formatarDataHora } from '../lib/format';
import { Skeleton, Spinner } from './Loading';

interface AtendimentoItem {
  id_atendimento: string;
  cliente_id_cliente: string;
  cliente_nome: string;
  canal: string;
  data_hora: string;
  assunto: string;
  resolvido: boolean;
  exigiu_repetir_informacao: string | null;
  atendido_por: string | null;
  id_pedido: string | null;
  nome_produto: string | null;
}

interface FeedbackItem {
  id_feedback: string;
  data: string;
  cliente_id_cliente: string;
  cliente_nome: string;
  relato_problema: string | null;
  solucao_esperada: string | null;
  nivel_compreensao_seguro: string | null;
  momento_conhecimento_seguro: string | null;
  aceita_assistente_virtual: string | null;
}

interface PedidoRef {
  id_pedido: string;
  name: string;
}

export default function AtendimentosPanel() {
  const [aba, setAba] = useState<'atendimentos' | 'feedbacks'>('atendimentos');
  const [atendimentos, setAtendimentos] = useState<AtendimentoItem[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [pedidos, setPedidos] = useState<PedidoRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Form Atendimento
  const [formAtdAberto, setFormAtdAberto] = useState(false);
  const [atdCanal, setAtdCanal] = useState('Chat Web');
  const [atdAssunto, setAtdAssunto] = useState('');
  const [atdPedido, setAtdPedido] = useState('');
  const [atdRepetir, setAtdRepetir] = useState('Não');
  const [atdAgente, setAtdAgente] = useState('Equipe LogMagna');
  const [atdResolvido, setAtdResolvido] = useState(false);

  // Form Feedback (5 campos da tabela FEEDBACK)
  const [formFdbAberto, setFormFdbAberto] = useState(false);
  const [fdbRelato, setFdbRelato] = useState('');
  const [fdbSolucao, setFdbSolucao] = useState('');
  const [fdbNivel, setFdbNivel] = useState('Alto');
  const [fdbMomento, setFdbMomento] = useState('No checkout da compra');
  const [fdbAssistente, setFdbAssistente] = useState('Sim');

  const carregar = useCallback(() => {
    setLoading(true);
    setErro('');
    Promise.all([
      authFetch(`${API_URL}/atendimentos`).then((r) => r.json()),
      authFetch(`${API_URL}/feedbacks`).then((r) => r.json()),
      authFetch(`${API_URL}/pedidos`).then((r) => r.json()),
    ])
      .then(([atds, fdbs, peds]) => {
        setAtendimentos(Array.isArray(atds) ? atds : []);
        setFeedbacks(Array.isArray(fdbs) ? fdbs : []);
        setPedidos(Array.isArray(peds) ? peds : []);
      })
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar suporte.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function salvarAtendimento(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    setMsg('');
    try {
      const resp = await authFetch(`${API_URL}/atendimentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canal: atdCanal,
          assunto: atdAssunto,
          id_pedido: atdPedido || undefined,
          exigiu_repetir_informacao: atdRepetir,
          atendido_por: atdAgente,
          resolvido: atdResolvido,
        }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || 'Erro ao registrar atendimento.');
      setFormAtdAberto(false);
      setAtdAssunto('');
      setMsg(`Atendimento ${json.id_atendimento} registrado.`);
      carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar atendimento.');
    } finally {
      setSalvando(false);
    }
  }

  async function alternarResolvido(a: AtendimentoItem) {
    try {
      const resp = await authFetch(`${API_URL}/atendimentos/${a.id_atendimento}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolvido: !a.resolvido }),
      });
      if (!resp.ok) throw new Error('Erro ao atualizar atendimento.');
      carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao atualizar atendimento.');
    }
  }

  async function salvarFeedback(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    setMsg('');
    try {
      const resp = await authFetch(`${API_URL}/feedbacks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          relato_problema: fdbRelato,
          solucao_esperada: fdbSolucao,
          nivel_compreensao_seguro: fdbNivel,
          momento_conhecimento_seguro: fdbMomento,
          aceita_assistente_virtual: fdbAssistente,
        }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || 'Erro ao enviar feedback.');
      setFormFdbAberto(false);
      setFdbRelato('');
      setFdbSolucao('');
      setMsg(`Feedback ${json.id_feedback} registrado com sucesso.`);
      carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao enviar feedback.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Atendimentos e feedbacks</h1>
          <p className="text-gray-500 mt-1">Registre chamados de suporte vinculados a pedidos e colete avaliações da jornada do seguro.</p>
        </div>
        {aba === 'atendimentos' ? (
          <button onClick={() => setFormAtdAberto((v) => !v)} className="bg-[#1a3326] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#2d4a3e] flex items-center gap-2">
            <Plus size={17} /> Novo atendimento
          </button>
        ) : (
          <button onClick={() => setFormFdbAberto((v) => !v)} className="bg-[#1a3326] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#2d4a3e] flex items-center gap-2">
            <Plus size={17} /> Enviar feedback
          </button>
        )}
      </div>

      <div className="flex gap-4 border-b border-gray-200 text-sm font-medium">
        <button
          onClick={() => setAba('atendimentos')}
          className={`pb-3 px-1 flex items-center gap-2 border-b-2 transition ${aba === 'atendimentos' ? 'border-[#1a3326] text-[#1a3326] font-semibold' : 'border-transparent text-gray-500'}`}
        >
          <MessageSquare size={17} /> Atendimentos ({atendimentos.length})
        </button>
        <button
          onClick={() => setAba('feedbacks')}
          className={`pb-3 px-1 flex items-center gap-2 border-b-2 transition ${aba === 'feedbacks' ? 'border-[#1a3326] text-[#1a3326] font-semibold' : 'border-transparent text-gray-500'}`}
        >
          <Star size={17} /> Pesquisas de Feedback ({feedbacks.length})
        </button>
      </div>

      {erro && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{erro}</div>}
      {msg && <div className="p-3 rounded-lg bg-[#e8f0eb] text-[#1a3326] text-sm animate-pop-in">{msg}</div>}

      {aba === 'atendimentos' && (
        <>
          {formAtdAberto && (
            <form onSubmit={salvarAtendimento} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 animate-pop-in">
              <h2 className="font-bold text-lg text-gray-900">Registrar atendimento</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Canal *</label>
                  <select value={atdCanal} onChange={(e) => setAtdCanal(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-white">
                    <option value="Chat Web">Chat Web</option>
                    <option value="E-mail">E-mail</option>
                    <option value="Telefone">Telefone</option>
                    <option value="WhatsApp">WhatsApp</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Pedido relacionado (opcional)</label>
                  <select value={atdPedido} onChange={(e) => setAtdPedido(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-white">
                    <option value="">Sem vínculo direto</option>
                    {pedidos.map((p) => (
                      <option key={p.id_pedido} value={p.id_pedido}>{p.id_pedido} — {p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Exigiu repetir informação?</label>
                  <select value={atdRepetir} onChange={(e) => setAtdRepetir(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-white">
                    <option value="Não">Não</option>
                    <option value="Sim, uma vez">Sim, uma vez</option>
                    <option value="Sim, várias vezes">Sim, várias vezes</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Assunto *</label>
                  <input type="text" value={atdAssunto} onChange={(e) => setAtdAssunto(e.target.value)} placeholder="Ex.: Dúvida sobre prazo de indenização" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Atendido por</label>
                  <input type="text" value={atdAgente} onChange={(e) => setAtdAgente(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={atdResolvido} onChange={(e) => setAtdResolvido(e.target.checked)} className="accent-[#1a3326] w-4 h-4" />
                Atendimento já resolvido no primeiro contato
              </label>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setFormAtdAberto(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancelar</button>
                <button type="submit" disabled={salvando} className="px-4 py-2 bg-[#1a3326] text-white rounded-lg text-sm font-medium flex items-center gap-2">
                  {salvando && <Spinner size={14} />} Salvar atendimento
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
          ) : (
            <div className="space-y-3">
              {atendimentos.map((a) => (
                <div key={a.id_atendimento} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-gray-900">{a.assunto}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{a.canal}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.resolvido ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        {a.resolvido ? 'Resolvido' : 'Em aberto'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {a.id_atendimento} • Cliente: {a.cliente_nome} • Atendente: {a.atendido_por || '—'} • Repetiu info: {a.exigiu_repetir_informacao || 'Não'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {a.id_pedido ? `Pedido: ${a.id_pedido} (${a.nome_produto}) • ` : ''}{formatarDataHora(a.data_hora)}
                    </p>
                  </div>
                  <button
                    onClick={() => alternarResolvido(a)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium hover:bg-gray-50 flex items-center gap-1.5"
                  >
                    <CheckCircle size={14} /> {a.resolvido ? 'Reabrir' : 'Marcar resolvido'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {aba === 'feedbacks' && (
        <>
          {formFdbAberto && (
            <form onSubmit={salvarFeedback} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 animate-pop-in">
              <h2 className="font-bold text-lg text-gray-900">Responder pesquisa de experiência</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Relato do problema / experiência *</label>
                  <input type="text" value={fdbRelato} onChange={(e) => setFdbRelato(e.target.value)} placeholder="O que pode melhorar?" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Solução esperada</label>
                  <input type="text" value={fdbSolucao} onChange={(e) => setFdbSolucao(e.target.value)} placeholder="Como gostaria que funcionasse?" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nível de compreensão do seguro</label>
                  <select value={fdbNivel} onChange={(e) => setFdbNivel(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-white">
                    <option value="Alto">Alto</option>
                    <option value="Médio">Médio</option>
                    <option value="Baixo">Baixo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Momento de conhecimento do seguro</label>
                  <select value={fdbMomento} onChange={(e) => setFdbMomento(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-white">
                    <option value="No checkout da compra">No checkout da compra</option>
                    <option value="Ao rastrear a encomenda">Ao rastrear a encomenda</option>
                    <option value="Após a ocorrência no transporte">Após a ocorrência no transporte</option>
                    <option value="Ainda não conhecia">Ainda não conhecia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Aceita assistente virtual?</label>
                  <select value={fdbAssistente} onChange={(e) => setFdbAssistente(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-white">
                    <option value="Sim">Sim</option>
                    <option value="Sim, para triagem inicial">Sim, para triagem inicial</option>
                    <option value="Não, prefiro atendente humano">Não, prefiro atendente humano</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setFormFdbAberto(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancelar</button>
                <button type="submit" disabled={salvando} className="px-4 py-2 bg-[#1a3326] text-white rounded-lg text-sm font-medium flex items-center gap-2">
                  {salvando && <Spinner size={14} />} Registrar feedback
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feedbacks.map((f) => (
                <div key={f.id_feedback} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span className="font-semibold text-gray-900">{f.id_feedback} • {f.cliente_nome}</span>
                    <span>{formatarDataHora(f.data)}</span>
                  </div>
                  <p className="text-sm text-gray-800"><strong>Relato:</strong> {f.relato_problema || '—'}</p>
                  <p className="text-xs text-gray-600"><strong>Solução esperada:</strong> {f.solucao_esperada || '—'}</p>
                  <div className="flex flex-wrap gap-2 text-[11px] pt-2 border-t border-gray-100">
                    <span className="px-2 py-0.5 rounded bg-[#e8f0eb] text-[#1a3326]">Compreensão: {f.nivel_compreensao_seguro}</span>
                    <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">Conhecimento: {f.momento_conhecimento_seguro}</span>
                    <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">Assistente virtual: {f.aceita_assistente_virtual}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
