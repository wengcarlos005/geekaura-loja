import { describe, expect, it } from 'vitest';
import { aplicarFreteGratis, faltaParaFreteGratis } from '../src/lib/freteGratis';

const opcoes = [{ id: 1, preco: 20 }, { id: 2, preco: 35.5 }, { id: 3, preco: 18 }];

describe('frete grátis', () => {
  it('abaixo do limite nada muda', () => {
    expect(aplicarFreteGratis(opcoes, 199.99, 200).map(o => o.preco)).toEqual([20, 35.5, 18]);
    expect(aplicarFreteGratis(opcoes, 199.99, 200).every(o => !o.gratis)).toBe(true);
  });
  it('no limite: a mais barata zera e as outras pagam a diferença', () => {
    const r = aplicarFreteGratis(opcoes, 200, 200);
    expect(r.map(o => o.preco)).toEqual([2, 17.5, 0]);
    expect(r.map(o => o.gratis)).toEqual([false, false, true]);
    expect(r.map(o => o.preco_original)).toEqual([20, 35.5, 18]);
  });
  it('sem limite configurado nada muda', () => {
    expect(aplicarFreteGratis(opcoes, 1000, null).map(o => o.preco)).toEqual([20, 35.5, 18]);
  });
  it('quanto falta', () => {
    expect(faltaParaFreteGratis(150.1, 200)).toBe(49.9);
    expect(faltaParaFreteGratis(250, 200)).toBe(0);
    expect(faltaParaFreteGratis(10, null)).toBeNull();
  });
});
