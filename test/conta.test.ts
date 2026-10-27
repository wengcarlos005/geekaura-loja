import { describe, expect, it } from 'vitest';
import { assinarJson, verificarJson } from '../src/lib/assinatura';
import { destinoSeguro, mapearCliente, mapearEndereco, primeiroNome, validarCadastro, validarEndereco } from '../src/lib/conta';

const SEGREDO = 'segredo-de-teste-com-16+';

describe('cookie assinado', () => {
  it('volta igual quando ninguém mexeu', async () => {
    const v = await assinarJson({ t: 'rzc_abc', n: 'Ana' }, SEGREDO, 'conta-v1');
    expect(await verificarJson(v, SEGREDO, 'conta-v1')).toEqual({ t: 'rzc_abc', n: 'Ana' });
  });

  it('corpo trocado, segredo errado ou outro contexto viram null', async () => {
    const v = await assinarJson({ t: 'rzc_abc', n: 'Ana' }, SEGREDO, 'conta-v1');
    const [corpo, sig] = v.split('.');
    const outro = (await assinarJson({ t: 'rzc_xyz', n: 'Eva' }, SEGREDO, 'conta-v1')).split('.')[0];
    expect(await verificarJson(`${outro}.${sig}`, SEGREDO, 'conta-v1')).toBeNull();
    expect(await verificarJson(v, 'outro-segredo-qualquer', 'conta-v1')).toBeNull();
    // Cookie de carrinho nunca vale como cookie de conta.
    expect(await verificarJson(v, SEGREDO, 'carrinho')).toBeNull();
    expect(await verificarJson(`${corpo}.${sig}.extra`, SEGREDO, 'conta-v1')).toBeNull();
    expect(await verificarJson('', SEGREDO, 'conta-v1')).toBeNull();
    expect(await verificarJson('x'.repeat(5000), SEGREDO, 'conta-v1')).toBeNull();
  });
});

describe('destino depois do login', () => {
  it('aceita só caminho interno', () => {
    expect(destinoSeguro('/checkout')).toBe('/checkout');
    expect(destinoSeguro('/conta/enderecos')).toBe('/conta/enderecos');
    expect(destinoSeguro('/produtos?faixa=ate-30')).toBe('/produtos?faixa=ate-30');
  });
  it('recusa outro site, esquema e barra invertida', () => {
    for (const ruim of ['//evil.com', 'https://evil.com', '/\\evil.com', 'javascript:alert(1)', 'conta', '', null, 42, '/a"b']) {
      expect(destinoSeguro(ruim)).toBe('/conta');
    }
  });
});

describe('validação', () => {
  it('cadastro', () => {
    expect(validarCadastro({ nome: 'Ana Souza', email: ' ANA@Ex.com ', senha: '12345678' })).toEqual({
      ok: true, valor: { nome: 'Ana Souza', email: 'ana@ex.com', senha: '12345678', telefone: null },
    });
    expect(validarCadastro({ nome: 'A', email: 'ana@ex.com', senha: '12345678' }).ok).toBe(false);
    expect(validarCadastro({ nome: 'Ana', email: 'ana@', senha: '12345678' }).ok).toBe(false);
    expect(validarCadastro({ nome: 'Ana', email: 'ana@ex.com', senha: '1234567' }).ok).toBe(false);
    expect(validarCadastro({ nome: 'Ana', email: 'ana@ex.com', senha: 'x'.repeat(129) }).ok).toBe(false);
    expect(validarCadastro({ nome: 'Ana', email: 'ana@ex.com', senha: '12345678', telefone: '123' }).ok).toBe(false);
    const comTel = validarCadastro({ nome: 'Ana', email: 'ana@ex.com', senha: '12345678', telefone: '(21) 96951-4829' });
    expect(comTel.ok && comTel.valor.telefone).toBe('21969514829');
  });

  it('endereço', () => {
    const base = { nome: 'Ana Souza', cep: '24934-015', logradouro: 'Av. Brasil', numero: '10', bairro: 'Centro', cidade: 'Maricá', uf: 'rj' };
    const ok = validarEndereco(base);
    expect(ok.ok && ok.valor).toMatchObject({ cep: '24934015', uf: 'RJ', apelido: 'Casa', padrao: false });
    expect(validarEndereco({ ...base, cep: '123' }).ok).toBe(false);
    expect(validarEndereco({ ...base, uf: 'XX' }).ok).toBe(false);
    expect(validarEndereco({ ...base, numero: '' }).ok).toBe(false);
    const padrao = validarEndereco({ ...base, padrao: true });
    expect(padrao.ok && padrao.valor.padrao).toBe(true);
  });
});

describe('respostas do Ryzo', () => {
  it('cliente sem e-mail ou id é descartado', () => {
    expect(mapearCliente({ id: 'x' })).toBeNull();
    expect(mapearCliente({ email: 'a@b.co' })).toBeNull();
    expect(mapearCliente({ id: 'u1', nome: 'Ana', email: 'A@B.co', telefone: null, email_verificado: true }))
      .toEqual({ id: 'u1', nome: 'Ana', email: 'a@b.co', telefone: null, email_verificado: true });
  });
  it('endereço sem CEP válido é descartado', () => {
    expect(mapearEndereco({ id: 'e1', cep: 'abc' })).toBeNull();
    expect(mapearEndereco({ id: 'e1', cep: '24934015', padrao: 1 })?.padrao).toBe(true);
  });
  it('primeiro nome', () => {
    expect(primeiroNome('  Carlos   Weng ')).toBe('Carlos');
  });
});
