// Formulários de conta (entrar, criar conta, recuperar, dados, endereço): viram fetch com JSON,
// mostram o erro no próprio formulário e, quando dá certo, seguem para data-volta.

export async function enviarJson(url: string, corpo: unknown): Promise<any> {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(corpo) });
  const d = await r.json().catch(() => ({ ok: false, error: 'Algo deu errado. Tente de novo.' }));
  if (r.status === 401 && d?.sessao === false) location.href = `/entrar?volta=${encodeURIComponent(location.pathname)}`;
  return d;
}

export function mostrarErro(form: HTMLElement, texto: string | null) {
  const caixa = form.querySelector<HTMLElement>('[data-erro]');
  if (!caixa) return;
  caixa.textContent = texto ?? '';
  caixa.hidden = !texto;
  if (texto) caixa.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

/** Lê o formulário como objeto; checkbox vira booleano. */
export function lerForm(form: HTMLFormElement): Record<string, unknown> {
  const dados: Record<string, unknown> = {};
  for (const el of form.elements as unknown as Iterable<HTMLInputElement>) {
    if (!el.name || el.disabled) continue;
    if (el.type === 'checkbox') dados[el.name] = el.checked;
    else if (el.type === 'radio') { if (el.checked) dados[el.name] = el.value; }
    else dados[el.name] = el.value;
  }
  return dados;
}

for (const form of document.querySelectorAll<HTMLFormElement>('form[data-form-conta]')) {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    mostrarErro(form, null);
    const botao = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (botao) { botao.disabled = true; botao.classList.add('carregando'); }
    try {
      const d = await enviarJson(form.dataset.endpoint!, lerForm(form));
      if (!d.ok) { mostrarErro(form, d.error || 'Não deu certo. Tente de novo.'); return; }
      form.dispatchEvent(new CustomEvent('conta-ok', { detail: d }));
      if (form.dataset.volta) location.href = form.dataset.volta;
    } catch {
      mostrarErro(form, 'Sem conexão. Tente de novo.');
    } finally {
      if (botao) { botao.disabled = false; botao.classList.remove('carregando'); }
    }
  });
}

// Botão de mostrar/esconder senha.
document.addEventListener('click', e => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-ver-senha]');
  if (!b) return;
  const campo = b.parentElement?.querySelector('input');
  if (!campo) return;
  const ver = campo.type === 'password';
  campo.type = ver ? 'text' : 'password';
  b.setAttribute('aria-pressed', String(ver));
  b.setAttribute('aria-label', ver ? 'Esconder senha' : 'Mostrar senha');
});

// Máscara de celular.
for (const tel of document.querySelectorAll<HTMLInputElement>('input[data-mascara="tel"]')) {
  tel.addEventListener('input', () => {
    const d = tel.value.replace(/\D/g, '').slice(0, 11);
    tel.value = d.length > 10 ? d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3') : d.replace(/(\d{2})(\d{0,4})(\d{0,4})/, (_, a, b, c) => (b ? `(${a}) ${b}${c ? '-' + c : ''}` : a));
  });
}
