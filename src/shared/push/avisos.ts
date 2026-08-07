import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/cliente';
import { ehIOS, estaInstalado } from '../pwa/instalacao';

export type EstadoAvisos =
  /** Navegador sem Web Push (Safari em macOS antigo, navegador embutido de app) */
  | 'indisponivel'
  /** iPhone sem o app na tela de início — pedir permissão aqui falha e queima a chance */
  | 'precisa-instalar'
  /** O servidor está sem VAPID configurado */
  | 'sem-configuracao'
  | 'desligado'
  /** O usuário negou. Só as configurações do navegador revertem — não adianta pedir de novo */
  | 'negado'
  | 'ligado';

/** `desligado` aqui significa que o usuário fechou o pedido sem responder. */
export type ResultadoAtivacao = EstadoAvisos | 'erro';

export function suportaAvisos(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    typeof window !== 'undefined' &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Inscrição em Web Push.
 *
 * Push é o único canal em tempo real do produto (docs/plano-produto.md §8), e o
 * fluxo tem duas armadilhas que decidem se ele existe ou não:
 *
 *  1. **iOS só entrega push com o PWA na tela de início.** Chamar
 *     `Notification.requestPermission()` antes disso falha, e o usuário que viu
 *     o pedido falhar não volta. Por isso `precisa-instalar` é um estado, não
 *     um erro — ele manda para a página /instalar.
 *  2. **A inscrição é presa à chave VAPID do servidor.** Se a chave mudar, o
 *     navegador continua devolvendo a inscrição velha e todo envio é recusado
 *     com 403, em silêncio. A checagem em `mesmaChave` é o que faz o app se
 *     reinscrever sozinho nesse caso.
 */
export function useAvisos() {
  const [estado, setEstado] = useState<EstadoAvisos>('desligado');
  const [ativando, setAtivando] = useState(false);

  useEffect(() => {
    let vivo = true;

    void (async () => {
      const atual = await estadoAtual();
      if (vivo) setEstado(atual);

      // O endpoint é rotacionado pelo próprio navegador. Reenviá-lo a cada
      // abertura evita a família achar que os avisos pararam sem motivo.
      await ressincronizar();
    })();

    return () => {
      vivo = false;
    };
  }, []);

  const ativar = useCallback(async (): Promise<ResultadoAtivacao> => {
    setAtivando(true);
    try {
      const resultado = await inscrever();
      setEstado(resultado === 'erro' ? await estadoAtual() : resultado);
      return resultado;
    } finally {
      setAtivando(false);
    }
  }, []);

  const desativar = useCallback(async () => {
    await desinscrever();
    setEstado(await estadoAtual());
  }, []);

  return { estado, ativando, ativar, desativar };
}

async function estadoAtual(): Promise<EstadoAvisos> {
  if (!suportaAvisos()) return 'indisponivel';
  if (Notification.permission === 'denied') return 'negado';
  if (ehIOS() && !estaInstalado()) return 'precisa-instalar';
  if (Notification.permission !== 'granted') return 'desligado';

  const inscricao = await inscricaoAtual();
  return inscricao ? 'ligado' : 'desligado';
}

async function inscricaoAtual(): Promise<PushSubscription | null> {
  try {
    const registro = await navigator.serviceWorker.getRegistration();
    return (await registro?.pushManager.getSubscription()) ?? null;
  } catch {
    return null;
  }
}

async function chavePublica(): Promise<string | null> {
  const { data } = await api.GET('/v1/notificacoes/chave-publica');
  return data?.chavePublica ?? null;
}

async function inscrever(): Promise<ResultadoAtivacao> {
  if (!suportaAvisos()) return 'indisponivel';
  if (ehIOS() && !estaInstalado()) return 'precisa-instalar';

  const chave = await chavePublica();
  if (!chave) return 'sem-configuracao';

  const permissao = await Notification.requestPermission();
  if (permissao !== 'granted') return permissao === 'denied' ? 'negado' : 'desligado';

  try {
    // `ready`, não `getRegistration`: na primeira visita o service worker ainda
    // pode estar instalando, e `pushManager` só existe depois de ativo.
    const registro = await navigator.serviceWorker.ready;

    let inscricao = await registro.pushManager.getSubscription();

    if (inscricao && !mesmaChave(inscricao, chave)) {
      await inscricao.unsubscribe();
      inscricao = null;
    }

    inscricao ??= await registro.pushManager.subscribe({
      // Obrigatório nos navegadores atuais: push silencioso não é permitido, e
      // aqui é o que queremos mesmo — todo aviso tem algo a dizer.
      userVisibleOnly: true,
      applicationServerKey: base64UrlParaBytes(chave),
    });

    await enviarInscricao(inscricao);

    // Confirmação imediata: sem ela o usuário concede a permissão, não vê nada
    // acontecer e conclui que não funcionou.
    await api.POST('/v1/notificacoes/teste', {});

    return 'ligado';
  } catch {
    return 'erro';
  }
}

async function desinscrever(): Promise<void> {
  const inscricao = await inscricaoAtual();
  if (!inscricao) return;

  await api.POST('/v1/notificacoes/devices/remover', {
    body: { endpoint: inscricao.endpoint },
  });
  await inscricao.unsubscribe();
}

/** Reenvia a inscrição existente, sem pedir permissão nenhuma. */
export async function ressincronizar(): Promise<void> {
  if (!suportaAvisos() || Notification.permission !== 'granted') return;

  const inscricao = await inscricaoAtual();
  if (!inscricao) return;

  const chave = await chavePublica();
  if (chave && !mesmaChave(inscricao, chave)) {
    // A chave do servidor mudou: a inscrição atual seria recusada com 403 em
    // todo envio. Descartar aqui deixa o próximo `ativar()` refazer.
    await inscricao.unsubscribe();
    return;
  }

  await enviarInscricao(inscricao);
}

async function enviarInscricao(inscricao: PushSubscription): Promise<void> {
  const chaves = inscricao.toJSON().keys;
  if (!chaves?.p256dh || !chaves.auth) return;

  await api.POST('/v1/notificacoes/devices', {
    body: {
      endpoint: inscricao.endpoint,
      p256dh: chaves.p256dh,
      auth: chaves.auth,
      plataforma: navigator.userAgent.slice(0, 120),
    },
  });
}

function mesmaChave(inscricao: PushSubscription, chave: string): boolean {
  const atual = inscricao.options.applicationServerKey;
  if (!atual) return false;
  return bytesParaBase64Url(new Uint8Array(atual)) === chave;
}

/** A chave VAPID trafega em base64url; `subscribe()` exige bytes. */
function base64UrlParaBytes(base64url: string): ArrayBuffer {
  const preenchido = base64url.padEnd(base64url.length + ((4 - (base64url.length % 4)) % 4), '=');
  const bruto = atob(preenchido.replace(/-/g, '+').replace(/_/g, '/'));

  const buffer = new ArrayBuffer(bruto.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bruto.length; i += 1) bytes[i] = bruto.charCodeAt(i);

  return buffer;
}

function bytesParaBase64Url(bytes: Uint8Array): string {
  let binario = '';
  for (const byte of bytes) binario += String.fromCharCode(byte);
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
