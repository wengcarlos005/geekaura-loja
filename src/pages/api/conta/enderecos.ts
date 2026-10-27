// POST /api/conta/enderecos {acao: 'salvar'|'apagar', id?, endereco?} — endereços do cliente logado.
import type { APIRoute } from 'astro';
import { envDe, erro, falha, json, lerJson, limitar, origemValida } from '../../../lib/api';
import { apagarEndereco, gravarSessao, lerSessao, salvarEndereco, validarEndereco } from '../../../lib/conta';
import { ErroRyzo } from '../../../lib/ryzo';

const RE_ID = /^[A-Za-z0-9_-]{1,60}$/;

export const POST: APIRoute = async ctx => {
  try {
    if (!origemValida(ctx)) return erro('Origem não permitida.', 403);
    if (!limitar(ctx, 'conta-enderecos', 20)) return erro('Muitas alterações seguidas. Espere um instante.', 429);
    const s = await lerSessao(ctx);
    if (!s) return erro('Entre na sua conta de novo.', 401, { sessao: false });
    const corpo = await lerJson(ctx.request, 3000);
    const id = corpo?.id ? String(corpo.id) : undefined;
    if (id !== undefined && !RE_ID.test(id)) return erro('Endereço inválido.');
    const env = envDe(ctx);
    if (corpo?.acao === 'apagar') {
      if (!id) return erro('Endereço inválido.');
      const r = await apagarEndereco(env, s, id);
      await gravarSessao(ctx, r.sessao);
      return json({ ok: true, enderecos: r.enderecos });
    }
    if (corpo?.acao === 'salvar') {
      const v = validarEndereco(corpo?.endereco);
      if (!v.ok) return erro(v.erro);
      const r = await salvarEndereco(env, s, v.valor, id);
      await gravarSessao(ctx, r.sessao);
      return json({ ok: true, enderecos: r.enderecos });
    }
    return erro('Operação inválida.');
  } catch (e) {
    if (e instanceof Response) return e;
    if (e instanceof ErroRyzo && e.status === 401 && /sess/i.test(e.message)) { await gravarSessao(ctx, null); return erro(e.message, 401, { sessao: false }); }
    return falha(e);
  }
};
