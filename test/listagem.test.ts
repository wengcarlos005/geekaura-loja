import { describe, expect, it } from 'vitest';
import { buscar, naFaixa, ordenar } from '../src/lib/listagem';
import { catalogo } from '../src/lib/demo';

describe('busca no catálogo', () => {
  const todos = catalogo();
  it('ignora acento e caixa e procura nos modelos', () => {
    expect(buscar(todos, 'ESTACAO espacial').map(p => p.slug)).toEqual(['estacao-espacial-inblox-blocos-de-montar']);
    expect(buscar(todos, 'trenó').map(p => p.slug)).toEqual(['micro-blocos-de-natal']);
  });
  it('termo vazio ou de uma letra não devolve nada', () => {
    expect(buscar(todos, ' a ')).toEqual([]);
  });
  it('faixa de preço e ordenação com esgotado no fim', () => {
    // O catálogo de demonstração cresce: confere a regra da faixa, não a lista exata.
    for (const p of naFaixa(todos, 'acima-de-100')) expect(p.preco_a_partir).toBeGreaterThanOrEqual(100);
    const meio = naFaixa(todos, '60-a-100');
    expect(meio.map(p => p.slug)).toContain('navio-porta-avioes-8-em-1-554-pecas');
    for (const p of meio) expect(p.preco_a_partir >= 60 && p.preco_a_partir < 100).toBe(true);
    const lista = ordenar([{ ...todos[0], disponivel: false, preco_a_partir: 1 }, todos[1], todos[2]], 'menor');
    expect(lista[2].disponivel).toBe(false);
    expect(lista[0].preco_a_partir).toBeLessThanOrEqual(lista[1].preco_a_partir);
  });
});
