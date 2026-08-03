/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

declare const self: ServiceWorkerGlobalScope;

/**
 * Service worker comum aos dois PWAs, com estratégias diferentes por app.
 *
 * O educador precisa do turno inteiro sem rede. O responsável não deve manter
 * dado de criança em cache além do necessário — cachear ali é superfície de
 * exposição sem contrapartida (docs/plano-produto.md §5).
 */
const APP = (self.registration.scope.includes('5174') ? 'responsavel' : 'educador') as
  | 'educador'
  | 'responsavel';

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
clientsClaim();

// Sem skipWaiting automático: quem decide atualizar é o usuário, pelo prompt.
// Recarregar por baixo de um educador no meio da chamada perde trabalho.
self.addEventListener('message', (evento) => {
  if (evento.data?.type === 'SKIP_WAITING') void self.skipWaiting();
});

const CACHE_DADOS = `diadeles-dados-${APP}`;

self.addEventListener('fetch', (evento) => {
  const url = new URL(evento.request.url);
  const ehApi = url.pathname.includes('/v1/');

  if (!ehApi || evento.request.method !== 'GET') return;

  if (APP === 'educador') {
    // Rede primeiro, cache como rede de segurança: o educador aceita ver o
    // estado de 5 minutos atrás, mas não aceita tela em branco.
    evento.respondWith(
      (async () => {
        try {
          const resposta = await fetch(evento.request);
          if (resposta.ok) {
            const cache = await caches.open(CACHE_DADOS);
            await cache.put(evento.request, resposta.clone());
          }
          return resposta;
        } catch {
          const emCache = await caches.match(evento.request);
          if (emCache) return emCache;
          return new Response(
            JSON.stringify({ codigo: 'OFFLINE', mensagem: 'Sem conexão no momento.' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } },
          );
        }
      })(),
    );
    return;
  }

  // Responsável: só rede. Nada de dado de criança persistido no aparelho.
});

self.addEventListener('push', (evento) => {
  if (!evento.data) return;

  const dados = evento.data.json() as {
    titulo: string;
    corpo: string;
    link?: string;
    gravidade?: string;
  };

  void self.registration.showNotification(dados.titulo, {
    body: dados.corpo,
    icon: '/pwa-192.png',
    badge: '/pwa-192.png',
    tag: dados.gravidade === 'GRAVE' ? 'grave' : 'rotina',
    requireInteraction: dados.gravidade === 'GRAVE',
    data: { link: dados.link ?? '/' },
  });
});

self.addEventListener('notificationclick', (evento) => {
  evento.notification.close();
  const link = (evento.notification.data as { link?: string })?.link ?? '/';

  evento.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((janelas) => {
      for (const janela of janelas) {
        if ('focus' in janela) return janela.focus();
      }
      return self.clients.openWindow(link);
    }),
  );
});

/** Background Sync existe só em Chromium; o fallback está no app (sincronizador.ts). */
self.addEventListener('sync', (evento) => {
  const sincronizacao = evento as ExtendableEvent & { tag: string };
  if (sincronizacao.tag !== 'diadeles-fila') return;

  sincronizacao.waitUntil(
    self.clients.matchAll().then((janelas) => {
      for (const janela of janelas) janela.postMessage({ type: 'SINCRONIZAR' });
    }),
  );
});
