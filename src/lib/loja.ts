// Dados fixos da loja: empresa, atendimento e navegação. Um lugar só, para rodapé, páginas legais
// e JSON-LD não divergirem.
import { slugificar } from './formato';

export const LOJA = {
  nome: 'Geek Aura',
  url: 'https://geekaura.com.br',
  razaoSocial: 'Wan Aura Comercio LTDA',
  cnpj: '57.575.249/0001-42',
  endereco: 'Av. Doutor Antonio Marques Matias, 4586, Qd. 250, Lt. 03 · Jardim Atlântico Central (Itaipuaçu) · Maricá/RJ · CEP 24934-015',
  email: 'geekauracontatooficial@gmail.com',
  whatsapp: '(21) 96951-4829',
  whatsappLink: 'https://wa.me/5521969514829',
  prazoPostagem: 'até 2 dias úteis após a confirmação do pagamento',
  notaShopee: '4,81',
  bordao: 'Onde a Magia Geek Vive',
} as const;

export interface Categoria { nome: string; slug: string; }

/** Categorias na ordem do menu; as que não têm produto no catálogo ficam de fora. */
const ORDEM = ['Blocos de montar', 'Cartas colecionáveis', 'Jogos de cartas', 'Jogos de tabuleiro', 'Figuras e caixas surpresa', 'Natal'];

export function categoriasDoCatalogo(produtos: { categoria: string }[]): Categoria[] {
  const nomes = [...new Set(produtos.map(p => p.categoria).filter(Boolean))];
  nomes.sort((a, b) => {
    const ia = ORDEM.indexOf(a), ib = ORDEM.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b, 'pt-BR');
  });
  return nomes.map(nome => ({ nome, slug: slugificar(nome) }));
}

export const FAIXAS = [
  { slug: 'ate-30', nome: 'Até R$ 30', min: 0, max: 30 },
  { slug: '30-a-60', nome: 'R$ 30 a R$ 60', min: 30, max: 60 },
  { slug: '60-a-100', nome: 'R$ 60 a R$ 100', min: 60, max: 100 },
  { slug: 'acima-de-100', nome: 'Acima de R$ 100', min: 100, max: Infinity },
] as const;
