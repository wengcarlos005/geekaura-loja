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
    expect(naFaixa(todos, 'acima-de-100')).toEqual([]);
    expect(naFaixa(todos, '60-a-100').map(p => p.preco_a_partir)).toEqual([83.9]);
    const lista = ordenar([{ ...todos[0], disponivel: false, preco_a_partir: 1 }, todos[1], todos[2]], 'menor');
    expect(lista[2].disponivel).toBe(false);
    expect(lista[0].preco_a_partir).toBeLessThanOrEqual(lista[1].preco_a_partir);
  });
});
