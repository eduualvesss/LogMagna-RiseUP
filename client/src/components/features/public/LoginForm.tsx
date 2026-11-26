'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/auth-context';
import { useSetupStatus } from '@/hooks/useSetupStatus';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Loading';
import { Logo } from '@/components/ui/Logo';
import loginImg from '@/assets/login.jpg';

export default function LoginForm() {
  const router = useRouter();
  const { user, loading: authLoading, login } = useAuth();
  const { needsSetup } = useSetupStatus();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard');
    }
  }, [authLoading, user, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Informe e-mail e senha.');
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password, remember);
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao entrar.');
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
          <h2 className="text-4xl font-bold leading-tight mb-4">Sua operação logística sob controle.</h2>
          <p className="text-slate-200 leading-relaxed">
            Acompanhe encomendas, apólices de seguro, ocorrências, sinistros e atendimento em uma única plataforma.
          </p>
        </div>
        <div className="relative flex items-center gap-2 text-xs text-slate-300">
          <ShieldCheck size={14} /> Acesso autenticado e trilha completa de auditoria
        </div>
      </aside>

      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8 text-[#1a3326]">
            <Logo className="w-9 h-9 text-[#1a3326]" />
            <span className="text-xl font-bold tracking-wider">LOGMAGNA</span>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">Entrar na plataforma</h1>
            <p className="text-sm text-slate-500 mt-1 mb-6">Informe suas credenciais corporativas para continuar.</p>

            {needsSetup && (
              <Alert variant="info" className="mb-5">
                <p className="font-semibold">Primeiro acesso detectado</p>
                <p className="text-xs mt-0.5">
                  Ainda não há usuários cadastrados. Crie a primeira conta para assumir o perfil de administrador.
                </p>
                <Link
                  href="/cadastro"
                  className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold underline"
                >
                  <UserPlus size={13} /> Criar conta administradora
                </Link>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1.5">E-mail</label>
                <div className="relative">
                  <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nome@empresa.com.br"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="senha" className="block text-xs font-semibold text-slate-700 mb-1.5">Senha</label>
                <div className="relative">
                  <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="senha"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    className={`${inputClass} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="accent-[#1a3326] w-4 h-4 rounded"
                />
                Manter sessão neste dispositivo
              </label>

              {error && <Alert variant="error">{error}</Alert>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#1a3326] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#274837] disabled:opacity-70 disabled:cursor-wait transition flex items-center justify-center gap-2 text-sm"
              >
                {submitting ? <Spinner /> : <ArrowRight size={17} />}
                {submitting ? 'Autenticando...' : 'Entrar'}
              </button>
            </form>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 mt-6 px-1">
            <span>
              Não tem conta?{' '}
              <Link href="/cadastro" className="text-[#1a3326] font-semibold hover:underline">
                Criar cadastro
              </Link>
            </span>
            <Link href="/rastrear" className="text-slate-600 hover:text-[#1a3326] hover:underline">
              Consulta pública de rastreio →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
