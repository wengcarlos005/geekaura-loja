// Como cada status de pedido aparece para o cliente (lista da conta e página do pedido).
import type { StatusPedido } from './ryzo';

export const STATUS_PEDIDO: Record<StatusPedido, { rotulo: string; classe: string }> = {
  aguardando_pagamento: { rotulo: 'Aguardando pagamento', classe: 'st-espera' },
  processando: { rotulo: 'Confirmando pagamento', classe: 'st-espera' },
  pago: { rotulo: 'Pago', classe: 'st-ok' },
  sem_estoque: { rotulo: 'Problema de estoque', classe: 'st-falha' },
  cancelado: { rotulo: 'Cancelado', classe: 'st-falha' },
};

export function dataCurta(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Sao_Paulo' });
}
