// GET devolve o carrinho montado; POST /api/carrinho adiciona, muda quantidade, remove ou limpa. Aceita JSON (fetch) e formulário
// comum (sem JavaScript: redireciona para /carrinho). O cookie guarda só sku e quantidade.
import type { APIRoute } from 'astro';
import { aplicar, lerOperacao } from '../../lib/carrinho';
import { envDe, erro, falha, gravarCarrinho, json, lerCarrinho, lerJson, limitar, origemValida } from '../../lib/api';
import { catalogo, configLoja } from '../../lib/ryzo';
import { montarCarrinho } from '../../lib/carrinhoVisivel';

/** GET /api/carrinho — linhas do carrinho para a gaveta lateral (nome, foto, preço e estoque de hoje). */
export const GET: APIRoute = async ctx => {
  try {
    const itens = await lerCarrinho(ctx);
    const [{ linhas, subtotal, ok }, loja] = await Promise.all([montarCarrinho(envDe(ctx), itens), configLoja(envDe(ctx))]);
    return json({ ok: true, pronto: ok, subtotal, qtd: itens.reduce((s, i) => s + i.qtd, 0), linhas, frete_gratis_acima: loja.frete_gratis_acima });
  } catch (e) {
    return falha(e);
  }
};

export const POST: APIRoute = async ctx => {
  const ehForm = (ctx.request.headers.get('content-type') || '').includes('application/x-www-form-urlencoded');
  const responder = (r: Response) => (ehForm ? ctx.redirect('/carrinho', 303) : r);
  try {
    if (!origemValida(ctx)) return erro('Origem não permitida.', 403);
    if (!limitar(ctx, 'carrinho', 60)) return erro('Muitas alterações seguidas. Espere um instante.', 429);

    let bruto: unknown;
    if (ehForm) {
      const texto = await ctx.request.text();
      if (texto.length > 2000) return erro('Pedido grande demais.', 413);
      bruto = Object.fromEntries(new URLSearchParams(texto));
      (bruto as any).qtd = Number((bruto as any).qtd);
    } else {
      bruto = await lerJson(ctx.request, 2000);
    }
    const op = lerOperacao(bruto);
    if (!op) return responder(erro('Operação inválida.'));

    const atual = await lerCarrinho(ctx);
    const novo = aplicar(atual, op);

    if (op.acao === 'adicionar' || op.acao === 'definir') {
      const itemNovo = novo.find(i => i.sku === op.sku);
      const antes = atual.find(i => i.sku === op.sku)?.qtd ?? 0;
      // Diminuir sempre pode (é como o comprador conserta um item acima do estoque); só aumento confere.
      if (itemNovo && itemNovo.qtd > antes) {
        const variacao = (await catalogo(envDe(ctx))).flatMap(p => p.variacoes).find(v => v.sku === op.sku);
        if (!variacao) return responder(erro('Este produto não está mais à venda.', 404));
        if (variacao.estoque <= 0) return responder(erro('Este modelo esgotou.', 409));
        if (itemNovo.qtd > variacao.estoque) {
          return responder(erro(`Só ${variacao.estoque === 1 ? 'resta 1 unidade' : `restam ${variacao.estoque} unidades`} deste modelo.`, 409));
        }
        if (atual.length >= 30 && !atual.some(i => i.sku === op.sku)) return responder(erro('Carrinho com itens demais (máximo 30).', 409));
      }
    }

    await gravarCarrinho(ctx, novo);
    return responder(json({ ok: true, qtd: novo.reduce((s, i) => s + i.qtd, 0), itens: novo }));
  } catch (e) {
    if (e instanceof Response) return responder(e);
    return responder(falha(e));
  }
};
