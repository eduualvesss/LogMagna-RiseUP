'use client';

import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Briefcase, Calendar, Eye, EyeOff, Lock, Mail, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/hooks/auth-context';
import { useSetupStatus } from '@/hooks/useSetupStatus';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Loading';
import { Logo } from '@/components/ui/Logo';
import loginImg from '@/assets/login.jpg';

export default function CadastroForm() {
  const router = useRouter();
  const { user, loading: authLoading, register } = useAuth();
  const { needsSetup } = useSetupStatus();
  const [form, setForm] = useState({
    nome_completo: '',
    email_corporativo: '',
    password: '',
    confirmPassword: '',
    data_nascimento: '',
    tipo_vinculo: 'Pessoa Física',
    frequencia_compra: 'Mensal',
    faixa_gasto_medio: 'R$ 500 a R$ 1.500',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard');
    }
  }, [authLoading, user, router]);

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (!form.nome_completo.trim() || !form.email_corporativo.trim() || !form.password) {
      setError('Preencha nome completo, e-mail e senha.');
      return;
    }
    if (form.password.length < 8 || !/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(form.password) || !/\d/.test(form.password)) {
      setError('A senha deve ter pelo menos 8 caracteres, incluindo letra e número.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('As senhas digitadas não conferem.');
      return;
    }

    setSubmitting(true);
    try {
      await register({
        nome_completo: form.nome_completo.trim(),
        email_corporativo: form.email_corporativo.trim(),
        password: form.password,
        data_nascimento: form.data_nascimento || undefined,
        tipo_vinculo: form.tipo_vinculo,
        frequencia_compra: form.frequencia_compra,
        faixa_gasto_medio: form.faixa_gasto_medio,
      });
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar cadastro.');
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1a3326] focus:ring-2 focus:ring-[#1a3326]/10 transition bg-white text-sm';

  return (
    <div className="min-h-screen bg-[#f8faf9] grid grid-cols-1 lg:grid-cols-2">
      <aside className="relative hidden lg:flex flex-col justify-between p-12 text-white overflow-hidden">
        <img src={loginImg.src} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#11221a]/95 via-[#1a3326]/85 to-[#234234]/75" />
        <Link href="/" className="relative flex items-center gap-3 w-fit">
          <Logo className="w-9 h-9 text-emerald-300" />
          <span className="text-xl font-bold tracking-wider">LOGMAGNA</span>
        </Link>
        <div className="relative max-w-md">
          <h2 className="text-4xl font-bold leading-tight mb-4">
            {needsSetup ? 'Configure o primeiro administrador.' : 'Crie sua conta na LogMagna.'}
          </h2>
          <p className="text-slate-200 leading-relaxed">
            {needsSetup
              ? 'Como ainda não existem usuários cadastrados, esta primeira conta receberá automaticamente permissões administrativas para gerenciar toda a operação.'
              : 'Seu cadastro integra seu acesso ao painel de pedidos, apólices, ocorrências, sinistros e atendimento.'}
          </p>
        </div>
        <div className="relative flex items-center gap-2 text-xs text-slate-300">
          <ShieldCheck size={14} /> Senha criptografada com scrypt e proteção por perfil de acesso
        </div>
      </aside>

      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-lg animate-fade-in-up">
          <div className="flex lg:hidden items-center justify-center gap-3 mb-6 text-[#1a3326]">
            <Logo className="w-9 h-9 text-[#1a3326]" />
            <span className="text-xl font-bold tracking-wider">LOGMAGNA</span>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">
              {needsSetup ? 'Configuração inicial (Administrador)' : 'Criar cadastro'}
            </h1>
            <p className="text-slate-500 text-sm mt-1 mb-6">
              {needsSetup
                ? 'Crie a conta principal de administração para iniciar o sistema.'
                : 'Preencha seus dados para acessar sua área do cliente.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="nome" className="block text-xs font-semibold text-slate-700 mb-1">Nome completo *</label>
                <div className="relative">
                  <UserIcon size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="nome"
                    type="text"
                    maxLength={120}
                    value={form.nome_completo}
                    onChange={set('nome_completo')}
                    placeholder="Seu nome completo"
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1">E-mail *</label>
                <div className="relative">
                  <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    maxLength={120}
                    value={form.email_corporativo}
                    onChange={set('email_corporativo')}
                    placeholder="nome@empresa.com.br"
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="senha" className="block text-xs font-semibold text-slate-700 mb-1">
                    Senha * (8+ chars, letra e número)
                  </label>
                  <div className="relative">
                    <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="senha"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={set('password')}
                      placeholder="Mín. 8 caracteres"
                      className={`${inputClass} pr-10`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="confirmar" className="block text-xs font-semibold text-slate-700 mb-1">Confirmar senha *</label>
                  <div className="relative">
                    <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="confirmar"
                      type={showPassword ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={set('confirmPassword')}
                      placeholder="Repita a senha"
                      className={inputClass}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nasc" className="block text-xs font-semibold text-slate-700 mb-1">Data de nascimento</label>
                  <div className="relative">
                    <Calendar size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="nasc"
                      type="date"
                      value={form.data_nascimento}
                      onChange={set('data_nascimento')}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="vinculo" className="block text-xs font-semibold text-slate-700 mb-1">Tipo de vínculo</label>
                  <div className="relative">
                    <Briefcase size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select id="vinculo" value={form.tipo_vinculo} onChange={set('tipo_vinculo')} className={inputClass}>
                      <option value="Pessoa Física">Pessoa Física</option>
                      <option value="MEI / Pequeno Negócio">MEI / Pequeno Negócio</option>
                      <option value="Corporativo">Corporativo</option>
                      <option value="E-commerce">E-commerce</option>
                      <option value="Marketplace">Marketplace</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="freq" className="block text-xs font-semibold text-slate-700 mb-1">Frequência de compra</label>
                  <select
                    id="freq"
                    value={form.frequencia_compra}
                    onChange={set('frequencia_compra')}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:border-[#1a3326]"
                  >
                    <option value="Semanal">Semanal</option>
                    <option value="Quinzenal">Quinzenal</option>
                    <option value="Mensal">Mensal</option>
                    <option value="Eventual">Eventual</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="gasto" className="block text-xs font-semibold text-slate-700 mb-1">Faixa de gasto médio</label>
                  <select
                    id="gasto"
                    value={form.faixa_gasto_medio}
                    onChange={set('faixa_gasto_medio')}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:border-[#1a3326]"
                  >
                    <option value="Até R$ 500">Até R$ 500</option>
                    <option value="R$ 500 a R$ 1.500">R$ 500 a R$ 1.500</option>
                    <option value="R$ 1.500 a R$ 5.000">R$ 1.500 a R$ 5.000</option>
                    <option value="Acima de R$ 5.000">Acima de R$ 5.000</option>
                  </select>
                </div>
              </div>

              {error && <Alert variant="error">{error}</Alert>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#1a3326] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#274837] disabled:opacity-70 disabled:cursor-wait transition flex items-center justify-center gap-2 text-sm"
              >
                {submitting ? <Spinner /> : <ArrowRight size={17} />}
                {submitting ? 'Criando conta...' : needsSetup ? 'Criar administrador e acessar' : 'Criar conta e acessar'}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-slate-500 mt-5">
            Já possui cadastro?{' '}
            <Link href="/login" className="text-[#1a3326] font-semibold hover:underline">
              Entrar na plataforma
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
