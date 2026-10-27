// POST /api/conta/cadastro {nome, email, senha, telefone?} — cria a conta e já entra.
import type { APIRoute } from 'astro';
import { envDe, erro, falha, json, lerJson, limitar, origemValida } from '../../../lib/api';
import { cadastrar, gravarSessao, validarCadastro } from '../../../lib/conta';

export const POST: APIRoute = async ctx => {
  try {
    if (!origemValida(ctx)) return erro('Origem não permitida.', 403);
    if (!limitar(ctx, 'cadastro', 5)) return erro('Muitas tentativas seguidas. Espere um minuto.', 429);
    const corpo = await lerJson(ctx.request, 2000);
    const v = validarCadastro(corpo);
    if (!v.ok) return erro(v.erro);
    if (corpo?.aceite !== true) return erro('Para criar a conta, aceite os termos de uso e a política de privacidade.');
    const sessao = await cadastrar(envDe(ctx), v.valor);
    await gravarSessao(ctx, sessao);
    return json({ ok: true, nome: sessao.n }, 201);
  } catch (e) {
    if (e instanceof Response) return e;
    return falha(e);
  }
};
