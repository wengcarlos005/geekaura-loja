// Comportamento comum a todas as páginas: carrinho sem recarregar (com gaveta lateral), favoritos,
// sugestões na busca do topo e fotos que falharam antes de o script carregar.
import './movimento';
import { precoBRL } from '../lib/formato';

for (const img of document.querySelectorAll<HTMLImageElement>('.foto img')) {
  if (img.complete && img.naturalWidth === 0) img.parentElement?.classList.add('falhou');
}

// ---------- Aviso flutuante ----------

let tempoTorrada: ReturnType<typeof setTimeout> | undefined;
export function avisar(texto: string, link?: { href: string; rotulo: string }) {
  const el = document.querySelector<HTMLElement>('[data-torrada]');
  if (!el) return;
  el.replaceChildren(document.createTextNode(texto));
  if (link) {
    const a = document.createElement('a');
    a.href = link.href;
    a.textContent = link.rotulo;
    el.append(a);
  }
  el.classList.add('visivel');
  clearTimeout(tempoTorrada);
  tempoTorrada = setTimeout(() => el.classList.remove('visivel'), 4500);
}

export function atualizarContador(qtd: number) {
  for (const el of document.querySelectorAll<HTMLElement>('[data-contador]')) {
    el.textContent = String(qtd);
    if (qtd > 0) el.removeAttribute('data-zero'); else el.setAttribute('data-zero', '');
    el.classList.remove('pulou'); void el.offsetWidth; el.classList.add('pulou');
    el.closest('a')?.setAttribute('aria-label', `Carrinho com ${qtd} ${qtd === 1 ? 'item' : 'itens'}`);
  }
}

export async function mexerNoCarrinho(op: Record<string, unknown>): Promise<{ ok: boolean; qtd?: number; error?: string }> {
  const r = await fetch('/api/carrinho', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(op),
  });
  const dados = await r.json().catch(() => ({ ok: false, error: 'Não foi possível atualizar o carrinho.' }));
  if (dados.ok && typeof dados.qtd === 'number') atualizarContador(dados.qtd);
  return dados;
}

// ---------- Gaveta do carrinho ----------

interface Linha { sku: string; qtd: number; preco: number; disponivel: number; ok: boolean; a_venda: boolean; titulo: string; rotulo: string | null; foto: string | null; slug: string | null; }

const gaveta = document.querySelector<HTMLElement>('[data-gaveta]');
const fundo = document.querySelector<HTMLElement>('[data-gaveta-fundo]');
let focoAntes: HTMLElement | null = null;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, classe?: string, textoDe?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (textoDe !== undefined) e.textContent = textoDe;
  return e;
}

function desenharGaveta(d: { linhas: Linha[]; subtotal: number; qtd: number; pronto: boolean }) {
  if (!gaveta) return;
  const lista = gaveta.querySelector<HTMLElement>('[data-gaveta-itens]')!;
  const vazia = gaveta.querySelector<HTMLElement>('[data-gaveta-vazia]')!;
  const rodape = gaveta.querySelector<HTMLElement>('[data-gaveta-rodape]')!;
  gaveta.querySelector('[data-gaveta-qtd]')!.textContent = d.qtd ? `(${d.qtd})` : '';
  lista.replaceChildren();
  vazia.hidden = d.linhas.length > 0;
  rodape.hidden = d.linhas.length === 0;
  for (const l of d.linhas) {
    const li = el('li', 'g-item');
    li.dataset.revelar = '';
    const foto = el('a', 'g-foto foto');
    foto.href = l.slug ? `/produto/${l.slug}` : '/';
    foto.tabIndex = -1;
    if (l.foto) { const img = el('img'); img.src = l.foto; img.alt = ''; img.width = 80; img.height = 80; img.referrerPolicy = 'no-referrer'; foto.append(img); }
    const info = el('div', 'g-info');
    const nome = el('a', 'g-nome', l.titulo);
    nome.href = foto.href;
    info.append(nome);
    if (l.rotulo) info.append(el('span', 'nota', l.rotulo));
    if (!l.ok) info.append(el('span', 'g-aviso', !l.a_venda ? 'Saiu de venda' : l.disponivel > 0 ? `Só ${l.disponivel} em estoque` : 'Esgotou'));
    const acoes = el('div', 'g-acoes');
    const qtd = el('div', 'quantidade quantidade-mini');
    const menos = el('button', '', '−'); menos.type = 'button'; menos.dataset.gQtd = String(l.qtd - 1); menos.dataset.sku = l.sku; menos.setAttribute('aria-label', `Diminuir ${l.titulo}`);
    const valor = el('span', 'qtd-valor', String(l.qtd));
    const mais = el('button', '', '+'); mais.type = 'button'; mais.dataset.gQtd = String(l.qtd + 1); mais.dataset.sku = l.sku; mais.setAttribute('aria-label', `Aumentar ${l.titulo}`);
    if (l.a_venda && l.qtd >= l.disponivel) mais.disabled = true;
    qtd.append(menos, valor, mais);
    const remover = el('button', 'g-remover', 'Remover'); remover.type = 'button'; remover.dataset.gRemover = l.sku;
    acoes.append(qtd, remover);
    info.append(acoes);
    li.append(foto, info, el('strong', 'g-preco', precoBRL(l.preco * l.qtd)));
    lista.append(li);
  }
  gaveta.querySelector('[data-gaveta-subtotal]')!.textContent = precoBRL(d.subtotal);
  const fechar = gaveta.querySelector<HTMLAnchorElement>('[data-gaveta-checkout]');
  if (fechar) fechar.setAttribute('aria-disabled', d.pronto ? 'false' : 'true');
  gaveta.querySelector<HTMLElement>('[data-gaveta-problema]')!.hidden = d.pronto || !d.linhas.length;
}

async function carregarGaveta() {
  try {
    const d = await (await fetch('/api/carrinho', { headers: { Accept: 'application/json' } })).json();
    if (d.ok) { desenharGaveta(d); atualizarContador(d.qtd); }
  } catch { /* a gaveta fica como estava */ }
}

export async function abrirGaveta(adicionado = false) {
  if (!gaveta || !fundo) { location.href = '/carrinho'; return; }
  focoAntes = document.activeElement as HTMLElement | null;
  gaveta.querySelector<HTMLElement>('[data-gaveta-aviso]')!.hidden = !adicionado;
  gaveta.hidden = false; fundo.hidden = false;
  void gaveta.offsetWidth;
  gaveta.classList.add('aberta'); fundo.classList.add('aberta');
  document.documentElement.classList.add('sem-rolagem');
  gaveta.querySelector<HTMLElement>('[data-gaveta-fechar]')?.focus();
  await carregarGaveta();
}

function fecharGaveta() {
  if (!gaveta || !fundo || gaveta.hidden) return;
  gaveta.classList.remove('aberta'); fundo.classList.remove('aberta');
  document.documentElement.classList.remove('sem-rolagem');
  const esconder = () => { gaveta.hidden = true; fundo.hidden = true; };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) esconder(); else setTimeout(esconder, 280);
  focoAntes?.focus?.();
}

fundo?.addEventListener('click', fecharGaveta);
gaveta?.addEventListener('click', async e => {
  const alvo = e.target as HTMLElement;
  if (alvo.closest('[data-gaveta-fechar]')) { fecharGaveta(); return; }
  const q = alvo.closest<HTMLButtonElement>('[data-g-qtd]');
  const r = alvo.closest<HTMLButtonElement>('[data-g-remover]');
  if (!q && !r) return;
  const op = q ? { acao: 'definir', sku: q.dataset.sku, qtd: Number(q.dataset.gQtd) } : { acao: 'remover', sku: r!.dataset.gRemover };
  (q ?? r)!.disabled = true;
  const res = await mexerNoCarrinho(op).catch(() => ({ ok: false, error: 'Sem conexão. Tente de novo.' }));
  if (!res.ok) avisar(res.error || 'Não foi possível atualizar.');
  await carregarGaveta();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') { fecharGaveta(); fecharSugestoes(); } });
document.querySelectorAll<HTMLAnchorElement>('[data-abre-gaveta]').forEach(a => a.addEventListener('click', e => {
  if (e.metaKey || e.ctrlKey || e.shiftKey) return;
  e.preventDefault();
  abrirGaveta();
}));

// Todo formulário de "adicionar" vira fetch e abre a gaveta.
document.addEventListener('submit', async e => {
  const form = e.target as HTMLFormElement;
  if (!form.matches('form[data-carrinho]')) return;
  e.preventDefault();
  const dados = new FormData(form);
  const sku = dados.get('sku');
  if (!sku) { avisar('Escolha um modelo antes de adicionar.'); return; }
  const botao = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (botao) { botao.disabled = true; botao.classList.add('carregando'); }
  try {
    const r = await mexerNoCarrinho({ acao: 'adicionar', sku, qtd: Number(dados.get('qtd') || 1) });
    if (r.ok) {
      botao?.classList.add('adicionado');
      setTimeout(() => botao?.classList.remove('adicionado'), 1600);
      abrirGaveta(true);
    } else avisar(r.error || 'Não foi possível adicionar.');
  } catch {
    avisar('Sem conexão. Tente de novo.');
  } finally {
    if (botao) { botao.disabled = false; botao.classList.remove('carregando'); }
  }
});

// ---------- Favoritos (ficam neste navegador) ----------

const CHAVE_FAV = 'ga_favoritos';
export function lerFavoritos(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(CHAVE_FAV) || '[]');
    return Array.isArray(v) ? v.filter(s => typeof s === 'string' && /^[a-z0-9-]{1,80}$/.test(s)).slice(0, 100) : [];
  } catch { return []; }
}
function gravarFavoritos(lista: string[]) {
  try { localStorage.setItem(CHAVE_FAV, JSON.stringify(lista.slice(0, 100))); } catch { /* navegador sem armazenamento */ }
}
function pintarFavoritos() {
  const favs = new Set(lerFavoritos());
  for (const b of document.querySelectorAll<HTMLButtonElement>('[data-favorito]')) {
    const ativo = favs.has(b.dataset.favorito!);
    b.setAttribute('aria-pressed', String(ativo));
    b.setAttribute('aria-label', `${ativo ? 'Remover dos' : 'Salvar nos'} favoritos`);
  }
  for (const c of document.querySelectorAll<HTMLElement>('[data-fav-contador]')) {
    c.textContent = String(favs.size);
    if (favs.size) c.removeAttribute('data-zero'); else c.setAttribute('data-zero', '');
  }
  document.dispatchEvent(new CustomEvent('favoritos', { detail: [...favs] }));
}
document.addEventListener('click', e => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-favorito]');
  if (!b) return;
  e.preventDefault();
  const slug = b.dataset.favorito!;
  const favs = lerFavoritos();
  const tinha = favs.includes(slug);
  gravarFavoritos(tinha ? favs.filter(s => s !== slug) : [slug, ...favs]);
  pintarFavoritos();
  b.classList.remove('pulou'); void b.offsetWidth; b.classList.add('pulou');
  if (!tinha) avisar('Salvo nos favoritos.', { href: '/favoritos', rotulo: 'Ver favoritos' });
});
pintarFavoritos();

// ---------- Sugestões da busca ----------

const campoBusca = document.querySelector<HTMLInputElement>('#busca-topo');
const caixaSug = document.querySelector<HTMLElement>('[data-sugestoes]');
let tempoBusca: ReturnType<typeof setTimeout> | undefined;
let pedidoBusca = 0;

function fecharSugestoes() {
  if (!caixaSug) return;
  caixaSug.hidden = true;
  campoBusca?.setAttribute('aria-expanded', 'false');
}

async function sugerir(q: string) {
  if (!caixaSug) return;
  const meu = ++pedidoBusca;
  try {
    const d = await (await fetch(`/api/sugestoes?q=${encodeURIComponent(q)}`)).json();
    if (meu !== pedidoBusca || !d.ok) return;
    caixaSug.replaceChildren();
    if (!d.produtos.length) {
      caixaSug.append(el('p', 'sug-vazio', `Nada encontrado para "${q}".`));
    } else {
      for (const p of d.produtos as { slug: string; titulo: string; preco: number; foto: string | null; categoria: string }[]) {
        const a = el('a', 'sug-item');
        a.href = `/produto/${p.slug}`;
        a.setAttribute('role', 'option');
        const f = el('span', 'sug-foto foto');
        if (p.foto) { const img = el('img'); img.src = p.foto; img.alt = ''; img.width = 48; img.height = 48; img.referrerPolicy = 'no-referrer'; f.append(img); }
        const t = el('span', 'sug-texto');
        t.append(el('span', 'sug-nome', p.titulo), el('span', 'nota', p.categoria));
        a.append(f, t, el('strong', 'sug-preco', precoBRL(p.preco)));
        caixaSug.append(a);
      }
    }
    const todos = el('a', 'sug-todos', `Ver todos os resultados para "${q}"`);
    todos.href = `/busca?q=${encodeURIComponent(q)}`;
    caixaSug.append(todos);
    caixaSug.hidden = false;
    campoBusca?.setAttribute('aria-expanded', 'true');
  } catch { /* sem sugestão, a busca normal continua funcionando */ }
}

campoBusca?.addEventListener('input', () => {
  clearTimeout(tempoBusca);
  const q = campoBusca.value.trim();
  if (q.length < 2) { fecharSugestoes(); return; }
  tempoBusca = setTimeout(() => sugerir(q), 180);
});
campoBusca?.addEventListener('keydown', e => {
  if (e.key !== 'ArrowDown' || !caixaSug || caixaSug.hidden) return;
  e.preventDefault();
  caixaSug.querySelector<HTMLElement>('a')?.focus();
});
caixaSug?.addEventListener('keydown', e => {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  e.preventDefault();
  const itens = [...caixaSug.querySelectorAll<HTMLElement>('a')];
  const i = itens.indexOf(document.activeElement as HTMLElement);
  const prox = e.key === 'ArrowDown' ? itens[i + 1] : i <= 0 ? campoBusca : itens[i - 1];
  prox?.focus();
});
document.addEventListener('click', e => {
  if (!(e.target as HTMLElement).closest('.busca')) fecharSugestoes();
});
