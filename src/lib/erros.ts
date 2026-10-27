/** Erro com a mensagem do Ryzo (já em português, pronta para o comprador) e o status HTTP. */
export class ErroRyzo extends Error {
  constructor(message: string, public status: number, public skus?: string[]) { super(message); }
}
