export function brl(valor: number | string | null | undefined): string {
  const num = Number(valor ?? 0);
  if (!Number.isFinite(num)) return 'R$ 0,00';
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatarData(iso?: string | null): string {
  if (!iso) return '—';
  const matchDataSimples = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (matchDataSimples) {
    return `${matchDataSimples[3]}/${matchDataSimples[2]}/${matchDataSimples[1]}`;
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('pt-BR');
}

export function formatarDataExtenso(iso?: string | null): string {
  if (!iso) return '—';
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso.trim()) ? new Date(`${iso.trim()}T12:00:00Z`) : new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function formatarDataHora(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
