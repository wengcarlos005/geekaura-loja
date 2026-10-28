/// <reference types="astro/client" />

interface Env {
  RYZO_URL?: string;
  RYZO_VITRINE_KEY?: string;
  CART_SECRET?: string;
  /** ID de medição do Google Analytics 4 (G-XXXXXXX). Sem ele o site não carrega o Analytics. */
  GA_ID?: string;
}

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {
    nonce: string;
  }
}

interface Window { gtag?: (...args: unknown[]) => void; dataLayer?: unknown[]; }
