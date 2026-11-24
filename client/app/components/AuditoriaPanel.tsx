'use client';

import { useEffect, useState, useCallback } from 'react';
import type { FormEvent } from 'react';
import { ClipboardList, Users, Tag, Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { authFetch } from '../lib/auth';
import { API_URL } from '../lib/config';
import { formatarDataHora, formatarData } from '../lib/format';
import type { ClientePerfil } from '../lib/auth';
import { useUser } from '../screens';
import { Spinner, TableSkeleton } from './Loading';

interface LogAuditoria {
  id_log: string;
  id_usuario: string;
  entidade: string;
  id_registro: string;
  acao: string;
  data_hora: string;
  usuario_nome: string;
  usuario_email: string;
  usuario_perfil: string;
}

interface UsuarioRow {
  id_usuario: string;
  nome_completo: string;
  email_corporativo: string;
  perfil: string;
  data_cadastro: string;
  ativo: boolean;
  cliente_id_cliente: string | null;
  id_cliente: string | null;
  data_nascimento: string | null;
  tipo_vinculo: string | null;
  frequencia_compra: string | null;
  faixa_gasto_medio: string | null;
}

interface CategoriaRow {
  id_categoria: string;
  descricao: string;
  total_pedidos?: number;
}

export default function AuditoriaPanel() {
  const user = useUser();
  const [aba, setAba] = useState<'logs' | 'conta' | 'categorias'>('logs');
  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([]);
  const [categorias, setCategorias] = useState<CategoriaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');

  // Filtros Auditoria
  const [filtroEntidade, setFiltroEntidade] = useState('');
  const [buscaLog, setBuscaLog] = useState('');

  // Meu perfil
  const [nomePerfil, setNomePerfil] = useState('');
  const [nascPerfil, setNascPerfil] = useState('');
  const [vinculoPerfil, setVinculoPerfil] = useState('Pessoa Física');
  const [freqPerfil, setFreqPerfil] = useState('Mensal');
  const [gastoPerfil, setGastoPerfil] = useState('R$ 500 a R$ 1.500');
  const [salvando, setSalvando] = useState(false);

  // Categorias
  const [catEditId, setCatEditId] = useState<string | null>(null);
  const [catDesc, setCatDesc] = useState('');

  const carregarTudo = useCallback(() => {
    setLoading(true);
    setErro('');
    const qs = new URLSearchParams();
    if (filtroEntidade) qs.set('entidade', filtroEntidade);
    if (buscaLog.trim()) qs.set('busca', buscaLog.trim());

    Promise.all([
      authFetch(`${API_URL}/auditoria?${qs}`).then((r) => r.json()),
      authFetch(`${API_URL}/usuarios`).then((r) => r.json()),
      authFetch(`${API_URL}/categorias`).then((r) => r.json()),
      authFetch(`${API_URL}/auth/me`).then((r) => r.json()),
    ])
      .then(([ls, us, cats, me]) => {
        setLogs(Array.isArray(ls) ? ls : []);
        setUsuarios(Array.isArray(us) ? us : []);
        setCategorias(Array.isArray(cats) ? cats : []);
        const cli: ClientePerfil | null = me?.cliente || null;
        if (me?.user) setNomePerfil(me.user.nome_completo || me.user.nome || '');
        if (cli) {
          setNascPerfil(cli.data_nascimento || '');
          setVinculoPerfil(cli.tipo_vinculo || 'Pessoa Física');
          setFreqPerfil(cli.frequencia_compra || 'Mensal');
          setGastoPerfil(cli.faixa_gasto_medio || 'R$ 500 a R$ 1.500');
        }
      })
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar dados.'))
      .finally(() => setLoading(false));
  }, [filtroEntidade, buscaLog]);

  useEffect(() => { carregarTudo(); }, [carregarTudo]);

  async function salvarPerfil(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    setMsg('');
    try {
      const resp = await authFetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_completo: nomePerfil,
          data_nascimento: nascPerfil,
          tipo_vinculo: vinculoPerfil,
          frequencia_compra: freqPerfil,
          faixa_gasto_medio: gastoPerfil,
        }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || 'Erro ao salvar perfil.');
      setMsg('Perfil de usuário e cliente atualizado no banco Magna.');
      carregarTudo();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao salvar perfil.');
    } finally {
      setSalvando(false);
    }
  }

  async function alternarUsuarioAtivo(u: UsuarioRow) {
    setErro('');
    setMsg('');
    try {
      const resp = await authFetch(`${API_URL}/usuarios/${u.id_usuario}/ativo`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !u.ativo }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || 'Erro ao alterar status do usuário.');
      setMsg(`Usuário ${u.email_corporativo} ${json.ativo ? 'ativado' : 'desativado'}.`);
      carregarTudo();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao alterar status.');
    }
  }

  async function salvarCategoria(e: FormEvent) {
    e.preventDefault();
    if (!catDesc.trim()) return;
    setSalvando(true);
    setErro('');
    setMsg('');
    try {
      const url = catEditId ? `${API_URL}/categorias/${catEditId}` : `${API_URL}/categorias`;
      const resp = await authFetch(url, {
        method: catEditId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descricao: catDesc.trim() }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || 'Erro ao salvar categoria.');
      setCatEditId(null);
      setCatDesc('');
      setMsg(`Categoria ${json.descricao} salva.`);
      carregarTudo();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar categoria.');
    } finally {
      setSalvando(false);
    }
  }

  async function excluirCategoria(c: CategoriaRow) {
    setErro('');
    setMsg('');
    try {
      const resp = await authFetch(`${API_URL}/categorias/${c.id_categoria}`, { method: 'DELETE' });
      if (!resp.ok) {
        const json = await resp.json().catch(() => ({}));
        throw new Error(json.error || 'Erro ao excluir categoria.');
      }
      setMsg(`Categoria ${c.descricao} excluída.`);
      carregarTudo();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao excluir categoria.');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Auditoria, conta e categorias</h1>
        <p className="text-gray-500 mt-1">Consulte trilhas de auditoria, atualize seu perfil de cliente e administre categorias de produtos.</p>
      </div>

      <div className="flex flex-wrap gap-4 border-b border-gray-200 text-sm font-medium">
        <button
          onClick={() => setAba('logs')}
          className={`pb-3 px-1 flex items-center gap-2 border-b-2 transition ${aba === 'logs' ? 'border-[#1a3326] text-[#1a3326] font-semibold' : 'border-transparent text-gray-500'}`}
        >
          <ClipboardList size={17} /> Logs de Auditoria ({logs.length})
        </button>
        <button
          onClick={() => setAba('conta')}
          className={`pb-3 px-1 flex items-center gap-2 border-b-2 transition ${aba === 'conta' ? 'border-[#1a3326] text-[#1a3326] font-semibold' : 'border-transparent text-gray-500'}`}
        >
          <Users size={17} /> Meu Perfil & Usuários ({usuarios.length})
        </button>
        <button
          onClick={() => setAba('categorias')}
          className={`pb-3 px-1 flex items-center gap-2 border-b-2 transition ${aba === 'categorias' ? 'border-[#1a3326] text-[#1a3326] font-semibold' : 'border-transparent text-gray-500'}`}
        >
          <Tag size={17} /> Categorias de Produto ({categorias.length})
        </button>
      </div>

      {erro && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{erro}</div>}
      {msg && <div className="p-3 rounded-lg bg-[#e8f0eb] text-[#1a3326] text-sm animate-pop-in">{msg}</div>}

      {aba === 'logs' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={buscaLog}
                onChange={(e) => setBuscaLog(e.target.value)}
                placeholder="Buscar por ID de registro, usuário ou e-mail"
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#1a3326]"
              />
            </div>
            <select
              value={filtroEntidade}
              onChange={(e) => setFiltroEntidade(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="">Todas as entidades</option>
              {['USUARIO', 'CLIENTE', 'PEDIDO', 'REMESSA', 'APOLICE', 'SEGURADORA', 'CATEGORIA_PRODUTO', 'OCORRENCIA', 'SINISTRO', 'DOCUMENTO', 'NOTIFICACAO', 'ATENDIMENTO', 'FEEDBACK', 'UNIDADE'].map((ent) => (
                <option key={ent} value={ent}>{ent}</option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="p-4">Log</th>
                  <th className="p-4">Data / Hora</th>
                  <th className="p-4">Usuário</th>
                  <th className="p-4">Entidade</th>
                  <th className="p-4">Registro</th>
                  <th className="p-4">Ação</th>
                </tr>
              </thead>
              {loading ? (
                <TableSkeleton rows={6} cols={6} />
              ) : (
                <tbody className="divide-y divide-gray-100">
                  {logs.map((l) => (
                    <tr key={l.id_log} className="hover:bg-gray-50">
                      <td className="p-4 font-mono text-xs text-gray-600">{l.id_log}</td>
                      <td className="p-4 text-xs text-gray-500 whitespace-nowrap">{formatarDataHora(l.data_hora)}</td>
                      <td className="p-4">
                        <div className="font-medium text-gray-900">{l.usuario_nome}</div>
                        <div className="text-xs text-gray-400">{l.usuario_email}</div>
                      </td>
                      <td className="p-4 text-xs font-semibold text-gray-700">{l.entidade}</td>
                      <td className="p-4 font-mono text-xs text-gray-700">{l.id_registro}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#e8f0eb] text-[#1a3326]">{l.acao}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>
        </div>
      )}

      {aba === 'conta' && (
        <div className="space-y-6">
          <form onSubmit={salvarPerfil} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <h2 className="font-bold text-lg text-gray-900">Meus dados cadastrais (USUARIO + CLIENTE)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nome completo *</label>
                <input type="text" value={nomePerfil} onChange={(e) => setNomePerfil(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Data de nascimento</label>
                <input type="date" value={nascPerfil} onChange={(e) => setNascPerfil(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de vínculo</label>
                <select value={vinculoPerfil} onChange={(e) => setVinculoPerfil(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-white">
                  <option value="Pessoa Física">Pessoa Física</option>
                  <option value="MEI / Pequeno Negócio">MEI / Pequeno Negócio</option>
                  <option value="Corporativo">Corporativo</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Frequência de compra</label>
                <select value={freqPerfil} onChange={(e) => setFreqPerfil(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-white">
                  <option value="Semanal">Semanal</option>
                  <option value="Quinzenal">Quinzenal</option>
                  <option value="Mensal">Mensal</option>
                  <option value="Eventual">Eventual</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Faixa de gasto médio</label>
                <select value={gastoPerfil} onChange={(e) => setGastoPerfil(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-white">
                  <option value="Até R$ 500">Até R$ 500</option>
                  <option value="R$ 500 a R$ 1.500">R$ 500 a R$ 1.500</option>
                  <option value="R$ 1.500 a R$ 5.000">R$ 1.500 a R$ 5.000</option>
                  <option value="Acima de R$ 5.000">Acima de R$ 5.000</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={salvando} className="px-5 py-2.5 bg-[#1a3326] text-white rounded-lg text-sm font-medium hover:bg-[#2d4a3e] flex items-center gap-2">
                {salvando && <Spinner size={14} />} Salvar perfil
              </button>
            </div>
          </form>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
            <div className="p-4 border-b border-gray-100 font-bold text-gray-900">
              {user?.papel === 'admin' ? 'Usuários e clientes cadastrados' : 'Resumo da sua conta'}
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="p-4">Usuário / Cliente</th>
                  <th className="p-4">E-mail</th>
                  <th className="p-4">Perfil / Vínculo</th>
                  <th className="p-4">Cadastro</th>
                  <th className="p-4">Status</th>
                  {user?.papel === 'admin' && <th className="p-4 text-right">Ação</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usuarios.map((u) => (
                  <tr key={u.id_usuario} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{u.nome_completo}</div>
                      <div className="text-xs text-gray-400">{u.id_usuario} • {u.id_cliente || 'Sem cliente'}</div>
                    </td>
                    <td className="p-4 text-gray-600">{u.email_corporativo}</td>
                    <td className="p-4 text-xs text-gray-600">
                      <span className="capitalize font-semibold">{u.perfil}</span> • {u.tipo_vinculo || '—'}
                    </td>
                    <td className="p-4 text-xs text-gray-500">{formatarData(u.data_cadastro)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    {user?.papel === 'admin' && (
                      <td className="p-4 text-right">
                        {u.id_usuario !== user.id && (
                          <button onClick={() => alternarUsuarioAtivo(u)} className="text-xs font-medium text-[#1a3326] hover:underline">
                            {u.ativo ? 'Desativar' : 'Ativar'}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {aba === 'categorias' && (
        <div className="space-y-6">
          <form onSubmit={salvarCategoria} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[240px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {catEditId ? `Editando categoria ${catEditId}` : 'Nova categoria de produto'}
              </label>
              <input
                type="text"
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                placeholder="Ex.: Eletrodomésticos"
                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm"
                required
              />
            </div>
            {catEditId && (
              <button type="button" onClick={() => { setCatEditId(null); setCatDesc(''); }} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm">
                Cancelar
              </button>
            )}
            <button type="submit" disabled={salvando} className="px-4 py-2.5 bg-[#1a3326] text-white rounded-lg text-sm font-medium flex items-center gap-2">
              <Plus size={16} /> {catEditId ? 'Atualizar' : 'Adicionar categoria'}
            </button>
          </form>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="p-4">Código</th>
                  <th className="p-4">Descrição</th>
                  <th className="p-4">Pedidos vinculados</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categorias.map((c) => (
                  <tr key={c.id_categoria} className="hover:bg-gray-50">
                    <td className="p-4 font-mono text-xs text-gray-700">{c.id_categoria}</td>
                    <td className="p-4 font-medium text-gray-900">{c.descricao}</td>
                    <td className="p-4 text-gray-600">{c.total_pedidos ?? 0}</td>
                    <td className="p-4 text-right space-x-3 whitespace-nowrap">
                      <button onClick={() => { setCatEditId(c.id_categoria); setCatDesc(c.descricao); }} className="text-xs font-medium text-[#1a3326] hover:underline inline-flex items-center gap-1">
                        <Pencil size={13} /> Editar
                      </button>
                      <button onClick={() => excluirCategoria(c)} className="text-xs font-medium text-red-700 hover:underline inline-flex items-center gap-1">
                        <Trash2 size={13} /> Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
