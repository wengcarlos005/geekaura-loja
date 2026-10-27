import { describe, expect, it } from 'vitest';
import { jsonLdSeguro, resumo } from '../src/lib/seo';

describe('JSON-LD', () => {
  it('não deixa um título fechar a tag script', () => {
    const saida = jsonLdSeguro({ name: 'Navio</script><script>alert(1)</script>' });
    expect(saida).not.toContain('</script>');
    expect(saida).not.toContain('<');
    expect(JSON.parse(saida).name).toBe('Navio</script><script>alert(1)</script>');
  });
});

describe('resumo', () => {
  it('tira emoji e quebra de linha e corta em palavra', () => {
    const r = resumo('🚀 Estação Espacial\n\nMonte sua própria missão no espaço! ' + 'palavra '.repeat(40), 80);
    expect(r.startsWith('Estação Espacial Monte')).toBe(true);
    expect(r.length).toBeLessThanOrEqual(80);
    expect(r.endsWith('…')).toBe(true);
  });
});
