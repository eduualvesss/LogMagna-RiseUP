'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { CheckCircle2, Headphones, MessageSquare, Plus } from 'lucide-react';
import { useAtendimentos } from '@/hooks/useAtendimentos';
import { formatarData, formatarDataHora } from '@/lib/format';
import { suporteService } from '@/services/suporte.service';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner, TableSkeleton } from '@/components/ui/Loading';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs } from '@/components/ui/Tabs';

export default function AtendimentosView() {
  const { atendimentos, feedbacks, pedidos, loading, erro, recarregar } = useAtendimentos();
  const [aba, setAba] = useState<'atendimentos' | 'feedbacks'>('atendimentos');
  const [erroAcao, setErroAcao] = useState('');
  const [msg, setMsg] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Modal Atendimento
  const [modalAtend, setModalAtend] = useState(false);
  const [atCanal, setAtCanal] = useState('Portal Web');
  const [atAssunto, setAtAssunto] = useState('');
  const [atIdPedido, setAtIdPedido] = useState('');
  const [atAtendidoPor, setAtAtendidoPor] = useState('Equipe LogMagna');
  const [atRepetiu, setAtRepetiu] = useState('Não');

  // Modal Feedback
  const [modalFeed, setModalFeed] = useState(false);
  const [fbProblema, setFbProblema] = useState('');
  const [fbSolucao, setFbSolucao] = useState('');
  const [fbCompreensao, setFbCompreensao] = useState('Clara');
  const [fbMomento, setFbMomento] = useState('No checkout do pedido');
  const [fbAssistente, setFbAssistente] = useState('Sim');

  function abrirModalAtendimento() {
    setAtCanal('Portal Web');
    setAtAssunto('');
    setAtIdPedido('');
    setAtAtendidoPor('Equipe LogMagna');
    setAtRepetiu('Não');
    setErroAcao('');
    setModalAtend(true);
  }

  function abrirModalFeedback() {
    setFbProblema('');
    setFbSolucao('');
    setFbCompreensao('Clara');
    setFbMomento('No checkout do pedido');
    setFbAssistente('Sim');
    setErroAcao('');
    setModalFeed(true);
  }

  async function salvarAtendimento(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErroAcao('');
    setMsg('');
    try {
      await suporteService.createAtendimento({
        canal: atCanal,
        assunto: atAssunto.trim(),
        id_pedido: atIdPedido || undefined,
        exigiu_repetir_informacao: atRepetiu,
        atendido_por: atAtendidoPor,
        resolvido: false,
      });
      setModalAtend(false);
      setMsg('Atendimento registrado com sucesso.');
      await recarregar();
    } catch (err) {
      setErroAcao(err instanceof Error ? err.message : 'Falha ao registrar atendimento.');
    } finally {
      setSalvando(false);
    }
  }

  async function alternarResolvido(id: string, resolvidoAtual: boolean) {
    setErroAcao('');
    setMsg('');
    try {
      await suporteService.updateAtendimento(id, { resolvido: !resolvidoAtual });
      setMsg(!resolvidoAtual ? 'Atendimento marcado como resolvido.' : 'Atendimento reaberto.');
      await recarregar();
    } catch (err) {
      setErroAcao(err instanceof Error ? err.message : 'Falha ao atualizar atendimento.');
    }
  }

  async function salvarFeedback(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErroAcao('');
    setMsg('');
    try {
      await suporteService.createFeedback({
        relato_problema: fbProblema.trim(),
        solucao_esperada: fbSolucao.trim(),
        nivel_compreensao_seguro: fbCompreensao,
        momento_conhecimento_seguro: fbMomento,
        aceita_assistente_virtual: fbAssistente,
      });
      setModalFeed(false);
      setMsg('Feedback enviado. Obrigado por contribuir com a melhoria do serviço.');
      await recarregar();
    } catch (err) {
      setErroAcao(err instanceof Error ? err.message : 'Falha ao enviar feedback.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Atendimento e Experiência"
        description="Acompanhe chamados de suporte vinculados aos pedidos e registre percepções sobre o seguro logístico."
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={abrirModalFeedback} className="btn-secondary">
              <MessageSquare className="h-4 w-4" />
              Enviar feedback
            </button>
            <button type="button" onClick={abrirModalAtendimento} className="btn-primary">
              <Plus className="h-4 w-4" />
              Novo atendimento
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
          { id: 'atendimentos', label: 'Atendimentos', count: atendimentos.length, icon: Headphones },
          { id: 'feedbacks', label: 'Feedbacks do Seguro', count: feedbacks.length, icon: MessageSquare },
        ]}
      />

      {loading ? (
        <TableSkeleton rows={4} />
      ) : aba === 'atendimentos' ? (
        atendimentos.length === 0 ? (
          <EmptyState
            icon={Headphones}
            title="Nenhum atendimento registrado"
            description="Abra um chamado de suporte vinculado ou não a um pedido específico para acompanhar a resolução."
            action={
              <button type="button" onClick={abrirModalAtendimento} className="btn-primary">
                <Plus className="h-4 w-4" />
                Abrir atendimento
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {atendimentos.map((at) => (
              <div key={at.id_atendimento} className="card-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#143326]">{at.id_atendimento}</span>
                      <Badge variant={at.resolvido ? 'success' : 'warning'}>
                        {at.resolvido ? 'Resolvido' : 'Em aberto'}
                      </Badge>
                      <Badge variant="neutral">{at.canal}</Badge>
                    </div>
                    <h3 className="mt-2 text-sm font-bold text-gray-900">{at.assunto}</h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => alternarResolvido(at.id_atendimento, at.resolvido)}
                    className="btn-secondary !px-3 !py-1.5 !text-xs"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {at.resolvido ? 'Reabrir' : 'Concluir'}
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span>Solicitante: <strong className="text-gray-700">{at.cliente_nome}</strong></span>
                  {at.nome_produto ? (
                    <span>Pedido: <strong className="text-gray-700">{at.nome_produto}</strong></span>
                  ) : null}
                  {at.atendido_por ? <span>Atendente: {at.atendido_por}</span> : null}
                  <span>Data: {formatarDataHora(at.data_hora)}</span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : feedbacks.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Nenhum feedback enviado"
          description="Registre avaliações sobre clareza do seguro, dificuldades e sugestões de melhoria."
          action={
            <button type="button" onClick={abrirModalFeedback} className="btn-primary">
              <Plus className="h-4 w-4" />
              Enviar feedback
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {feedbacks.map((fb) => (
            <div key={fb.id_feedback} className="card-surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#143326]">{fb.id_feedback}</span>
                  <span className="text-xs font-semibold text-gray-800">{fb.cliente_nome}</span>
                </div>
                <span className="text-xs text-gray-400">{formatarData(fb.data)}</span>
              </div>

              {fb.relato_problema ? (
                <p className="mt-3 text-sm text-gray-800">
                  <span className="font-semibold">Relato:</span> {fb.relato_problema}
                </p>
              ) : null}
              {fb.solucao_esperada ? (
                <p className="mt-1.5 text-sm text-gray-600">
                  <span className="font-semibold text-gray-800">Solução esperada:</span> {fb.solucao_esperada}
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2">
                {fb.nivel_compreensao_seguro ? (
                  <Badge variant="brand">Compreensão: {fb.nivel_compreensao_seguro}</Badge>
                ) : null}
                {fb.momento_conhecimento_seguro ? (
                  <Badge variant="neutral">Conhecimento: {fb.momento_conhecimento_seguro}</Badge>
                ) : null}
                {fb.aceita_assistente_virtual ? (
                  <Badge variant="info">Assistente: {fb.aceita_assistente_virtual}</Badge>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Atendimento */}
      <Modal
        open={modalAtend}
        onClose={() => setModalAtend(false)}
        title="Novo Atendimento"
      >
        <form onSubmit={salvarAtendimento} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label-field">Canal</label>
              <select className="input-field" value={atCanal} onChange={(e) => setAtCanal(e.target.value)}>
                <option value="Portal Web">Portal Web</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="E-mail">E-mail</option>
                <option value="Telefone">Telefone</option>
              </select>
            </div>
            <div>
              <label className="label-field">Pedido relacionado (opcional)</label>
              <select className="input-field" value={atIdPedido} onChange={(e) => setAtIdPedido(e.target.value)}>
                <option value="">Sem vínculo específico</option>
                {pedidos.map((p) => (
                  <option key={p.id_pedido} value={p.id_pedido}>
                    {p.nome_produto} ({p.codigo_rastreio || p.id_pedido})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label-field">Assunto</label>
            <input
              type="text"
              className="input-field"
              value={atAssunto}
              onChange={(e) => setAtAssunto(e.target.value)}
              placeholder="Ex.: Solicitação de atualização da previsão de entrega"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label-field">Responsável pelo atendimento</label>
              <input
                type="text"
                className="input-field"
                value={atAtendidoPor}
                onChange={(e) => setAtAtendidoPor(e.target.value)}
              />
            </div>
            <div>
              <label className="label-field">Exigiu repetir informações?</label>
              <select className="input-field" value={atRepetiu} onChange={(e) => setAtRepetiu(e.target.value)}>
                <option value="Não">Não</option>
                <option value="Sim">Sim</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalAtend(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={salvando} className="btn-primary">
              {salvando ? <Spinner className="h-4 w-4 text-white" /> : null}
              Registrar chamado
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Feedback */}
      <Modal
        open={modalFeed}
        onClose={() => setModalFeed(false)}
        title="Registrar Feedback do Serviço"
      >
        <form onSubmit={salvarFeedback} className="space-y-4">
          <div>
            <label className="label-field">Relato do problema ou ponto de melhoria</label>
            <textarea
              className="input-field min-h-[80px]"
              value={fbProblema}
              onChange={(e) => setFbProblema(e.target.value)}
              placeholder="Descreva sua experiência com o transporte ou cobertura do seguro..."
              required
            />
          </div>
          <div>
            <label className="label-field">Solução esperada</label>
            <textarea
              className="input-field min-h-[70px]"
              value={fbSolucao}
              onChange={(e) => setFbSolucao(e.target.value)}
              placeholder="O que tornaria esse processo mais simples ou rápido?"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="label-field">Clareza do seguro</label>
              <select
                className="input-field"
                value={fbCompreensao}
                onChange={(e) => setFbCompreensao(e.target.value)}
              >
                <option value="Muito clara">Muito clara</option>
                <option value="Clara">Clara</option>
                <option value="Parcial">Parcial</option>
                <option value="Confusa">Confusa</option>
              </select>
            </div>
            <div>
              <label className="label-field">Momento em que soube</label>
              <select className="input-field" value={fbMomento} onChange={(e) => setFbMomento(e.target.value)}>
                <option value="No checkout do pedido">No checkout</option>
                <option value="No rastreamento">No rastreamento</option>
                <option value="Após ocorrência">Após ocorrência</option>
              </select>
            </div>
            <div>
              <label className="label-field">Aceita assistente virtual?</label>
              <select
                className="input-field"
                value={fbAssistente}
                onChange={(e) => setFbAssistente(e.target.value)}
              >
                <option value="Sim">Sim</option>
                <option value="Talvez">Talvez</option>
                <option value="Não">Não</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalFeed(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={salvando} className="btn-primary">
              {salvando ? <Spinner className="h-4 w-4 text-white" /> : null}
              Enviar feedback
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
