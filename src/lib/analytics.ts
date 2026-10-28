// Google Analytics 4. Só liga com GA_ID válido na configuração do Worker: sem ele nenhum script do
// Google é carregado e a CSP não abre nada para ele.

export const RE_GA_ID = /^G-[A-Z0-9]{4,16}$/;

/** Domínios que o gtag usa: o script vem do Tag Manager, a coleta vai para os do Analytics. */
export const GA_DOMINIOS = {
  script: ['https://www.googletagmanager.com'],
  connect: ['https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://*.googletagmanager.com'],
};

export function idGa(env: { GA_ID?: string }): string | null {
  const id = (env.GA_ID || '').trim().toUpperCase();
  return RE_GA_ID.test(id) ? id : null;
}

export interface ItemGa { item_id: string; item_name: string; item_category?: string; item_variant?: string; price: number; quantity: number; }

/** Item no formato do comércio eletrônico do GA4; nomes cortados no limite de 100 caracteres. */
export function itemGa(i: { sku: string; titulo: string; categoria?: string | null; rotulo?: string | null; preco: number; qtd: number }): ItemGa {
  const item: ItemGa = { item_id: i.sku, item_name: i.titulo.slice(0, 100), price: Number(i.preco.toFixed(2)), quantity: i.qtd };
  if (i.categoria) item.item_category = i.categoria.slice(0, 100);
  if (i.rotulo) item.item_variant = i.rotulo.slice(0, 100);
  return item;
}
