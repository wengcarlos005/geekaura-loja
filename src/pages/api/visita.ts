import type { APIRoute } from 'astro';
import { limitar, origemValida } from '../../lib/api';
import { COOKIE_VISITA, contar, diaBR, type EventoDoSite } from '../../lib/metricas';

// Visita contada pelo NAVEGADOR (src/scripts/loja.ts), não pelo servidor ao entregar a página.
// Até 27/11/2026 a contagem era no middleware, e o primeiro dia deu 638 visitantes para 638
// páginas vistas: cada acesso chegava sem o cookie do anterior, assinatura de robô que não se
// identifica como "bot" (rastreador da Meta, verificador de página do Google Shopping, raspador).
// Agora só conta quem abriu a página num navegador, com a aba visível e por pelo menos 1,5 s.
export const POST: APIRoute = async ctx => {
  const vazio = new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
  if (!origemValida(ctx) || !ctx.request.headers.get('accept-language')) return vazio;
  if (!limitar(ctx, 'visita', 60)) return vazio;
  let produto = false;
  try {
    const texto = (await ctx.request.text()).slice(0, 200);
    produto = JSON.parse(texto || '{}')?.produto === true;
  } catch { /* corpo estranho: conta só a página */ }
  const eventos: EventoDoSite[] = ['visualizacao'];
  if (produto) eventos.push('produto_visto');
  const hoje = diaBR();
  if (ctx.cookies.get(COOKIE_VISITA)?.value !== hoje) {
    eventos.push('visitante');
    ctx.cookies.set(COOKIE_VISITA, hoje, { path: '/', maxAge: 172800, sameSite: 'lax', secure: true, httpOnly: true });
  }
  contar(ctx, eventos);
  return vazio;
};
