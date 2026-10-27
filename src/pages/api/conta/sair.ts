// POST /api/conta/sair — encerra a sessão no Ryzo e apaga o cookie. Aceita formulário comum.
import type { APIRoute } from 'astro';
import { envDe, erro, origemValida } from '../../../lib/api';
import { gravarSessao, lerSessao, sair } from '../../../lib/conta';

export const POST: APIRoute = async ctx => {
  if (!origemValida(ctx)) return erro('Origem não permitida.', 403);
  const s = await lerSessao(ctx);
  if (s) await sair(envDe(ctx), s);
  await gravarSessao(ctx, null);
  return ctx.redirect('/', 303);
};
