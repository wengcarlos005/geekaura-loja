import { describe, expect, it } from 'vitest';
import { validarEntrega, validarPagamento } from '../src/lib/validacao';

const ENTREGA = {
  nome: 'Maria da Silva', email: 'maria@exemplo.com', telefone: '(21) 96951-4829', cpf: '529.982.247-25',
  cep: '24934-015', logradouro: 'Rua A', numero: '10', complemento: '', bairro: 'Centro', cidade: 'Niterói', uf: 'rj',
};

describe('entrega', () => {
  it('normaliza um endereço válido', () => {
    const r = validarEntrega(ENTREGA);
    expect(r.ok && r.valor).toMatchObject({ cpf: '52998224725', cep: '24934015', telefone: '21969514829', uf: 'RJ' });
  });
  it('aponta o primeiro campo errado', () => {
    expect(validarEntrega({ ...ENTREGA, nome: 'Maria' })).toEqual({ ok: false, erro: 'Informe o nome completo.' });
    expect(validarEntrega({ ...ENTREGA, cpf: '111.111.111-11' })).toEqual({ ok: false, erro: 'CPF inválido.' });
    expect(validarEntrega({ ...ENTREGA, numero: '' })).toEqual({ ok: false, erro: 'Informe o número (ou "S/N").' });
  });
  it('corta texto longo', () => {
    const r = validarEntrega({ ...ENTREGA, complemento: 'x'.repeat(500) });
    expect(r.ok && r.valor.complemento.length).toBe(80);
  });
});

describe('pagamento', () => {
  const pagador = { email: 'maria@exemplo.com', nome: 'Maria da Silva', cpf: '52998224725' };
  it('Pix e boleto não levam cartão', () => {
    const r = validarPagamento({ metodo: 'pix', pagador, cartao: { token: 'x'.repeat(20) } });
    expect(r.ok && r.valor.cartao).toBeUndefined();
  });
  it('cartão exige token, bandeira e parcelas no formato', () => {
    expect(validarPagamento({ metodo: 'cartao', pagador, cartao: { token: 'abc', payment_method_id: 'visa', installments: 1 } }).ok).toBe(false);
    expect(validarPagamento({ metodo: 'cartao', pagador, cartao: { token: 'a1b2c3d4e5', payment_method_id: 'visa', installments: 13 } }).ok).toBe(false);
    expect(validarPagamento({ metodo: 'cartao', pagador, cartao: { token: 'a1b2c3d4e5', payment_method_id: 'visa', installments: 3 } }).ok).toBe(true);
  });
  it('nunca aceita valor vindo do navegador', () => {
    const r = validarPagamento({ metodo: 'pix', pagador, valor: 0.01, total: 0.01 });
    expect(r.ok && Object.keys(r.valor)).toEqual(['metodo', 'pagador']);
  });
  it('recusa método desconhecido', () => {
    expect(validarPagamento({ metodo: 'cheque', pagador }).ok).toBe(false);
  });
});
