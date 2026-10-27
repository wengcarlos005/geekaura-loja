// Modo demonstração: o site inteiro funciona sem a chave da vitrine do Ryzo, para desenvolver e tirar
// print de tela sem tocar no banco de verdade. Os produtos são REAIS (anúncios da Geek Aura na Shopee,
// lidos do Ryzo em 27/10/2026): título enxuto para o site, descrição, fotos e variações com estoque.
// O preço segue a mesma regra do Ryzo (precoSugeridoDoSite): 10% abaixo do preço atual da Shopee,
// promoção incluída, terminando em ,90. Pedido, frete e pagamento são simulados e vivem só na memória.

import type {
  ConfigPagamento, Disponibilidade, NovoPedido, OpcaoFrete, Pagamento, Pedido, PedidoCriado,
  PedidoDePagamento, Produto, StatusPedido,
} from './ryzo';
import type { ItemDoCarrinho } from './carrinho';
import { ErroRyzo } from './erros';
import catalogoExtra from './catalogo-demo.json';

/** Cópia da regra do Ryzo (src/lojaPropria.ts). Só o modo demonstração calcula preço: em produção ele vem pronto. */
export function precoSugeridoDoSite(preco: number): number {
  const alvoCentavos = Math.floor(preco * 0.9 * 100 + 1e-6);
  const reais = Math.floor((alvoCentavos - 90) / 100);
  return reais >= 0 ? Number((reais + 0.9).toFixed(2)) : Number((alvoCentavos / 100).toFixed(2));
}

const shopee = (id: string) => `https://cf.shopee.com.br/file/${id}`;

interface Bruto {
  slug: string; titulo: string; categoria: string; descricao: string; fotos?: string[];
  peso_g: number; medidas: [number, number, number];
  /** [sku, rótulo, foto, preço na Shopee, estoque] */
  variacoes: [string, string | null, string | null, number, number][];
}

const FEITOS_A_MAO: Bruto[] = [
  {
    slug: 'bonecos-ninja-dragao-blocos-de-montar',
    titulo: 'Bonecos Ninja Dragão — blocos de montar',
    categoria: 'Blocos de montar',
    peso_g: 372, medidas: [33, 12, 6],
    descricao: `Descubra o Universo dos Bonecos Ninja Dragão!
Prepare-se para aventuras épicas com nossos incríveis bonecos de montar. Eles trazem toda a ação de guerreiros ninjas, motoqueiros velozes e domadores de dragões em um único conjunto cheio de diversão e criatividade.

Crie, Monte e Explore:
Essas mini figuras oferecem detalhes impressionantes e peças compatíveis com outras marcas de blocos de montar. Você pode construir cenários, criar batalhas épicas e inventar histórias incríveis. São perfeitos para crianças que amam desafios e colecionadores apaixonados por ação e fantasia.

Por que escolher nossos bonecos Ninja Dragão?
✔ Alta Qualidade – Durabilidade e segurança para todas as idades.
✔ Versatilidade – Ideal para brincar e colecionar.
✔ Criatividade Sem Limites – Crie mundos únicos e personalizados.

✅ Garantia contra defeitos de fabricação`,
    variacoes: [
      ['MLB4619147537', 'Guerreiro Vermelho', shopee('br-11134207-7r98o-m5005crq7jxu1d'), 41.9, 12],
      ['MLB4619152455', 'Guerreiro Azul', shopee('br-11134207-7r98o-m5005crq65deb6'), 37.9, 13],
      ['MLB4619152479', 'Guerreiro Verde', shopee('br-11134207-7r98o-m500ehvg7rt127'), 37.9, 16],
      ['MLB4619147557', 'Guerreiro Amarelo', shopee('br-11134207-7r98o-m500ehvg6d8lb7'), 37.9, 16],
      ['MLB4835947521', 'Dragão Turbo Celeste Azul', shopee('br-11134207-820ld-mq4vepcijl6re7'), 40.9, 8],
      ['MLB7076168838', 'Dragão Turbo Celeste Vermelho', shopee('br-11134207-820m2-mq4vepcifdhf94'), 40.9, 14],
      ['MLB7071767130', 'Dragão Turbo Celeste Amarelo', shopee('br-11134207-820lz-mq4vepcigs1vf5'), 39.9, 14],
      ['1867601769773', 'Dragão Turbo Celeste Verde', shopee('br-11134207-820m7-mq4vepcii6mbde'), 40.9, 4],
      ['186760176979', 'Dragão Verde', shopee('br-11134207-820lw-mm650v3mhb0g37'), 38.9, 15],
      ['186760176977', 'Dragão Vermelho', shopee('br-11134207-820ll-mm650v3s0rnr97'), 39.9, 5],
      ['186760176976', 'Dragão Azul', shopee('br-11134207-820lr-mm650v3mfwg064'), 38.9, 3],
      ['MLB4619152453', 'Dragão Branco', shopee('br-11134207-820lj-mm650v3mipkw4c'), 39.9, 3],
      ['MLB6643000904', 'Treinador de Dragão Verde', shopee('br-11134207-7r98o-m500ehvghls5d1'), 45.9, 8],
      ['MLB6643000980', 'Treinador de Dragão Azul', shopee('br-11134207-7r98o-m52xixkbvx51f3'), 45.9, 9],
      ['MLB6643000908', 'Treinador de Dragão Vermelho', shopee('br-11134207-7r98o-m500ehvgj0cl39'), 45.9, 9],
      ['MLB4619147455', 'Treinador de Dragão Amarelo', shopee('br-11134207-7r98o-m52xixkbxbph4c'), 45.9, 7],
    ],
  },
  {
    slug: 'robo-dinossauro-2-em-1-blocos-de-montar',
    titulo: 'Robô Dinossauro 2 em 1 — blocos de montar',
    categoria: 'Blocos de montar',
    peso_g: 300, medidas: [33, 12, 6],
    descricao: `🦖 Robô Dinossauro 2 em 1 – Dinowars MechWarriors

A batalha mais épica começou! Os Dinowars MechWarriors são brinquedos de montar 2 em 1 que unem a ferocidade dos dinossauros ao poder dos robôs mechas: cada modelo se transforma de dinossauro em mecha guerreiro. Um presente perfeito para o Natal, aniversários e Dia das Crianças, para fãs de dinossauros e robôs.

📦 O que vem na caixa
• 1 unidade do modelo escolhido na variação

🎨 Modelos disponíveis
• T-Rex: o líder indomável, com força devastadora
• Autoraptor: ágil e estratégico, perfeito para ataques rápidos
• Guardian: o escudo invencível, com força e resistência
• HexaHydron: a fusão perfeita entre poder e tecnologia

🔹 A grande fusão
Junte os 4 Dinowars MechWarriors e forme o MegaREX, um robô gigante que combina o melhor de cada guerreiro!

✨ Características
• Brinquedo 2 em 1: dinossauro e robô mecha
• Blocos de montar com muitos detalhes
• Colecionável: junte os 4 e monte o MegaREX
• Estimula criatividade, coordenação motora e pensamento estratégico

⚠️ Cuidados
Contém peças pequenas. Não indicado para crianças menores de 3 anos. Recomendamos a supervisão de um adulto durante a montagem.

🔎 Importante
Cada unidade corresponde a UM dinossauro. Para formar o MegaREX, adicione os 4 modelos ao carrinho.`,
    variacoes: [
      ['187028376041', 'T-Rex', shopee('br-11134207-7r98o-m7e22gvc773mb8'), 17.3, 52],
      ['187028223819', 'Autoraptor', shopee('br-11134207-7r98o-m7e22gvc069e55'), 17.3, 52],
      ['187028223815', 'Guardian', shopee('br-11134207-7r98o-m7e22gvc1ktu9d'), 17.3, 52],
      ['187028223821', 'HexaHydron', shopee('br-11134207-7r98o-m7e22gvc8lo253'), 17.3, 53],
    ],
  },
  {
    slug: 'navio-porta-avioes-8-em-1-554-pecas',
    titulo: 'Navio Porta-Aviões 8 em 1 — 554 peças',
    categoria: 'Blocos de montar',
    peso_g: 320, medidas: [33, 12, 6],
    fotos: [
      'https://http2.mlstatic.com/D_871078-MLB90553068846_082025-O.jpg',
      'https://http2.mlstatic.com/D_600546-MLB96009003298_102025-O.jpg',
      'https://http2.mlstatic.com/D_788749-MLB82155969367_012025-O.jpg',
      'https://http2.mlstatic.com/D_657386-MLB90563845647_082025-O.jpg',
    ],
    // O anúncio de origem fala em 1028 peças numa linha e 554 nas outras; aqui ficou só 554.
    descricao: `Navegue pela Criatividade com o Navio 8 em 1 de Blocos!
Desperte o capitão aventureiro que há em você com este incrível navio de blocos de montar. Com 8 possibilidades de montagem diferentes, incluindo um poderoso navio de guerra e mais 6 modelos variados, este conjunto oferece diversão e criatividade para entusiastas de todas as idades!

✔ Versatilidade 8 em 1: Construa até 8 modelos únicos, incluindo navios, veículos e outras figuras incríveis.
✔ Peças Compatíveis: Compatível com outras marcas de blocos para criar ainda mais possibilidades.
✔ Alta Qualidade: peças fabricadas em plástico ABS, conhecido por sua durabilidade e segurança.
✔ Design Realista: Inclui detalhes impressionantes, ideal para colecionadores e fãs de quebra-cabeças.
✔ Desenvolvimento Criativo: Estimula habilidades motoras e criatividade durante a montagem.

Especificações Técnicas:
📦 Quantidade de Peças: 554 blocos.
📐 Dimensões do Navio Principal: 18 cm (altura) x 32 cm (comprimento) x 8 cm (largura).
👶 Idade Recomendada: A partir de 14 anos.
🎨 Modelos Inclusos: Navio de guerra + 6 modelos adicionais.
🌟 Material das Peças: Plástico ABS, seguro e resistente.`,
    variacoes: [['MLB5271456132', null, null, 93.9, 15]],
  },
  {
    slug: 'jogo-de-cartas-saboteur',
    titulo: 'Saboteur — jogo de cartas',
    categoria: 'Jogos de cartas',
    peso_g: 200, medidas: [10, 15, 4],
    descricao: `⛏️ Saboteur – Jogo de Cartas de Estratégia e Blefe

Vocês são anões mineradores em busca de ouro... mas cuidado: alguns jogadores são sabotadores e vão tentar impedir o progresso dos outros! Estratégia, blefe e trabalho em equipe em partidas rápidas, sempre diferentes e cheias de risadas. Um presente perfeito para o Natal, aniversários e Dia das Crianças, e garantia de diversão em reuniões com a família e os amigos.

📦 O que vem na caixa
• 1 jogo Saboteur (versão escolhida na variação)

✨ Características
• Número de jogadores: 3 a 10
• Faixa etária recomendada: 8 a 13 anos, também divertido para jovens e adultos
• Regras simples e fáceis de aprender
• Mistura estratégia, blefe e trabalho em equipe
• Ideal para noites de jogos, festas e encontros

🎯 Como funciona
Cada jogador recebe secretamente um papel: minerador ou sabotador. Os mineradores tentam abrir um caminho até o ouro, enquanto os sabotadores fazem de tudo para atrapalhar sem serem descobertos. Ninguém sabe em quem confiar!`,
    variacoes: [
      ['186854540703', 'Saboteur 1', shopee('br-11134207-7r98o-m5x2qisbkfgw5a'), 54.3, 23],
      ['186854540705', 'Saboteur 2', shopee('br-11134207-7r98o-m5x6drrmqmhcb8'), 80, 0],
    ],
  },
  {
    slug: 'transformers-blokees-defender-figura-surpresa',
    titulo: 'Transformers Blokees Defender — figura de montar surpresa',
    categoria: 'Figuras e caixas surpresa',
    peso_g: 191, medidas: [8, 17, 27],
    // Anúncio da Shopee não tem foto por variação; estas são do mesmo produto no Mercado Livre.
    fotos: [
      'https://http2.mlstatic.com/D_767038-MLB103890383309_012026-O.webp',
      'https://http2.mlstatic.com/D_605421-MLB103372577670_012026-O.jpg',
      'https://http2.mlstatic.com/D_733719-MLB103372685660_012026-O.jpg',
      'https://http2.mlstatic.com/D_729925-MLB103372675688_012026-O.jpg',
      'https://http2.mlstatic.com/D_971226-MLB103372577668_012026-O.jpg',
      'https://http2.mlstatic.com/D_608815-MLB103890373575_012026-O.jpg',
    ],
    descricao: `🤖 Blokees Transformers – Figura de Montar Colecionável Surpresa

Monte seu próprio Transformer! Figuras de 5,5 cm com acabamento metálico e 14 pontos de articulação para criar poses cheias de ação. Cada caixa é uma surpresa, o que torna a coleção ainda mais divertida.

📦 O que vem na caixa
• 1 figura surpresa para montar
• Personagem aleatório entre as 12 figuras da coleção (não é possível escolher o personagem)

✨ Características
• Tamanho da figura: 5,5 cm
• 14 pontos de articulação por figura, com cabeça giratória 360° e braços e pernas móveis
• Montagem simples: de 6 a 23 peças por figura
• Material: plástico ABS + partes metálicas
• Personagens da coleção incluem Optimus Prime Firepower e Megatron Fully Armed
• Certificação INMETRO
• Idade recomendada: a partir de 8 anos
• Produto original, novo e lacrado

⚠️ Cuidados
Contém peças pequenas. Não indicado para crianças menores de 3 anos.

🔎 Importante
Por ser um produto surpresa, o personagem é aleatório e não pode ser escolhido.`,
    variacoes: [['58261866306', null, null, 27.09, 62]],
  },
  {
    slug: 'estacao-espacial-inblox-blocos-de-montar',
    titulo: 'Estação Espacial Inblox — blocos de montar',
    categoria: 'Blocos de montar',
    peso_g: 300, medidas: [33, 12, 6],
    descricao: `🚀 Estação Espacial Inblox – Blocos de Montar com Tema Espacial

Monte sua própria missão no espaço! Sonda, nave, satélite e foguete, cada um com detalhes e peças próprios, para brincar, criar histórias e decorar o quarto.

📦 O que vem na caixa
• O modelo escolhido na variação
• Manual ilustrado de montagem

✨ Características
• Material: plástico ABS de alta resistência, não tóxico
• Tamanho montado: aproximadamente 8 a 12 cm de altura (varia conforme o modelo)
• Peças coloridas e de encaixe fácil
• Compatível com outras marcas de blocos de montar
• Indicação: a partir de 6 anos
• Estimula criatividade, concentração e coordenação motora

⚠️ Cuidados
Contém peças pequenas. Não indicado para crianças menores de 3 anos. Recomendamos a supervisão de um adulto durante a montagem.

🔎 Importante
As versões "Menor" são diferentes das versões padrão. Confira com atenção o modelo escolhido.`,
    variacoes: [
      ['INB-ESP-NAV', 'Nave Espacial', shopee('sg-11134201-7rdwd-mc2frtngszym94'), 34.3, 7],
      ['INB-ESP-FOG', 'Foguete Espacial', shopee('sg-11134201-7rdwd-mc2frw6749qm0e'), 34.3, 2],
      ['INB-ESP-SON', 'Sonda Espacial', shopee('sg-11134201-7rdw1-mc2fs2ai5vq0e1'), 33.3, 3],
      ['INB-ESP-SAT', 'Satélite', shopee('sg-11134201-7rdvl-mc2frzq3x3akbb'), 33.3, 6],
      ['INB-ESP-NAV-M', 'Nave Menor', shopee('sg-11134201-8259w-mqti582i9c74bf'), 33.74, 6],
      ['INB-ESP-SAT-M', 'Satélite Menor', shopee('sg-11134201-825ag-mqti67qyic5pe0'), 33.74, 2],
      ['INB-ESP-ROB-M', 'Robô Espacial Menor', shopee('sg-11134201-8259t-mqti5qnhro5ea8'), 33.74, 3],
      ['INB-ESP-SON-M', 'Sonda Menor', shopee('sg-11134201-8259d-mqti6p6eegap4d'), 33.74, 0],
    ],
  },
  {
    slug: 'micro-blocos-de-natal',
    titulo: 'Micro blocos de Natal',
    categoria: 'Natal',
    peso_g: 400, medidas: [33, 12, 6],
    descricao: `🎄 Blocos de Montar de Natal – Micro Blocos para Decorar e Presentear

Deixe o Natal ainda mais especial montando figuras natalinas em micro blocos cheios de detalhes! Perfeitos para decorar a casa, a mesa ou a árvore, para presentear ou para uma atividade divertida em família.

📦 O que vem na caixa
• 1 modelo de micro blocos (o escolhido na variação)
• Manual de montagem

✨ Características
• Tema natalino
• Micro blocos detalhados, ideais para construções criativas
• Blocos em plástico ABS resistente
• Desenvolve coordenação motora, paciência e criatividade
• Ideal para presente, decoração ou passatempo
• Idade recomendada: a partir de 6 anos

⚠️ Cuidados
Contém peças pequenas. Não recomendado para menores de 3 anos. Recomendamos a supervisão de um adulto durante a montagem.

📌 Observação
As medidas podem variar em até 2 cm devido à medição manual.

🔎 Importante
Cada unidade corresponde a UM modelo. Para montar a coleção completa, adicione ao carrinho cada modelo desejado.`,
    variacoes: [
      ['186062448949', 'Boneco de Neve Gorro Vermelho', shopee('br-11134207-7r98o-m2mt7xhjiside1'), 28.3, 9],
      ['186062448947', 'Boneco de Neve', shopee('br-11134207-7r98o-m2mt7xhjhdxx79'), 28.3, 4],
      ['186062448957', 'Trenó', shopee('br-11134207-7r98o-m2mt7xhjoes55a'), 28.3, 5],
      ['186062448951', 'Duende', shopee('br-11134207-7r98o-m2mt7xhjk72t09'), 28.3, 4],
      ['186062448959', 'Trenzinho', shopee('br-11134207-7r98o-m2mt7xhjptcl7a'), 28.3, 3],
      ['186062448955', 'Sinos e Bota', shopee('br-11134207-7r98o-m2mt7xhjn07p20'), 28.3, 3],
      ['186062448943', 'Papai Noel', shopee('br-11134207-7r98o-m2mt7xhjekt1b6'), 28.3, 0],
      ['186062448953', 'Rena', shopee('br-11134207-7r98o-m2mt7xhjlln975'), 28.3, 0],
      ['186062448945', 'Árvore de Natal', shopee('br-11134207-7r98o-m2mt7xhjfzdh5a'), 28.3, 0],
    ],
  },
  {
    slug: 'jogo-taco-gato-cabra-queijo-pizza',
    titulo: 'Taco Gato Cabra Queijo Pizza — jogo de cartas',
    categoria: 'Jogos de cartas',
    peso_g: 150, medidas: [10, 7, 3],
    fotos: [
      'https://http2.mlstatic.com/D_835801-MLB82292367593_022025-O.jpg',
      'https://http2.mlstatic.com/D_938862-MLB82010577420_022025-O.jpg',
      'https://http2.mlstatic.com/D_849246-MLB82010577502_022025-O.webp',
      'https://http2.mlstatic.com/D_685813-MLB82010223614_022025-O.jpg',
      'https://http2.mlstatic.com/D_879658-MLB82010184488_022025-O.jpg',
      'https://http2.mlstatic.com/D_805839-MLB82010263680_022025-O.jpg',
    ],
    descricao: `🌮 Taco Gato Cabra Queijo Pizza – Jogo de Cartas Papergames

Guarde estas 5 palavras malucas: Taco, Gato, Cabra, Queijo e Pizza! Jogue uma carta enquanto fala uma das palavras. Quando a carta jogada coincidir com a palavra falada, todos correm para bater a mão na pilha central, e o último a bater leva a pilha inteira. Vence quem se livrar primeiro de todas as cartas. Parece fácil, mas a sua mente vai pregar peças em você!

📦 O que vem na caixa
• 64 cartas
• Folheto de regras

✨ Características
• Número de jogadores: 2 a 8
• Duração: cerca de 10 minutos por partida
• Idade recomendada: a partir de 6 anos
• Dimensões: 10 x 7 x 3,3 cm
• Peso: 150 g

💡 Por que vale a pena
• Regras simples: dá para começar a jogar em poucos minutos
• Estimula atenção, reflexo e raciocínio rápido
• Diversão para crianças e adultos ao mesmo tempo
• Tamanho compacto, fácil de levar para viagens e encontros`,
    variacoes: [['23998178842', null, null, 44.9, 3]],
  },
];

// O resto do catálogo foi lido do Ryzo e gravado em catalogo-demo.json. Os feitos à mão ganham em
// caso de SKU ou slug repetido; entrada malformada é descartada em vez de derrubar a página.
const skusAMao = new Set(FEITOS_A_MAO.flatMap(b => b.variacoes.map(v => v[0])));
const slugs = new Set(FEITOS_A_MAO.map(b => b.slug));
const BRUTOS: Bruto[] = [...FEITOS_A_MAO];
for (const b of catalogoExtra as unknown as Bruto[]) {
  if (!b || !/^[a-z0-9-]{1,80}$/.test(b.slug) || slugs.has(b.slug) || !Array.isArray(b.variacoes)) continue;
  const variacoes = b.variacoes.filter(v => Array.isArray(v) && typeof v[0] === 'string' && !skusAMao.has(v[0]) && Number(v[3]) > 0);
  if (!variacoes.length) continue;
  slugs.add(b.slug);
  BRUTOS.push({ ...b, variacoes, fotos: Array.isArray(b.fotos) && b.fotos.length ? b.fotos : undefined });
}

const PRODUTOS: Produto[] = BRUTOS.map(b => {
  const variacoes = b.variacoes.map(([sku, rotulo, foto, preco, estoque]) => ({
    sku, rotulo, foto, preco: precoSugeridoDoSite(preco), estoque,
  }));
  const fotosDasVariacoes = [...new Set(variacoes.map(v => v.foto).filter(Boolean) as string[])].slice(0, 6);
  const comEstoque = variacoes.filter(v => v.estoque > 0);
  return {
    slug: b.slug, titulo: b.titulo, categoria: b.categoria, descricao: b.descricao,
    fotos: b.fotos ?? fotosDasVariacoes,
    preco_a_partir: Math.min(...(comEstoque.length ? comEstoque : variacoes).map(v => v.preco)),
    disponivel: comEstoque.length > 0,
    variacoes,
    peso_g: b.peso_g,
    medidas_cm: { comprimento: b.medidas[0], largura: b.medidas[1], altura: b.medidas[2] },
  };
});

const porSku = new Map(PRODUTOS.flatMap(p => p.variacoes.map(v => [v.sku, { p, v }] as const)));

export function catalogo(): Produto[] { return PRODUTOS; }
export function produto(slug: string): Produto | null { return PRODUTOS.find(p => p.slug === slug) ?? null; }

export function disponibilidade(itens: ItemDoCarrinho[]): Disponibilidade {
  const linhas = itens.map(({ sku, qtd }) => {
    const achado = porSku.get(sku);
    const disponivel = achado?.v.estoque ?? 0;
    return { sku, qtd, a_venda: !!achado, preco: achado?.v.preco ?? 0, disponivel, ok: !!achado && disponivel >= qtd };
  });
  const subtotal = Number(linhas.reduce((s, l) => s + (l.a_venda ? l.preco * l.qtd : 0), 0).toFixed(2));
  return { ok: linhas.length > 0 && linhas.every(l => l.ok), itens: linhas, subtotal };
}

export function frete(itens: ItemDoCarrinho[], cep: string): OpcaoFrete[] {
  if (!/^\d{8}$/.test(cep)) throw new ErroRyzo('CEP inválido.', 400);
  const foraDeVenda = itens.filter(i => !porSku.has(i.sku)).map(i => i.sku);
  if (foraDeVenda.length) throw new ErroRyzo('Item fora de venda.', 409, foraDeVenda);
  const pesoKg = itens.reduce((s, i) => s + (porSku.get(i.sku)!.p.peso_g ?? 300) * i.qtd, 0) / 1000;
  // Sudeste (CEP 0 a 3) mais perto da origem; o resto do país leva mais tempo e custa mais.
  const longe = Number(cep[0]) >= 4;
  const r = (v: number) => Number(v.toFixed(2));
  return [
    { id: 1, nome: 'PAC', transportadora: 'Correios', preco: r(17.9 + pesoKg * 4 + (longe ? 9 : 0)), prazo_dias: longe ? 9 : 5 },
    { id: 2, nome: 'SEDEX', transportadora: 'Correios', preco: r(24.9 + pesoKg * 7 + (longe ? 14 : 0)), prazo_dias: longe ? 4 : 2 },
    { id: 3, nome: '.Package', transportadora: 'Jadlog', preco: r(15.9 + pesoKg * 5 + (longe ? 11 : 0)), prazo_dias: longe ? 8 : 4 },
  ];
}

interface PedidoDemo { pedido: Pedido; pagamento: Pagamento | null; email: string; }
const pedidos = new Map<string, PedidoDemo>();

export function criarPedido(novo: NovoPedido): PedidoCriado {
  const disp = disponibilidade(novo.itens);
  if (!disp.ok) throw new ErroRyzo('Sem estoque suficiente.', 409, disp.itens.filter(i => !i.ok).map(i => i.sku));
  let envio: PedidoCriado['envio'] = null;
  let valorFrete = 0;
  if (novo.frete && novo.entrega) {
    const opcao = frete(novo.itens, novo.entrega.cep).find(o => o.id === novo.frete!.servico_id);
    if (!opcao) throw new ErroRyzo('Esta opção de frete não está mais disponível. Calcule o frete de novo.', 409);
    envio = { servico: opcao.nome, transportadora: opcao.transportadora, prazo_dias: opcao.prazo_dias };
    valorFrete = opcao.preco;
  }
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const sorteio = crypto.getRandomValues(new Uint8Array(10));
  const codigo = 'SITE-' + Array.from(sorteio, b => letras[b % letras.length]).join('');
  const total = Number((disp.subtotal + valorFrete).toFixed(2));
  pedidos.set(codigo, {
    pagamento: null, email: novo.comprador.email.toLowerCase(),
    pedido: {
      codigo, status: 'aguardando_pagamento', total, frete: valorFrete, criado_em: new Date().toISOString(),
      itens: novo.itens.map(i => {
        const { p, v } = porSku.get(i.sku)!;
        return { sku: i.sku, titulo: p.titulo, rotulo: v.rotulo, qtd: i.qtd, preco: v.preco };
      }),
      envio: envio ? { ...envio, status: null, rastreio: null, status_transportadora: null } : null,
    },
  });
  if (pedidos.size > 200) pedidos.delete(pedidos.keys().next().value as string);
  return { codigo, subtotal: disp.subtotal, frete: valorFrete, total, envio };
}

export function pedido(codigo: string): Pedido | null { return pedidos.get(codigo)?.pedido ?? null; }

/** Pedidos feitos com este e-mail, do mais novo para o mais antigo (só os desta instância). */
export function pedidosDoEmail(email: string): Pedido[] {
  const alvo = email.toLowerCase();
  return [...pedidos.values()].filter(r => r.email === alvo).map(r => r.pedido).reverse();
}

export function configPagamento(): ConfigPagamento {
  return { public_key: '', ambiente: 'teste', metodos: ['pix', 'cartao', 'boleto'] };
}

export function pagar(codigo: string, corpo: PedidoDePagamento): { pagamento: Pagamento; status: StatusPedido } {
  const reg = pedidos.get(codigo);
  if (!reg) throw new ErroRyzo('Pedido não encontrado.', 404);
  if (reg.pedido.status !== 'aguardando_pagamento') throw new ErroRyzo('Este pedido não está aguardando pagamento.', 409);
  const expira = new Date(Date.now() + 30 * 60_000).toISOString();
  const id = `demo-${Date.now()}`;
  let pg: Pagamento;
  if (corpo.metodo === 'pix') {
    pg = { id, metodo: 'pix', status: 'aguardando', detalhe: null, expira_em: expira,
      pix: { qr: `00020126580014BR.GOV.BCB.PIX0136DEMONSTRACAO-NAO-PAGUE-${codigo}5204000053039865802BR6304ABCD`, qr_base64: null } };
  } else if (corpo.metodo === 'boleto') {
    pg = { id, metodo: 'boleto', status: 'aguardando', detalhe: null, expira_em: new Date(Date.now() + 3 * 86_400_000).toISOString(),
      boleto: { url: 'https://example.com/boleto-de-demonstracao', linha: '00190.00009 01234.567898 12345.678909 1 00000000000000' } };
  } else {
    pg = { id, metodo: 'cartao', status: 'aprovado', detalhe: 'accredited', expira_em: null };
    reg.pedido.status = 'pago';
  }
  reg.pagamento = pg;
  return { pagamento: pg, status: reg.pedido.status };
}

export function pagamento(codigo: string): { pagamento: Pagamento | null; status: StatusPedido | null } {
  const reg = pedidos.get(codigo);
  return { pagamento: reg?.pagamento ?? null, status: reg?.pedido.status ?? null };
}
