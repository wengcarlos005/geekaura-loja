// Conta do cliente. Quem guarda a conta é o Ryzo (/vitrine/v1/clientes/*): o site só segura o token
// da sessão num cookie httpOnly assinado e o repassa ao Ryzo no cabeçalho X-Cliente-Sessao. O
// primeiro nome também vai no cookie, para o cabeçalho de toda página dizer "Olá, Fulano" sem
// gastar uma chamada ao Ryzo por página vista.
//
// No modo demonstração não existe banco: a conta inteira (dados e até 3 endereços) vive dentro do
// próprio cookie assinado. Qualquer e-mail e senha entram, e o código de redefinição é qualquer
// número de 6 dígitos. É só para ver as telas funcionando.

import type { APIContext } from 'astro';
import { assinarJson, verificarJson } from './assinatura';
import { envDe, segredoDoCarrinho } from './api';
import { emailValido, texto, cepValido, ufValida, telefoneValido } from './formato';
import * as demo from './demo';
import { chamar, mapearPedido, modoDemo, ErroRyzo, type Pedido } from './ryzo';

export const COOKIE_CONTA = 'ga_conta';
const CONTEXTO = 'conta-v1';
const DURACAO_S = 60 * 60 * 24 * 30;
const MAX_ENDERECOS_DEMO = 3;

export interface Cliente { id: string; nome: string; email: string; telefone: string | null; email_verificado: boolean; }
export interface Endereco {
  id: string; apelido: string; nome: string; cep: string; logradouro: string; numero: string;
  complemento: string; bairro: string; cidade: string; uf: string; padrao: boolean;
}
export type EnderecoNovo = Omit<Endereco, 'id'>;
export interface SessaoSite { t: string; n: string; demo?: { c: Cliente; e: Endereco[] }; }

type Ctx = { cookies: APIContext['cookies']; locals: App.Locals };

// ---------- Cookie ----------

export async function lerSessao(ctx: Ctx): Promise<SessaoSite | null> {
  try {
    const s = await verificarJson<SessaoSite>(ctx.cookies.get(COOKIE_CONTA)?.value, segredoDoCarrinho(envDe(ctx)), CONTEXTO);
    return s && typeof s.t === 'string' && typeof s.n === 'string' ? s : null;
  } catch { return null; }
}

export async function gravarSessao(ctx: Ctx, s: SessaoSite | null) {
  if (!s) { ctx.cookies.delete(COOKIE_CONTA, { path: '/' }); return; }
  ctx.cookies.set(COOKIE_CONTA, await assinarJson(s, segredoDoCarrinho(envDe(ctx)), CONTEXTO), {
    path: '/', httpOnly: true, secure: true, sameSite: 'lax', maxAge: DURACAO_S,
  });
}

export function primeiroNome(nome: string): string {
  return (nome.trim().split(/\s+/)[0] || '').slice(0, 24);
}

/** Destino depois do login: só caminho interno, nunca "//outro-site" nem URL absoluta. */
export function destinoSeguro(v: unknown, padrao = '/conta'): string {
  const s = typeof v === 'string' ? v : '';
  return /^\/(?![/\\])[A-Za-z0-9\-._~/?=&%]*$/.test(s) && s.length <= 200 ? s : padrao;
}

// ---------- Validação do que vem do navegador ----------

type Valida<T> = { ok: true; valor: T } | { ok: false; erro: string };

export function validarSenha(v: unknown): string | null {
  return typeof v === 'string' && v.length >= 8 && v.length <= 128 ? v : null;
}

export function validarCadastro(c: any): Valida<{ nome: string; email: string; senha: string; telefone: string | null }> {
  const nome = texto(c?.nome, 120);
  if (nome.length < 2) return { ok: false, erro: 'Informe seu nome.' };
  const email = emailValido(c?.email);
  if (!email) return { ok: false, erro: 'E-mail inválido.' };
  const senha = validarSenha(c?.senha);
  if (!senha) return { ok: false, erro: 'A senha precisa ter pelo menos 8 caracteres.' };
  let telefone: string | null = null;
  if (c?.telefone) {
    telefone = telefoneValido(c.telefone);
    if (!telefone) return { ok: false, erro: 'Celular inválido (DDD + número).' };
  }
  return { ok: true, valor: { nome, email, senha, telefone } };
}

export function validarEndereco(c: any): Valida<EnderecoNovo> {
  const nome = texto(c?.nome, 80);
  if (nome.length < 3) return { ok: false, erro: 'Informe o nome de quem recebe.' };
  const cep = cepValido(c?.cep);
  if (!cep) return { ok: false, erro: 'CEP inválido.' };
  const logradouro = texto(c?.logradouro, 120);
  if (logradouro.length < 2) return { ok: false, erro: 'Informe a rua.' };
  const numero = texto(c?.numero, 20);
  if (!numero) return { ok: false, erro: 'Informe o número (ou "S/N").' };
  const bairro = texto(c?.bairro, 80);
  if (bairro.length < 2) return { ok: false, erro: 'Informe o bairro.' };
  const cidade = texto(c?.cidade, 80);
  if (cidade.length < 2) return { ok: false, erro: 'Informe a cidade.' };
  const uf = ufValida(c?.uf);
  if (!uf) return { ok: false, erro: 'UF inválida.' };
  return {
    ok: true,
    valor: {
      apelido: texto(c?.apelido, 30) || 'Casa', nome, cep, logradouro, numero,
      complemento: texto(c?.complemento, 80), bairro, cidade, uf, padrao: c?.padrao === true || c?.padrao === 'on',
    },
  };
}

// ---------- Mapeamento das respostas do Ryzo ----------

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');

export function mapearCliente(c: any): Cliente | null {
  const email = emailValido(c?.email);
  const id = str(c?.id, 60);
  if (!email || !id) return null;
  return { id, nome: str(c?.nome, 120) || email, email, telefone: str(c?.telefone, 20) || null, email_verificado: c?.email_verificado === true };
}

export function mapearEndereco(e: any): Endereco | null {
  const id = str(e?.id, 60);
  const cep = cepValido(e?.cep);
  if (!id || !cep) return null;
  return {
    id, apelido: str(e?.apelido, 30) || 'Endereço', nome: str(e?.nome, 80), cep,
    logradouro: str(e?.logradouro, 120), numero: str(e?.numero, 20), complemento: str(e?.complemento, 80),
    bairro: str(e?.bairro, 80), cidade: str(e?.cidade, 80), uf: str(e?.uf, 2), padrao: !!e?.padrao,
  };
}

function sessaoDaResposta(d: any): SessaoSite {
  const cliente = mapearCliente(d?.cliente);
  const token = str(d?.sessao?.token, 200);
  if (!cliente || !/^rzc_[A-Za-z0-9_-]{20,}$/.test(token)) throw new ErroRyzo('Não foi possível entrar agora. Tente de novo.', 502);
  return { t: token, n: primeiroNome(cliente.nome) };
}

// ---------- Modo demonstração ----------

function sessaoDemo(c: Cliente, e: Endereco[] = []): SessaoSite {
  return { t: 'demo', n: primeiroNome(c.nome), demo: { c, e: e.slice(0, MAX_ENDERECOS_DEMO) } };
}

function nomeDoEmail(email: string): string {
  const base = email.split('@')[0].replace(/[._\-+0-9]+/g, ' ').trim();
  return base ? base.replace(/\b\w/g, l => l.toUpperCase()) : 'Cliente';
}

function exigirDemo(s: SessaoSite): { c: Cliente; e: Endereco[] } {
  if (!s.demo) throw new ErroRyzo('Sua sessão expirou. Entre de novo.', 401);
  return s.demo;
}

// ---------- Operações ----------

const R = { repassar401: true };

export async function cadastrar(env: Env, dados: { nome: string; email: string; senha: string; telefone: string | null }): Promise<SessaoSite> {
  if (modoDemo(env)) return sessaoDemo({ id: 'demo', nome: dados.nome, email: dados.email, telefone: dados.telefone, email_verificado: true });
  return sessaoDaResposta(await chamar(env, 'POST', '/clientes', dados, R));
}

export async function entrar(env: Env, email: string, senha: string): Promise<SessaoSite> {
  if (modoDemo(env)) return sessaoDemo({ id: 'demo', nome: nomeDoEmail(email), email, telefone: null, email_verificado: true });
  return sessaoDaResposta(await chamar(env, 'POST', '/clientes/entrar', { email, senha }, R));
}

export async function sair(env: Env, s: SessaoSite): Promise<void> {
  if (modoDemo(env) || s.t === 'demo') return;
  try { await chamar(env, 'POST', '/clientes/sair', {}, { sessao: s.t, ...R }); } catch { /* o cookie some de qualquer jeito */ }
}

/** Cliente da sessão; null quando a sessão venceu ou foi encerrada em outro lugar. */
export async function clienteAtual(env: Env, s: SessaoSite | null): Promise<Cliente | null> {
  if (!s) return null;
  if (modoDemo(env)) return s.demo?.c ?? null;
  try { return mapearCliente((await chamar(env, 'GET', '/clientes/eu', undefined, { sessao: s.t, ...R })).cliente); }
  catch (e) { if (e instanceof ErroRyzo && e.status === 401) return null; throw e; }
}

export async function atualizarDados(
  env: Env, s: SessaoSite, dados: { nome?: string; telefone?: string | null; senha_atual?: string; senha_nova?: string },
): Promise<{ cliente: Cliente; sessao: SessaoSite }> {
  if (modoDemo(env)) {
    const d = exigirDemo(s);
    const c = { ...d.c, nome: dados.nome ?? d.c.nome, telefone: dados.telefone === undefined ? d.c.telefone : dados.telefone };
    return { cliente: c, sessao: sessaoDemo(c, d.e) };
  }
  const d = await chamar(env, 'PATCH', '/clientes/eu', dados, { sessao: s.t, ...R });
  const cliente = mapearCliente(d.cliente);
  if (!cliente) throw new ErroRyzo('Não foi possível salvar agora.', 502);
  return { cliente, sessao: { ...s, n: primeiroNome(cliente.nome) } };
}

export async function pedidosDoCliente(env: Env, s: SessaoSite): Promise<Pedido[]> {
  if (modoDemo(env)) return demo.pedidosDoEmail(exigirDemo(s).c.email);
  const d = await chamar(env, 'GET', '/clientes/eu/pedidos', undefined, { sessao: s.t, ...R });
  return (Array.isArray(d.pedidos) ? d.pedidos : []).map(mapearPedido).filter(Boolean) as Pedido[];
}

export async function listarEnderecos(env: Env, s: SessaoSite): Promise<Endereco[]> {
  if (modoDemo(env)) return exigirDemo(s).e;
  const d = await chamar(env, 'GET', '/clientes/eu/enderecos', undefined, { sessao: s.t, ...R });
  return (Array.isArray(d.enderecos) ? d.enderecos : []).map(mapearEndereco).filter(Boolean) as Endereco[];
}

/** Cria (sem id) ou altera um endereço; devolve a lista atualizada e a sessão (que muda no demo). */
export async function salvarEndereco(env: Env, s: SessaoSite, end: EnderecoNovo, id?: string): Promise<{ enderecos: Endereco[]; sessao: SessaoSite }> {
  if (modoDemo(env)) {
    const d = exigirDemo(s);
    let lista = [...d.e];
    if (!id && lista.length >= MAX_ENDERECOS_DEMO) throw new ErroRyzo(`No modo demonstração cabem só ${MAX_ENDERECOS_DEMO} endereços.`, 409);
    const novo: Endereco = { ...end, id: id || `d${Date.now().toString(36)}` };
    lista = id ? lista.map(e => (e.id === id ? novo : e)) : [...lista, novo];
    if (novo.padrao || lista.length === 1) lista = lista.map(e => ({ ...e, padrao: e.id === novo.id }));
    const sessao = sessaoDemo(d.c, lista);
    return { enderecos: sessao.demo!.e, sessao };
  }
  const caminho = id ? `/clientes/eu/enderecos/${encodeURIComponent(id)}` : '/clientes/eu/enderecos';
  await chamar(env, id ? 'PUT' : 'POST', caminho, end, { sessao: s.t, ...R });
  return { enderecos: await listarEnderecos(env, s), sessao: s };
}

export async function apagarEndereco(env: Env, s: SessaoSite, id: string): Promise<{ enderecos: Endereco[]; sessao: SessaoSite }> {
  if (modoDemo(env)) {
    const d = exigirDemo(s);
    let lista = d.e.filter(e => e.id !== id);
    if (lista.length && !lista.some(e => e.padrao)) lista = lista.map((e, i) => ({ ...e, padrao: i === 0 }));
    const sessao = sessaoDemo(d.c, lista);
    return { enderecos: lista, sessao };
  }
  await chamar(env, 'DELETE', `/clientes/eu/enderecos/${encodeURIComponent(id)}`, undefined, { sessao: s.t, ...R });
  return { enderecos: await listarEnderecos(env, s), sessao: s };
}

/** Sempre "deu certo" para quem pede: não revela se o e-mail tem conta. */
export async function pedirCodigo(env: Env, email: string): Promise<void> {
  if (modoDemo(env)) return;
  await chamar(env, 'POST', '/clientes/recuperar', { email }, R);
}

export async function redefinirSenha(env: Env, email: string, codigo: string, senha: string): Promise<SessaoSite> {
  if (modoDemo(env)) return sessaoDemo({ id: 'demo', nome: nomeDoEmail(email), email, telefone: null, email_verificado: true });
  return sessaoDaResposta(await chamar(env, 'POST', '/clientes/redefinir', { email, codigo, senha }, R));
}

/** Manda o código de confirmação para o e-mail da conta (pedidos antigos só aparecem depois dele). */
export async function enviarCodigoDeEmail(env: Env, s: SessaoSite): Promise<void> {
  if (modoDemo(env)) return;
  await chamar(env, 'POST', '/clientes/eu/email/enviar-codigo', {}, { sessao: s.t, ...R });
}

export async function confirmarEmail(env: Env, s: SessaoSite, codigo: string): Promise<Cliente> {
  if (modoDemo(env)) return exigirDemo(s).c;
  const c = mapearCliente((await chamar(env, 'POST', '/clientes/eu/email/confirmar', { codigo }, { sessao: s.t, ...R })).cliente);
  if (!c) throw new ErroRyzo('Não foi possível confirmar agora.', 502);
  return c;
}
