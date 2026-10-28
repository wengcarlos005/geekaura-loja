import type { APIRoute } from 'astro';
import { catalogo, modoDemo } from '../../lib/ryzo';
import { envDe } from '../../lib/api';
import { LOJA } from '../../lib/loja';
import { feedGoogle } from '../../lib/feedGoogle';

// Endereço para cadastrar no Merchant Center como "busca programada". Em modo demonstração fica vazio
// de propósito: produto com preço e estoque simulados não pode ir para o Google Shopping.
export const GET: APIRoute = async ctx => {
  const env = envDe(ctx);
  const produtos = modoDemo(env) ? [] : await catalogo(env).catch(() => null);
  if (!produtos) return new Response('Catálogo indisponível', { status: 503, headers: { 'Retry-After': '600' } });
  return new Response(feedGoogle(produtos, LOJA.url, LOJA.nome), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
};
