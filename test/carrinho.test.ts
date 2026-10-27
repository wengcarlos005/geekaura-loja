import { describe, expect, it } from 'vitest';
import { aplicar, assinar, lerOperacao, normalizar, verificar } from '../src/lib/carrinho';

const SEGREDO = 'segredo-de-teste-com-tamanho-bom';

describe('cookie do carrinho', () => {
  it('ida e volta preserva os itens', async () => {
    const itens = [{ sku: 'MLB5271456132', qtd: 2 }, { sku: 'INB-ESP-NAV', qtd: 1 }];
    expect(await verificar(await assinar(itens, SEGREDO), SEGREDO)).toEqual(itens);
  });

  it('guarda só sku e quantidade, nunca preço', async () => {
    const valor = await assinar([{ sku: 'A1', qtd: 1, preco: 0.01 } as any], SEGREDO);
    const corpo = Buffer.from(valor.split('.')[0], 'base64url').toString();
    expect(corpo).toBe('[{"s":"A1","q":1}]');
  });

  it('corpo adulterado é descartado', async () => {
    const valor = await assinar([{ sku: 'A1', qtd: 1 }], SEGREDO);
    const falso = Buffer.from('[{"s":"A1","q":99}]').toString('base64url');
    expect(await verificar(`${falso}.${valor.split('.')[1]}`, SEGREDO)).toEqual([]);
  });

  it('assinatura com outro segredo é descartada', async () => {
    const valor = await assinar([{ sku: 'A1', qtd: 1 }], 'outro-segredo-qualquer-123');
    expect(await verificar(valor, SEGREDO)).toEqual([]);
  });

  it('lixo não lança', async () => {
    for (const v of [undefined, '', 'abc', 'a.b.c', '!!!.???', 'x'.repeat(5000)]) {
      expect(await verificar(v as any, SEGREDO)).toEqual([]);
    }
  });
});

describe('regras do carrinho', () => {
  it('soma repetidos, limita a 99 e descarta inválidos', () => {
    expect(normalizar([
      { sku: 'A', qtd: 60 }, { sku: 'A', qtd: 60 }, { sku: 'B', qtd: -1 }, { sku: 'C', qtd: 1.5 },
      { sku: '<script>', qtd: 1 }, { sku: 'D', qtd: '2' },
    ])).toEqual([{ sku: 'A', qtd: 99 }, { sku: 'D', qtd: 2 }]);
  });

  it('no máximo 30 itens', () => {
    const muitos = Array.from({ length: 40 }, (_, i) => ({ sku: `S${i}`, qtd: 1 }));
    expect(normalizar(muitos)).toHaveLength(30);
  });

  it('adicionar, definir, remover e limpar', () => {
    let c = aplicar([], { acao: 'adicionar', sku: 'A', qtd: 2 });
    c = aplicar(c, { acao: 'adicionar', sku: 'A', qtd: 1 });
    expect(c).toEqual([{ sku: 'A', qtd: 3 }]);
    c = aplicar(c, { acao: 'definir', sku: 'A', qtd: 1 });
    expect(c).toEqual([{ sku: 'A', qtd: 1 }]);
    c = aplicar(c, { acao: 'definir', sku: 'A', qtd: 0 });
    expect(c).toEqual([]);
    c = aplicar([{ sku: 'A', qtd: 1 }, { sku: 'B', qtd: 1 }], { acao: 'remover', sku: 'A' });
    expect(c).toEqual([{ sku: 'B', qtd: 1 }]);
    expect(aplicar(c, { acao: 'limpar' })).toEqual([]);
  });

  it('operação vinda do navegador é validada', () => {
    expect(lerOperacao({ acao: 'adicionar', sku: 'A', qtd: 1 })).toEqual({ acao: 'adicionar', sku: 'A', qtd: 1 });
    expect(lerOperacao({ acao: 'adicionar', sku: 'A', qtd: 0 })).toBeNull();
    expect(lerOperacao({ acao: 'adicionar', sku: 'A', qtd: 100 })).toBeNull();
    expect(lerOperacao({ acao: 'adicionar', sku: 'A', qtd: -5 })).toBeNull();
    expect(lerOperacao({ acao: 'definir', sku: 'A', qtd: 0 })).toEqual({ acao: 'definir', sku: 'A', qtd: 0 });
    expect(lerOperacao({ acao: 'apagar-tudo' })).toBeNull();
    expect(lerOperacao({ acao: 'adicionar', sku: 'a b', qtd: 1 })).toBeNull();
  });
});
