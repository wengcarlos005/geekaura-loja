// POST /api/conta/entrar {email, senha} — abre a sessão do cliente (cookie httpOnly).
import type { APIRoute } from 'astro';
import { envDe, erro, falha, json, lerJson, limitar, origemValida } from '../../../lib/api';
import { entrar, gravarSessao, validarSenha } from '../../../lib/conta';
import { emailValido } from '../../../lib/formato';

export const POST: APIRoute = async ctx => {
  try {
    if (!origemValida(ctx)) return erro('Origem não permitida.', 403);
    if (!limitar(ctx, 'entrar', 10)) return erro('Muitas tentativas seguidas. Espere um minuto.', 429);
    const corpo = await lerJson(ctx.request, 1000);
    const email = emailValido(corpo?.email);
    const senha = validarSenha(corpo?.senha);
    if (!email || !senha) return erro('E-mail ou senha incorretos.', 401);
    const sessao = await entrar(envDe(ctx), email, senha);
    await gravarSessao(ctx, sessao);
    return json({ ok: true, nome: sessao.n });
  } catch (e) {
    if (e instanceof Response) return e;
    return falha(e);
  }
};
