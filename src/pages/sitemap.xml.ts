import type { APIRoute } from 'astro';
import { catalogo } from '../lib/ryzo';
import { envDe } from '../lib/api';
import { categoriasDoCatalogo, LOJA } from '../lib/loja';

const escapar = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const GET: APIRoute = async ctx => {
  const produtos = await catalogo(envDe(ctx)).catch(() => []);
  const caminhos = [
    '/', ...categoriasDoCatalogo(produtos).map(c => `/categoria/${c.slug}`),
    ...produtos.map(p => `/produto/${p.slug}`),
    '/sobre', '/contato', '/ajuda', '/frete-e-prazos', '/trocas-e-devolucoes', '/privacidade', '/termos',
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${caminhos
    .map(c => `  <url><loc>${escapar(new URL(c, LOJA.url).href)}</loc></url>`).join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
};
