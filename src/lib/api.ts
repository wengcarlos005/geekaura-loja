// Utilidades das rotas /api/*: resposta JSON, leitura de corpo com teto, origem e limite por IP.
import type { APIContext } from 'astro';
import { COOKIE_CARRINHO, verificar, assinar, type ItemDoCarrinho } from './carrinho';
import { ErroRyzo } from './erros';
import { modoDemo } from './ryzo';

export const MAX_CORPO = 16 * 1024;

export function json(dados: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(dados), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra },
  });
}

export function erro(mensagem: string, status = 400, extra: Record<string, unknown> = {}): Response {
  return json({ ok: false, error: mensagem, ...extra }, status);
}

/** Converte qualquer exceção numa resposta: mensagem do Ryzo passa, o resto vira genérica. */
export function falha(e: unknown): Response {
  if (e instanceof ErroRyzo) return erro(e.message, e.status >= 400 && e.status < 600 ? e.status : 502, e.skus ? { skus: e.skus } : {});
  console.error('erro inesperado', e);
  return erro('Algo deu errado do nosso lado. Tente de novo em instantes.', 500);
}

/** Lê JSON com teto de tamanho. Lança Response pronta quando o corpo não serve. */
export async function lerJson(req: Request, max = MAX_CORPO): Promise<any> {
  if (!(req.headers.get('content-type') || '').includes('application/json')) throw erro('Envie JSON.', 415);
  const declarado = Number(req.headers.get('content-length') || 0);
  if (declarado > max) throw erro('Pedido grande demais.', 413);
  const texto = await req.text();
  if (texto.length > max) throw erro('Pedido grande demais.', 413);
  try { return JSON.parse(texto); } catch { throw erro('JSON inválido.', 400); }
}

/**
 * Rotas que mudam estado só aceitam chamada da própria origem. O Astro já confere Origin em
 * formulário (security.checkOrigin); isto cobre o fetch com JSON, que ele deixa passar.
 */
export function origemValida(ctx: APIContext): boolean {
  const origem = ctx.request.headers.get('origin');
  if (!origem) return ctx.request.headers.get('sec-fetch-site') === 'same-origin';
  return origem === ctx.url.origin;
}

// Limite por IP, em memória do isolate. É o melhor esforço possível sem KV/Durable Object: segura
// laço de script ingênuo, não um ataque distribuído (o Ryzo tem o próprio limite atrás deste).
const janelas = new Map<string, { inicio: number; n: number }>();
export function limitar(ctx: APIContext, balde: string, maximo: number, janelaMs = 60_000): boolean {
  const ip = ctx.request.headers.get('cf-connecting-ip') || ctx.clientAddress || 'local';
  const chave = `${balde}|${ip}`;
  const agora = Date.now();
  const j = janelas.get(chave);
  if (!j || agora - j.inicio > janelaMs) { janelas.set(chave, { inicio: agora, n: 1 }); }
  else if (++j.n > maximo) return false;
  if (janelas.size > 5000) janelas.delete(janelas.keys().next().value as string);
  return true;
}

export function envDe(ctx: { locals: App.Locals }): Env {
  return (ctx.locals.runtime?.env ?? {}) as Env;
}

const SEGREDO_DEMO = 'demo-geekaura-carrinho-nao-usar-em-producao';

/** Segredo do carrinho. Fora do modo demonstração, faltar o segredo é erro de configuração. */
export function segredoDoCarrinho(env: Env): string {
  if (env.CART_SECRET && env.CART_SECRET.length >= 16) return env.CART_SECRET;
  if (modoDemo(env)) return SEGREDO_DEMO;
  throw new ErroRyzo('A loja está em manutenção. Tente de novo em instantes.', 503);
}

export async function lerCarrinho(ctx: { cookies: APIContext['cookies']; locals: App.Locals }): Promise<ItemDoCarrinho[]> {
  return verificar(ctx.cookies.get(COOKIE_CARRINHO)?.value, segredoDoCarrinho(envDe(ctx)));
}

export async function gravarCarrinho(ctx: { cookies: APIContext['cookies']; locals: App.Locals }, itens: ItemDoCarrinho[]) {
  if (!itens.length) { ctx.cookies.delete(COOKIE_CARRINHO, { path: '/' }); return; }
  ctx.cookies.set(COOKIE_CARRINHO, await assinar(itens, segredoDoCarrinho(envDe(ctx))), {
    path: '/', httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30,
  });
}
