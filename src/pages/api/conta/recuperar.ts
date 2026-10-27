// POST /api/conta/recuperar {email} — pede o código de redefinição. Responde igual exista ou não a conta.
import type { APIRoute } from 'astro';
import { envDe, erro, falha, json, lerJson, limitar, origemValida } from '../../../lib/api';
import { pedirCodigo } from '../../../lib/conta';
import { emailValido } from '../../../lib/formato';

export const POST: APIRoute = async ctx => {
  try {
    if (!origemValida(ctx)) return erro('Origem não permitida.', 403);
    if (!limitar(ctx, 'recuperar', 4)) return erro('Muitas tentativas seguidas. Espere um minuto.', 429);
    const corpo = await lerJson(ctx.request, 500);
    const email = emailValido(corpo?.email);
    if (!email) return erro('E-mail inválido.');
    await pedirCodigo(envDe(ctx), email);
    return json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return falha(e);
  }
};
