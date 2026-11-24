'use client';

import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, User as UserIcon, Calendar, Briefcase } from 'lucide-react';
import { Logo } from '../screens';
import { Spinner } from './Loading';
import { getSession, register, saveSession } from '../lib/auth';
import loginImg from '../assets/login.jpg';

export default function CadastroForm() {
  const router = useRouter();
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (getSession()) router.replace('/dashboard');
  }, [router]);

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (!form.nome_completo.trim() || !form.email_corporativo.trim() || !form.password) {
      setError('Preencha nome completo, e-mail e senha.');
      return;
    }
    if (form.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('As senhas digitadas não conferem.');
      return;
    }

    setLoading(true);
    try {
      const session = await register({
        nome_completo: form.nome_completo.trim(),
        email_corporativo: form.email_corporativo.trim(),
        password: form.password,
        data_nascimento: form.data_nascimento || undefined,
        tipo_vinculo: form.tipo_vinculo,
        frequencia_compra: form.frequencia_compra,
        faixa_gasto_medio: form.faixa_gasto_medio,
      });
      saveSession(session, true);
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao cadastrar.');
      setLoading(false);
    }
  }

  const inputClass =
    'w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a3326] focus:ring-2 focus:ring-[#1a3326]/10 transition bg-white text-sm';

  return (
    <div className="min-h-screen bg-[#f4f6f5] grid grid-cols-1 lg:grid-cols-2">
      <aside className="relative hidden lg:flex flex-col justify-between p-12 text-white overflow-hidden animate-fade-in">
        <img src={loginImg.src} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a3326]/95 via-[#1a3326]/85 to-[#2d4a3e]/70" />
        <div className="relative flex items-center gap-3">
          <Logo className="w-10 h-10 text-white" />
          <span className="text-xl font-bold tracking-wider">LOGMAGNA</span>
        </div>
        <div className="relative max-w-md animate-fade-in-up">
          <h2 className="text-4xl font-bold leading-tight mb-4">Crie sua conta de cliente no banco Magna.</h2>
          <p className="text-gray-200">
            Seu cadastro registra simultaneamente seu acesso de usuário e seu perfil de cliente para gerenciar pedidos, apólices, ocorrências e sinistros.
          </p>
        </div>
        <div className="relative flex items-center gap-2 text-xs text-gray-300">
          <ShieldCheck size={14} /> Persistência real em SQLite (tabela USUARIO + CLIENTE)
        </div>
      </aside>

      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-lg animate-fade-in-up">
          <div className="flex lg:hidden items-center justify-center gap-3 mb-6 text-[#1a3326]">
            <Logo className="w-10 h-10 text-[#3f6b4d]" />
            <span className="text-xl font-bold tracking-wider">LOGMAGNA</span>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">Criar cadastro</h1>
            <p className="text-gray-500 text-sm mt-1 mb-6">Preencha seus dados para acessar a área do cliente.</p>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="nome" className="block text-xs font-medium text-gray-700 mb-1">Nome completo *</label>
                <div className="relative">
                  <UserIcon size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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
                <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">E-mail *</label>
                <div className="relative">
                  <Mail size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    maxLength={120}
                    value={form.email_corporativo}
                    onChange={set('email_corporativo')}
                    placeholder="voce@empresa.com"
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="senha" className="block text-xs font-medium text-gray-700 mb-1">Senha * (mín. 6)</label>
                  <div className="relative">
                    <Lock size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="senha"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={set('password')}
                      placeholder="••••••"
                      className={`${inputClass} pr-10`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="confirmar" className="block text-xs font-medium text-gray-700 mb-1">Confirmar senha *</label>
                  <div className="relative">
                    <Lock size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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
                  <label htmlFor="nasc" className="block text-xs font-medium text-gray-700 mb-1">Data de nascimento</label>
                  <div className="relative">
                    <Calendar size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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
                  <label htmlFor="vinculo" className="block text-xs font-medium text-gray-700 mb-1">Tipo de vínculo</label>
                  <div className="relative">
                    <Briefcase size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select id="vinculo" value={form.tipo_vinculo} onChange={set('tipo_vinculo')} className={inputClass}>
                      <option value="Pessoa Física">Pessoa Física</option>
                      <option value="MEI / Pequeno Negócio">MEI / Pequeno Negócio</option>
                      <option value="Corporativo">Corporativo</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="freq" className="block text-xs font-medium text-gray-700 mb-1">Frequência de compra</label>
                  <select
                    id="freq"
                    value={form.frequencia_compra}
                    onChange={set('frequencia_compra')}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:border-[#1a3326]"
                  >
                    <option value="Semanal">Semanal</option>
                    <option value="Quinzenal">Quinzenal</option>
                    <option value="Mensal">Mensal</option>
                    <option value="Eventual">Eventual</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="gasto" className="block text-xs font-medium text-gray-700 mb-1">Faixa de gasto médio</label>
                  <select
                    id="gasto"
                    value={form.faixa_gasto_medio}
                    onChange={set('faixa_gasto_medio')}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:border-[#1a3326]"
                  >
                    <option value="Até R$ 500">Até R$ 500</option>
                    <option value="R$ 500 a R$ 1.500">R$ 500 a R$ 1.500</option>
                    <option value="R$ 1.500 a R$ 5.000">R$ 1.500 a R$ 5.000</option>
                    <option value="Acima de R$ 5.000">Acima de R$ 5.000</option>
                  </select>
                </div>
              </div>

              {error && (
                <div role="alert" className="p-3 rounded-lg bg-red-50 text-red-700 text-sm animate-pop-in">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1a3326] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#2d4a3e] disabled:opacity-70 disabled:cursor-wait transition flex items-center justify-center gap-2"
              >
                {loading ? <Spinner /> : <ArrowRight size={18} />}
                {loading ? 'Criando cadastro...' : 'Criar conta e acessar'}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-gray-500 mt-5">
            Já tem conta? <Link href="/login" className="text-[#3f6b4d] font-medium hover:text-[#1a3326]">Voltar ao login</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
