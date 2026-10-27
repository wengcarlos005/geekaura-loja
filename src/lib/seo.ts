// JSON-LD é a única coisa do site que sai como HTML cru (set:html), porque precisa ir dentro de
// <script type="application/ld+json">. Esta função é o portão: sem ela, um título de produto com
// "</script>" fecharia a tag e viraria HTML na página.
export function jsonLdSeguro(dados: unknown): string {
  return JSON.stringify(dados)
    .replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

/** Descrição curta para <meta>: primeira frase útil, sem emoji e sem quebra de linha. */
export function resumo(texto: string, max = 155): string {
  const limpo = texto.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '').replace(/\s+/g, ' ').trim();
  if (limpo.length <= max) return limpo;
  const corte = limpo.slice(0, max - 1);
  return corte.slice(0, Math.max(corte.lastIndexOf(' '), max - 20)).replace(/[\s,.;:–—-]+$/, '') + '…';
}
