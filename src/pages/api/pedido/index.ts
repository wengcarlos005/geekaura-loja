// POST /api/pedido — cria o pedido no Ryzo a partir do carrinho do COOKIE. Do navegador vêm só
// os dados de contato, o endereço e o id do frete escolhido: item, quantidade e preço nunca.
import type { APIRoute } from 'astro';
import { validarEntrega } from '../../../lib/validacao';
import { envDe, erro, falha, gravarCarrinho, json, lerCarrinho, lerJson, limitar, origemValida } from '../../../lib/api';
import { criarPedido } from '../../../lib/ryzo';

export const POST: APIRoute = async ctx => {
  try {
    if (!origemValida(ctx)) return erro('Origem não permitida.', 403);
    if (!limitar(ctx, 'pedido', 8)) return erro('Muitas tentativas seguidas. Espere um minuto.', 429);
    const corpo = await lerJson(ctx.request, 4000);
    const entrega = validarEntrega(corpo?.entrega);
    if (!entrega.ok) return erro(entrega.erro);
    const servico = Number(corpo?.frete?.servico_id);
    if (!Number.isInteger(servico) || servico <= 0) return erro('Escolha uma opção de frete.');

    const itens = await lerCarrinho(ctx);
    if (!itens.length) return erro('Seu carrinho está vazio.', 409);

    const e = entrega.valor;
    const criado = await criarPedido(envDe(ctx), {
      itens, comprador: { nome: e.nome, email: e.email }, frete: { servico_id: servico }, entrega: e,
    });
    await gravarCarrinho(ctx, []);
    return json({ ok: true, codigo: criado.codigo, total: criado.total }, 201);
  } catch (e) {
    if (e instanceof Response) return e;
    return falha(e);
  }
};
