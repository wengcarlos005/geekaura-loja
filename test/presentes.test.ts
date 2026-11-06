import { describe, expect, it } from 'vitest';
import { PRESENTES, produtosDoPresente, presentesComProdutos } from '../src/lib/presentes';
import type { ProdutoResumo } from '../src/lib/ryzo';

const p = (slug: string, preco: number, categoria = 'Blocos de montar', disponivel = true, foto = true): ProdutoResumo => ({
  slug, titulo: slug, categoria, fotos: foto ? ['https://img/' + slug] : [], preco_a_partir: preco, disponivel, variacoes: [],
});
const pagina = (slug: string) => PRESENTES.find(x => x.slug === slug)!;

describe('páginas de presente', () => {
  const catalogo = [p('a', 19.9), p('b', 30), p('c', 30.9), p('esgotado', 10, 'Blocos de montar', false), p('sem-foto', 12, 'Blocos de montar', true, false), p('enfeite', 59.9, 'Natal'), p('uno', 25, 'Jogos de cartas')];

  it('até R$ 30 inclui o limite, tira esgotado e sem foto, e vem do mais barato', () => {
    expect(produtosDoPresente(pagina('amigo-secreto-ate-30'), catalogo).map(x => x.slug)).toEqual(['a', 'uno', 'b']);
  });

  it('Natal põe a categoria Natal na frente', () => {
    expect(produtosDoPresente(pagina('presentes-de-natal'), catalogo)[0].slug).toBe('enfeite');
  });

  it('página com poucos produtos não entra no índice nem no sitemap', () => {
    expect(presentesComProdutos(catalogo).map(x => x.slug)).toEqual(['amigo-secreto-ate-50', 'presentes-ate-100', 'presentes-de-natal']);
  });
});
