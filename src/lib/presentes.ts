// Páginas de presente com endereço próprio (/presentes/...). Os filtros de preço da listagem vivem
// em ?faixa=, e o canônico tira a querystring: para o Google, "até R$ 30" nunca foi uma página.
// Estas são, com título e descrição escritos para a busca de quem procura presente.
// Só filtros que o dado sustenta (preço, categoria, estoque): nada de "para 6 anos" sem idade no cadastro.
import type { ProdutoResumo } from './ryzo';
import { slugificar } from './formato';

export interface PaginaPresente {
  slug: string;
  nome: string;
  titulo: string;
  descricao: string;
  h1: string;
  texto: string;
  filtro: (p: ProdutoResumo) => boolean;
}

const ate = (max: number) => (p: ProdutoResumo) => p.preco_a_partir > 0 && p.preco_a_partir <= max;
const daCategoria = (...slugs: string[]) => (p: ProdutoResumo) => slugs.includes(slugificar(p.categoria));

export const PRESENTES: PaginaPresente[] = [
  {
    slug: 'amigo-secreto-ate-30', nome: 'Amigo secreto até R$ 30',
    titulo: 'Amigo secreto até R$ 30: presentes geek baratos',
    descricao: 'Presentes geek de até R$ 30 para o amigo secreto: blocos de montar, micro blocos, cartas e colecionáveis. Pix na hora e envio para todo o Brasil.',
    h1: 'Amigo secreto até R$ 30',
    texto: 'Presentes geek que cabem no limite do amigo secreto: micro blocos, mini kits de montar, cartas e colecionáveis, todos até R$ 30.',
    filtro: ate(30),
  },
  {
    slug: 'amigo-secreto-ate-50', nome: 'Amigo secreto até R$ 50',
    titulo: 'Amigo secreto até R$ 50: presentes geek criativos',
    descricao: 'Presentes geek de até R$ 50 para o amigo secreto da família, da escola ou do trabalho. Blocos de montar, jogos e colecionáveis com envio para todo o Brasil.',
    h1: 'Amigo secreto até R$ 50',
    texto: 'Ideias de amigo secreto até R$ 50 para quem gosta de montar, jogar e colecionar. Dá para acertar no presente sem estourar o combinado.',
    filtro: ate(50),
  },
  {
    slug: 'presentes-ate-100', nome: 'Presentes até R$ 100',
    titulo: 'Presentes geek até R$ 100 para crianças e adultos',
    descricao: 'Presentes geek até R$ 100: kits de blocos de montar, robôs, dinossauros, jogos de cartas e colecionáveis. Pix na hora e envio para todo o Brasil.',
    h1: 'Presentes até R$ 100',
    texto: 'Kits maiores para montar com calma, jogos para a família e colecionáveis, todos até R$ 100. Bons para aniversário, Natal e Dia das Crianças.',
    filtro: ate(100),
  },
  {
    slug: 'presentes-de-natal', nome: 'Presentes de Natal',
    titulo: 'Presentes de Natal geek: blocos de montar, jogos e decoração',
    descricao: 'Presentes de Natal geek: micro blocos natalinos, kits de montar, jogos para a família e colecionáveis. Pix na hora e envio para todo o Brasil.',
    h1: 'Presentes de Natal',
    texto: 'Micro blocos natalinos para decorar, kits de montar para as férias e jogos para a ceia em família.',
    filtro: p => daCategoria('natal', 'blocos-de-montar', 'jogos-de-cartas', 'jogos-de-tabuleiro')(p),
  },
  {
    slug: 'jogos-para-familia', nome: 'Jogos para a família',
    titulo: 'Jogos para jogar em família: cartas e tabuleiro',
    descricao: 'Jogos de cartas e de tabuleiro para jogar em família e com os amigos. Presentes para todas as idades com envio para todo o Brasil.',
    h1: 'Jogos para jogar em família',
    texto: 'Jogos de cartas e de tabuleiro de regras simples, para reunir crianças e adultos na mesma mesa.',
    filtro: daCategoria('jogos-de-cartas', 'jogos-de-tabuleiro'),
  },
];

/** Produtos da página: só com estoque e com foto, Natal primeiro na página de Natal, e do mais barato ao mais caro. */
export function produtosDoPresente(pagina: PaginaPresente, catalogo: ProdutoResumo[]): ProdutoResumo[] {
  const lista = catalogo.filter(p => p.disponivel && p.fotos.length > 0 && pagina.filtro(p));
  const natalPrimeiro = pagina.slug === 'presentes-de-natal';
  return lista.sort((a, b) =>
    (natalPrimeiro ? Number(slugificar(b.categoria) === 'natal') - Number(slugificar(a.categoria) === 'natal') : 0)
    || a.preco_a_partir - b.preco_a_partir);
}

/** Páginas com produto suficiente para valer a pena existir: página quase vazia não ranqueia e frustra quem chega. */
export function presentesComProdutos(catalogo: ProdutoResumo[], minimo = 4): PaginaPresente[] {
  return PRESENTES.filter(p => produtosDoPresente(p, catalogo).length >= minimo);
}
