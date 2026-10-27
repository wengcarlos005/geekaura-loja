// Carrinho num cookie assinado (HMAC-SHA256). Guarda SÓ sku e quantidade: preço, nome e estoque
// vêm sempre do Ryzo na hora de mostrar e de fechar o pedido, então adulterar o cookie não muda
// valor nenhum — e a assinatura impede até isso.

export interface ItemDoCarrinho { sku: string; qtd: number; }

export const COOKIE_CARRINHO = 'ga_carrinho';
export const MAX_ITENS = 30;
export const MAX_QTD = 99;
const RE_SKU = /^[A-Za-z0-9._\-]{1,80}$/;

const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function deB64url(s: string): Uint8Array<ArrayBuffer> | null {
  try {
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4));
    return Uint8Array.from(bin, c => c.charCodeAt(0));
  } catch { return null; }
}

async function chave(segredo: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', enc.encode(segredo), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

/** Normaliza: SKUs válidos, quantidades inteiras de 1 a 99, repetidos somados, no máximo 30 itens. */
export function normalizar(bruto: unknown): ItemDoCarrinho[] {
  if (!Array.isArray(bruto)) return [];
  const porSku = new Map<string, number>();
  for (const it of bruto) {
    const sku = typeof it?.sku === 'string' ? it.sku.trim() : typeof it?.s === 'string' ? it.s.trim() : '';
    const qtd = Number(it?.qtd ?? it?.q);
    if (!RE_SKU.test(sku) || !Number.isInteger(qtd) || qtd < 1) continue;
    porSku.set(sku, Math.min(MAX_QTD, (porSku.get(sku) || 0) + qtd));
  }
  return [...porSku].slice(0, MAX_ITENS).map(([sku, qtd]) => ({ sku, qtd }));
}

export async function assinar(itens: ItemDoCarrinho[], segredo: string): Promise<string> {
  const corpo = b64url(enc.encode(JSON.stringify(normalizar(itens).map(i => ({ s: i.sku, q: i.qtd })))));
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', await chave(segredo), enc.encode(corpo)));
  return `${corpo}.${b64url(sig)}`;
}

/** Cookie válido → itens; ausente, malformado ou adulterado → carrinho vazio (nunca lança). */
export async function verificar(valor: string | undefined | null, segredo: string): Promise<ItemDoCarrinho[]> {
  if (!valor || valor.length > 4000) return [];
  const [corpo, sigTxt, sobra] = valor.split('.');
  if (!corpo || !sigTxt || sobra !== undefined) return [];
  const sig = deB64url(sigTxt);
  if (!sig) return [];
  // verify() compara em tempo constante.
  const ok = await crypto.subtle.verify('HMAC', await chave(segredo), sig, enc.encode(corpo));
  if (!ok) return [];
  const json = deB64url(corpo);
  if (!json) return [];
  try { return normalizar(JSON.parse(new TextDecoder().decode(json))); } catch { return []; }
}

export type Operacao =
  | { acao: 'adicionar'; sku: string; qtd: number }
  | { acao: 'definir'; sku: string; qtd: number }
  | { acao: 'remover'; sku: string }
  | { acao: 'limpar' };

export function aplicar(itens: ItemDoCarrinho[], op: Operacao): ItemDoCarrinho[] {
  if (op.acao === 'limpar') return [];
  const lista = itens.filter(i => i.sku !== op.sku);
  if (op.acao === 'remover') return lista;
  const atual = itens.find(i => i.sku === op.sku)?.qtd ?? 0;
  const nova = op.acao === 'adicionar' ? atual + op.qtd : op.qtd;
  if (nova < 1) return lista;
  return normalizar([...itens.filter(i => i.sku !== op.sku), { sku: op.sku, qtd: Math.min(MAX_QTD, nova) }]);
}

/** Lê e valida a operação vinda do navegador. */
export function lerOperacao(bruto: any): Operacao | null {
  const acao = bruto?.acao;
  if (acao === 'limpar') return { acao };
  const sku = typeof bruto?.sku === 'string' ? bruto.sku.trim() : '';
  if (!RE_SKU.test(sku)) return null;
  if (acao === 'remover') return { acao, sku };
  const qtd = Number(bruto?.qtd);
  if ((acao === 'adicionar' || acao === 'definir') && Number.isInteger(qtd) && qtd >= (acao === 'definir' ? 0 : 1) && qtd <= MAX_QTD) {
    return { acao, sku, qtd };
  }
  return null;
}
