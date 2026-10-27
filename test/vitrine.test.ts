import { describe, expect, it } from 'vitest';
import { embaralhar, escolherDestaques, sementeDoPeriodo } from '../src/lib/vitrine';
import type { ProdutoResumo } from '../src/lib/ryzo';

const prod = (slug: string, categoria: string, extra: Partial<ProdutoResumo> = {}): ProdutoResumo => ({
  slug, titulo: slug, categoria, fotos: ['https://img/x.jpg'], preco_a_partir: 10, disponivel: true, variacoes: [], ...extra,
});
const catalogo = [
  ...Array.from({ length: 10 }, (_, i) => prod(`bloco-${i}`, 'Blocos')),
  ...Array.from({ length: 3 }, (_, i) => prod(`carta-${i}`, 'Cartas')),
  prod('natal-0', 'Natal'),
  prod('sem-foto', 'Natal', { fotos: [] }),
  prod('esgotado', 'Cartas', { disponivel: false }),
];

describe('destaques da vitrine', () => {
  it('intercala categorias: as primeiras posições têm uma de cada', () => {
    const d = escolherDestaques(catalogo, 6, 42);
    expect(new Set(d.slice(0, 3).map(p => p.categoria)).size).toBe(3);
  });
  it('não mostra esgotado, produto sem foto nem o que já está em outra fileira', () => {
    const d = escolherDestaques(catalogo, 50, 1, new Set(['bloco-0']));
    const slugs = d.map(p => p.slug);
    expect(slugs).not.toContain('sem-foto');
    expect(slugs).not.toContain('esgotado');
    expect(slugs).not.toContain('bloco-0');
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.length).toBe(13);
  });
  it('mesma semente, mesma vitrine; outra semente, outra ordem', () => {
    const a = escolherDestaques(catalogo, 8, 7).map(p => p.slug);
    expect(escolherDestaques(catalogo, 8, 7).map(p => p.slug)).toEqual(a);
    const outras = [8, 9, 10, 11].map(s => escolherDestaques(catalogo, 8, s).map(p => p.slug).join());
    expect(outras.some(o => o !== a.join())).toBe(true);
  });
  it('a semente muda a cada 6 horas', () => {
    const t = Date.UTC(2026, 9, 27, 15, 0);
    expect(sementeDoPeriodo(t)).toBe(sementeDoPeriodo(t + 60 * 60_000));
    expect(sementeDoPeriodo(t + 6 * 3_600_000)).toBe(sementeDoPeriodo(t) + 1);
  });
  it('embaralhar mantém os itens', () => {
    expect(embaralhar([1, 2, 3, 4, 5], 3).sort()).toEqual([1, 2, 3, 4, 5]);
  });
});
