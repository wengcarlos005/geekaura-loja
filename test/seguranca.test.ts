import { describe, expect, it } from 'vitest';
import { carimbarNonce, politica } from '../src/lib/seguranca';

describe('CSP', () => {
  it('nonce entra em todo script sem nonce, e só neles', () => {
    const html = '<script type="module" src="/a.js"></script><script>x()</script><script nonce="velho"></script><scripts>';
    expect(carimbarNonce(html, 'N')).toBe('<script nonce="N" type="module" src="/a.js"></script><script nonce="N">x()</script><script nonce="velho"></script><scripts>');
  });

  it('política de produção não libera script inline nem eval', () => {
    const p = politica('abc');
    const script = p.split('; ').find(d => d.startsWith('script-src'))!;
    expect(script).toContain("'nonce-abc'");
    expect(script).not.toContain('unsafe-inline');
    expect(script).not.toContain('unsafe-eval');
    expect(p).toContain("object-src 'none'");
    expect(p).toContain("frame-ancestors 'none'");
    expect(p).toContain('upgrade-insecure-requests');
    expect(p).not.toContain('ws:');
  });

  it('libera iframe do Mercado Pago (cartão e 3DS)', () => {
    expect(politica('x')).toMatch(/frame-src [^;]*https:\/\/\*\.mercadopago\.com/);
  });
});
