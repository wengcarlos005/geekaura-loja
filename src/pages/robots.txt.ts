import type { APIRoute } from 'astro';
import { modoDemo } from '../lib/ryzo';
import { envDe } from '../lib/api';

// Em modo demonstração (sem chave do Ryzo) o site inteiro fica fora dos buscadores.
export const GET: APIRoute = ctx => {
  const corpo = modoDemo(envDe(ctx))
    ? 'User-agent: *\nDisallow: /\n'
    : ['User-agent: *', 'Disallow: /api/', 'Disallow: /carrinho', 'Disallow: /checkout', 'Disallow: /pedido', 'Disallow: /busca', '', `Sitemap: ${new URL('/sitemap.xml', ctx.url.origin).href}`, ''].join('\n');
  return new Response(corpo, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
};
