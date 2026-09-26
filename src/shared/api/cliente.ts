import createClient, { type Middleware } from 'openapi-fetch';
import type { paths } from './schema';
import { sessaoStore } from '../auth/sessao';

/**
 * Base sem o prefixo de versão: os paths do schema gerado já incluem `/v1`,
 * porque é assim que a API os publica. Manter o prefixo aqui e nas rotas
 * duplicaria o caminho — e o typecheck avisaria, que é o ponto de gerar tipos.
 */
export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3100';

/**
 * A escola do app. Na API, toda rota de escola é `/v1/<slug>/…`
 * (arquitetura.md §17.2): é o slug que diz em qual banco a requisição cai.
 *
 * **Ponte até a fase 3.** Por enquanto o slug vem do build (`VITE_ESCOLA`,
 * `demo` por padrão) e o app atende uma escola só. Na fase 3 ele passa a vir
 * do primeiro segmento do endereço — `app.diadeles.com.br/cantinho-feliz` —
 * e este é o único lugar que muda.
 */
export const ESCOLA = import.meta.env.VITE_ESCOLA ?? 'demo';

export const API_URL = `${API_BASE}/v1/${ESCOLA}`;

export interface ErroApi {
  codigo: string;
  mensagem: string;
  detalhes?: unknown;
  traceId?: string;
}

/**
 * Cliente tipado pelo OpenAPI da API. Sem monorepo, é o `schema.d.ts` gerado
 * por `pnpm gen:api` que trava o contrato: mudou na API, o typecheck do front
 * quebra (docs/arquitetura.md §2).
 */
export const api = createClient<paths>({ baseUrl: API_BASE });

let renovacaoEmCurso: Promise<boolean> | null = null;

/** Uma renovação por vez: 6 requisições em paralelo não podem rotacionar 6 refresh. */
async function renovarSessao(): Promise<boolean> {
  renovacaoEmCurso ??= (async () => {
    try {
      const refreshToken = sessaoStore.getState().refreshToken;
      if (!refreshToken) return false;

      const resposta = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!resposta.ok) {
        /*
          Só encerra a sessão quando o servidor diz que a credencial não vale.

          429, 5xx e um 502 do proxy são transitórios, e apagar a sessão neles
          desloga quem não fez nada de errado. Para a equipe isso custa uma nova
          digitação de senha; para a família custa a escola inteira: ela entrou
          por um convite de uso único, e voltar exige a secretaria emitir outro
          (auth.service.ts recusa convite já usado com 409).

          Devolver `false` sem limpar mantém a sessão de pé — a próxima
          requisição tenta renovar de novo.
        */
        if (resposta.status === 401 || resposta.status === 403) {
          sessaoStore.getState().encerrar();
        }
        return false;
      }

      sessaoStore.getState().definir(await resposta.json());
      return true;
    } catch {
      return false;
    } finally {
      renovacaoEmCurso = null;
    }
  })();

  return renovacaoEmCurso;
}

/**
 * Os paths do schema gerado são `/v1/turmas`, porque é assim que o Nest os
 * declara; a escola entra no caminho aqui, na saída. Mantém o typecheck do
 * contrato intacto e deixa o slug num lugar só.
 */
const escolaNoCaminho: Middleware = {
  async onRequest({ request }) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/v1/') || url.pathname.startsWith(`/v1/${ESCOLA}/`)) {
      return request;
    }
    url.pathname = `/v1/${ESCOLA}${url.pathname.slice(3)}`;

    // O corpo lido de propósito: recriar uma Request a partir de outra com
    // corpo em stream exige `duplex` e falha em parte dos navegadores.
    const semCorpo = request.method === 'GET' || request.method === 'HEAD';
    return new Request(url, {
      method: request.method,
      headers: request.headers,
      body: semCorpo ? undefined : await request.blob(),
      credentials: request.credentials,
      signal: request.signal,
    });
  },
};

const autenticacao: Middleware = {
  async onRequest({ request }) {
    const token = sessaoStore.getState().accessToken;
    if (token) request.headers.set('Authorization', `Bearer ${token}`);
    return request;
  },

  async onResponse({ request, response }) {
    if (response.status !== 401) return response;
    if (request.url.includes('/auth/')) return response;

    const renovou = await renovarSessao();
    if (!renovou) return response;

    // Repete a requisição original com o token novo.
    const token = sessaoStore.getState().accessToken;
    const repetida = new Request(request.url, {
      method: request.method,
      headers: new Headers(request.headers),
      body: request.bodyUsed ? undefined : await request.clone().text(),
    });
    if (token) repetida.headers.set('Authorization', `Bearer ${token}`);

    return fetch(repetida);
  },
};

api.use(escolaNoCaminho, autenticacao);

export function mensagemDeErro(erro: unknown): string {
  if (typeof erro === 'object' && erro && 'mensagem' in erro) {
    return String((erro as ErroApi).mensagem);
  }
  return 'Não foi possível concluir. Tente novamente.';
}
