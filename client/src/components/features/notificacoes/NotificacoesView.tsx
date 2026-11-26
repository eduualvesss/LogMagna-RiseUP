'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Bell, CheckCheck, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/auth-context';
import { useNotificacoes } from '@/hooks/useNotificacoes';
import { useNotificacoesHeader } from '@/hooks/notificacoes-context';
import { formatarDataHora } from '@/lib/format';
import { suporteService } from '@/services/suporte.service';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner, TableSkeleton } from '@/components/ui/Loading';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs } from '@/components/ui/Tabs';

export default function NotificacoesView() {
  const { isAdmin } = useAuth();
  const { refreshNotificacoes } = useNotificacoesHeader();
  const [filtro, setFiltro] = useState<'todas' | 'nao_lidas'>('todas');
  const { items, naoLidas, loading, erro, recarregar } = useNotificacoes(filtro);

  const [erroAcao, setErroAcao] = useState('');
  const [msg, setMsg] = useState('');
  const [salvando, setSalvando] = useState(false);

  const [modalCriar, setModalCriar] = useState(false);
  const [tipo, setTipo] = useState('Aviso Operacional');
  const [canal, setCanal] = useState('Sistema');

  async function alternarLida(id: string, lidaAtual: boolean) {
    setErroAcao('');
    setMsg('');
    try {
      await suporteService.toggleNotificacaoLida(id, !lidaAtual);
      await Promise.all([recarregar(), refreshNotificacoes()]);
    } catch (err) {
      setErroAcao(err instanceof Error ? err.message : 'Falha ao atualizar notificação.');
    }
  }

  async function marcarTodas() {
    setErroAcao('');
    setMsg('');
    try {
      await suporteService.marcarTodasLidas();
      setMsg('Todas as notificações foram marcadas como lidas.');
      await Promise.all([recarregar(), refreshNotificacoes()]);
    } catch (err) {
      setErroAcao(err instanceof Error ? err.message : 'Falha ao marcar todas como lidas.');
    }
  }

  async function remover(id: string) {
    setErroAcao('');
    setMsg('');
    try {
      await suporteService.deleteNotificacao(id);
      setMsg('Notificação removida.');
      await Promise.all([recarregar(), refreshNotificacoes()]);
    } catch (err) {
      setErroAcao(err instanceof Error ? err.message : 'Falha ao remover notificação.');
    }
  }

  async function criarNotificacao(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErroAcao('');
    setMsg('');
    try {
      await suporteService.createNotificacao({ tipo: tipo.trim(), canal });
      setModalCriar(false);
      setMsg('Notificação enviada.');
      await Promise.all([recarregar(), refreshNotificacoes()]);
    } catch (err) {
      setErroAcao(err instanceof Error ? err.message : 'Falha ao criar notificação.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Central de Notificações"
        description="Alertas automáticos de ocorrências, atualizações de entrega e comunicados operacionais."
        actions={
          <div className="flex flex-wrap gap-2">
            {naoLidas > 0 ? (
              <button type="button" onClick={marcarTodas} className="btn-secondary">
                <CheckCheck className="h-4 w-4" />
                Marcar todas como lidas
              </button>
            ) : null}
            {isAdmin ? (
              <button type="button" onClick={() => setModalCriar(true)} className="btn-primary">
                <Plus className="h-4 w-4" />
                Nova notificação
              </button>
            ) : null}
          </div>
        }
      />

      {erro ? <Alert variant="error">{erro}</Alert> : null}
      {erroAcao ? <Alert variant="error">{erroAcao}</Alert> : null}
      {msg ? <Alert variant="success">{msg}</Alert> : null}

      <Tabs
        value={filtro}
        onChange={setFiltro}
        items={[
          { id: 'todas', label: 'Todas', count: filtro === 'todas' ? items.length : undefined },
          { id: 'nao_lidas', label: 'Não lidas', count: naoLidas },
        ]}
      />

      {loading ? (
        <TableSkeleton rows={4} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={filtro === 'nao_lidas' ? 'Nenhuma notificação pendente' : 'Nenhuma notificação registrada'}
          description="Quando houver ocorrências em remessas ou avisos operacionais, os alertas aparecerão nesta caixa."
        />
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <div
              key={n.id_notificacao}
              className={`card-surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${
                n.lida ? 'opacity-80' : 'border-emerald-200 bg-emerald-50/20'
              }`}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {!n.lida ? <span className="h-2 w-2 rounded-full bg-[#3cd070]" /> : null}
                  <span className="text-sm font-bold text-gray-900">{n.tipo}</span>
                  <Badge variant="neutral">{n.canal}</Badge>
                  {n.ocorrencia_tipo ? <Badge variant="warning">{n.ocorrencia_tipo}</Badge> : null}
                </div>
                {n.ocorrencia_descricao ? (
                  <p className="mt-1 text-xs text-gray-600">{n.ocorrencia_descricao}</p>
                ) : null}
                <p className="mt-1 text-xs text-gray-400">
                  {n.cliente_nome ? `${n.cliente_nome} • ` : ''}
                  {formatarDataHora(n.data_envio)}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => alternarLida(n.id_notificacao, n.lida)}
                  className="btn-secondary !px-3 !py-1.5 !text-xs"
                >
                  {n.lida ? 'Marcar como não lida' : 'Marcar como lida'}
                </button>
                <button
                  type="button"
                  onClick={() => remover(n.id_notificacao)}
                  className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-red-50 hover:text-red-700"
                  title="Excluir notificação"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalCriar}
        onClose={() => setModalCriar(false)}
        title="Emitir Notificação Manual"
      >
        <form onSubmit={criarNotificacao} className="space-y-4">
          <div>
            <label className="label-field">Título / Tipo do aviso</label>
            <input
              type="text"
              className="input-field"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label-field">Canal</label>
            <select className="input-field" value={canal} onChange={(e) => setCanal(e.target.value)}>
              <option value="Sistema">Sistema</option>
              <option value="E-mail">E-mail</option>
              <option value="SMS">SMS</option>
              <option value="WhatsApp">WhatsApp</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalCriar(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={salvando} className="btn-primary">
              {salvando ? <Spinner className="h-4 w-4 text-white" /> : null}
              Enviar notificação
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
