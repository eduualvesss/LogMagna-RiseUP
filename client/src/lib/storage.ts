import type { Session, User } from '@/types';

const STORAGE_KEY = 'logmagna.session';

export function isValidUser(u: unknown): u is User {
  if (!u || typeof u !== 'object') return false;
  const obj = u as Record<string, unknown>;
  return (
    typeof obj.id_usuario === 'string' &&
    typeof obj.nome_completo === 'string' &&
    typeof obj.email_corporativo === 'string' &&
    typeof obj.perfil === 'string'
  );
}

export function saveSession(session: Session, remember: boolean): void {
  clearSession();
  if (typeof window === 'undefined') return;
  (remember ? localStorage : sessionStorage).setItem(STORAGE_KEY, JSON.stringify(session));
}

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<Session>;
    if (typeof parsed.token !== 'string' || !parsed.token || !isValidUser(parsed.user)) {
      clearSession();
      return null;
    }
    return { token: parsed.token, user: parsed.user };
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
}
