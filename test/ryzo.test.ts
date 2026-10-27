import { afterEach, describe, expect, it, vi } from 'vitest';
import * as ryzo from '../src/lib/ryzo';
import { precoSugeridoDoSite } from '../src/lib/demo';

const ENV_REAL = { RYZO_URL: 'https://ryzo.exemplo', RYZO_VITRINE_KEY: 'rzv_' + 'a'.repeat(64) } as Env;

afterEach(() => { vi.unstubAllGlobals(); ryzo.limparCache(); });

describe('mapeamento das respostas do Ryzo', () => {
  it('produto completo', () => {
    const p = ryzo.mapearProduto({
      slug: 'navio', titulo: 'Navio', categoria: 'Blocos de montar', descricao: 'x',
      fotos: ['https://img/a.jpg', 'javascript:alert(1)', 'http://inseguro/b.jpg', 42],
      peso_g: 320, medidas_cm: { comprimento: 33, largura: 12, altura: 6 },
      variacoes: [
        { sku: 'A', rotulo: 'Azul', foto: 'data:text/html,oi', preco: 30, estoque: 2 },
        { sku: 'B', rotulo: '', foto: null, preco: 20, estoque: 0 },
        { sku: 'C', preco: -1, estoque: 5 },
      ],
    })!;
    expect(p.fotos).toEqual(['https://img/a.jpg']);
    expect(p.variacoes.map(v => v.sku)).toEqual(['A', 'B']);
    expect(p.variacoes[0].foto).toBeNull();
    expect(p.variacoes[1].rotulo).toBeNull();
    expect(p.preco_a_partir).toBe(20);
    expect(p.disponivel).toBe(true);
    expect(p.medidas_cm).toEqual({ comprimento: 33, largura: 12, altura: 6 });
  });

  it('slug fora do formato é descartado', () => {
    expect(ryzo.mapearProduto({ slug: '../admin', variacoes: [] })).toBeNull();
  });

  it('pedido com status desconhecido não quebra', () => {
    const p = ryzo.mapearPedido({ codigo: 'SITE-ABC123', status: 'inventado', total: '10.5', itens: [{ sku: 'A', qtd: 2, preco: 5 }], envio: null })!;
    expect(p.status).toBe('processando');
    expect(p.total).toBe(10.5);
    expect(p.itens[0].titulo).toBe('A');
  });

  it('pagamento: boleto só com URL https, QR só base64', () => {
    const pg = ryzo.mapearPagamento({
      id: '1', metodo: 'pix', status: 'aguardando', pix: { qr: '000201', qr_base64: '"><img src=x>' },
    })!;
    expect(pg.pix!.qr_base64).toBeNull();
    const bol = ryzo.mapearPagamento({ id: '2', metodo: 'boleto', status: 'aguardando', boleto: { url: 'javascript:x', linha: '1' } })!;
    expect(bol.boleto).toBeUndefined();
    expect(ryzo.mapearPagamento({ metodo: 'cheque' })).toBeNull();
  });
});

describe('cliente', () => {
  it('manda a chave no cabeçalho e guarda o catálogo por 60 s', async () => {
    const fetchFalso = vi.fn(async () => new Response(JSON.stringify({ ok: true, produtos: [{ slug: 'a', titulo: 'A', variacoes: [{ sku: 'A', preco: 10, estoque: 1 }] }] })));
    vi.stubGlobal('fetch', fetchFalso);
    const lista = await ryzo.catalogo(ENV_REAL);
    await ryzo.catalogo(ENV_REAL);
    expect(lista).toHaveLength(1);
    expect(fetchFalso).toHaveBeenCalledTimes(1);
    const [url, init] = fetchFalso.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://ryzo.exemplo/vitrine/v1/catalogo');
    expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${ENV_REAL.RYZO_VITRINE_KEY}`);
  });

  it('repassa a mensagem de erro do Ryzo com os SKUs', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'Sem estoque suficiente.', skus: ['A'] }), { status: 409 })));
    await expect(ryzo.criarPedido(ENV_REAL, { itens: [{ sku: 'A', qtd: 1 }], comprador: { nome: 'x', email: 'x@x.com' } }))
      .rejects.toMatchObject({ message: 'Sem estoque suficiente.', status: 409, skus: ['A'] });
  });

  it('401 não vaza para o comprador como erro de chave', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'Chave inválida.' }), { status: 401 })));
    await expect(ryzo.pagamento(ENV_REAL, 'SITE-ABC123')).rejects.toMatchObject({ status: 503 });
  });

  it('produto inexistente vira null', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'Produto não encontrado.' }), { status: 404 })));
    expect(await ryzo.produto(ENV_REAL, 'nao-existe')).toBeNull();
  });
});

describe('modo demonstração', () => {
  const ENV_DEMO = {} as Env;

  it('liga sozinho sem a chave e não chama a rede', async () => {
    const fetchFalso = vi.fn();
    vi.stubGlobal('fetch', fetchFalso);
    expect(ryzo.modoDemo(ENV_DEMO)).toBe(true);
    const lista = await ryzo.catalogo(ENV_DEMO);
    expect(lista.length).toBeGreaterThanOrEqual(8);
    expect(fetchFalso).not.toHaveBeenCalled();
  });

  it('preço do site segue a regra do Ryzo: 10% abaixo, terminando em ,90', () => {
    expect(precoSugeridoDoSite(93.9)).toBe(83.9);
    expect(precoSugeridoDoSite(17.3)).toBe(14.9);
    expect(precoSugeridoDoSite(28.3)).toBe(24.9);
    expect(precoSugeridoDoSite(54.3)).toBe(47.9);
  });

  it('fluxo completo: frete, pedido, Pix', async () => {
    const [p] = await ryzo.catalogo(ENV_DEMO);
    const sku = p.variacoes.find(v => v.estoque > 0)!.sku;
    const opcoes = await ryzo.frete(ENV_DEMO, [{ sku, qtd: 1 }], '24934015');
    expect(opcoes.length).toBeGreaterThan(0);
    const criado = await ryzo.criarPedido(ENV_DEMO, {
      itens: [{ sku, qtd: 1 }], comprador: { nome: 'Fulano', email: 'f@x.com' }, frete: { servico_id: opcoes[0].id },
      entrega: { nome: 'Fulano de Tal', cpf: '52998224725', telefone: '21969514829', email: 'f@x.com', cep: '24934015',
        logradouro: 'Rua A', numero: '1', complemento: '', bairro: 'Centro', cidade: 'Maricá', uf: 'RJ' },
    });
    expect(criado.codigo).toMatch(/^SITE-[A-Z0-9]{10}$/);
    expect(criado.total).toBeCloseTo(criado.subtotal + opcoes[0].preco, 2);
    const { pagamento } = await ryzo.pagar(ENV_DEMO, criado.codigo, { metodo: 'pix', pagador: { email: 'f@x.com', nome: 'Fulano', cpf: '52998224725' } });
    expect(pagamento!.pix!.qr).toContain('DEMONSTRACAO');
    expect((await ryzo.pedido(ENV_DEMO, criado.codigo))!.status).toBe('aguardando_pagamento');
  });

  it('recusa quantidade acima do estoque', async () => {
    const lista = await ryzo.catalogo(ENV_DEMO);
    const v = lista.flatMap(p => p.variacoes).find(v => v.estoque > 0)!;
    const d = await ryzo.disponibilidade(ENV_DEMO, [{ sku: v.sku, qtd: v.estoque + 1 }]);
    expect(d.ok).toBe(false);
  });
});
