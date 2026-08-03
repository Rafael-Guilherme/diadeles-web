import createClient, { type Middleware } from 'openapi-fetch';
import type { paths } from './schema';
import { sessaoStore } from '../auth/sessao';

/**
 * Base sem o prefixo de versão: os paths do schema gerado já incluem `/v1`,
 * porque é assim que a API os publica. Manter o prefixo aqui e nas rotas
 * duplicaria o caminho — e o typecheck avisaria, que é o ponto de gerar tipos.
 */
export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
export const API_URL = `${API_BASE}/v1`;

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
        sessaoStore.getState().encerrar();
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

api.use(autenticacao);

export function mensagemDeErro(erro: unknown): string {
  if (typeof erro === 'object' && erro && 'mensagem' in erro) {
    return String((erro as ErroApi).mensagem);
  }
  return 'Não foi possível concluir. Tente novamente.';
}
