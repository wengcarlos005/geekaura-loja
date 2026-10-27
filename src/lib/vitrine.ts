// Escolha dos produtos em destaque. O objetivo é variedade: a vitrine intercala categorias (para não
// mostrar dez blocos de montar seguidos) e gira sozinha a cada período, então quem volta no dia
// seguinte vê outros produtos. O sorteio é determinístico por período: todo mundo vê a mesma vitrine
// naquelas horas, a página não "pula" a cada recarga e o resultado pode ser testado.
import type { ProdutoResumo } from './ryzo';

/** Número que muda a cada `horas` horas (horário de Brasília) e serve de semente do sorteio. */
export function sementeDoPeriodo(agora = Date.now(), horas = 6): number {
  return Math.floor((agora - 3 * 3_600_000) / (horas * 3_600_000));
}

/** Gerador pseudoaleatório pequeno (mulberry32): mesma semente, mesma sequência. */
function gerador(semente: number) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function embaralhar<T>(lista: readonly T[], semente: number): T[] {
  const r = gerador(semente);
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/**
 * Até `n` produtos com estoque e foto, intercalando categorias: um de cada categoria por rodada,
 * na ordem sorteada, até completar. `excluir` evita repetir o que outra fileira já mostrou.
 */
export function escolherDestaques(produtos: readonly ProdutoResumo[], n: number, semente: number, excluir: ReadonlySet<string> = new Set()): ProdutoResumo[] {
  const candidatos = produtos.filter(p => p.disponivel && p.fotos.length > 0 && !excluir.has(p.slug));
  const porCategoria = new Map<string, ProdutoResumo[]>();
  for (const p of embaralhar(candidatos, semente)) {
    const lista = porCategoria.get(p.categoria) ?? [];
    lista.push(p);
    porCategoria.set(p.categoria, lista);
  }
  const filas = embaralhar([...porCategoria.values()], semente + 7);
  const escolhidos: ProdutoResumo[] = [];
  while (escolhidos.length < n && filas.some(f => f.length)) {
    for (const fila of filas) {
      const p = fila.shift();
      if (p) escolhidos.push(p);
      if (escolhidos.length >= n) break;
    }
  }
  return escolhidos;
}
