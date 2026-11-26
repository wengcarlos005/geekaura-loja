// Contadores do painel "Indicadores" do Ryzo: visitante (um por pessoa por dia), página vista,
// produto visto, produto adicionado ao carrinho e fechamento aberto. Sai do SERVIDOR do site, depois
// da resposta (waitUntil): contar nunca atrasa a página e falha de contagem nunca vira erro na tela.
// Robô de busca, prévia de link (WhatsApp, Facebook) e monitor ficam de fora pelo User-Agent.
import { chamar, modoDemo } from './ryzo';
import { envDe } from './api';

export type EventoDoSite = 'visitante' | 'visualizacao' | 'produto_visto' | 'carrinho' | 'checkout';

const ROBO = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|monitor|lighthouse|headless|pingdom|uptime|curl|wget|python|axios|node-fetch|go-http|java\//i;

export function ehRobo(ua: string | null | undefined): boolean {
  return !ua || ROBO.test(ua);
}

/** Dia civil em Brasília, "AAAA-MM-DD": é a chave do cookie de visitante do dia. */
export function diaBR(ts = Date.now()): string {
  return new Date(ts - 3 * 3600_000).toISOString().slice(0, 10);
}

export const COOKIE_VISITA = 'ga_dia';

export function contar(ctx: { locals: App.Locals; request: Request }, eventos: EventoDoSite[]): void {
  if (!eventos.length || ehRobo(ctx.request.headers.get('user-agent'))) return;
  const env = envDe(ctx);
  if (modoDemo(env)) return;
  const envio = chamar(env, 'POST', '/eventos', { eventos: eventos.map(tipo => ({ tipo })) }).catch(() => undefined);
  const exec = ctx.locals.runtime?.ctx;
  if (exec?.waitUntil) exec.waitUntil(envio);
}
