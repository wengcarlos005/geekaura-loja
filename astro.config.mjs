import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://geekaura.com.br',
  output: 'server',
  adapter: cloudflare({ platformProxy: { enabled: true } }),
  security: { checkOrigin: true },
  // CSS sempre em arquivo: com <style> embutido a CSP precisaria liberar estilo inline também.
  build: { inlineStylesheets: 'never' },
  devToolbar: { enabled: false },
});
