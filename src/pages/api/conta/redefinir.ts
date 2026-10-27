// POST /api/conta/redefinir {email, codigo, senha} — troca a senha com o código do e-mail e já entra.
import type { APIRoute } from 'astro';
import { envDe, erro, falha, json, lerJson, limitar, origemValida } from '../../../lib/api';
import { gravarSessao, redefinirSenha, validarSenha } from '../../../lib/conta';
import { emailValido } from '../../../lib/formato';

export const POST: APIRoute = async ctx => {
  try {
    if (!origemValida(ctx)) return erro('Origem não permitida.', 403);
    if (!limitar(ctx, 'redefinir', 8)) return erro('Muitas tentativas seguidas. Espere um minuto.', 429);
    const corpo = await lerJson(ctx.request, 1000);
    const email = emailValido(corpo?.email);
    const codigo = String(corpo?.codigo ?? '').replace(/\D/g, '');
    const senha = validarSenha(corpo?.senha);
    if (!email) return erro('E-mail inválido.');
    if (!/^\d{6}$/.test(codigo)) return erro('O código tem 6 números.');
    if (!senha) return erro('A nova senha precisa ter pelo menos 8 caracteres.');
    const sessao = await redefinirSenha(envDe(ctx), email, codigo, senha);
    await gravarSessao(ctx, sessao);
    return json({ ok: true, nome: sessao.n });
  } catch (e) {
    if (e instanceof Response) return e;
    return falha(e);
  }
};
