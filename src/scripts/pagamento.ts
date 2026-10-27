// Página do pedido: copiar Pix/boleto, acompanhar o status sozinho e escolher a forma de pagamento.
// O cartão usa o cardForm do Mercado Pago com campos em iframe: número, validade e CVV são digitados
// dentro do Mercado Pago e daqui só sai o token. O SDK só é baixado quando a pessoa escolhe cartão.
import { cpfValido, emailValido, somenteDigitos } from '../lib/formato';

declare global { interface Window { MercadoPago?: any } }

const raiz = document.querySelector<HTMLElement>('[data-pedido]');
const codigo = raiz?.dataset.pedido ?? '';

// ---------- Copiar ----------
document.addEventListener('click', async e => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-copiar]');
  if (!b) return;
  const alvo = document.querySelector<HTMLTextAreaElement>(b.dataset.copiar!);
  if (!alvo) return;
  const original = b.lastChild?.textContent ?? '';
  try { await navigator.clipboard.writeText(alvo.value); }
  catch { alvo.select(); return; } // sem permissão de área de transferência: deixa selecionado para copiar à mão
  if (b.lastChild) b.lastChild.textContent = 'Copiado!';
  setTimeout(() => { if (b.lastChild) b.lastChild.textContent = original; }, 2500);
});

// ---------- Acompanhar ----------
if (raiz && raiz.hasAttribute('data-acompanhar')) {
  const inicio = Date.now();
  const statusInicial = raiz.dataset.status;
  const consultar = async () => {
    if (document.hidden) return;
    try {
      const r = await fetch(`/api/pedido/${codigo}`, { headers: { Accept: 'application/json' } });
      const d = await r.json();
      if (d.ok && (d.pedido.status !== statusInicial || (d.pagamento && d.pagamento.status !== 'aguardando'))) location.reload();
    } catch { /* tenta de novo no próximo ciclo */ }
  };
  const t = setInterval(() => {
    if (Date.now() - inicio > 30 * 60_000) {
      clearInterval(t);
      const aviso = document.querySelector('[data-aguardando]');
      if (aviso) aviso.textContent = 'Já pagou? Atualize a página para ver a confirmação.';
      return;
    }
    consultar();
  }, 5000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) consultar(); });
}

// ---------- Escolher e pagar ----------
const caixa = document.querySelector<HTMLElement>('[data-escolher]');
if (caixa) {
  const erro = caixa.querySelector<HTMLElement>('[data-erro-pagamento]')!;
  const botao = caixa.querySelector<HTMLButtonElement>('[data-pagar]')!;
  const rotuloBotao = botao.textContent ?? 'Pagar';
  const secaoCartao = caixa.querySelector<HTMLElement>('[data-cartao]')!;
  const demo = caixa.hasAttribute('data-demo');
  const chave = caixa.dataset.chave ?? '';
  const campo = (id: string) => document.getElementById(id) as HTMLInputElement;

  try {
    const salvo = JSON.parse(sessionStorage.getItem(`ga_pagador_${codigo}`) || 'null');
    if (salvo) {
      campo('pg-nome').value = salvo.nome ?? '';
      campo('pg-email').value = salvo.email ?? '';
      campo('pg-cpf').value = salvo.cpf ?? '';
      if (salvo.nome && salvo.email && salvo.cpf) caixa.querySelector('[data-pagador]')?.removeAttribute('open');
    }
  } catch { /* sem sessionStorage: a pessoa digita */ }

  const metodo = () => caixa.querySelector<HTMLInputElement>('input[name="metodo"]:checked')?.value ?? '';
  let cardForm: any = null;
  let carregando: Promise<void> | null = null;

  caixa.addEventListener('change', e => {
    if ((e.target as HTMLInputElement).name !== 'metodo') return;
    erro.hidden = true;
    secaoCartao.hidden = metodo() !== 'cartao';
    if (metodo() === 'cartao' && !demo) carregando ??= montarCartao();
  });

  function falhar(texto: string) {
    erro.textContent = texto;
    erro.hidden = false;
    botao.disabled = false;
    botao.textContent = rotuloBotao;
  }

  function carregarSdk(): Promise<void> {
    if (window.MercadoPago) return Promise.resolve();
    return new Promise((ok, nao) => {
      const s = document.createElement('script');
      s.src = 'https://sdk.mercadopago.com/js/v2';
      s.onload = () => ok();
      s.onerror = () => nao(new Error('sdk'));
      document.head.append(s);
    });
  }

  async function montarCartao() {
    if (!chave) { falhar('Pagamento com cartão indisponível agora. Use Pix ou boleto.'); return; }
    try { await carregarSdk(); }
    catch { carregando = null; falhar('Não conseguimos abrir o pagamento com cartão. Confira a internet e escolha de novo.'); return; }
    const mp = new window.MercadoPago!(chave, { locale: 'pt-BR' });
    cardForm = mp.cardForm({
      amount: String(caixa!.dataset.total),
      iframe: true,
      form: {
        id: 'form-cartao',
        cardNumber: { id: 'mp-numero', placeholder: '0000 0000 0000 0000' },
        expirationDate: { id: 'mp-validade', placeholder: 'MM/AA' },
        securityCode: { id: 'mp-cvv', placeholder: 'CVV' },
        cardholderName: { id: 'mp-titular' },
        issuer: { id: 'mp-banco' },
        installments: { id: 'mp-parcelas' },
        identificationType: { id: 'mp-doc-tipo' },
        identificationNumber: { id: 'mp-doc-numero' },
        cardholderEmail: { id: 'mp-email' },
      },
      callbacks: {
        onFormMounted: (e: unknown) => { if (e) falhar('Não conseguimos abrir o pagamento com cartão. Use Pix ou boleto.'); },
        onSubmit: (e: Event) => e.preventDefault(),
      },
    });
  }

  botao.addEventListener('click', async () => {
    erro.hidden = true;
    const pagador = { nome: campo('pg-nome').value.trim(), email: emailValido(campo('pg-email').value), cpf: cpfValido(campo('pg-cpf').value) };
    if (pagador.nome.length < 3 || !pagador.email || !pagador.cpf) {
      caixa.querySelector('[data-pagador]')?.setAttribute('open', '');
      return falhar('Confira nome, e-mail e CPF do pagador.');
    }
    const m = metodo();
    if (!m) return falhar('Escolha a forma de pagamento.');
    botao.disabled = true;
    botao.textContent = 'Processando…';

    const corpo: Record<string, unknown> = { metodo: m, pagador };
    if (m === 'cartao') {
      if (demo) {
        corpo.cartao = { token: 'demo-token-cartao', payment_method_id: 'visa', installments: 1 };
      } else {
        if (carregando) await carregando;
        if (!cardForm) return falhar('Pagamento com cartão indisponível agora. Use Pix ou boleto.');
        try {
          campo('mp-email').value = pagador.email;
          campo('mp-doc-numero').value = somenteDigitos(pagador.cpf);
          const tipo = document.getElementById('mp-doc-tipo') as HTMLSelectElement;
          if ([...tipo.options].some(o => o.value === 'CPF')) tipo.value = 'CPF';
          await cardForm.createCardToken();
          const d = cardForm.getCardFormData();
          corpo.cartao = { token: d.token, payment_method_id: d.paymentMethodId, installments: Number(d.installments) || 1 };
        } catch {
          return falhar('Confira os dados do cartão.');
        }
      }
    }

    try {
      const r = await fetch(`/api/pedido/${codigo}/pagamento`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo),
      });
      const d = await r.json();
      if (!d.ok) return falhar(d.error || 'Não foi possível criar o pagamento.');
      location.reload();
    } catch {
      falhar('Sem conexão. Confira a internet e tente de novo.');
    }
  });

  // Máscara simples do CPF do pagador.
  campo('pg-cpf')?.addEventListener('input', e => {
    const el = e.target as HTMLInputElement;
    const d = somenteDigitos(el.value).slice(0, 11);
    el.value = d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  });
}
