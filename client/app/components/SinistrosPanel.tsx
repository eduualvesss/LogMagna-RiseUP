'use client';

import { useEffect, useState, useCallback } from 'react';
import type { FormEvent } from 'react';
import { FileWarning, FileText, Plus, CheckCircle, XCircle, Trash2, Pencil, ShieldAlert } from 'lucide-react';
import { authFetch } from '../lib/auth';
import { API_URL } from '../lib/config';
import { brl, formatarDataHora } from '../lib/format';
import { useNotificacoesHeader } from '../screens';
import { Skeleton, Spinner } from './Loading';

interface DocumentoItem {
  id_documento: string;
  id_sinistro: string;
  tipo: string;
  arquivo: string;
  data_envio: string;
  validado: boolean;
}

interface SinistroItem {
  id_sinistro: string;
  data_abertura: string;
  status: string;
  valor_indenizado: number | null;
  data_encerramento: string | null;
  etapa_mais_dificil: string | null;
  motivo_nao_acionamento: string | null;
  ocorrencia_id_ocorrencia: string;
  id_apolice: string;
  ocorrencia_tipo: string;
  ocorrencia_descricao: string;
  codigo_rastreio: string;
  id_pedido: string;
  nome_produto: string | null;
  cliente_nome: string;
  valor_segurado: number;
  seguradora_razao_social: string;
  documentos: DocumentoItem[];
}

interface OcorrenciaItem {
  id_ocorrencia: string;
  id_remessa: string;
  tipo: string;
  data_ocorrencia: string;
  descricao: string;
  codigo_rastreio: string;
  id_apolice: string | null;
  id_pedido: string;
  nome_produto: string | null;
  cliente_nome: string;
}

interface PedidoRemessa {
  id_pedido: string;
  name: string;
  id_remessa: string | null;
  codigo_rastreio: string | null;
  id_apolice: string | null;
}

export default function SinistrosPanel() {
  const { refreshNotificacoes } = useNotificacoesHeader();
  const [aba, setAba] = useState<'sinistros' | 'ocorrencias'>('sinistros');
  const [sinistros, setSinistros] = useState<SinistroItem[]>([]);
  const [ocorrencias, setOcorrencias] = useState<OcorrenciaItem[]>([]);
  const [pedidos, setPedidos] = useState<PedidoRemessa[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Novo/Editar Sinistro
  const [formSinAberto, setFormSinAberto] = useState(false);
  const [editSinId, setEditSinId] = useState<string | null>(null);
  const [sinOcorrenciaId, setSinOcorrenciaId] = useState('');
  const [sinStatus, setSinStatus] = useState('Em análise');
  const [sinValorIndenizado, setSinValorIndenizado] = useState('');
  const [sinEtapaDificil, setSinEtapaDificil] = useState('');
  const [sinMotivoNao, setSinMotivoNao] = useState('');

  // Nova Ocorrência
  const [formOcoAberto, setFormOcoAberto] = useState(false);
  const [ocoRemessaId, setOcoRemessaId] = useState('');
  const [ocoTipo, setOcoTipo] = useState('Atraso operacional');
  const [ocoDesc, setOcoDesc] = useState('');

  // Novo Documento por sinistro
  const [docFormSinId, setDocFormSinId] = useState<string | null>(null);
  const [docTipo, setDocTipo] = useState('Nota Fiscal');
  const [docArquivo, setDocArquivo] = useState('');

  const carregar = useCallback(() => {
    setLoading(true);
    setErro('');
    Promise.all([
      authFetch(`${API_URL}/sinistros`).then((r) => r.json()),
      authFetch(`${API_URL}/ocorrencias`).then((r) => r.json()),
      authFetch(`${API_URL}/pedidos`).then((r) => r.json()),
    ])
      .then(([sins, ocos, peds]) => {
        const listaSin = Array.isArray(sins) ? sins : [];
        const listaOco = Array.isArray(ocos) ? ocos : [];
        const listaPed = Array.isArray(peds) ? peds : [];
        setSinistros(listaSin);
        setOcorrencias(listaOco);
        setPedidos(listaPed);
        if (!sinOcorrenciaId && listaOco[0]) setSinOcorrenciaId(listaOco[0].id_ocorrencia);
        if (!ocoRemessaId && listaPed.find((p) => p.id_remessa)?.id_remessa) {
          setOcoRemessaId(listaPed.find((p) => p.id_remessa)!.id_remessa!);
        }
      })
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar sinistros.'))
      .finally(() => setLoading(false));
  }, [sinOcorrenciaId, ocoRemessaId]);

  useEffect(() => { carregar(); }, [carregar]);

  function abrirNovoSinistro(ocorrenciaPre?: string) {
    setEditSinId(null);
    setSinOcorrenciaId(ocorrenciaPre || ocorrencias[0]?.id_ocorrencia || '');
    setSinStatus('Em análise');
    setSinValorIndenizado('');
    setSinEtapaDificil('');
    setSinMotivoNao('');
    setFormSinAberto(true);
    setAba('sinistros');
    setErro('');
    setMsg('');
  }

  function abrirEditarSinistro(s: SinistroItem) {
    setEditSinId(s.id_sinistro);
    setSinOcorrenciaId(s.ocorrencia_id_ocorrencia);
    setSinStatus(s.status);
    setSinValorIndenizado(s.valor_indenizado != null ? String(s.valor_indenizado) : '');
    setSinEtapaDificil(s.etapa_mais_dificil || '');
    setSinMotivoNao(s.motivo_nao_acionamento || '');
    setFormSinAberto(true);
    setErro('');
    setMsg('');
  }

  async function salvarSinistro(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    setMsg('');
    try {
      const url = editSinId ? `${API_URL}/sinistros/${editSinId}` : `${API_URL}/sinistros`;
      const resp = await authFetch(url, {
        method: editSinId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ocorrencia_id_ocorrencia: sinOcorrenciaId,
          status: sinStatus,
          valor_indenizado: sinValorIndenizado !== '' ? Number(sinValorIndenizado) : null,
          etapa_mais_dificil: sinEtapaDificil,
          motivo_nao_acionamento: sinMotivoNao,
        }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || 'Erro ao salvar sinistro.');
      setFormSinAberto(false);
      setMsg(editSinId ? `Sinistro ${json.id_sinistro} atualizado.` : `Sinistro ${json.id_sinistro} aberto com notificação.`);
      carregar();
      refreshNotificacoes();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao salvar sinistro.');
    } finally {
      setSalvando(false);
    }
  }

  async function salvarOcorrencia(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    setMsg('');
    try {
      const resp = await authFetch(`${API_URL}/ocorrencias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_remessa: ocoRemessaId,
          tipo: ocoTipo,
          descricao: ocoDesc,
        }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || 'Erro ao registrar ocorrência.');
      setFormOcoAberto(false);
      setOcoDesc('');
      setMsg(`Ocorrência ${json.id_ocorrencia} registrada e notificação enviada ao cliente.`);
      carregar();
      refreshNotificacoes();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao registrar ocorrência.');
    } finally {
      setSalvando(false);
    }
  }

  async function adicionarDocumento(e: FormEvent, idSinistro: string) {
    e.preventDefault();
    if (!docArquivo.trim()) return;
    setSalvando(true);
    setErro('');
    try {
      const resp = await authFetch(`${API_URL}/sinistros/${idSinistro}/documentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: docTipo, arquivo: docArquivo.trim() }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || 'Erro ao anexar documento.');
      setDocFormSinId(null);
      setDocArquivo('');
      setMsg(`Documento ${json.id_documento} anexado ao sinistro ${idSinistro}.`);
      carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao anexar documento.');
    } finally {
      setSalvando(false);
    }
  }

  async function alternarValidacaoDocumento(doc: DocumentoItem) {
    try {
      const resp = await authFetch(`${API_URL}/documentos/${doc.id_documento}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ validado: !doc.validado }),
      });
      if (!resp.ok) throw new Error('Erro ao validar documento.');
      carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao validar documento.');
    }
  }

  async function excluirDocumento(idDocumento: string) {
    try {
      const resp = await authFetch(`${API_URL}/documentos/${idDocumento}`, { method: 'DELETE' });
      if (!resp.ok) throw new Error('Erro ao excluir documento.');
      carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao excluir documento.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sinistros, ocorrências e documentos</h1>
          <p className="text-gray-500 mt-1">Registre ocorrências de transporte, acione sinistros vinculados às apólices e valide documentos.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setFormOcoAberto((v) => !v); setAba('ocorrencias'); }}
            className="border border-gray-300 bg-white text-gray-800 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
          >
            <Plus size={17} /> Nova ocorrência
          </button>
          <button
            onClick={() => abrirNovoSinistro()}
            disabled={ocorrencias.length === 0}
            className="bg-[#1a3326] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#2d4a3e] disabled:opacity-60 flex items-center gap-2"
          >
            <Plus size={17} /> Abrir sinistro
          </button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-gray-200 text-sm font-medium">
        <button
          onClick={() => setAba('sinistros')}
          className={`pb-3 px-1 flex items-center gap-2 border-b-2 transition ${aba === 'sinistros' ? 'border-[#1a3326] text-[#1a3326] font-semibold' : 'border-transparent text-gray-500'}`}
        >
          <ShieldAlert size={17} /> Sinistros e Documentos ({sinistros.length})
        </button>
        <button
          onClick={() => setAba('ocorrencias')}
          className={`pb-3 px-1 flex items-center gap-2 border-b-2 transition ${aba === 'ocorrencias' ? 'border-[#1a3326] text-[#1a3326] font-semibold' : 'border-transparent text-gray-500'}`}
        >
          <FileWarning size={17} /> Ocorrências ({ocorrencias.length})
        </button>
      </div>

      {erro && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{erro}</div>}
      {msg && <div className="p-3 rounded-lg bg-[#e8f0eb] text-[#1a3326] text-sm animate-pop-in">{msg}</div>}

      {formOcoAberto && (
        <form onSubmit={salvarOcorrencia} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 animate-pop-in">
          <h2 className="font-bold text-lg text-gray-900">Registrar nova ocorrência</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Remessa / Pedido *</label>
              <select value={ocoRemessaId} onChange={(e) => setOcoRemessaId(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-white" required>
                {pedidos.filter((p) => p.id_remessa).map((p) => (
                  <option key={p.id_remessa!} value={p.id_remessa!}>
                    {p.codigo_rastreio} — {p.name} ({p.id_pedido})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de ocorrência *</label>
              <select value={ocoTipo} onChange={(e) => setOcoTipo(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-white">
                <option value="Atraso operacional">Atraso operacional</option>
                <option value="Retenção fiscal">Retenção fiscal</option>
                <option value="Avaria na embalagem">Avaria na embalagem</option>
                <option value="Extravio parcial">Extravio parcial</option>
                <option value="Extravio total">Extravio total</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Descrição detalhada *</label>
            <input type="text" value={ocoDesc} onChange={(e) => setOcoDesc(e.target.value)} placeholder="Descreva o ocorrido com a encomenda" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" required />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setFormOcoAberto(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancelar</button>
            <button type="submit" disabled={salvando} className="px-4 py-2 bg-[#1a3326] text-white rounded-lg text-sm font-medium flex items-center gap-2">
              {salvando && <Spinner size={14} />} Salvar ocorrência
            </button>
          </div>
        </form>
      )}

      {formSinAberto && (
        <form onSubmit={salvarSinistro} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 animate-pop-in">
          <h2 className="font-bold text-lg text-gray-900">{editSinId ? `Atualizar sinistro ${editSinId}` : 'Abrir novo sinistro'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {!editSinId && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Ocorrência vinculada *</label>
                <select value={sinOcorrenciaId} onChange={(e) => setSinOcorrenciaId(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-white" required>
                  {ocorrencias.map((o) => (
                    <option key={o.id_ocorrencia} value={o.id_ocorrencia}>
                      {o.id_ocorrencia} • {o.tipo} ({o.codigo_rastreio})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status *</label>
              <select value={sinStatus} onChange={(e) => setSinStatus(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-white">
                <option value="Em análise">Em análise</option>
                <option value="Documentação pendente">Documentação pendente</option>
                <option value="Aprovado">Aprovado</option>
                <option value="Indenizado">Indenizado</option>
                <option value="Não acionado">Não acionado</option>
                <option value="Encerrado">Encerrado</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Valor indenizado (R$)</label>
              <input type="number" step="0.01" min="0" value={sinValorIndenizado} onChange={(e) => setSinValorIndenizado(e.target.value)} placeholder="Opcional" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Etapa mais difícil (pesquisa de jornada)</label>
              <input type="text" value={sinEtapaDificil} onChange={(e) => setSinEtapaDificil(e.target.value)} placeholder="Ex.: Envio da nota fiscal" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Motivo de não acionamento (se aplicável)</label>
              <input type="text" value={sinMotivoNao} onChange={(e) => setSinMotivoNao(e.target.value)} placeholder="Opcional" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setFormSinAberto(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancelar</button>
            <button type="submit" disabled={salvando} className="px-4 py-2 bg-[#1a3326] text-white rounded-lg text-sm font-medium flex items-center gap-2">
              {salvando && <Spinner size={14} />} Salvar sinistro
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-36 w-full" />)}
        </div>
      ) : aba === 'sinistros' ? (
        sinistros.length === 0 ? (
          <div className="bg-white p-10 rounded-xl border border-gray-100 text-center text-sm text-gray-500">
            Nenhum sinistro cadastrado ainda.
          </div>
        ) : (
          <div className="space-y-4">
            {sinistros.map((s) => (
              <div key={s.id_sinistro} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-lg text-gray-900">{s.id_sinistro}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        s.status === 'Indenizado' ? 'bg-green-100 text-green-800' :
                        s.status === 'Não acionado' ? 'bg-gray-100 text-gray-700' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {s.status}
                      </span>
                      <span className="text-xs text-gray-500">Apólice {s.id_apolice} • {s.seguradora_razao_social}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">
                      <strong>{s.nome_produto || s.id_pedido}</strong> ({s.codigo_rastreio}) — Ocorrência {s.ocorrencia_id_ocorrencia}: {s.ocorrencia_tipo}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.ocorrencia_descricao}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-xs text-gray-500">Segurado: <strong>{brl(s.valor_segurado)}</strong></div>
                    {s.valor_indenizado !== null && (
                      <div className="text-sm font-bold text-[#1a3326]">Indenizado: {brl(s.valor_indenizado)}</div>
                    )}
                    <button onClick={() => abrirEditarSinistro(s)} className="text-xs text-[#1a3326] font-medium hover:underline inline-flex items-center gap-1">
                      <Pencil size={12} /> Atualizar sinistro
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-gray-50 p-3 rounded-lg text-xs text-gray-600">
                  <div>Abertura: <strong>{formatarDataHora(s.data_abertura)}</strong></div>
                  <div>Etapa mais difícil: <strong>{s.etapa_mais_dificil || '—'}</strong></div>
                  <div>{s.motivo_nao_acionamento ? `Não acionamento: ${s.motivo_nao_acionamento}` : `Encerramento: ${s.data_encerramento ? formatarDataHora(s.data_encerramento) : 'Em aberto'}`}</div>
                </div>

                {/* Documentos do sinistro */}
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <FileText size={16} /> Documentos anexados ({s.documentos.length})
                    </h4>
                    <button
                      onClick={() => { setDocFormSinId(docFormSinId === s.id_sinistro ? null : s.id_sinistro); setDocArquivo(''); }}
                      className="text-xs font-medium text-[#1a3326] hover:underline flex items-center gap-1"
                    >
                      <Plus size={14} /> Anexar documento
                    </button>
                  </div>

                  {docFormSinId === s.id_sinistro && (
                    <form onSubmit={(e) => adicionarDocumento(e, s.id_sinistro)} className="flex flex-wrap gap-3 mb-3 p-3 bg-gray-50 rounded-lg">
                      <select value={docTipo} onChange={(e) => setDocTipo(e.target.value)} className="border border-gray-200 rounded-lg p-2 text-xs bg-white">
                        <option value="Nota Fiscal">Nota Fiscal</option>
                        <option value="Fotos da Avaria">Fotos da Avaria</option>
                        <option value="Boletim de Ocorrência">Boletim de Ocorrência</option>
                        <option value="Laudo Técnico">Laudo Técnico</option>
                        <option value="Comprovante de Retenção">Comprovante de Retenção</option>
                      </select>
                      <input
                        type="text"
                        value={docArquivo}
                        onChange={(e) => setDocArquivo(e.target.value)}
                        placeholder="Nome do arquivo (ex.: nota-fiscal-pedido.pdf)"
                        className="flex-1 min-w-[200px] border border-gray-200 rounded-lg p-2 text-xs bg-white"
                        required
                      />
                      <button type="submit" disabled={salvando} className="px-3 py-2 bg-[#1a3326] text-white rounded-lg text-xs font-medium">
                        Salvar anexo
                      </button>
                    </form>
                  )}

                  {s.documentos.length === 0 ? (
                    <p className="text-xs text-gray-400">Nenhum documento enviado para este sinistro.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {s.documentos.map((doc) => (
                        <div key={doc.id_documento} className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-gray-200 text-xs">
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 truncate">{doc.tipo} — {doc.arquivo}</div>
                            <div className="text-gray-400">{doc.id_documento} • {formatarDataHora(doc.data_envio)}</div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => alternarValidacaoDocumento(doc)}
                              className={`px-2 py-1 rounded-full font-medium inline-flex items-center gap-1 ${
                                doc.validado ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                              }`}
                              title="Clique para alternar validação"
                            >
                              {doc.validado ? <CheckCircle size={12} /> : <XCircle size={12} />}
                              {doc.validado ? 'Validado' : 'Pendente'}
                            </button>
                            <button onClick={() => excluirDocumento(doc.id_documento)} className="text-red-600 hover:text-red-800 p-1" aria-label="Excluir documento">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="p-4">Ocorrência</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Pedido / Rastreio</th>
                <th className="p-4">Descrição</th>
                <th className="p-4">Data</th>
                <th className="p-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ocorrencias.map((o) => (
                <tr key={o.id_ocorrencia} className="hover:bg-gray-50">
                  <td className="p-4 font-semibold text-gray-900">{o.id_ocorrencia}</td>
                  <td className="p-4"><span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 font-medium">{o.tipo}</span></td>
                  <td className="p-4">
                    <div className="font-medium text-gray-800">{o.nome_produto || o.id_pedido}</div>
                    <div className="text-xs text-gray-400">{o.codigo_rastreio}</div>
                  </td>
                  <td className="p-4 text-xs text-gray-600 max-w-sm">{o.descricao}</td>
                  <td className="p-4 text-xs text-gray-500 whitespace-nowrap">{formatarDataHora(o.data_ocorrencia)}</td>
                  <td className="p-4 text-right whitespace-nowrap">
                    <button onClick={() => abrirNovoSinistro(o.id_ocorrencia)} className="text-xs font-medium text-[#1a3326] hover:underline">
                      Abrir sinistro →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
