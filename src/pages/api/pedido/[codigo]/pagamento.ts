// POST /api/pedido/:codigo/pagamento — escolhe Pix, boleto ou cartão. O valor é o do pedido no
// Ryzo; daqui só sai o método, o pagador e, no cartão, o token que o SDK do Mercado Pago gerou
// (o número do cartão nunca passa por este servidor).
import type { APIRoute } from 'astro';
import { codigoDePedidoValido } from '../../../../lib/formato';
import { validarPagamento } from '../../../../lib/validacao';
import { envDe, erro, falha, json, lerJson, limitar, origemValida } from '../../../../lib/api';
import { pagar } from '../../../../lib/ryzo';

export const POST: APIRoute = async ctx => {
  try {
    if (!origemValida(ctx)) return erro('Origem não permitida.', 403);
    const codigo = codigoDePedidoValido(ctx.params.codigo);
    if (!codigo) return erro('Pedido não encontrado.', 404);
    if (!limitar(ctx, 'pagamento', 6)) return erro('Muitas tentativas seguidas. Espere um minuto.', 429);
    const v = validarPagamento(await lerJson(ctx.request, 4000));
    if (!v.ok) return erro(v.erro);
    const r = await pagar(envDe(ctx), codigo, v.valor);
    return json({ ok: true, pagamento: r.pagamento, status: r.status }, 201);
  } catch (e) {
    if (e instanceof Response) return e;
    return falha(e);
  }
};
