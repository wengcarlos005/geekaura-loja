// POST /api/frete — cota o frete no Ryzo (que fala com o Melhor Envio). Recebe itens e CEP; os itens
// podem vir do carrinho (checkout) ou de um produto só (página do produto).
import type { APIRoute } from 'astro';
import { normalizar } from '../../lib/carrinho';
import { cepValido } from '../../lib/formato';
import { envDe, erro, falha, json, lerCarrinho, lerJson, limitar, origemValida } from '../../lib/api';
import { frete } from '../../lib/ryzo';

export const POST: APIRoute = async ctx => {
  try {
    if (!origemValida(ctx)) return erro('Origem não permitida.', 403);
    if (!limitar(ctx, 'frete', 20)) return erro('Muitas cotações seguidas. Espere um instante.', 429);
    const corpo = await lerJson(ctx.request, 4000);
    const cep = cepValido(corpo?.cep);
    if (!cep) return erro('CEP inválido.');
    const itens = corpo?.carrinho === true ? await lerCarrinho(ctx) : normalizar(corpo?.itens);
    if (!itens.length) return erro('Carrinho vazio.');
    return json({ ok: true, cep, opcoes: await frete(envDe(ctx), itens, cep) });
  } catch (e) {
    if (e instanceof Response) return e;
    return falha(e);
  }
};
