// Valor JSON assinado com HMAC-SHA256 para guardar em cookie. Quem lê de volta recebe o objeto só
// se a assinatura bater; cookie ausente, adulterado ou grande demais vira null (nunca lança).

const enc = new TextEncoder();

export function b64url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function deB64url(s: string): Uint8Array<ArrayBuffer> | null {
  try {
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4));
    return Uint8Array.from(bin, c => c.charCodeAt(0));
  } catch { return null; }
}

async function chave(segredo: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', enc.encode(segredo), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

/** O contexto entra na assinatura: um cookie de carrinho nunca vale como cookie de conta. */
export async function assinarJson(valor: unknown, segredo: string, contexto: string): Promise<string> {
  const corpo = b64url(enc.encode(JSON.stringify(valor)));
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', await chave(segredo), enc.encode(`${contexto}.${corpo}`)));
  return `${corpo}.${b64url(sig)}`;
}

export async function verificarJson<T = unknown>(valor: string | undefined | null, segredo: string, contexto: string): Promise<T | null> {
  if (!valor || valor.length > 3800) return null;
  const [corpo, sigTxt, sobra] = valor.split('.');
  if (!corpo || !sigTxt || sobra !== undefined) return null;
  const sig = deB64url(sigTxt);
  if (!sig) return null;
  // verify() compara em tempo constante.
  if (!(await crypto.subtle.verify('HMAC', await chave(segredo), sig, enc.encode(`${contexto}.${corpo}`)))) return null;
  const bytes = deB64url(corpo);
  if (!bytes) return null;
  try { return JSON.parse(new TextDecoder().decode(bytes)) as T; } catch { return null; }
}
