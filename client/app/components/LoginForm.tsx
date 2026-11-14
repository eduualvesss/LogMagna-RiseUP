'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, Info } from 'lucide-react';
import { Logo } from '../screens';
import { Spinner } from './Loading';
import { getSession, login, saveSession } from '../lib/auth';
import loginImg from '../assets/login.jpg';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // Quem ja esta logado vai direto para a area do cliente.
  useEffect(() => {
    if (getSession()) router.replace('/dashboard');
  }, [router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!email.trim() || !password) {
      setError('Informe e-mail e senha.');
      return;
    }
    setLoading(true);
    try {
      const session = await login(email, password);
      saveSession(session, remember);
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao entrar.');
      setLoading(false);
    }
  }

  const inputClass =
    'w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a3326] focus:ring-2 focus:ring-[#1a3326]/10 transition bg-white';

  return (
    <div className="min-h-screen bg-[#f4f6f5] grid grid-cols-1 lg:grid-cols-2">
      {/* Painel visual */}
      <aside className="relative hidden lg:flex flex-col justify-between p-12 text-white overflow-hidden animate-fade-in">
        <img src={loginImg.src} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a3326]/95 via-[#1a3326]/85 to-[#2d4a3e]/70" />
        <div className="relative flex items-center gap-3">
          <Logo className="w-10 h-10 text-white" />
          <span className="text-xl font-bold tracking-wider">LOGMAGNA</span>
        </div>
        <div className="relative max-w-md animate-fade-in-up">
          <h2 className="text-4xl font-bold leading-tight mb-4">Sua operação, conectada e sob controle.</h2>
          <p className="text-gray-200">Cadastre produtos, acompanhe cada entrega e consulte seus serviços em um só lugar.</p>
        </div>
        <div className="relative flex items-center gap-2 text-xs text-gray-300">
          <ShieldCheck size={14} /> Ambiente de demonstração • Dados fictícios
        </div>
      </aside>

      {/* Formulario */}
      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8 text-[#1a3326]">
            <Logo className="w-10 h-10 text-[#3f6b4d]" />
            <span className="text-xl font-bold tracking-wider">LOGMAGNA</span>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <h1 className="text-3xl font-bold text-gray-900">Acesse sua conta</h1>
            <p className="text-gray-500 mt-1 mb-8">Sua operação, conectada e sob controle.</p>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">E-mail corporativo</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="você@empresa.com"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="senha" className="block text-xs font-medium text-gray-700 mb-1">Senha</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="accent-[#1a3326] w-4 h-4"
                  />
                  Lembrar este dispositivo
                </label>
                <button
                  type="button"
                  onClick={() => setInfo('A recuperação de senha ainda não está disponível na demonstração.')}
                  className="text-[#3f6b4d] hover:text-[#1a3326] font-medium"
                >
                  Esqueceu a senha?
                </button>
              </div>

              {error && (
                <div role="alert" className="p-3 rounded-lg bg-red-50 text-red-700 text-sm animate-pop-in">{error}</div>
              )}
              {info && (
                <div className="p-3 rounded-lg bg-[#e8f0eb] text-[#1a3326] text-sm animate-pop-in flex items-center gap-2">
                  <Info size={16} /> {info}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1a3326] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#2d4a3e] disabled:opacity-70 disabled:cursor-wait transition flex items-center justify-center gap-2"
              >
                {loading ? <Spinner /> : <ArrowRight size={18} />} {loading ? 'Entrando...' : 'Entrar na plataforma'}
              </button>
            </form>

            <div className="flex items-center gap-3 my-6 text-sm text-gray-400">
              <span className="flex-1 h-px bg-gray-200" /> ou <span className="flex-1 h-px bg-gray-200" />
            </div>

            <button
              type="button"
              onClick={() => setInfo('O login corporativo via SSO ainda não está disponível na demonstração.')}
              className="w-full border border-gray-300 px-6 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-2"
            >
              <ShieldCheck size={18} /> Login corporativo via SSO (SAML/Microsoft)
            </button>

            <p className="mt-6 text-xs text-gray-400 text-center">
              Demonstração: <span className="font-medium text-gray-500">cliente@logmagna.com</span> / <span className="font-medium text-gray-500">logmagna123</span>
            </p>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Ainda não tem conta? <Link href="/add" className="text-[#3f6b4d] font-medium hover:text-[#1a3326]">Criar cadastro</Link>
          </p>
        </div>
      </main>
    </div>
  );
}