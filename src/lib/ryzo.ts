// Cliente da vitrine do Ryzo (/vitrine/v1/*). Roda só no servidor: a chave rzv_ nunca vai ao navegador.
// Sem RYZO_VITRINE_KEY o site entra em modo demonstração e responde com os dados de src/lib/demo.ts.

import * as demo from './demo';
import type { ItemDoCarrinho } from './carrinho';
import { ErroRyzo } from './erros';

export interface Variacao { sku: string; rotulo: string | null; foto: string | null; preco: number; estoque: number; }
export interface ProdutoResumo {
  slug: string; titulo: string; categoria: string; fotos: string[];
  preco_a_partir: number; disponivel: boolean; variacoes: Variacao[];
}
export interface Produto extends ProdutoResumo {
  descricao: string; peso_g: number | null;
  medidas_cm: { comprimento: number; largura: number; altura: number } | null;
}
export interface ItemDisponivel { sku: string; qtd: number; a_venda: boolean; preco: number; disponivel: number; ok: boolean; }
export interface Disponibilidade { ok: boolean; itens: ItemDisponivel[]; subtotal: number; }
export interface OpcaoFrete { id: number; nome: string; transportadora: string; preco: number; prazo_dias: number; }
export interface Entrega {
  nome: string; cpf: string; telefone: string; email: string; cep: string; logradouro: string;
  numero: string; complemento: string; bairro: string; cidade: string; uf: string;
}
export interface NovoPedido {
  itens: ItemDoCarrinho[]; comprador: { nome: string; email: string };
  frete?: { servico_id: number }; entrega?: Entrega;
}
export interface PedidoCriado {
  codigo: string; subtotal: number; frete: number; total: number;
  envio: { servico: string; transportadora: string; prazo_dias: number } | null;
}
export type StatusPedido = 'aguardando_pagamento' | 'processando' | 'pago' | 'sem_estoque' | 'cancelado';
export interface Pedido {
  codigo: string; status: StatusPedido; total: number; frete: number; criado_em: string;
  itens: { sku: string; titulo: string; rotulo: string | null; qtd: number; preco: number }[];
  envio: {
    servico: string; transportadora: string; prazo_dias: number;
    status: string | null; rastreio: string | null; status_transportadora: string | null;
  } | null;
}
export type MetodoPagamento = 'pix' | 'boleto' | 'cartao';
export interface Pagamento {
  id: string; metodo: MetodoPagamento; status: string; detalhe: string | null; expira_em: string | null;
  pix?: { qr: string; qr_base64: string | null }; boleto?: { url: string; linha: string };
}
export interface ConfigPagamento { public_key: string; ambiente: 'teste' | 'producao'; metodos: MetodoPagamento[]; }
export interface PedidoDePagamento {
  metodo: MetodoPagamento; pagador: { email: string; nome: string; cpf: string };
  cartao?: { token: string; payment_method_id: string; installments: number };
}

export { ErroRyzo };

// ---------- Mapeamento: tudo que vem de fora é conferido campo a campo ----------

const num = (v: unknown, padrao = 0) => { const n = Number(v); return Number.isFinite(n) ? n : padrao; };
const str = (v: unknown, max = 500) => (typeof v === 'string' ? v.slice(0, max) : '');
const strOuNulo = (v: unknown, max = 500) => (typeof v === 'string' && v.trim() ? v.slice(0, max) : null);
/** Só aceita https: uma URL "javascript:" ou "data:" vinda do catálogo nunca vira src. */
export const urlSegura = (v: unknown): string | null => {
  if (typeof v !== 'string') return null;
  try { const u = new URL(v); return u.protocol === 'https:' ? u.href : null; } catch { return null; }
};

export function mapearVariacao(v: any): Variacao | null {
  const sku = str(v?.sku, 80).trim();
  const preco = num(v?.preco, NaN);
  if (!sku || !(preco > 0)) return null;
  return { sku, rotulo: strOuNulo(v?.rotulo, 60), foto: urlSegura(v?.foto), preco, estoque: Math.max(0, Math.floor(num(v?.estoque))) };
}

export function mapearProduto(p: any): Produto | null {
  const slug = str(p?.slug, 80);
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null;
  const variacoes = (Array.isArray(p?.variacoes) ? p.variacoes : []).map(mapearVariacao).filter(Boolean) as Variacao[];
  const precos = variacoes.map(v => v.preco);
  const m = p?.medidas_cm;
  return {
    slug,
    titulo: str(p?.titulo, 200) || slug,
    categoria: str(p?.categoria, 80),
    descricao: str(p?.descricao, 8000),
    fotos: (Array.isArray(p?.fotos) ? p.fotos : []).map(urlSegura).filter(Boolean).slice(0, 12) as string[],
    preco_a_partir: num(p?.preco_a_partir, NaN) > 0 ? num(p.preco_a_partir) : (precos.length ? Math.min(...precos) : 0),
    disponivel: typeof p?.disponivel === 'boolean' ? p.disponivel : variacoes.some(v => v.estoque > 0),
    variacoes,
    peso_g: num(p?.peso_g, NaN) > 0 ? num(p.peso_g) : null,
    medidas_cm: m && num(m.comprimento) > 0 ? { comprimento: num(m.comprimento), largura: num(m.largura), altura: num(m.altura) } : null,
  };
}

export function mapearPedido(p: any): Pedido | null {
  const codigo = str(p?.codigo, 30);
  if (!/^SITE-[A-Z0-9]{6,20}$/.test(codigo)) return null;
  const STATUS: StatusPedido[] = ['aguardando_pagamento', 'processando', 'pago', 'sem_estoque', 'cancelado'];
  const e = p?.envio;
  return {
    codigo,
    status: STATUS.includes(p?.status) ? p.status : 'processando',
    total: num(p?.total), frete: num(p?.frete), criado_em: str(p?.criado_em, 40),
    itens: (Array.isArray(p?.itens) ? p.itens : []).map((i: any) => ({
      sku: str(i?.sku, 80), titulo: str(i?.titulo, 200) || str(i?.sku, 80), rotulo: strOuNulo(i?.rotulo, 60),
      qtd: Math.max(0, Math.floor(num(i?.qtd))), preco: num(i?.preco),
    })),
    envio: e ? {
      servico: str(e.servico, 80), transportadora: str(e.transportadora, 80), prazo_dias: num(e.prazo_dias),
      status: strOuNulo(e.status, 40), rastreio: strOuNulo(e.rastreio, 60), status_transportadora: strOuNulo(e.status_transportadora, 120),
    } : null,
  };
}

export function mapearPagamento(p: any): Pagamento | null {
  if (!p || typeof p !== 'object') return null;
  const metodo = (['pix', 'boleto', 'cartao'] as const).find(m => m === p.metodo);
  if (!metodo) return null;
  const qrB64 = typeof p?.pix?.qr_base64 === 'string' && /^[A-Za-z0-9+/=]{20,200000}$/.test(p.pix.qr_base64) ? p.pix.qr_base64 : null;
  const boletoUrl = urlSegura(p?.boleto?.url);
  return {
    id: str(p.id, 60), metodo, status: str(p.status, 30), detalhe: strOuNulo(p.detalhe, 200), expira_em: strOuNulo(p.expira_em, 40),
    pix: p.pix ? { qr: str(p.pix.qr, 1000), qr_base64: qrB64 } : undefined,
    boleto: p.boleto && boletoUrl ? { url: boletoUrl, linha: str(p.boleto.linha, 80) } : undefined,
  };
}

// ---------- Transporte ----------

const TIMEOUT_MS = 8000;
const CACHE_MS = 60_000;
const cache = new Map<string, { expira: number; valor: unknown }>();

/** Limpa o cache em memória (usado nos testes). */
export function limparCache() { cache.clear(); }

/** Cabeçalho com que o site repassa ao Ryzo a sessão do cliente logado (ver src/lib/conta.ts). */
export const CABECALHO_SESSAO = 'X-Cliente-Sessao';

export async function chamar(
  env: Env, metodo: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE', caminho: string, corpo?: unknown,
  opc: { sessao?: string | null; repassar401?: boolean } = {},
): Promise<any> {
  const sessao = opc.sessao;
  const base = (env.RYZO_URL || '').replace(/\/+$/, '');
  if (!/^https:\/\//.test(base)) throw new ErroRyzo('A loja está em manutenção. Tente de novo em instantes.', 503);
  let r: Response;
  try {
    r = await fetch(`${base}/vitrine/v1${caminho}`, {
      method: metodo,
      headers: {
        Authorization: `Bearer ${env.RYZO_VITRINE_KEY}`,
        Accept: 'application/json',
        ...(corpo !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(sessao ? { [CABECALHO_SESSAO]: sessao } : {}),
      },
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new ErroRyzo('A loja demorou a responder. Tente de novo em instantes.', 504);
  }
  let dados: any = null;
  try { dados = await r.json(); } catch { /* corpo vazio ou não JSON */ }
  if (!r.ok || !dados || dados.ok === false) {
    const msg = typeof dados?.error === 'string' ? dados.error.slice(0, 300) : 'Não foi possível falar com a loja agora.';
    // 401 é configuração nossa (chave da vitrine), não do comprador: não repassa o texto técnico.
    // As rotas de conta de cliente pedem o repasse, porque lá o 401 é senha errada ou sessão vencida.
    if (r.status === 401 && (!opc.repassar401 || /vitrine/i.test(msg))) throw new ErroRyzo('A loja está em manutenção. Tente de novo em instantes.', 503);
    const skus = Array.isArray(dados?.skus) ? dados.skus.filter((s: unknown) => typeof s === 'string').slice(0, 30) : undefined;
    throw new ErroRyzo(msg, r.status >= 400 ? r.status : 502, skus);
  }
  return dados;
}

async function comCache<T>(chave: string, gerar: () => Promise<T>): Promise<T> {
  const agora = Date.now();
  const hit = cache.get(chave);
  if (hit && hit.expira > agora) return hit.valor as T;
  const valor = await gerar();
  cache.set(chave, { expira: agora + CACHE_MS, valor });
  if (cache.size > 300) cache.delete(cache.keys().next().value as string);
  return valor;
}

// ---------- API pública do módulo ----------

export function modoDemo(env: Env): boolean { return !env.RYZO_VITRINE_KEY; }

export async function catalogo(env: Env): Promise<ProdutoResumo[]> {
  if (modoDemo(env)) return demo.catalogo();
  return comCache(`${env.RYZO_URL}|catalogo`, async () => {
    const d = await chamar(env, 'GET', '/catalogo');
    return (Array.isArray(d.produtos) ? d.produtos : []).map(mapearProduto).filter(Boolean) as Produto[];
  });
}

export async function produto(env: Env, slug: string): Promise<Produto | null> {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null;
  if (modoDemo(env)) return demo.produto(slug);
  return comCache(`${env.RYZO_URL}|produto|${slug}`, async () => {
    try { return mapearProduto((await chamar(env, 'GET', `/produto/${slug}`)).produto); }
    catch (e) { if (e instanceof ErroRyzo && e.status === 404) return null; throw e; }
  });
}

export async function disponibilidade(env: Env, itens: ItemDoCarrinho[]): Promise<Disponibilidade> {
  if (modoDemo(env)) return demo.disponibilidade(itens);
  const d = await chamar(env, 'POST', '/disponibilidade', { itens });
  return {
    ok: !!d.ok, subtotal: num(d.subtotal),
    itens: (Array.isArray(d.itens) ? d.itens : []).map((i: any) => ({
      sku: str(i?.sku, 80), qtd: num(i?.qtd), a_venda: !!i?.a_venda, preco: num(i?.preco), disponivel: num(i?.disponivel), ok: !!i?.ok,
    })),
  };
}

export async function frete(env: Env, itens: ItemDoCarrinho[], cep: string): Promise<OpcaoFrete[]> {
  if (modoDemo(env)) return demo.frete(itens, cep);
  const d = await chamar(env, 'POST', '/frete', { itens, cep });
  return (Array.isArray(d.opcoes) ? d.opcoes : []).map((o: any) => ({
    id: num(o?.id), nome: str(o?.nome, 80), transportadora: str(o?.transportadora, 80), preco: num(o?.preco), prazo_dias: num(o?.prazo_dias),
  })).filter((o: OpcaoFrete) => o.id > 0 && o.preco >= 0);
}

export async function criarPedido(env: Env, novo: NovoPedido, sessaoCliente?: string | null): Promise<PedidoCriado> {
  if (modoDemo(env)) return demo.criarPedido(novo);
  const d = await chamar(env, 'POST', '/pedidos', novo, { sessao: sessaoCliente });
  return {
    codigo: str(d.codigo, 30), subtotal: num(d.subtotal), frete: num(d.frete), total: num(d.total),
    envio: d.envio ? { servico: str(d.envio.servico, 80), transportadora: str(d.envio.transportadora, 80), prazo_dias: num(d.envio.prazo_dias) } : null,
  };
}

export async function pedido(env: Env, codigo: string): Promise<Pedido | null> {
  if (modoDemo(env)) return demo.pedido(codigo);
  try { return mapearPedido((await chamar(env, 'GET', `/pedidos/${codigo}`)).pedido); }
  catch (e) { if (e instanceof ErroRyzo && e.status === 404) return null; throw e; }
}

export async function configPagamento(env: Env): Promise<ConfigPagamento> {
  if (modoDemo(env)) return demo.configPagamento();
  return comCache(`${env.RYZO_URL}|pagamento-config`, async () => {
    const d = await chamar(env, 'GET', '/pagamento/config');
    return {
      public_key: str(d.public_key, 200), ambiente: d.ambiente === 'producao' ? 'producao' : 'teste',
      metodos: (Array.isArray(d.metodos) ? d.metodos : []).filter((m: unknown) => m === 'pix' || m === 'boleto' || m === 'cartao'),
    };
  });
}

export async function pagar(env: Env, codigo: string, corpo: PedidoDePagamento): Promise<{ pagamento: Pagamento | null; status: StatusPedido | null }> {
  if (modoDemo(env)) return demo.pagar(codigo, corpo);
  const d = await chamar(env, 'POST', `/pedidos/${codigo}/pagamento`, corpo);
  return { pagamento: mapearPagamento(d.pagamento), status: d.pedido?.status ?? null };
}

export async function pagamento(env: Env, codigo: string): Promise<{ pagamento: Pagamento | null; status: StatusPedido | null }> {
  if (modoDemo(env)) return demo.pagamento(codigo);
  const d = await chamar(env, 'GET', `/pedidos/${codigo}/pagamento`);
  return { pagamento: mapearPagamento(d.pagamento), status: d.pedido?.status ?? null };
}
