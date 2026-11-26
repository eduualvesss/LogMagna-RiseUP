'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  Activity,
  FolderTree,
  KeyRound,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserCog,
  Users,
} from 'lucide-react';
import { useAuth } from '@/hooks/auth-context';
import { useAuditoria } from '@/hooks/useAuditoria';
import { formatarData, formatarDataHora } from '@/lib/format';
import { adminService } from '@/services/admin.service';
import { segurosService } from '@/services/seguros.service';
import type { CategoriaItem, UsuarioAdminItem } from '@/types';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner, TableSkeleton } from '@/components/ui/Loading';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs } from '@/components/ui/Tabs';

export default function AuditoriaView() {
  const { user, cliente, isAdmin, updateProfile, changePassword } = useAuth();

  const [aba, setAba] = useState<'perfil' | 'usuarios' | 'categorias' | 'logs'>('perfil');
  const [filtroEntidade, setFiltroEntidade] = useState('');
  const [buscaLog, setBuscaLog] = useState('');

  const { logs, usuarios, categorias, loading, erro, recarregar } = useAuditoria(filtroEntidade, buscaLog);

  const [erroAcao, setErroAcao] = useState('');
  const [msg, setMsg] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Perfil
  const [nomePerfil, setNomePerfil] = useState(user?.nome_completo || '');
  const [nascimento, setNascimento] = useState(cliente?.data_nascimento || '');
  const [vinculo, setVinculo] = useState(cliente?.tipo_vinculo || 'Corporativo');
  const [frequencia, setFrequencia] = useState(cliente?.frequencia_compra || 'Mensal');
  const [gasto, setGasto] = useState(cliente?.faixa_gasto_medio || 'R$ 500 - R$ 2.500');

  // Senha
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  // Modal Novo Usuário (admin)
  const [modalUsuario, setModalUsuario] = useState(false);
  const [uNome, setUNome] = useState('');
  const [uEmail, setUEmail] = useState('');
  const [uSenha, setUSenha] = useState('');
  const [uPerfil, setUPerfil] = useState<'cliente' | 'admin'>('cliente');
  const [uVinculo, setUVinculo] = useState('Corporativo');

  // Modal Categoria (admin)
  const [modalCat, setModalCat] = useState(false);
  const [editCat, setEditCat] = useState<CategoriaItem | null>(null);
  const [catDesc, setCatDesc] = useState('');

  async function salvarPerfil(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErroAcao('');
    setMsg('');
    try {
      await updateProfile({
        nome_completo: nomePerfil.trim(),
        data_nascimento: nascimento || undefined,
        tipo_vinculo: vinculo,
        frequencia_compra: frequencia,
        faixa_gasto_medio: gasto,
      });
      setMsg('Dados cadastrais atualizados com sucesso.');
      await recarregar();
    } catch (err) {
      setErroAcao(err instanceof Error ? err.message : 'Falha ao atualizar perfil.');
    } finally {
      setSalvando(false);
    }
  }

  async function salvarSenha(e: FormEvent) {
    e.preventDefault();
    if (novaSenha !== confirmarSenha) {
      setErroAcao('A confirmação da nova senha não confere.');
      return;
    }
    setSalvando(true);
    setErroAcao('');
    setMsg('');
    try {
      await changePassword({ senha_atual: senhaAtual, nova_senha: novaSenha });
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      setMsg('Senha alterada com sucesso.');
    } catch (err) {
      setErroAcao(err instanceof Error ? err.message : 'Falha ao alterar senha.');
    } finally {
      setSalvando(false);
    }
  }

  async function criarUsuario(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErroAcao('');
    setMsg('');
    try {
      await adminService.createUsuario({
        nome_completo: uNome.trim(),
        email_corporativo: uEmail.trim(),
        password: uSenha,
        perfil: uPerfil,
        tipo_vinculo: uVinculo,
      });
      setModalUsuario(false);
      setUNome('');
      setUEmail('');
      setUSenha('');
      setMsg('Usuário criado com sucesso.');
      await recarregar();
    } catch (err) {
      setErroAcao(err instanceof Error ? err.message : 'Falha ao criar usuário.');
    } finally {
      setSalvando(false);
    }
  }

  async function alternarAtivoUsuario(u: UsuarioAdminItem) {
    setErroAcao('');
    setMsg('');
    try {
      await adminService.toggleUsuarioAtivo(u.id_usuario, !u.ativo);
      setMsg(`Usuário ${u.nome_completo} ${!u.ativo ? 'reativado' : 'desativado'}.`);
      await recarregar();
    } catch (err) {
      setErroAcao(err instanceof Error ? err.message : 'Falha ao atualizar status do usuário.');
    }
  }

  async function alternarPerfilUsuario(u: UsuarioAdminItem) {
    setErroAcao('');
    setMsg('');
    const proximo = u.perfil === 'admin' ? 'cliente' : 'admin';
    try {
      await adminService.updateUsuarioPerfil(u.id_usuario, proximo);
      setMsg(`Perfil de ${u.nome_completo} alterado para ${proximo}.`);
      await recarregar();
    } catch (err) {
      setErroAcao(err instanceof Error ? err.message : 'Falha ao atualizar perfil.');
    }
  }

  function abrirNovaCategoria() {
    setEditCat(null);
    setCatDesc('');
    setErroAcao('');
    setModalCat(true);
  }

  function abrirEditarCategoria(c: CategoriaItem) {
    setEditCat(c);
    setCatDesc(c.descricao);
    setErroAcao('');
    setModalCat(true);
  }

  async function salvarCategoria(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErroAcao('');
    setMsg('');
    try {
      if (editCat) {
        await segurosService.updateCategoria(editCat.id_categoria, catDesc.trim());
        setMsg('Categoria atualizada.');
      } else {
        await segurosService.createCategoria(catDesc.trim());
        setMsg('Categoria cadastrada.');
      }
      setModalCat(false);
      await recarregar();
    } catch (err) {
      setErroAcao(err instanceof Error ? err.message : 'Falha ao salvar categoria.');
    } finally {
      setSalvando(false);
    }
  }

  async function removerCategoria(c: CategoriaItem) {
    setErroAcao('');
    setMsg('');
    try {
      await segurosService.deleteCategoria(c.id_categoria);
      setMsg(`Categoria "${c.descricao}" removida.`);
      await recarregar();
    } catch (err) {
      setErroAcao(err instanceof Error ? err.message : 'Não foi possível remover a categoria.');
    }
  }

  const abas = isAdmin
    ? [
        { id: 'perfil' as const, label: 'Minha Conta & Segurança', icon: UserCog },
        { id: 'usuarios' as const, label: 'Usuários', count: usuarios.length, icon: Users },
        { id: 'categorias' as const, label: 'Categorias', count: categorias.length, icon: FolderTree },
        { id: 'logs' as const, label: 'Logs de Auditoria', count: logs.length, icon: Activity },
      ]
    : [
        { id: 'perfil' as const, label: 'Minha Conta & Segurança', icon: UserCog },
        { id: 'logs' as const, label: 'Minhas Atividades', count: logs.length, icon: Activity },
      ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conta e Governança"
        description={
          isAdmin
            ? 'Gerencie sua conta, permissões de acesso, catálogo de categorias e trilhas de auditoria.'
            : 'Atualize seus dados cadastrais, senha de acesso e acompanhe o histórico da sua conta.'
        }
      />

      {erro ? <Alert variant="error">{erro}</Alert> : null}
      {erroAcao ? <Alert variant="error">{erroAcao}</Alert> : null}
      {msg ? <Alert variant="success">{msg}</Alert> : null}

      <Tabs value={aba} onChange={setAba} items={abas} />

      {aba === 'perfil' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <form onSubmit={salvarPerfil} className="card-surface space-y-4 p-6">
            <div>
              <h2 className="text-base font-bold text-gray-900">Dados cadastrais</h2>
              <p className="text-xs text-gray-500">
                E-mail corporativo: <strong className="text-gray-700">{user?.email_corporativo}</strong>
              </p>
            </div>

            <div>
              <label className="label-field">Nome completo</label>
              <input
                type="text"
                className="input-field"
                value={nomePerfil}
                onChange={(e) => setNomePerfil(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label-field">Data de nascimento</label>
                <input
                  type="date"
                  className="input-field"
                  value={nascimento}
                  onChange={(e) => setNascimento(e.target.value)}
                />
              </div>
              <div>
                <label className="label-field">Tipo de vínculo</label>
                <select className="input-field" value={vinculo} onChange={(e) => setVinculo(e.target.value)}>
                  <option value="Corporativo">Corporativo</option>
                  <option value="E-commerce">E-commerce</option>
                  <option value="Marketplace">Marketplace</option>
                  <option value="Pessoa Física">Pessoa Física</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label-field">Frequência de envios</label>
                <select className="input-field" value={frequencia} onChange={(e) => setFrequencia(e.target.value)}>
                  <option value="Semanal">Semanal</option>
                  <option value="Mensal">Mensal</option>
                  <option value="Eventual">Eventual</option>
                </select>
              </div>
              <div>
                <label className="label-field">Faixa de valor médio</label>
                <select className="input-field" value={gasto} onChange={(e) => setGasto(e.target.value)}>
                  <option value="Até R$ 500">Até R$ 500</option>
                  <option value="R$ 500 - R$ 2.500">R$ 500 - R$ 2.500</option>
                  <option value="R$ 2.500 - R$ 10.000">R$ 2.500 - R$ 10.000</option>
                  <option value="Acima de R$ 10.000">Acima de R$ 10.000</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button type="submit" disabled={salvando} className="btn-primary">
                {salvando ? <Spinner className="h-4 w-4 text-white" /> : null}
                Salvar dados cadastrais
              </button>
            </div>
          </form>

          <form onSubmit={salvarSenha} className="card-surface space-y-4 p-6">
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-[#143326]" />
              <div>
                <h2 className="text-base font-bold text-gray-900">Segurança e alteração de senha</h2>
                <p className="text-xs text-gray-500">
                  Mínimo de 8 caracteres combinando letras e números.
                </p>
              </div>
            </div>

            <div>
              <label className="label-field">Senha atual</label>
              <input
                type="password"
                className="input-field"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label-field">Nova senha</label>
              <input
                type="password"
                className="input-field"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                minLength={8}
                required
              />
            </div>

            <div>
              <label className="label-field">Confirmar nova senha</label>
              <input
                type="password"
                className="input-field"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                minLength={8}
                required
              />
            </div>

            <div className="pt-2">
              <button type="submit" disabled={salvando} className="btn-secondary">
                {salvando ? <Spinner className="h-4 w-4" /> : null}
                Atualizar senha
              </button>
            </div>
          </form>
        </div>
      ) : loading ? (
        <TableSkeleton rows={5} />
      ) : aba === 'usuarios' && isAdmin ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button type="button" onClick={() => setModalUsuario(true)} className="btn-primary">
              <Plus className="h-4 w-4" />
              Novo usuário
            </button>
          </div>

          <div className="card-surface overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Nome / E-mail</th>
                  <th className="px-4 py-3">Perfil</th>
                  <th className="px-4 py-3">Vínculo</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Cadastro</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usuarios.map((u) => (
                  <tr key={u.id_usuario} className="hover:bg-gray-50/70">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{u.nome_completo}</p>
                      <p className="text-xs text-gray-500">{u.email_corporativo}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.perfil === 'admin' ? 'brand' : 'neutral'}>{u.perfil}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.tipo_vinculo || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={u.ativo ? 'success' : 'danger'}>{u.ativo ? 'Ativo' : 'Inativo'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatarData(u.data_cadastro)}</td>
                    <td className="px-4 py-3 text-right">
                      {u.id_usuario === user?.id_usuario ? (
                        <span className="text-xs text-gray-400">Sessão atual</span>
                      ) : (
                        <div className="inline-flex gap-2">
                          <button
                            type="button"
                            onClick={() => alternarPerfilUsuario(u)}
                            className="btn-secondary !px-2.5 !py-1 !text-xs"
                          >
                            {u.perfil === 'admin' ? 'Tornar cliente' : 'Promover admin'}
                          </button>
                          <button
                            type="button"
                            onClick={() => alternarAtivoUsuario(u)}
                            className="btn-secondary !px-2.5 !py-1 !text-xs"
                          >
                            {u.ativo ? 'Desativar' : 'Reativar'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : aba === 'categorias' && isAdmin ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button type="button" onClick={abrirNovaCategoria} className="btn-primary">
              <Plus className="h-4 w-4" />
              Nova categoria
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categorias.map((c) => (
              <div key={c.id_categoria} className="card-surface flex items-center justify-between p-4">
                <div>
                  <p className="font-mono text-xs text-gray-400">{c.id_categoria}</p>
                  <p className="font-semibold text-gray-900">{c.descricao}</p>
                  <p className="text-xs text-gray-500">{c.total_pedidos ?? 0} pedido(s) vinculado(s)</p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => abrirEditarCategoria(c)}
                    className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removerCategoria(c)}
                    className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card-surface flex flex-col gap-3 p-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className="input-field pl-9"
                value={buscaLog}
                onChange={(e) => setBuscaLog(e.target.value)}
                placeholder="Filtrar por ação, registro ou usuário..."
              />
            </div>
            <select
              className="input-field sm:w-52"
              value={filtroEntidade}
              onChange={(e) => setFiltroEntidade(e.target.value)}
            >
              <option value="">Todas as entidades</option>
              <option value="USUARIO">Usuário</option>
              <option value="PEDIDO">Pedido</option>
              <option value="APOLICE">Apólice</option>
              <option value="SINISTRO">Sinistro</option>
              <option value="OCORRENCIA">Ocorrência</option>
              <option value="UNIDADE">Unidade</option>
            </select>
          </div>

          {logs.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="Nenhum evento encontrado"
              description="As ações operacionais registradas na plataforma aparecem nesta trilha de auditoria."
            />
          ) : (
            <div className="card-surface overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3">Data / Hora</th>
                    <th className="px-4 py-3">Entidade</th>
                    <th className="px-4 py-3">Ação</th>
                    <th className="px-4 py-3">Registro</th>
                    <th className="px-4 py-3">Usuário</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((l) => (
                    <tr key={l.id_log} className="hover:bg-gray-50/70">
                      <td className="px-4 py-3 text-xs text-gray-500">{formatarDataHora(l.data_hora)}</td>
                      <td className="px-4 py-3">
                        <Badge variant="neutral">{l.entidade}</Badge>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{l.acao}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{l.id_registro}</td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold text-gray-800">{l.usuario_nome}</p>
                        <p className="text-[11px] text-gray-400">{l.usuario_email}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Criar Usuário */}
      <Modal open={modalUsuario} onClose={() => setModalUsuario(false)} title="Cadastrar Usuário">
        <form onSubmit={criarUsuario} className="space-y-4">
          <div>
            <label className="label-field">Nome completo</label>
            <input
              type="text"
              className="input-field"
              value={uNome}
              onChange={(e) => setUNome(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label-field">E-mail corporativo</label>
            <input
              type="email"
              className="input-field"
              value={uEmail}
              onChange={(e) => setUEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label-field">Perfil</label>
              <select
                className="input-field"
                value={uPerfil}
                onChange={(e) => setUPerfil(e.target.value === 'admin' ? 'admin' : 'cliente')}
              >
                <option value="cliente">Cliente</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div>
              <label className="label-field">Vínculo</label>
              <select className="input-field" value={uVinculo} onChange={(e) => setUVinculo(e.target.value)}>
                <option value="Corporativo">Corporativo</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Marketplace">Marketplace</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label-field">Senha inicial (mín. 8 caracteres, letra e número)</label>
            <input
              type="password"
              className="input-field"
              minLength={8}
              value={uSenha}
              onChange={(e) => setUSenha(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalUsuario(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={salvando} className="btn-primary">
              {salvando ? <Spinner className="h-4 w-4 text-white" /> : null}
              Criar usuário
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Categoria */}
      <Modal
        open={modalCat}
        onClose={() => setModalCat(false)}
        title={editCat ? 'Editar Categoria' : 'Nova Categoria de Produto'}
      >
        <form onSubmit={salvarCategoria} className="space-y-4">
          <div>
            <label className="label-field">Descrição</label>
            <input
              type="text"
              className="input-field"
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              placeholder="Ex.: Equipamentos Médicos"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalCat(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={salvando} className="btn-primary">
              {salvando ? <Spinner className="h-4 w-4 text-white" /> : null}
              Salvar categoria
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
