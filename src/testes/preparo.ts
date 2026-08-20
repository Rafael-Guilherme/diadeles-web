import 'fake-indexeddb/auto';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom não implementa matchMedia, usado pela detecção de app instalado.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

type Manipulador = (url: string, init?: RequestInit) => Response | Promise<Response>;

let manipulador: Manipulador = () => new Response('{}', { status: 200 });

interface RespostaCrua {
  __resposta: { status: number; corpo: unknown };
}

/**
 * Resposta com status diferente de 200 — para os casos em que o código de
 * erro *é* o comportamento sob teste. O 404 de `/demo` num ambiente sem
 * demonstração, por exemplo, não é falha: é a API dizendo que aquele ambiente
 * é de produção.
 */
export function comStatus(status: number, corpo: unknown = {}): RespostaCrua {
  return { __resposta: { status, corpo } };
}

export interface ChamadaRegistrada {
  url: string;
  metodo: string;
  corpo: unknown;
}

/**
 * O que o app pediu à API, na ordem. Alguns comportamentos só existem como
 * requisição — "sair" que não chama `/auth/sair` deixa a sessão viva no
 * servidor, e nenhuma asserção sobre a tela pegaria isso.
 */
export const chamadas: ChamadaRegistrada[] = [];

/**
 * O fetch precisa ser substituído aqui, no setup, e não dentro de cada teste:
 * o `openapi-fetch` captura `globalThis.fetch` no momento do import. Um stub
 * instalado depois não teria efeito — as requisições sairiam de verdade, o
 * token de teste tomaria 401 e o app encerraria a sessão, que é justamente o
 * comportamento correto dele em produção.
 */
globalThis.fetch = (async (entrada: RequestInfo | URL, init?: RequestInit) => {
  // O `openapi-fetch` chama `fetch(request)` com um Request montado, e não com
  // (url, init): sem ler o corpo dele, metade das requisições do app apareceria
  // aqui sem payload nenhum.
  const requisicao = typeof entrada === 'object' && 'url' in entrada ? entrada : null;
  const url = String(requisicao ? requisicao.url : entrada);

  const texto = requisicao
    ? await requisicao.clone().text()
    : typeof init?.body === 'string'
      ? init.body
      : '';

  chamadas.push({
    url,
    metodo: requisicao?.method ?? init?.method ?? 'GET',
    corpo: texto ? JSON.parse(texto) : null,
  });

  return manipulador(url, init);
}) as typeof fetch;

/** Mapeia trechos de rota para o corpo devolvido. */
export function responderCom(mapa: Record<string, unknown>): void {
  manipulador = (url) => {
    const chave = Object.keys(mapa).find((rota) => url.includes(rota));
    const valor = chave ? mapa[chave] : {};

    const crua =
      typeof valor === 'object' && valor !== null && '__resposta' in valor
        ? (valor as RespostaCrua).__resposta
        : null;

    return new Response(JSON.stringify(crua ? crua.corpo : valor), {
      status: crua ? crua.status : 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  chamadas.length = 0;
  manipulador = () => new Response('{}', { status: 200 });
  vi.restoreAllMocks();
});
