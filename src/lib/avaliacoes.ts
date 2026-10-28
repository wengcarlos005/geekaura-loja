// Avaliações REAIS da loja Geek Aura na Shopee, copiadas da API em 28/10/2026 (100 mais recentes).
// O nome vai mascarado como a própria Shopee mostra; o texto só teve erro de digitação e abreviação
// corrigidos ("p" virou "para") e um trecho final cortado, sem mudar o sentido. Não acrescente
// avaliação inventada: anúncio de depoimento falso é propaganda enganosa (CDC, art. 37).
export interface Avaliacao { autor: string; nota: number; data: string; texto: string; }

/** Resumo das 100 avaliações mais recentes da Shopee em 28/10/2026: 92 de 5 estrelas, média 4,86. */
export const RESUMO_AVALIACOES = { total: 100, cincoEstrelas: 92, media: '4,86', origem: 'Shopee' } as const;

export const AVALIACOES: Avaliacao[] = [
  { autor: 'p*****l', nota: 5, data: 'out/2026', texto: 'O jogo é ótimo para trabalhar concentração. Nos divertimos muito jogando, minha filha de 3 aninhos já brinca junto com a gente, as cartas são coloridas, o que torna o jogo ainda mais legal. Super recomendo!!' },
  { autor: 'c*****a', nota: 5, data: 'out/2026', texto: 'Essa já é a 2ª compra e o quarto brinquedo comprado na loja. Muito bom e chegou muito antes do prazo.' },
  { autor: 'i*****c', nota: 5, data: 'out/2026', texto: 'Pelúcia muito bem acabada, com costuras perfeitas. Vale a pena comprar!' },
  { autor: 'g*****4', nota: 5, data: 'out/2026', texto: 'Eu havia pedido esse produto antes e tinha vindo errado, mas eles foram atenciosos e resolveram esse erro. Agora veio certo, parabéns, a loja e o produto são de qualidade.' },
  { autor: 'l*****4', nota: 5, data: 'out/2026', texto: 'Comprei para o meu filho e ele amou, é muito lindinho e chegou muito rápido, com 2 dias.' },
  { autor: 'd*****h', nota: 5, data: 'out/2026', texto: 'Simplesmente incrível a qualidade, articulação e bem bonito.' },
  { autor: 'f*****g', nota: 5, data: 'out/2026', texto: 'Lindo. Muito divertida a montagem. Vale a pena a compra sim.' },
  { autor: 'a*****a', nota: 5, data: 'out/2026', texto: 'Comprei para presente! Meu sobrinho adorou!' },
];
