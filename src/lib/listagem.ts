// Busca, faixa de preço e ordenação sobre o catálogo (pequeno: tudo em memória).
import type { ProdutoResumo } from './ryzo';
import { FAIXAS } from './loja';

const normal = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Todas as palavras precisam aparecer no título, na categoria ou no nome de algum modelo. */
export function buscar(produtos: ProdutoResumo[], termo: string): ProdutoResumo[] {
  const palavras = normal(termo).split(/[^a-z0-9]+/).filter(p => p.length >= 2);
  if (!palavras.length) return [];
  return produtos.filter(p => {
    const alvo = normal([p.titulo, p.categoria, ...p.variacoes.map(v => v.rotulo ?? '')].join(' '));
    return palavras.every(w => alvo.includes(w));
  });
}

export function naFaixa(produtos: ProdutoResumo[], slug: string): ProdutoResumo[] {
  const f = FAIXAS.find(x => x.slug === slug);
  if (!f) return produtos;
  return produtos.filter(p => p.preco_a_partir >= f.min && p.preco_a_partir < f.max);
}

/** Esgotados vão para o fim em qualquer ordem. */
export function ordenar(produtos: ProdutoResumo[], ordem: string): ProdutoResumo[] {
  const lista = [...produtos];
  if (ordem === 'menor') lista.sort((a, b) => a.preco_a_partir - b.preco_a_partir);
  if (ordem === 'maior') lista.sort((a, b) => b.preco_a_partir - a.preco_a_partir);
  return lista.sort((a, b) => Number(b.disponivel) - Number(a.disponivel));
}
