'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { MapPin, Pencil, Plus, Search, ShieldAlert, Trash2, Warehouse } from 'lucide-react';
import { useAuth } from '@/hooks/auth-context';
import { useUnidades } from '@/hooks/useUnidades';
import { unidadesService } from '@/services/unidades.service';
import type { UnidadeItem } from '@/types';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner, TableSkeleton } from '@/components/ui/Loading';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';

export default function UnidadesView() {
  const { isAdmin } = useAuth();
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const { unidades, loading, erro, recarregar } = useUnidades(busca, filtroStatus);

  const [erroAcao, setErroAcao] = useState('');
  const [msg, setMsg] = useState('');
  const [salvando, setSalvando] = useState(false);

  const [modalForm, setModalForm] = useState(false);
  const [editando, setEditando] = useState<UnidadeItem | null>(null);
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('Centro de distribuição');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('SP');
  const [status, setStatus] = useState('ativa');

  const [unidadeExcluir, setUnidadeExcluir] = useState<UnidadeItem | null>(null);

  function abrirCriar() {
    setEditando(null);
    setNome('');
    setTipo('Centro de distribuição');
    setCidade('');
    setEstado('SP');
    setStatus('ativa');
    setErroAcao('');
    setModalForm(true);
  }

  function abrirEditar(u: UnidadeItem) {
    setEditando(u);
    setNome(u.nome);
    setTipo(u.tipo);
    setCidade(u.cidade);
    setEstado(u.estado);
    setStatus(u.status);
    setErroAcao('');
    setModalForm(true);
  }

  async function salvarUnidade(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErroAcao('');
    setMsg('');
    try {
      const payload = {
        nome: nome.trim(),
        tipo: tipo.trim(),
        cidade: cidade.trim(),
        estado: estado.trim().toUpperCase(),
        status,
      };
      if (editando) {
        await unidadesService.update(editando.id_unidade, { ...payload, version: editando.version });
        setMsg(`Unidade "${payload.nome}" atualizada.`);
      } else {
        await unidadesService.create(payload);
        setMsg(`Unidade "${payload.nome}" cadastrada.`);
      }
      setModalForm(false);
      await recarregar();
    } catch (err) {
      setErroAcao(err instanceof Error ? err.message : 'Falha ao salvar unidade.');
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarExclusao() {
    if (!unidadeExcluir) return;
    setSalvando(true);
    setErroAcao('');
    setMsg('');
    try {
      await unidadesService.remove(unidadeExcluir.id_unidade);
      setMsg(`Unidade "${unidadeExcluir.nome}" removida.`);
      setUnidadeExcluir(null);
      await recarregar();
    } catch (err) {
      setErroAcao(err instanceof Error ? err.message : 'Falha ao remover unidade.');
    } finally {
      setSalvando(false);
    }
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Unidades Operacionais"
          description="Gestão de hubs, centros de distribuição e bases regionais."
        />
        <EmptyState
          icon={ShieldAlert}
          title="Acesso restrito à administração"
          description="A manutenção de unidades e hubs logísticos está disponível apenas para usuários administradores."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Unidades Operacionais"
        description="Cadastre e gerencie hubs, centros de distribuição e bases regionais da malha LogMagna."
        actions={
          <button type="button" onClick={abrirCriar} className="btn-primary">
            <Plus className="h-4 w-4" />
            Nova unidade
          </button>
        }
      />

      {erro ? <Alert variant="error">{erro}</Alert> : null}
      {erroAcao ? <Alert variant="error">{erroAcao}</Alert> : null}
      {msg ? <Alert variant="success">{msg}</Alert> : null}

      <div className="card-surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="input-field pl-9"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, cidade ou tipo..."
          />
        </div>
        <select
          className="input-field sm:w-48"
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="ativa">Ativa</option>
          <option value="inativa">Inativa</option>
        </select>
      </div>

      {loading ? (
        <TableSkeleton rows={4} />
      ) : unidades.length === 0 ? (
        <EmptyState
          icon={Warehouse}
          title="Nenhuma unidade cadastrada"
          description="Adicione os centros de distribuição e hubs reais da sua operação para começar."
          action={
            <button type="button" onClick={abrirCriar} className="btn-primary">
              <Plus className="h-4 w-4" />
              Cadastrar primeira unidade
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {unidades.map((u) => (
            <div key={u.id_unidade} className="card-surface flex flex-col justify-between p-5">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{u.tipo}</p>
                    <h3 className="mt-0.5 text-base font-bold text-gray-900">{u.nome}</h3>
                  </div>
                  <Badge variant={u.status === 'ativa' ? 'success' : 'neutral'}>
                    {u.status === 'ativa' ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  {u.cidade} / {u.estado}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                <span className="text-xs text-gray-400">Versão {u.version}</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => abrirEditar(u)}
                    className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50"
                    title="Editar unidade"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnidadeExcluir(u)}
                    className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-700"
                    title="Remover unidade"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalForm}
        onClose={() => setModalForm(false)}
        title={editando ? `Editar ${editando.nome}` : 'Nova Unidade Operacional'}
      >
        <form onSubmit={salvarUnidade} className="space-y-4">
          <div>
            <label className="label-field">Nome da unidade</label>
            <input
              type="text"
              className="input-field"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: CD Campinas Sul"
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label-field">Tipo</label>
              <select className="input-field" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="Matriz">Matriz</option>
                <option value="Filial">Filial</option>
                <option value="Centro de distribuição">Centro de distribuição</option>
              </select>
            </div>
            <div>
              <label className="label-field">Status</label>
              <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="ativa">Ativa</option>
                <option value="inativa">Inativa</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="label-field">Cidade</label>
              <input
                type="text"
                className="input-field"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="Ex.: Campinas"
                required
              />
            </div>
            <div>
              <label className="label-field">UF</label>
              <input
                type="text"
                maxLength={2}
                className="input-field uppercase"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalForm(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={salvando} className="btn-primary">
              {salvando ? <Spinner className="h-4 w-4 text-white" /> : null}
              {editando ? 'Salvar alterações' : 'Cadastrar unidade'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(unidadeExcluir)}
        onClose={() => setUnidadeExcluir(null)}
        title="Confirmar exclusão"
      >
        <p className="text-sm text-gray-600">
          Deseja remover a unidade <strong className="text-gray-900">{unidadeExcluir?.nome}</strong>? Essa ação não
          pode ser desfeita.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => setUnidadeExcluir(null)} className="btn-secondary">
            Cancelar
          </button>
          <button
            type="button"
            disabled={salvando}
            onClick={confirmarExclusao}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {salvando ? <Spinner className="h-4 w-4 text-white" /> : null}
            Remover unidade
          </button>
        </div>
      </Modal>
    </div>
  );
}
