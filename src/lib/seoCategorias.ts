// Texto de busca de cada categoria: título da aba, descrição do resultado do Google e um parágrafo
// curto no fim da página. O parágrafo fica DEPOIS dos produtos de propósito: quem chega quer ver o
// produto primeiro, e o Google lê a página inteira. Sem promessa que a loja não cumpre (preço, prazo).
export interface SeoCategoria { titulo: string; descricao: string; texto: string; }

const CATEGORIAS: Record<string, SeoCategoria> = {
  'blocos-de-montar': {
    titulo: 'Blocos de montar: navios, robôs, dinossauros e micro blocos',
    descricao: 'Blocos de montar para crianças e adultos: navios, robôs, dinossauros, ninjas e micro blocos, com peças compatíveis com as marcas conhecidas. Pix na hora e envio para todo o Brasil.',
    texto: 'Blocos de montar para todas as idades: kits grandes para montar em família, robôs e dinossauros 2 em 1, ninjas articulados e micro blocos para decorar. As peças encaixam nas das marcas mais conhecidas, então dá para misturar com a coleção que você já tem.',
  },
  'cartas-colecionaveis': {
    titulo: 'Cartas colecionáveis: boosters e caixas para completar a coleção',
    descricao: 'Cartas colecionáveis, boosters e caixas lacradas para colecionar e trocar. Compre na Geek Aura com Pix na hora e envio para todo o Brasil.',
    texto: 'Boosters e caixas lacradas de cartas colecionáveis, para abrir, trocar e completar a coleção. Cada pacote sai conferido e protegido para chegar inteiro.',
  },
  'jogos-de-cartas': {
    titulo: 'Jogos de cartas para a família e para os amigos',
    descricao: 'Jogos de cartas rápidos e divertidos para jogar em família e com os amigos, de 2 a 10 jogadores. Pix na hora e envio para todo o Brasil.',
    texto: 'Jogos de cartas para a mesa de sábado: partidas rápidas, regras simples e diversão de 2 a 10 jogadores, das crianças aos adultos. Ótimos para presentear.',
  },
  'jogos-de-tabuleiro': {
    titulo: 'Jogos de tabuleiro para jogar em família',
    descricao: 'Jogos de tabuleiro para jogar em família e com os amigos. Compre na Geek Aura com Pix na hora e envio para todo o Brasil.',
    texto: 'Jogos de tabuleiro para reunir a família e os amigos, com partidas para todas as idades.',
  },
  'figuras-e-caixas-surpresa': {
    titulo: 'Figuras colecionáveis e caixas surpresa',
    descricao: 'Figuras colecionáveis, blind boxes e caixas surpresa dos personagens favoritos. Compre na Geek Aura com Pix na hora e envio para todo o Brasil.',
    texto: 'Figuras colecionáveis e caixas surpresa para quem gosta de abrir e descobrir qual personagem veio. Uma forma divertida de começar ou completar a coleção.',
  },
  natal: {
    titulo: 'Presentes de Natal geek: micro blocos e decoração',
    descricao: 'Presentes de Natal geek: micro blocos natalinos, decoração e lembrancinhas. Compre na Geek Aura com Pix na hora e envio para todo o Brasil.',
    texto: 'Micro blocos natalinos e lembrancinhas geek para decorar a casa e presentear no Natal.',
  },
};

/** Texto da categoria; para categoria nova sem texto escrito, um genérico que não promete nada. */
export function seoDaCategoria(slug: string, nome: string, qtd: number): SeoCategoria {
  return CATEGORIAS[slug] ?? {
    titulo: nome,
    descricao: `${nome} na Geek Aura: ${qtd} ${qtd === 1 ? 'produto' : 'produtos'} com Pix na hora e envio para todo o Brasil.`,
    texto: '',
  };
}

/** BreadcrumbList do schema.org: Início > ... > página atual. */
export function trilhaJsonLd(base: string, passos: { nome: string; caminho: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [{ nome: 'Início', caminho: '/' }, ...passos].map((p, i) => ({
      '@type': 'ListItem', position: i + 1, name: p.nome, item: new URL(p.caminho, base).href,
    })),
  };
}
