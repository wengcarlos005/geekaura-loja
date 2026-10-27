import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://geekaura.com.br',
  output: 'server',
  adapter: cloudflare({ platformProxy: { enabled: true }, imageService: 'passthrough' }),
  security: { checkOrigin: true },
  // CSS sempre em arquivo: com <style> embutido a CSP precisaria liberar estilo inline também.
  build: { inlineStylesheets: 'never' },
  devToolbar: { enabled: false },
  // Nada de arquivo virando data: URI (fonte pequena virava, e a CSP de fonte é só 'self').
  vite: { build: { assetsInlineLimit: 0 } },
  // O site não usa Astro.session; sem isto o adaptador exige um KV "SESSION" à toa.
  session: { driver: 'null' },
});
