// Validação do que o comprador digita no checkout e na escolha do pagamento. As mesmas regras do
// Ryzo, conferidas aqui antes para a mensagem de erro aparecer sem ida e volta, e para lixo não
// sair do site. O Ryzo valida de novo: esta camada é conveniência, não a única barreira.
import { cepValido, cpfValido, emailValido, telefoneValido, texto, ufValida } from './formato';
import type { Entrega, PedidoDePagamento } from './ryzo';

export function validarEntrega(c: any): { ok: true; valor: Entrega } | { ok: false; erro: string } {
  const nome = texto(c?.nome, 80);
  if (nome.length < 3 || !nome.includes(' ')) return { ok: false, erro: 'Informe o nome completo.' };
  const email = emailValido(c?.email);
  if (!email) return { ok: false, erro: 'E-mail inválido.' };
  const telefone = telefoneValido(c?.telefone);
  if (!telefone) return { ok: false, erro: 'Telefone inválido (DDD + número).' };
  const cpf = cpfValido(c?.cpf);
  if (!cpf) return { ok: false, erro: 'CPF inválido.' };
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
  return { ok: true, valor: { nome, email, telefone, cpf, cep, logradouro, numero, complemento: texto(c?.complemento, 80), bairro, cidade, uf } };
}

export function validarPagamento(c: any): { ok: true; valor: PedidoDePagamento } | { ok: false; erro: string } {
  const metodo = c?.metodo;
  if (metodo !== 'pix' && metodo !== 'boleto' && metodo !== 'cartao') return { ok: false, erro: 'Método de pagamento inválido.' };
  const email = emailValido(c?.pagador?.email);
  if (!email) return { ok: false, erro: 'E-mail do pagador inválido.' };
  const nome = texto(c?.pagador?.nome, 80);
  if (nome.length < 3) return { ok: false, erro: 'Informe o nome do pagador.' };
  const cpf = cpfValido(c?.pagador?.cpf);
  if (!cpf) return { ok: false, erro: 'CPF inválido.' };
  const valor: PedidoDePagamento = { metodo, pagador: { email, nome, cpf } };
  if (metodo === 'cartao') {
    const token = String(c?.cartao?.token ?? '');
    const bandeira = String(c?.cartao?.payment_method_id ?? '');
    const parcelas = Number(c?.cartao?.installments);
    if (!/^[A-Za-z0-9-]{8,200}$/.test(token)) return { ok: false, erro: 'Dados do cartão inválidos. Confira e tente de novo.' };
    if (!/^[a-z_]{2,30}$/.test(bandeira)) return { ok: false, erro: 'Bandeira do cartão não reconhecida.' };
    if (!Number.isInteger(parcelas) || parcelas < 1 || parcelas > 12) return { ok: false, erro: 'Número de parcelas inválido.' };
    valor.cartao = { token, payment_method_id: bandeira, installments: parcelas };
  }
  return { ok: true, valor };
}
