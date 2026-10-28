// CSP e cabeçalhos de segurança. Separado do middleware para poder ser testado sem o Astro.
//
// O Astro não carimba nonce sozinho, então a página é gerada primeiro e o nonce entra depois em
// cada <script> do HTML. Com 'strict-dynamic', o que um script com nonce carrega também é aceito:
// é o que deixa o SDK do Mercado Pago (carregado só quando o comprador escolhe cartão) puxar os
// arquivos dele sem a gente manter uma lista de domínios que muda sem aviso.

import { GA_DOMINIOS } from './analytics';

const MERCADO_PAGO = {
  script: ['https://sdk.mercadopago.com', 'https://http2.mlstatic.com'],
  connect: ['https://api.mercadopago.com', 'https://api.mercadolibre.com', 'https://events.mercadopago.com'],
  // Secure fields do cartão e desafio 3DS rodam em iframe do próprio Mercado Pago.
  frame: ['https://*.mercadopago.com', 'https://*.mercadopago.com.br', 'https://*.mercadolibre.com', 'https://*.mercadolivre.com.br'],
};

export function gerarNonce(): string {
  const b = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...b));
}

export function politica(nonce: string, dev = false): string {
  return [
    `default-src 'self'`,
    `script-src 'nonce-${nonce}' 'strict-dynamic' 'self' ${[...MERCADO_PAGO.script, ...GA_DOMINIOS.script].join(' ')}`,
    // Atributo style é usado pontualmente; folha de estilo vem sempre de arquivo.
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: https:`,
    `font-src 'self'`,
    `connect-src 'self' https://viacep.com.br ${[...MERCADO_PAGO.connect, ...GA_DOMINIOS.connect].join(' ')}${dev ? ' ws: wss:' : ''}`,
    `frame-src ${MERCADO_PAGO.frame.join(' ')}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    ...(dev ? [] : ['upgrade-insecure-requests']),
  ].join('; ');
}

export const CABECALHOS_FIXOS: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), usb=(), interest-cohort=(), payment=(self)',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

/** Coloca o nonce em todo <script> que ainda não tem um. */
export function carimbarNonce(html: string, nonce: string): string {
  return html.replace(/<script(?![^>]*\snonce=)(?=[\s>])/gi, `<script nonce="${nonce}"`);
}
