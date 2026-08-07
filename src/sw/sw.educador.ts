/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';
import { iniciar } from './base';

declare const self: ServiceWorkerGlobalScope;

// `self.__WB_MANIFEST` fica no arquivo de entrada de propósito: é o marcador
// que o workbox substitui pela lista de precache no build.
precacheAndRoute(self.__WB_MANIFEST);

iniciar('educador');
