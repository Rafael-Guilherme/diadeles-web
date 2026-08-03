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

/**
 * O fetch precisa ser substituído aqui, no setup, e não dentro de cada teste:
 * o `openapi-fetch` captura `globalThis.fetch` no momento do import. Um stub
 * instalado depois não teria efeito — as requisições sairiam de verdade, o
 * token de teste tomaria 401 e o app encerraria a sessão, que é justamente o
 * comportamento correto dele em produção.
 */
globalThis.fetch = ((entrada: RequestInfo | URL, init?: RequestInit) => {
  const url = String(
    typeof entrada === 'object' && 'url' in entrada ? entrada.url : entrada,
  );
  return Promise.resolve(manipulador(url, init));
}) as typeof fetch;

/** Mapeia trechos de rota para o corpo devolvido. */
export function responderCom(mapa: Record<string, unknown>): void {
  manipulador = (url) => {
    const chave = Object.keys(mapa).find((rota) => url.includes(rota));
    return new Response(JSON.stringify(chave ? mapa[chave] : {}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  manipulador = () => new Response('{}', { status: 200 });
  vi.restoreAllMocks();
});
