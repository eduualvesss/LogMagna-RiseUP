'use client';

import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';
import { Box, Calendar, CheckCircle, Shield, Truck } from 'lucide-react';
import { useNotificacoesHeader } from '@/hooks/notificacoes-context';
import { usePedidos } from '@/hooks/usePedidos';
import { brl } from '@/lib/format';
import type { PedidoItem } from '@/types';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Loading';
import { PageHeader } from '@/components/ui/PageHeader';

interface NovoPedidoForm {
  nome_produto: string;
  id_categoria: string;
  valor_declarado: string;
  loja: string;
  data_compra: string;
  id_seguradora: string;
  coberturas: string;
  transportadora: string;
  codigo_rastreio: string;
  origem: string;
  cep_destino: string;
  destino: string;
}

export default function NovoPedidoView() {
  const { refreshNotificacoes } = useNotificacoesHeader();
  const { categorias, seguradoras, criarPedido } = usePedidos();

  const [form, setForm] = useState<NovoPedidoForm>(() => ({
    nome_produto: '',
    id_categoria: '',
    valor_declarado: '',
    loja: '',
    data_compra: new Date().toISOString().slice(0, 10),
    id_seguradora: '',
    coberturas: 'Roubo, extravio e avaria no transporte',
    transportadora: 'LogMagna Express',
    codigo_rastreio: '',
    origem: '',
    cep_destino: '',
    destino: '',
  }));

  const [criado, setCriado] = useState<PedidoItem | null>(null);
  const [msg, setMsg] = useState('');
  const [erro, setErro] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categoriaSelecionada = form.id_categoria || categorias[0]?.id_categoria || '';
  const seguradoraSelecionada = form.id_seguradora || seguradoras[0]?.id_seguradora || '';

  const set = (k: keyof NovoPedidoForm) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const valorNum = Number(String(form.valor_declarado).replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setMsg('');
    setErro('');

    if (!form.nome_produto.trim() || valorNum <= 0) {
      setErro('Informe o nome do produto e um valor declarado maior que zero.');
      return;
    }

    setSubmitting(true);
    try {
      const novo = await criarPedido({
        ...form,
        id_categoria: categoriaSelecionada || undefined,
        id_seguradora: seguradoraSelecionada || undefined,
        destino: form.destino.replace(/\s*\/\s*/, ', ').trim() || 'São Paulo, SP',
        origem: form.origem.trim() || 'Centro Logístico',
        valor_declarado: valorNum,
      });
      setCriado(novo);
      setMsg(`Pedido ${novo.id_pedido} registrado com apólice ${novo.id_apolice} e rastreio ${novo.codigo_rastreio}.`);
      setForm((prev) => ({
        ...prev,
        nome_produto: '',
        valor_declarado: '',
        loja: '',
        codigo_rastreio: '',
        origem: '',
        cep_destino: '',
        destino: '',
      }));
      await refreshNotificacoes();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao cadastrar pedido.');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white focus:outline-none focus:border-[#1a3326] focus:ring-2 focus:ring-[#1a3326]/10';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cadastrar novo pedido"
        description="Registre os dados da compra para emitir a apólice de seguro e gerar o código de rastreio."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
        <form className="lg:col-span-2 space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="font-bold text-base text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Box size={18} className="text-[#1a3326]" /> Dados do produto
            </h2>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nome do produto *</label>
              <input
                type="text"
                value={form.nome_produto}
                onChange={set('nome_produto')}
                placeholder="Ex.: Notebook corporativo 15 polegadas"
                className={inputClass}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Categoria *</label>
                <select value={categoriaSelecionada} onChange={set('id_categoria')} className={inputClass}>
                  {categorias.map((c) => (
                    <option key={c.id_categoria} value={c.id_categoria}>{c.descricao}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Valor declarado (R$) *</label>
                <input
                  type="text"
                  value={form.valor_declarado}
                  onChange={set('valor_declarado')}
                  placeholder="Ex.: 2500,00"
                  className={inputClass}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Loja / fornecedor</label>
                <input
                  type="text"
                  value={form.loja}
                  onChange={set('loja')}
                  placeholder="Ex.: Loja Oficial"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Data da compra *</label>
                <input type="date" value={form.data_compra} onChange={set('data_compra')} className={inputClass} required />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="font-bold text-base text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Shield size={18} className="text-[#1a3326]" /> Seguro e apólice
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Seguradora *</label>
                <select value={seguradoraSelecionada} onChange={set('id_seguradora')} className={inputClass}>
                  {seguradoras.map((s) => (
                    <option key={s.id_seguradora} value={s.id_seguradora}>{s.razao_social}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Coberturas incluídas *</label>
                <input type="text" value={form.coberturas} onChange={set('coberturas')} className={inputClass} required />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="font-bold text-base text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Truck size={18} className="text-[#1a3326]" /> Informações de envio
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Transportadora *</label>
                <select value={form.transportadora} onChange={set('transportadora')} className={inputClass}>
                  <option value="LogMagna Express">LogMagna Express</option>
                  <option value="Correios SEDEX">Correios SEDEX</option>
                  <option value="Jadlog Rodoviário">Jadlog Rodoviário</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Código de rastreio (opcional)</label>
                <input
                  type="text"
                  value={form.codigo_rastreio}
                  onChange={set('codigo_rastreio')}
                  placeholder="Gerado automaticamente se vazio"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Origem *</label>
                <input
                  type="text"
                  value={form.origem}
                  onChange={set('origem')}
                  placeholder="Ex.: Campinas, SP"
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">CEP de destino</label>
                <input
                  type="text"
                  value={form.cep_destino}
                  onChange={set('cep_destino')}
                  placeholder="00000-000"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Cidade / UF de destino *</label>
                <input
                  type="text"
                  value={form.destino}
                  onChange={set('destino')}
                  placeholder="Ex.: Recife, PE"
                  className={inputClass}
                  required
                />
              </div>
            </div>
          </div>

          {erro && <Alert variant="error">{erro}</Alert>}
          {msg && (
            <Alert variant="success">
              <div className="font-medium">{msg}</div>
              {criado && (
                <div className="flex flex-wrap gap-4 text-xs mt-2">
                  <Link href="/services" className="underline font-semibold">Ver em Pedidos e seguros →</Link>
                  {criado.codigo_rastreio && (
                    <Link href={`/tracking?code=${encodeURIComponent(criado.codigo_rastreio)}`} className="underline font-semibold">
                      Acompanhar rastreio ({criado.codigo_rastreio}) →
                    </Link>
                  )}
                </div>
              )}
            </Alert>
          )}

          <div className="flex justify-between pt-2">
            <Link href="/services" className="px-5 py-2.5 border border-slate-200 bg-white rounded-xl text-slate-700 text-sm font-medium hover:bg-slate-50">
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-[#1a3326] text-white rounded-xl text-sm font-medium hover:bg-[#274837] disabled:opacity-70 inline-flex items-center gap-2"
            >
              {submitting ? <Spinner /> : <CheckCircle size={17} />}
              {submitting ? 'Registrando...' : 'Registrar pedido e apólice'}
            </button>
          </div>
        </form>

        <div className="space-y-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs sticky top-24">
            <h3 className="font-bold text-base text-slate-900 mb-3">Resumo da emissão</h3>
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">
              <div className="w-10 h-10 bg-[#e8f0eb] rounded-xl flex items-center justify-center text-[#1a3326]">
                <Box size={19} />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm text-slate-900 truncate">
                  {form.nome_produto.trim() || 'Novo produto'}
                </div>
                <div className="text-xs text-slate-500">
                  {categorias.find((c) => c.id_categoria === categoriaSelecionada)?.descricao || 'Categoria'}
                </div>
              </div>
            </div>

            <div className="space-y-2.5 text-sm mb-5">
              <div className="flex justify-between"><span className="text-slate-500">Valor declarado</span><span className="font-semibold tabular-nums">{brl(valorNum)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Taxa da proteção</span><span className="font-medium">2% sobre valor</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Origem</span><span className="font-medium">{form.origem || '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Destino</span><span className="font-medium">{form.destino || '—'}</span></div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-1">Valor do prêmio da apólice</p>
              <div className="text-3xl font-bold text-slate-900 tabular-nums">{brl(valorNum * 0.02)}</div>
              <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                <Calendar size={12} /> Vigência de 12 meses a partir da compra
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
