// GET /api/pedido/:codigo — status do pedido e do pagamento, para a página do pedido acompanhar.
import type { APIRoute } from 'astro';
import { codigoDePedidoValido } from '../../../lib/formato';
import { envDe, erro, falha, json, limitar } from '../../../lib/api';
import { pagamento, pedido } from '../../../lib/ryzo';

export const GET: APIRoute = async ctx => {
  try {
    const codigo = codigoDePedidoValido(ctx.params.codigo);
    if (!codigo) return erro('Pedido não encontrado.', 404);
    if (!limitar(ctx, 'status', 40)) return erro('Muitas consultas seguidas.', 429);
    const env = envDe(ctx);
    const p = await pedido(env, codigo);
    if (!p) return erro('Pedido não encontrado.', 404);
    const pg = p.status === 'aguardando_pagamento' || p.status === 'processando' ? await pagamento(env, codigo) : { pagamento: null, status: p.status };
    return json({ ok: true, pedido: { ...p, status: pg.status ?? p.status }, pagamento: pg.pagamento });
  } catch (e) {
    return falha(e);
  }
};
