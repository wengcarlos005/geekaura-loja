import { describe, expect, it } from 'vitest';
import { diaBR, ehRobo } from '../src/lib/metricas';

describe('contagem de visitas', () => {
  it('robô e prévia de link não contam; navegador conta', () => {
    expect(ehRobo('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')).toBe(true);
    expect(ehRobo('WhatsApp/2.23.20.0 A')).toBe(true);
    expect(ehRobo('facebookexternalhit/1.1')).toBe(true);
    expect(ehRobo(null)).toBe(true);
    expect(ehRobo('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile/15E148 Safari/604.1')).toBe(false);
  });

  it('o dia do cookie é o de Brasília', () => {
    expect(diaBR(Date.parse('2026-11-25T02:30:00Z'))).toBe('2026-11-24');
    expect(diaBR(Date.parse('2026-11-25T03:30:00Z'))).toBe('2026-11-25');
  });
});

describe('envio ao Ryzo', () => {
  it('manda os eventos com a chave, fora do caminho da resposta (waitUntil), e ignora robô', async () => {
    const { contar } = await import('../src/lib/metricas');
    const chamadas: { url: string; corpo: string; auth: string | null }[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = (async (url: string, init: RequestInit) => {
      chamadas.push({ url, corpo: String(init.body), auth: new Headers(init.headers).get('authorization') });
      return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
    }) as any;
    try {
      const pendentes: Promise<unknown>[] = [];
      const locals = { runtime: { env: { RYZO_URL: 'https://ryzo.test', RYZO_VITRINE_KEY: 'rzv_x' }, ctx: { waitUntil: (p: Promise<unknown>) => pendentes.push(p) } } } as any;
      const navegador = new Request('https://loja.test/', { headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0) Chrome/130' } });
      contar({ locals, request: navegador }, ['visualizacao', 'visitante']);
      contar({ locals, request: new Request('https://loja.test/', { headers: { 'user-agent': 'Googlebot/2.1' } }) }, ['visualizacao']);
      await Promise.all(pendentes);
      expect(pendentes).toHaveLength(1);
      expect(chamadas).toHaveLength(1);
      expect(chamadas[0].url).toBe('https://ryzo.test/vitrine/v1/eventos');
      expect(chamadas[0].auth).toBe('Bearer rzv_x');
      expect(JSON.parse(chamadas[0].corpo)).toEqual({ eventos: [{ tipo: 'visualizacao' }, { tipo: 'visitante' }] });
    } finally { globalThis.fetch = original; }
  });
});
