// Feed de produtos do Google Merchant Center (RSS 2.0 com o namespace g:). É o que coloca os produtos
// nas listagens GRATUITAS da aba Shopping e no resultado com preço. Um item por modelo, agrupado por
// item_group_id, como o Google pede para variação.
import type { ProdutoResumo } from './ryzo';

const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function feedGoogle(produtos: ProdutoResumo[], base: string, nomeLoja: string): string {
  const itens = produtos.flatMap(p => p.variacoes.filter(v => v.preco > 0).map(v => {
    const foto = v.foto || p.fotos[0];
    if (!foto) return '';
    const titulo = (p.variacoes.length > 1 && v.rotulo ? `${p.titulo} - ${v.rotulo}` : p.titulo).slice(0, 150);
    const link = new URL(`/produto/${p.slug}`, base);
    if (p.variacoes.length > 1) link.searchParams.set('modelo', v.sku);
    const extras = [...new Set([...p.fotos, v.foto].filter((f): f is string => !!f && f !== foto))].slice(0, 10);
    return [
      '    <item>',
      `      <g:id>${xml(v.sku)}</g:id>`,
      `      <g:item_group_id>${xml(p.slug)}</g:item_group_id>`,
      `      <g:title>${xml(titulo)}</g:title>`,
      `      <g:description>${xml(`${titulo}. ${p.categoria} na ${nomeLoja}, com Pix na hora e envio para todo o Brasil.`)}</g:description>`,
      `      <g:link>${xml(link.href)}</g:link>`,
      `      <g:image_link>${xml(foto)}</g:image_link>`,
      ...extras.map(f => `      <g:additional_image_link>${xml(f)}</g:additional_image_link>`),
      `      <g:availability>${v.estoque > 0 ? 'in_stock' : 'out_of_stock'}</g:availability>`,
      `      <g:price>${v.preco.toFixed(2)} BRL</g:price>`,
      '      <g:condition>new</g:condition>',
      // Produto sem marca registrada nem código de barras: o Google exige dizer isso explicitamente.
      '      <g:identifier_exists>no</g:identifier_exists>',
      `      <g:product_type>${xml(p.categoria)}</g:product_type>`,
      '    </item>',
    ].join('\n');
  })).filter(Boolean);
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${xml(nomeLoja)}</title>
    <link>${xml(base)}</link>
    <description>${xml(`Produtos da ${nomeLoja}`)}</description>
${itens.join('\n')}
  </channel>
</rss>
`;
}
