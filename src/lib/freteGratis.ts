// Regra do frete grátis, igual à do Ryzo (que é quem decide de verdade): com subtotal de produtos a
// partir do limite, a opção mais barata sai de graça e as outras cobram só a diferença. Aqui ela é
// usada pelo modo demonstração e para a barra "faltam R$ X"; em produção o preço já vem pronto.
import type { OpcaoFrete } from './ryzo';

export function aplicarFreteGratis<T extends { preco: number }>(opcoes: T[], subtotal: number, limite: number | null):
  (T & { preco_original: number; gratis: boolean })[] {
  const valeGratis = limite !== null && Number.isFinite(limite) && limite > 0 && subtotal >= limite && opcoes.length > 0;
  const menor = valeGratis ? Math.min(...opcoes.map(o => o.preco)) : 0;
  return opcoes.map(o => {
    const preco = valeGratis ? Math.max(0, Number((o.preco - menor).toFixed(2))) : o.preco;
    return { ...o, preco, preco_original: o.preco, gratis: valeGratis && preco === 0 };
  });
}

/** Quanto falta para o frete grátis (0 quando já ganhou; null quando não há frete grátis). */
export function faltaParaFreteGratis(subtotal: number, limite: number | null): number | null {
  if (limite === null || !(limite > 0)) return null;
  return Math.max(0, Number((limite - subtotal).toFixed(2)));
}

