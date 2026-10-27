// POST /api/conta/email {acao: 'enviar'} ou {acao: 'confirmar', codigo} — confirma o e-mail da conta.
import type { APIRoute } from 'astro';
import { envDe, erro, falha, json, lerJson, limitar, origemValida } from '../../../lib/api';
import { confirmarEmail, enviarCodigoDeEmail, gravarSessao, lerSessao } from '../../../lib/conta';
import { ErroRyzo } from '../../../lib/ryzo';

export const POST: APIRoute = async ctx => {
  try {
    if (!origemValida(ctx)) return erro('Origem não permitida.', 403);
    if (!limitar(ctx, 'conta-email', 8)) return erro('Muitas tentativas seguidas. Espere um minuto.', 429);
    const s = await lerSessao(ctx);
    if (!s) return erro('Entre na sua conta de novo.', 401, { sessao: false });
    const corpo = await lerJson(ctx.request, 500);
    const env = envDe(ctx);
    if (corpo?.acao === 'enviar') {
      await enviarCodigoDeEmail(env, s);
      return json({ ok: true });
    }
    if (corpo?.acao === 'confirmar') {
      const codigo = String(corpo?.codigo ?? '').replace(/\D/g, '');
      if (!/^\d{6}$/.test(codigo)) return erro('O código tem 6 números.');
      return json({ ok: true, cliente: await confirmarEmail(env, s, codigo) });
    }
    return erro('Operação inválida.');
  } catch (e) {
    if (e instanceof Response) return e;
    if (e instanceof ErroRyzo && e.status === 401 && /sess/i.test(e.message)) { await gravarSessao(ctx, null); return erro(e.message, 401, { sessao: false }); }
    return falha(e);
  }
};
