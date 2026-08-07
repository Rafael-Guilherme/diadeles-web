/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';
import { iniciar } from './base';

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

// Sem `fetch` interceptado: o app da família não guarda resposta da API no
// aparelho. O que ele precisa do service worker é receber o push.
iniciar('responsavel');
