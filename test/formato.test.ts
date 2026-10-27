import { describe, expect, it } from 'vitest';
import { cepValido, codigoDePedidoValido, cpfValido, emailValido, precoBRL, slugificar, telefoneValido, ufValida } from '../src/lib/formato';

describe('precoBRL', () => {
  it('formata em reais com vírgula e milhar', () => {
    expect(precoBRL(14.9)).toBe('R$ 14,90');
    expect(precoBRL(1234.5)).toBe('R$ 1.234,50');
    expect(precoBRL(0)).toBe('R$ 0,00');
  });
  it('não usa espaço especial (copia e compara direito)', () => {
    expect(precoBRL(83.9)).not.toMatch(/[  ]/);
  });
  it('valor não numérico vira travessão, nunca NaN na tela', () => {
    expect(precoBRL(NaN)).toBe('—');
    expect(precoBRL(Infinity)).toBe('—');
  });
});

describe('CEP', () => {
  it('aceita com e sem hífen e devolve só dígitos', () => {
    expect(cepValido('24934-015')).toBe('24934015');
    expect(cepValido('01310100')).toBe('01310100');
  });
  it('recusa tamanho errado e zeros', () => {
    expect(cepValido('2493401')).toBeNull();
    expect(cepValido('00000-000')).toBeNull();
    expect(cepValido(undefined)).toBeNull();
  });
});

describe('CPF', () => {
  it('confere os dígitos verificadores', () => {
    expect(cpfValido('529.982.247-25')).toBe('52998224725');
    expect(cpfValido('52998224724')).toBeNull();
  });
  it('recusa sequência repetida e tamanho errado', () => {
    expect(cpfValido('111.111.111-11')).toBeNull();
    expect(cpfValido('1234567890')).toBeNull();
  });
});

describe('outros campos', () => {
  it('telefone com DDD, fixo ou celular', () => {
    expect(telefoneValido('(21) 96951-4829')).toBe('21969514829');
    expect(telefoneValido('2133334444')).toBe('2133334444');
    expect(telefoneValido('969514829')).toBeNull();
  });
  it('e-mail', () => {
    expect(emailValido('  Fulano@Exemplo.com.br ')).toBe('fulano@exemplo.com.br');
    expect(emailValido('fulano@')).toBeNull();
  });
  it('UF', () => {
    expect(ufValida('rj')).toBe('RJ');
    expect(ufValida('XX')).toBeNull();
  });
  it('slug sem acento', () => {
    expect(slugificar('Figuras e caixas surpresa')).toBe('figuras-e-caixas-surpresa');
    expect(slugificar('Árvore de Natal!')).toBe('arvore-de-natal');
  });
  it('código de pedido', () => {
    expect(codigoDePedidoValido('site-abc123')).toBe('SITE-ABC123');
    expect(codigoDePedidoValido('SITE-ab')).toBeNull();
    expect(codigoDePedidoValido('SITE-ABC123/../x')).toBeNull();
  });
});
