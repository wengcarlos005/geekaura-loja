// Comportamento comum a todas as páginas: formulários de carrinho viram fetch (sem recarregar a
// página) e fotos que já falharam antes de o script carregar ganham a reserva com o nome.

for (const img of document.querySelectorAll<HTMLImageElement>('.foto img')) {
  if (img.complete && img.naturalWidth === 0) img.parentElement?.classList.add('falhou');
}

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

document.addEventListener('submit', async e => {
  const form = e.target as HTMLFormElement;
  if (!form.matches('form[data-carrinho]')) return;
  e.preventDefault();
  const dados = new FormData(form);
  const sku = dados.get('sku');
  if (!sku) { avisar('Escolha um modelo antes de adicionar.'); return; }
  const botao = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (botao) botao.disabled = true;
  try {
    const r = await mexerNoCarrinho({ acao: 'adicionar', sku, qtd: Number(dados.get('qtd') || 1) });
    if (r.ok) avisar('Adicionado ao carrinho.', { href: '/carrinho', rotulo: 'Ver carrinho' });
    else avisar(r.error || 'Não foi possível adicionar.');
  } catch {
    avisar('Sem conexão. Tente de novo.');
  } finally {
    if (botao) botao.disabled = false;
  }
});
