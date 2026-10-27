// Revelação ao rolar: tudo com data-revelar aparece quando entra na tela, irmãos em cascata.
// O <head> já pôs "anima" no <html> e armou um cronômetro que mostra tudo à força; aqui o
// cronômetro é cancelado porque o observador assumiu o trabalho.

const raiz = document.documentElement;
const reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches;

function revelarTudo() {
  raiz.classList.add('anima-fim');
}

if (!raiz.classList.contains('anima') || reduzido || !('IntersectionObserver' in window)) {
  revelarTudo();
} else {
  clearTimeout((window as any).__anima);
  const io = new IntersectionObserver(entradas => {
    for (const e of entradas) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('revelado');
      io.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  const vistos = new WeakSet<Element>();
  const registrar = (el: Element) => {
    if (vistos.has(el)) return;
    vistos.add(el);
    const irmaos = el.parentElement ? [...el.parentElement.children].filter(c => c.hasAttribute('data-revelar')) : [];
    const i = irmaos.indexOf(el);
    if (i > 0) (el as HTMLElement).style.setProperty('--i', String(Math.min(i, 8)));
    io.observe(el);
  };
  document.querySelectorAll('[data-revelar]').forEach(registrar);

  // Nó que chega depois (gaveta, filtro, sugestões) também é registrado.
  new MutationObserver(lista => {
    for (const m of lista) for (const n of m.addedNodes) {
      if (!(n instanceof Element)) continue;
      if (n.hasAttribute('data-revelar')) registrar(n);
      n.querySelectorAll?.('[data-revelar]').forEach(registrar);
    }
  }).observe(document.body, { childList: true, subtree: true });

  // Rede de segurança: o que estiver na tela e ainda escondido depois de 4 s aparece de qualquer jeito.
  setTimeout(() => {
    for (const el of document.querySelectorAll('[data-revelar]:not(.revelado)')) {
      if (el.getBoundingClientRect().top < innerHeight) el.classList.add('revelado');
    }
  }, 4000);
}

// Cabeçalho ganha sombra quando a página rola.
const topo = document.querySelector<HTMLElement>('.topo');
if (topo) {
  let ultimo = false;
  const marcar = () => {
    const agora = scrollY > 40;
    if (agora !== ultimo) { topo.classList.toggle('rolou', agora); ultimo = agora; }
  };
  addEventListener('scroll', marcar, { passive: true });
  marcar();
}
