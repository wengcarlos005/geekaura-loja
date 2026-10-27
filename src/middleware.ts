// Cabeçalhos de segurança em toda resposta e CSP com nonce em toda página (ver src/lib/seguranca.ts).
import { defineMiddleware } from 'astro:middleware';
import { CABECALHOS_FIXOS, carimbarNonce, gerarNonce, politica } from './lib/seguranca';

const SEM_CACHE = /^\/(carrinho|checkout|pedido|api)(\/|$)/;

export const onRequest = defineMiddleware(async (ctx, next) => {
  const nonce = gerarNonce();
  ctx.locals.nonce = nonce;
  const resposta = await next();

  const headers = new Headers(resposta.headers);
  for (const [k, v] of Object.entries(CABECALHOS_FIXOS)) headers.set(k, v);
  if (SEM_CACHE.test(ctx.url.pathname)) headers.set('Cache-Control', 'no-store');

  const tipo = headers.get('content-type') || '';
  if (!tipo.includes('text/html')) {
    return new Response(resposta.body, { status: resposta.status, statusText: resposta.statusText, headers });
  }
  headers.set('Content-Security-Policy', politica(nonce, import.meta.env.DEV));
  headers.delete('content-length');
  const html = carimbarNonce(await resposta.text(), nonce);
  return new Response(html, { status: resposta.status, statusText: resposta.statusText, headers });
});
