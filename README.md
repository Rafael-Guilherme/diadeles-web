# diadeles-app

Um repositório, **três builds**: o site institucional e os dois PWAs — educador e família. Mesma
base em `src/shared`, com manifests, ícones, tema e bundles próprios.

O site não é instalável: ninguém quer um ícone de página de vendas na tela de início, e um service
worker ali só serviria para servir preço desatualizado.

Por que dois e não um app com troca de papel: o service worker dos dois é oposto — o educador
precisa de offline agressivo, a família não deve manter dado de criança em cache sem necessidade —
e o ícone instalado é o que sustenta a taxa de instalação, que por sua vez sustenta o push
(`docs/plano-produto.md` §5 e §8).

## Rodar

```bash
cp .env.example .env
pnpm install
pnpm gen:api            # requer a API rodando
pnpm gen:icones

pnpm dev:site           # http://localhost:5176
pnpm dev:educador       # http://localhost:5175
pnpm dev:responsavel    # http://localhost:5174
```

## Estrutura

```
src/
  shared/
    api/        cliente tipado + schema.d.ts gerado do OpenAPI (commitado)
    auth/       sessão presa ao device
    offline/    fila Dexie + sincronizador
    pwa/        detecção e prompt de instalação
    ui/         tema e componentes
    telas/      entrada de demonstração e página /instalar
  sw/sw.ts      service worker comum, com estratégias distintas por app
  apps/
    site/         landing: proposta, planos, perguntas — não usa a API
    educador/     turmas, grade em lote, chamada, fechamento do turno
                  + gestão: painel do dia, equipe e acesso das famílias
    responsavel/  o dia, avisos, cardápio
  testes/       smoke de renderização do site e dos dois apps
```

As rotas `/gestao` só são montadas para `GESTOR`, `COORDENADOR` e `SUPER_ADMIN` — os mesmos papéis
que a API aceita nos endpoints correspondentes. Quem decide o acesso continua sendo a API, que
confere o papel em cada requisição; esconder a rota aqui serve para não oferecer uma tela que
resultaria em 403.

## O contrato com a API

`pnpm gen:api` baixa o OpenAPI e escreve `src/shared/api/schema.d.ts` — arquivo **commitado, nunca
editado à mão**. Mudou um contrato na API, o typecheck do front quebra. É o que substitui o
monorepo, sem acoplar os repositórios.

Os paths incluem `/v1` porque é assim que a API os publica; a `baseUrl` do cliente não repete o
prefixo.

## Offline

Toda ação do educador vai para a fila (`shared/offline/fila.ts`) antes de qualquer rede, e a UI
atualiza na hora. O envio dispara em três gatilhos: Background Sync, evento `online` e
`visibilitychange` — os dois últimos são o que faz funcionar no iPhone, onde Background Sync não
existe.

Cada envelope carrega um `clientId` gerado no cliente, que é a chave de idempotência: reenviar o
mesmo lote não cria registro repetido. Item recusado por regra de negócio sai da fila e vira aviso
visível no fechamento do turno — o que não pode acontecer é sumir em silêncio.

## Scripts

| Comando | O que faz |
|---|---|
| `pnpm build` | Constrói os três em `dist/site`, `dist/educador` e `dist/responsavel` |
| `pnpm test` | Renderiza o site e os dois apps em jsdom |
| `pnpm lint` | ESLint, com as regras de hooks do React |
| `pnpm gen:api` | Regenera os tipos a partir da API |
| `pnpm gen:icones` | Regera os ícones dos dois PWAs e o favicon do site |
