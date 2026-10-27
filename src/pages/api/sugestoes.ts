// GET /api/sugestoes?q= — até 6 produtos para a caixa de sugestões da busca do topo.
import type { APIRoute } from 'astro';
import { envDe, erro, falha, json, limitar } from '../../lib/api';
import { buscar, ordenar } from '../../lib/listagem';
import { catalogo } from '../../lib/ryzo';

export const GET: APIRoute = async ctx => {
  try {
    if (!limitar(ctx, 'sugestoes', 120)) return erro('Muitas buscas seguidas. Espere um instante.', 429);
    const q = (ctx.url.searchParams.get('q') || '').trim().slice(0, 80);
    if (q.length < 2) return json({ ok: true, produtos: [] });
    const achados = ordenar(buscar(await catalogo(envDe(ctx)), q), '').slice(0, 6);
    return json({
      ok: true,
      produtos: achados.map(p => ({ slug: p.slug, titulo: p.titulo, categoria: p.categoria, preco: p.preco_a_partir, foto: p.fotos[0] ?? null })),
    });
  } catch (e) {
    return falha(e);
  }
};
