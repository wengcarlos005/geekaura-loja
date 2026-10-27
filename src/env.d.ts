/// <reference types="astro/client" />

interface Env {
  RYZO_URL?: string;
  RYZO_VITRINE_KEY?: string;
  CART_SECRET?: string;
}

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {
    nonce: string;
  }
}
