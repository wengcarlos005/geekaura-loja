// Formatação e validação compartilhadas por páginas, rotas de API e testes. Nada aqui toca rede.

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** R$ 1.234,56 — com espaço comum (o Intl usa espaço fino, que quebra comparação e copia mal). */
export function precoBRL(valor: number): string {
  if (!Number.isFinite(valor)) return '—';
  return BRL.format(valor).replace(/\s/g, ' ');
}

export function somenteDigitos(v: unknown): string {
  return String(v ?? '').replace(/\D/g, '');
}

/** CEP com 8 dígitos, devolvido só com números. */
export function cepValido(v: unknown): string | null {
  const d = somenteDigitos(v);
  return /^\d{8}$/.test(d) && !/^0{8}$/.test(d) ? d : null;
}

export function cepFormatado(cep: string): string {
  return cep.length === 8 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep;
}

/** CPF com dígitos verificadores conferidos; devolvido só com números. */
export function cpfValido(v: unknown): string | null {
  const c = somenteDigitos(v);
  if (!/^\d{11}$/.test(c) || /^(\d)\1{10}$/.test(c)) return null;
  for (const n of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += Number(c[i]) * (n + 1 - i);
    const dv = ((soma * 10) % 11) % 10;
    if (dv !== Number(c[n])) return null;
  }
  return c;
}

/** Telefone com DDD: 10 ou 11 dígitos. */
export function telefoneValido(v: unknown): string | null {
  const d = somenteDigitos(v);
  return /^[1-9]\d(9\d{8}|[2-8]\d{7})$/.test(d) ? d : null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export function emailValido(v: unknown): string | null {
  const s = typeof v === 'string' ? v.trim().toLowerCase() : '';
  return s.length <= 120 && EMAIL_RE.test(s) ? s : null;
}

/** Texto livre com teto de tamanho e espaços normalizados; vazio vira ''. */
export function texto(v: unknown, max: number): string {
  const s = typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '';
  return s.slice(0, max);
}

/** Slug igual ao do Ryzo: minúsculas, sem acento, só letras, números e hífen. */
export function slugificar(v: unknown): string {
  return String(v ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR',
  'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'] as const;

export function ufValida(v: unknown): string | null {
  const s = String(v ?? '').trim().toUpperCase();
  return (UFS as readonly string[]).includes(s) ? s : null;
}

/** "SITE-" + 6 a 20 caracteres, igual ao formato que o Ryzo aceita nas rotas. */
export function codigoDePedidoValido(v: unknown): string | null {
  const s = String(v ?? '').trim().toUpperCase();
  return /^SITE-[A-Z0-9]{6,20}$/.test(s) ? s : null;
}
