'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  FileText,
  FileWarning,
  Plus,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/hooks/auth-context';
import { useNotificacoesHeader } from '@/hooks/notificacoes-context';
import { useSinistros } from '@/hooks/useSinistros';
import { brl, formatarData, formatarDataHora, statusBadgeVariant } from '@/lib/format';
import { sinistrosService } from '@/services/sinistros.service';
import type { DocumentoItem, SinistroItem } from '@/types';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListSkeleton, Spinner } from '@/components/ui/Loading';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs } from '@/components/ui/Tabs';

export default function SinistrosView() {
  const { isAdmin } = useAuth();
  const { refreshNotificacoes } = useNotificacoesHeader();
  const { sinistros, ocorrencias, pedidos, loading, erro, recarregar } = useSinistros();

  const [aba, setAba] = useState<'sinistros' | 'ocorrencias'>('sinistros');
  const [erroAcao, setErroAcao] = useState('');
  const [msg, setMsg] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Modal Ocorrência
  const [modalOcorrencia, setModalOcorrencia] = useState(false);
  const [ocIdRemessa, setOcIdRemessa] = useState('');
  const [ocTipo, setOcTipo] = useState('Atraso Crítico');
  const [ocDesc, setOcDesc] = useState('');

  // Modal Sinistro (criar ou atualizar)
  const [modalSinistro, setModalSinistro] = useState(false);
  const [editSinistroId, setEditSinistroId] = useState<string | null>(null);
  const [sinIdOcorrencia, setSinIdOcorrencia] = useState('');
  const [sinStatus, setSinStatus] = useState('Aberto');
  const [sinValor, setSinValor] = useState('');
  const [sinEtapa, setSinEtapa] = useState('');
  const [sinMotivo, setSinMotivo] = useState('');

  // Modal Documento
  const [modalDocSinistro, setModalDocSinistro] = useState<SinistroItem | null>(null);
  const [docTipo, setDocTipo] = useState('Nota Fiscal');
  const [docArquivo, setDocArquivo] = useState('');
  const [docExcluir, setDocExcluir] = useState<DocumentoItem | null>(null);

  const remessasDisponiveis = pedidos.filter((p) => Boolean(p.id_remessa));

  function abrirNovaOcorrencia() {
    setOcIdRemessa(remessasDisponiveis[0]?.id_remessa || '');
    setOcTipo('Atraso Crítico');
    setOcDesc('');
    setErroAcao('');
    setModalOcorrencia(true);
  }

  function abrirNovoSinistro() {
    setEditSinistroId(null);
    setSinIdOcorrencia(ocorrencias[0]?.id_ocorrencia || '');
    setSinStatus('Aberto');
    setSinValor('');
    setSinEtapa('');
    setSinMotivo('');
    setErroAcao('');
    setModalSinistro(true);
  }

  function abrirEditarSinistro(s: SinistroItem) {
    setEditSinistroId(s.id_sinistro);
    setSinIdOcorrencia(s.ocorrencia_id_ocorrencia);
    setSinStatus(s.status === 'Em Análise' ? 'Em análise' : s.status);
    setSinValor(s.valor_indenizado != null ? String(s.valor_indenizado) : '');
    setSinEtapa(s.etapa_mais_dificil || '');
    setSinMotivo(s.motivo_nao_acionamento || '');
    setErroAcao('');
    setModalSinistro(true);
  }

  function abrirModalDocumento(s: SinistroItem) {
    setModalDocSinistro(s);
    setDocTipo('Nota Fiscal');
    setDocArquivo('');
    setErroAcao('');
  }

  async function salvarOcorrencia(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErroAcao('');
    setMsg('');
    try {
      const criada = await sinistrosService.createOcorrencia({
        id_remessa: ocIdRemessa,
        tipo: ocTipo,
        descricao: ocDesc.trim(),
      });
      setModalOcorrencia(false);
      setMsg(`Ocorrência ${criada.id_ocorrencia} registrada com notificação automática.`);
      await Promise.all([recarregar(), refreshNotificacoes()]);
    } catch (err) {
      setErroAcao(err instanceof Error ? err.message : 'Falha ao registrar ocorrência.');
    } finally {
      setSalvando(false);
    }
  }

  async function salvarSinistro(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErroAcao('');
    setMsg('');
    try {
      const payload = {
        status: sinStatus,
        valor_indenizado: sinValor.trim() ? Number(sinValor) : null,
        etapa_mais_dificil: sinEtapa.trim(),
        motivo_nao_acionamento: sinMotivo.trim(),
      };
      if (editSinistroId) {
        const atualizado = await sinistrosService.updateSinistro(editSinistroId, payload);
        setMsg(`Sinistro ${atualizado.id_sinistro} atualizado para "${atualizado.status}".`);
      } else {
        const criado = await sinistrosService.createSinistro({
          ocorrencia_id_ocorrencia: sinIdOcorrencia,
          ...payload,
        });
        setMsg(`Sinistro ${criado.id_sinistro} aberto com sucesso.`);
      }
      setModalSinistro(false);
      await recarregar();
    } catch (err) {
      setErroAcao(err instanceof Error ? err.message : 'Falha ao salvar sinistro.');
    } finally {
      setSalvando(false);
    }
  }

  async function salvarDocumento(e: FormEvent) {
    e.preventDefault();
    if (!modalDocSinistro) return;
    setSalvando(true);
    setErroAcao('');
    setMsg('');
    try {
      await sinistrosService.addDocumento(modalDocSinistro.id_sinistro, {
        tipo: docTipo,
        arquivo: docArquivo.trim(),
      });
      setModalDocSinistro(null);
      setMsg(`Documento anexado ao sinistro ${modalDocSinistro.id_sinistro}.`);
      await recarregar();
    } catch (err) {
      setErroAcao(err instanceof Error ? err.message : 'Falha ao anexar documento.');
    } finally {
      setSalvando(false);
    }
  }

  async function alternarValidacaoDoc(idDoc: string, validadoAtual: boolean) {
    setErroAcao('');
    setMsg('');
    try {
      await sinistrosService.toggleValidacaoDocumento(idDoc, !validadoAtual);
      setMsg(!validadoAtual ? 'Documento validado pela operação.' : 'Validação do documento removida.');
      await recarregar();
    } catch (err) {
      setErroAcao(err instanceof Error ? err.message : 'Falha ao validar documento.');
    }
  }

  async function confirmarRemoverDocumento() {
    if (!docExcluir) return;
    setSalvando(true);
    setErroAcao('');
    setMsg('');
    try {
      await sinistrosService.deleteDocumento(docExcluir.id_documento);
      setMsg('Documento removido do dossiê.');
      setDocExcluir(null);
      await recarregar();
    } catch (err) {
      setErroAcao(err instanceof Error ? err.message : 'Falha ao remover documento.');
      setDocExcluir(null);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sinistros e Ocorrências"
        description="Registre ocorrências de transporte, abra sinistros vinculados às apólices e gerencie documentos comprobatórios."
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={abrirNovaOcorrencia}
              disabled={remessasDisponiveis.length === 0}
              className="btn-secondary disabled:opacity-50"
            >
              <AlertTriangle className="h-4 w-4" />
              Registrar ocorrência
            </button>
            <button
              type="button"
              onClick={abrirNovoSinistro}
              disabled={ocorrencias.length === 0}
              className="btn-primary disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Abrir sinistro
            </button>
          </div>
        }
      />

      {erro ? <Alert variant="error">{erro}</Alert> : null}
      {erroAcao ? <Alert variant="error">{erroAcao}</Alert> : null}
      {msg ? <Alert variant="success">{msg}</Alert> : null}

      <Tabs
        value={aba}
        onChange={setAba}
        items={[
          { id: 'sinistros', label: 'Sinistros', count: sinistros.length, icon: ShieldAlert },
          { id: 'ocorrencias', label: 'Ocorrências de Remessa', count: ocorrencias.length, icon: FileWarning },
        ]}
      />

      {loading ? (
        <ListSkeleton rows={4} />
      ) : aba === 'sinistros' ? (
        sinistros.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title="Nenhum sinistro registrado"
            description={
              ocorrencias.length === 0
                ? 'Registre primeiro uma ocorrência de transporte para conseguir abrir um sinistro vinculado à apólice.'
                : 'Você já possui ocorrências registradas e pode abrir um sinistro sempre que houver necessidade de acionamento.'
            }
            action={
              ocorrencias.length > 0 ? (
                <button type="button" onClick={abrirNovoSinistro} className="btn-primary">
                  <Plus className="h-4 w-4" />
                  Abrir primeiro sinistro
                </button>
              ) : remessasDisponiveis.length > 0 ? (
                <button type="button" onClick={abrirNovaOcorrencia} className="btn-secondary">
                  <AlertTriangle className="h-4 w-4" />
                  Registrar ocorrência
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-4">
            {sinistros.map((s) => (
              <div key={s.id_sinistro} className="card-surface p-5">
                <div className="flex flex-col gap-4 border-b border-gray-100 pb-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#143326]">{s.id_sinistro}</span>
                      <Badge variant={statusBadgeVariant(s.status)}>{s.status}</Badge>
                      <span className="text-xs text-gray-400">Aberto em {formatarData(s.data_abertura)}</span>
                      {s.data_encerramento ? (
                        <span className="text-xs text-gray-400">• Encerrado em {formatarData(s.data_encerramento)}</span>
                      ) : null}
                    </div>
                    <h3 className="mt-1.5 text-base font-bold text-gray-900">
                      {s.nome_produto || s.id_pedido} — {s.ocorrencia_tipo}
                    </h3>
                    <p className="mt-0.5 text-sm text-gray-600">{s.ocorrencia_descricao}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span>Rastreio: <strong className="font-mono text-gray-700">{s.codigo_rastreio}</strong></span>
                      <span>Apólice: <strong className="font-mono text-gray-700">{s.id_apolice}</strong></span>
                      <span>Seguradora: <strong className="text-gray-700">{s.seguradora_razao_social}</strong></span>
                      <span>Cliente: <strong className="text-gray-700">{s.cliente_nome}</strong></span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-end">
                    <div className="text-left lg:text-right">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                        Valor Segurado / Indenizado
                      </p>
                      <p className="text-sm font-bold text-gray-900">
                        {brl(s.valor_segurado)}
                        {s.valor_indenizado != null ? (
                          <span className="ml-2 text-emerald-700">({brl(s.valor_indenizado)})</span>
                        ) : null}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => abrirModalDocumento(s)}
                        className="btn-secondary !px-3 !py-1.5 !text-xs"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Anexar documento
                      </button>
                      <button
                        type="button"
                        onClick={() => abrirEditarSinistro(s)}
                        className="btn-secondary !px-3 !py-1.5 !text-xs"
                      >
                        Atualizar status
                      </button>
                    </div>
                  </div>
                </div>

                {(s.etapa_mais_dificil || s.motivo_nao_acionamento) ? (
                  <div className="mt-3 grid grid-cols-1 gap-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-600 md:grid-cols-2">
                    {s.etapa_mais_dificil ? (
                      <div>
                        <span className="font-semibold text-gray-800">Etapa crítica:</span> {s.etapa_mais_dificil}
                      </div>
                    ) : null}
                    {s.motivo_nao_acionamento ? (
                      <div>
                        <span className="font-semibold text-gray-800">Observação / motivo:</span>{' '}
                        {s.motivo_nao_acionamento}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Documentos comprobatórios ({s.documentos.length})
                  </p>
                  {s.documentos.length === 0 ? (
                    <p className="mt-1.5 text-xs text-gray-400">
                      Nenhum documento anexado a este sinistro ainda.
                    </p>
                  ) : (
                    <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                      {s.documentos.map((doc) => (
                        <div
                          key={doc.id_documento}
                          className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-gray-800">{doc.tipo}</p>
                            <p className="truncate font-mono text-[11px] text-gray-500">{doc.arquivo}</p>
                            <p className="text-[11px] text-gray-400">Enviado em {formatarData(doc.data_envio)}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <Badge variant={doc.validado ? 'success' : 'warning'}>
                              {doc.validado ? 'Validado' : 'Pendente'}
                            </Badge>
                            {isAdmin ? (
                              <button
                                type="button"
                                onClick={() => alternarValidacaoDoc(doc.id_documento, doc.validado)}
                                className="rounded-md border border-gray-200 p-1 text-gray-600 hover:bg-gray-50"
                                title={doc.validado ? 'Remover validação' : 'Validar documento'}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => setDocExcluir(doc)}
                              className="rounded-md border border-gray-200 p-1 text-gray-500 hover:bg-red-50 hover:text-red-700"
                              title="Remover documento"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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
      ) : ocorrencias.length === 0 ? (
        <EmptyState
          icon={FileCheck2}
          title="Nenhuma ocorrência registrada"
          description="As ocorrências de atraso, avaria ou retenção aparecem aqui quando reportadas para uma remessa."
          action={
            remessasDisponiveis.length > 0 ? (
              <button type="button" onClick={abrirNovaOcorrencia} className="btn-primary">
                <AlertTriangle className="h-4 w-4" />
                Registrar ocorrência
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="card-surface overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Ocorrência</th>
                <th className="px-4 py-3">Pedido / Rastreio</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ocorrencias.map((oc) => (
                <tr key={oc.id_ocorrencia} className="hover:bg-gray-50/70">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-[#143326]">{oc.id_ocorrencia}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{oc.nome_produto || oc.id_pedido}</p>
                    <p className="font-mono text-xs text-gray-400">{oc.codigo_rastreio}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="warning">{oc.tipo}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{oc.descricao}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatarDataHora(oc.data_ocorrencia)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Ocorrência */}
      <Modal
        open={modalOcorrencia}
        onClose={() => setModalOcorrencia(false)}
        title="Registrar Ocorrência"
        subtitle="Gera notificação automática vinculada à remessa selecionada."
      >
        <form onSubmit={salvarOcorrencia} className="space-y-4">
          <div>
            <label className="label-field">Remessa / Pedido</label>
            <select
              className="input-field"
              value={ocIdRemessa}
              onChange={(e) => setOcIdRemessa(e.target.value)}
              required
            >
              {remessasDisponiveis.map((p) => (
                <option key={p.id_remessa || p.id_pedido} value={p.id_remessa || ''}>
                  {p.codigo_rastreio} — {p.nome_produto}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field">Tipo de ocorrência</label>
            <select className="input-field" value={ocTipo} onChange={(e) => setOcTipo(e.target.value)}>
              <option value="Atraso Crítico">Atraso Crítico</option>
              <option value="Extravio">Extravio</option>
              <option value="Avaria">Avaria</option>
              <option value="Retenção Fiscal">Retenção Fiscal</option>
              <option value="Divergência de Entrega">Divergência de Entrega</option>
            </select>
          </div>
          <div>
            <label className="label-field">Descrição detalhada</label>
            <textarea
              className="input-field min-h-[88px]"
              value={ocDesc}
              onChange={(e) => setOcDesc(e.target.value)}
              placeholder="Descreva o ocorrido e as evidências disponíveis..."
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOcorrencia(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={salvando} className="btn-primary">
              {salvando ? <Spinner className="h-4 w-4 text-white" /> : null}
              Registrar ocorrência
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Sinistro */}
      <Modal
        open={modalSinistro}
        onClose={() => setModalSinistro(false)}
        title={editSinistroId ? `Atualizar Sinistro ${editSinistroId}` : 'Abrir Novo Sinistro'}
        subtitle="Acompanhamento de indenização vinculado à ocorrência e apólice."
      >
        <form onSubmit={salvarSinistro} className="space-y-4">
          {!editSinistroId ? (
            <div>
              <label className="label-field">Ocorrência de referência</label>
              <select
                className="input-field"
                value={sinIdOcorrencia}
                onChange={(e) => setSinIdOcorrencia(e.target.value)}
                required
              >
                {ocorrencias.map((oc) => (
                  <option key={oc.id_ocorrencia} value={oc.id_ocorrencia}>
                    {oc.id_ocorrencia} • {oc.tipo} ({oc.codigo_rastreio})
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label-field">Status do sinistro</label>
              <select className="input-field" value={sinStatus} onChange={(e) => setSinStatus(e.target.value)}>
                <option value="Aberto">Aberto</option>
                <option value="Em análise">Em análise</option>
                <option value="Documentação pendente">Documentação pendente</option>
                <option value="Aprovado">Aprovado</option>
                <option value="Indenizado">Indenizado</option>
                <option value="Negado">Negado</option>
                <option value="Não acionado">Não acionado</option>
                <option value="Encerrado">Encerrado</option>
              </select>
            </div>
            <div>
              <label className="label-field">Valor indenizado (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input-field"
                value={sinValor}
                onChange={(e) => setSinValor(e.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>

          <div>
            <label className="label-field">Etapa mais difícil (opcional)</label>
            <input
              type="text"
              className="input-field"
              value={sinEtapa}
              onChange={(e) => setSinEtapa(e.target.value)}
              placeholder="Ex.: Envio da documentação fiscal"
            />
          </div>

          <div>
            <label className="label-field">Observação / motivo de não acionamento (opcional)</label>
            <textarea
              className="input-field min-h-[76px]"
              value={sinMotivo}
              onChange={(e) => setSinMotivo(e.target.value)}
              placeholder="Detalhes adicionais sobre o andamento ou motivo"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalSinistro(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={salvando} className="btn-primary">
              {salvando ? <Spinner className="h-4 w-4 text-white" /> : null}
              {editSinistroId ? 'Salvar atualização' : 'Confirmar abertura'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Documento */}
      <Modal
        open={Boolean(modalDocSinistro)}
        onClose={() => setModalDocSinistro(null)}
        title={`Anexar Documento — ${modalDocSinistro?.id_sinistro || ''}`}
      >
        <form onSubmit={salvarDocumento} className="space-y-4">
          <div>
            <label className="label-field">Tipo de documento</label>
            <select className="input-field" value={docTipo} onChange={(e) => setDocTipo(e.target.value)}>
              <option value="Nota Fiscal">Nota Fiscal</option>
              <option value="Conhecimento de Transporte (CT-e)">Conhecimento de Transporte (CT-e)</option>
              <option value="Laudo de Avaria">Laudo de Avaria</option>
              <option value="Boletim de Ocorrência">Boletim de Ocorrência</option>
              <option value="Comprovante de Postagem">Comprovante de Postagem</option>
            </select>
          </div>
          <div>
            <label className="label-field">Identificador / Nome do arquivo</label>
            <input
              type="text"
              className="input-field"
              value={docArquivo}
              onChange={(e) => setDocArquivo(e.target.value)}
              placeholder="Ex.: danfe-pedido-2026.pdf"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalDocSinistro(null)} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={salvando} className="btn-primary">
              {salvando ? <Spinner className="h-4 w-4 text-white" /> : null}
              Anexar documento
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(docExcluir)}
        onClose={() => setDocExcluir(null)}
        title="Confirmar exclusão"
      >
        <p className="text-sm text-gray-600">
          Deseja remover o documento <strong className="text-gray-900">{docExcluir?.tipo}</strong> (
          <span className="font-mono text-xs">{docExcluir?.arquivo}</span>)? Essa ação não pode ser desfeita.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => setDocExcluir(null)} className="btn-secondary">
            Cancelar
          </button>
          <button
            type="button"
            disabled={salvando}
            onClick={confirmarRemoverDocumento}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {salvando ? <Spinner className="h-4 w-4 text-white" /> : null}
            Remover documento
          </button>
        </div>
      </Modal>
    </div>
  );
}
