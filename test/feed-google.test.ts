import { describe, expect, it } from 'vitest';
import { feedGoogle } from '../src/lib/feedGoogle';
import type { ProdutoResumo } from '../src/lib/ryzo';

const navio: ProdutoResumo = {
  slug: 'navio', titulo: 'Navio & Porta-Aviões <8 em 1>', categoria: 'Blocos de montar', fotos: ['https://img/n1.jpg', 'https://img/n2.jpg'],
  preco_a_partir: 83.9, disponivel: true,
  variacoes: [
    { sku: 'NAV-A', rotulo: 'Azul', foto: 'https://img/a.jpg', preco: 83.9, estoque: 3 },
    { sku: 'NAV-B', rotulo: 'Cinza', foto: null, preco: 89.9, estoque: 0 },
  ],
};

describe('feed do Google Merchant', () => {
  const saida = feedGoogle([navio], 'https://geekaura.com.br', 'Geek Aura');

  it('um item por modelo, agrupado pelo produto, com link que abre o modelo', () => {
    expect(saida.match(/<item>/g)).toHaveLength(2);
    expect(saida).toContain('<g:item_group_id>navio</g:item_group_id>');
    expect(saida).toContain('<g:link>https://geekaura.com.br/produto/navio?modelo=NAV-A</g:link>');
    expect(saida).toContain('<g:price>89.90 BRL</g:price>');
  });

  it('estoque zero vira out_of_stock e modelo sem foto usa a do produto', () => {
    const cinza = saida.split('<item>')[2];
    expect(cinza).toContain('<g:availability>out_of_stock</g:availability>');
    expect(cinza).toContain('<g:image_link>https://img/n1.jpg</g:image_link>');
  });

  it('escapa o título para não quebrar o XML', () => {
    expect(saida).toContain('Navio &amp; Porta-Aviões &lt;8 em 1&gt; - Azul');
    expect(saida).not.toContain('<8 em 1>');
  });
});
