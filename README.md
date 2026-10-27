# Geek Aura — loja virtual

Site de vendas da Geek Aura (geekaura.com.br). Astro 5 em modo servidor, rodando como Cloudflare
Worker. Catálogo, estoque, pedidos, pagamento (Mercado Pago) e frete (Melhor Envio) vêm do **Ryzo**,
pelas rotas `/vitrine/v1/*`. Este repositório não guarda produto, preço nem pedido: só mostra e repassa.

## Rodar

```sh
npm install
cp .dev.vars.example .dev.vars   # deixe RYZO_VITRINE_KEY vazio para o modo demonstração
npm run dev                      # http://localhost:4321 (Vite, recarrega ao salvar)
npm run preview                  # build + wrangler dev: o Worker de verdade, em http://localhost:8787
```

Verificações (rode as três antes de abrir PR):

```sh
npm run check   # astro check (tipos)
npm test        # vitest
npm run build
```

### Modo demonstração

Sem `RYZO_VITRINE_KEY` o site liga sozinho o modo demonstração: uma faixa roxa no topo avisa, o
`robots.txt` bloqueia tudo e cada página leva `noindex`. Os produtos são **reais** (8 anúncios da Geek
Aura lidos do Ryzo, com o preço calculado pela mesma regra do Ryzo: 10% abaixo da Shopee, final ,90).
Frete, pedido e pagamento são simulados em memória. Dá para fazer o fluxo inteiro, do carrinho ao Pix.
A conta de cliente também: qualquer e-mail e senha de 8 caracteres entram, e a conta (dados e até 3
endereços) vive dentro do próprio cookie assinado, porque não há banco.

### Conta do cliente

Quem guarda a conta é o Ryzo (`/vitrine/v1/clientes/*`). O site só segura o token da sessão (`rzc_...`)
num cookie `HttpOnly` assinado (`ga_conta`, `src/lib/conta.ts`) e o repassa ao Ryzo no cabeçalho
`X-Cliente-Sessao`. O primeiro nome vai junto no cookie para o cabeçalho dizer "Olá, Fulano" sem uma
chamada ao Ryzo por página. Telas: `/entrar`, `/cadastro`, `/recuperar-senha`, `/conta` (pedidos),
`/conta/enderecos`, `/conta/dados`. No checkout, quem está logado já encontra nome, e-mail, celular e
endereço preenchidos, e o pedido entra na conta.

Pedido feito **antes** de criar a conta só aparece depois que o cliente confirma o e-mail (código de 6
números). Sem isso, qualquer pessoa criaria conta com o e-mail de outra e veria os pedidos dela. O
envio de e-mail depende do Resend configurado no Ryzo; no staging ele não existe, de propósito.

Favoritos ficam no navegador (`localStorage`), não na conta.

### Fotos

Em produção as fotos vêm do catálogo do Ryzo (as URLs cadastradas na vitrine). Hoje são URLs do CDN
da Shopee e do Mercado Livre. Quando uma foto não carrega, o card mostra o nome do produto sobre fundo
cinza, sem quebrar o layout. **Próximo passo:** copiar as fotos para um bucket R2 próprio, para não
depender do CDN dos marketplaces.

## Segredos

| Nome | Onde | O que é |
|---|---|---|
| `RYZO_URL` | `wrangler.jsonc` (vars) | Endereço do Ryzo. Hoje aponta para o staging. |
| `RYZO_VITRINE_KEY` | `wrangler secret put` | Chave `rzv_...` da vitrine, gerada no Ryzo. Só o servidor usa. |
| `CART_SECRET` | `wrangler secret put` | Texto aleatório longo que assina o cookie do carrinho. Gere com `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`. |

Sem `CART_SECRET` fora do modo demonstração o carrinho não funciona (mensagem de manutenção), de
propósito: assinar com um segredo conhecido deixaria qualquer pessoa forjar o cookie.

A chave pública do Mercado Pago **não** fica aqui: o site pede ao Ryzo (`/vitrine/v1/pagamento/config`).
As credenciais do Mercado Pago e do Melhor Envio ficam só no Ryzo, criptografadas.

## Publicar

```sh
npx wrangler login
npx wrangler secret put RYZO_VITRINE_KEY
npx wrangler secret put CART_SECRET
npm run deploy        # astro build && wrangler deploy
```

Antes do primeiro deploy de produção, troque `RYZO_URL` no `wrangler.jsonc` para o Ryzo de produção.

### Domínio geekaura.com.br

O domínio está registrado no Registro.br. Para servir o Worker nele:

1. No painel da Cloudflare, **Add a site** → `geekaura.com.br` (plano Free) e anote os dois nameservers.
2. No Registro.br, em **DNS → Alterar servidores DNS**, troque pelos nameservers da Cloudflare. A
   propagação leva de minutos a algumas horas.
3. Em **Workers & Pages → geekaura-loja → Settings → Domains & Routes**, adicione o *Custom Domain*
   `geekaura.com.br` e também `www.geekaura.com.br` (a Cloudflare cria o DNS e o certificado).
4. Redirecione `www` para o domínio sem `www` (Rules → Redirect Rules), para não duplicar páginas no Google.

Se o domínio já recebe e-mail, copie os registros MX/TXT antigos para a Cloudflare antes do passo 2.

## Segurança (o que já está feito)

- CSP com nonce por resposta (`src/middleware.ts`, `src/lib/seguranca.ts`): nada de script inline sem
  nonce; `frame-src` só para os iframes do Mercado Pago (cartão e 3DS).
- HSTS, `nosniff`, `Referrer-Policy`, `X-Frame-Options` e `Permissions-Policy`. O arquivo `public/_headers`
  cobre os arquivos estáticos, que não passam pelo middleware.
- Carrinho em cookie `HttpOnly; Secure; SameSite=Lax` assinado com HMAC-SHA256, guardando só SKU e
  quantidade. O preço vem sempre do Ryzo; o pedido é montado a partir do cookie, nunca do corpo da requisição.
- Rotas de escrita conferem `Origin`, limitam o corpo e têm limite por IP (em memória, melhor esforço;
  o Ryzo tem o próprio limite atrás).
- Nenhum `set:html` com dado externo. A única exceção é o JSON-LD, que passa por `jsonLdSeguro`.
- Conta do cliente: cookie `ga_conta` assinado com contexto próprio (um cookie de carrinho nunca vale
  como cookie de conta); senha só trafega do navegador para o Ryzo, que guarda o hash; o destino depois
  do login (`?volta=`) só aceita caminho interno (`destinoSeguro`).
- O número do cartão nunca passa por este servidor: o cardForm do Mercado Pago roda em iframe e devolve
  só o token.

## Estrutura

```
src/
  middleware.ts        CSP com nonce e cabeçalhos
  lib/ryzo.ts          cliente da vitrine (timeout 8 s, cache 60 s, mapeamento campo a campo)
  lib/demo.ts          dados e fluxo do modo demonstração
  lib/carrinho.ts      cookie assinado do carrinho
  lib/conta.ts         sessão e operações da conta do cliente (Ryzo ou demonstração)
  lib/assinatura.ts    JSON assinado com HMAC para cookie
  lib/validacao.ts     regras de checkout e pagamento
  lib/loja.ts          dados da empresa e do atendimento (um lugar só)
  pages/               vitrine, carrinho, checkout, pedido, institucionais, /api/*
  scripts/             JavaScript do navegador: loja.ts (gaveta do carrinho, favoritos, sugestões
                       da busca), movimento.ts (revelação ao rolar), formConta.ts, pagamento.ts
  styles/movimento.css animação; o estado escondido só vale com a classe "anima" no <html>, que um
                       cronômetro no <head> desfaz em 2,5 s se o script não assumir
test/                  vitest
```
