// POST /api/conta/dados {nome, telefone, senha_atual?, senha_nova?} — muda os dados do cliente logado.
import type { APIRoute } from 'astro';
import { envDe, erro, falha, json, lerJson, limitar, origemValida } from '../../../lib/api';
import { atualizarDados, gravarSessao, lerSessao, validarSenha } from '../../../lib/conta';
import { telefoneValido, texto } from '../../../lib/formato';
import { ErroRyzo } from '../../../lib/ryzo';

export const POST: APIRoute = async ctx => {
  try {
    if (!origemValida(ctx)) return erro('Origem não permitida.', 403);
    if (!limitar(ctx, 'conta-dados', 10)) return erro('Muitas tentativas seguidas. Espere um minuto.', 429);
    const s = await lerSessao(ctx);
    if (!s) return erro('Entre na sua conta de novo.', 401, { sessao: false });
    const corpo = await lerJson(ctx.request, 2000);
    const nome = texto(corpo?.nome, 120);
    if (nome.length < 2) return erro('Informe seu nome.');
    let telefone: string | null = null;
    if (corpo?.telefone) {
      telefone = telefoneValido(corpo.telefone);
      if (!telefone) return erro('Celular inválido (DDD + número).');
    }
    const mudanca: Parameters<typeof atualizarDados>[2] = { nome, telefone };
    if (corpo?.senha_nova) {
      const nova = validarSenha(corpo.senha_nova);
      if (!nova) return erro('A nova senha precisa ter pelo menos 8 caracteres.');
      if (!corpo?.senha_atual) return erro('Para trocar a senha, informe a senha atual.');
      mudanca.senha_atual = String(corpo.senha_atual).slice(0, 128);
      mudanca.senha_nova = nova;
    }
    const r = await atualizarDados(envDe(ctx), s, mudanca);
    await gravarSessao(ctx, r.sessao);
    return json({ ok: true, cliente: r.cliente });
  } catch (e) {
    if (e instanceof Response) return e;
    if (e instanceof ErroRyzo && e.status === 401 && /sess/i.test(e.message)) { await gravarSessao(ctx, null); return erro(e.message, 401, { sessao: false }); }
    return falha(e);
  }
};
