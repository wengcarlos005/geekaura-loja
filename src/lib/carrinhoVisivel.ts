// Junta o carrinho do cookie (sku + qtd) com o que o Ryzo diz hoje (preço, estoque) e com o catálogo
// (nome, foto, link). É o que carrinho e checkout mostram.
import type { ItemDoCarrinho } from './carrinho';
import { catalogo, disponibilidade, type Disponibilidade } from './ryzo';

export interface LinhaDoCarrinho {
  sku: string; qtd: number; preco: number; disponivel: number; ok: boolean; a_venda: boolean;
  titulo: string; rotulo: string | null; foto: string | null; slug: string | null;
}

export async function montarCarrinho(env: Env, itens: ItemDoCarrinho[]): Promise<{ linhas: LinhaDoCarrinho[]; subtotal: number; ok: boolean }> {
  if (!itens.length) return { linhas: [], subtotal: 0, ok: false };
  const [disp, produtos] = await Promise.all([disponibilidade(env, itens), catalogo(env)]);
  const porSku = new Map(produtos.flatMap(p => p.variacoes.map(v => [v.sku, { p, v }] as const)));
  const linhas = itens.map(it => {
    const d: Disponibilidade['itens'][number] | undefined = disp.itens.find(x => x.sku === it.sku);
    const achado = porSku.get(it.sku);
    return {
      sku: it.sku, qtd: it.qtd,
      preco: d?.preco ?? 0, disponivel: d?.disponivel ?? 0, ok: !!d?.ok, a_venda: !!d?.a_venda,
      titulo: achado?.p.titulo ?? 'Produto indisponível', rotulo: achado?.v.rotulo ?? null,
      foto: achado?.v.foto ?? achado?.p.fotos[0] ?? null, slug: achado?.p.slug ?? null,
    };
  });
  return { linhas, subtotal: disp.subtotal, ok: disp.ok && linhas.every(l => l.ok) };
}
