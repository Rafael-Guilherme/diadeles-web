import { useEffect, useState } from 'react';

interface EventoInstalacao extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let eventoGuardado: EventoInstalacao | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (evento) => {
    evento.preventDefault();
    eventoGuardado = evento as EventoInstalacao;
  });
}

export function estaInstalado(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS não reporta display-mode em versões antigas
    ('standalone' in window.navigator && Boolean(window.navigator.standalone))
  );
}

export function ehIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    // iPad moderno se apresenta como Mac com toque
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export interface EstadoInstalacao {
  instalado: boolean;
  podeInstalarDireto: boolean;
  precisaInstruirManualmente: boolean;
  ios: boolean;
  instalar: () => Promise<'accepted' | 'dismissed' | 'indisponivel'>;
}

/**
 * `beforeinstallprompt` só existe em Chromium. No iOS o caminho é
 * Compartilhar → Adicionar à Tela de Início, e é por isso que existe uma página
 * /instalar com instruções — sem ela o iPhone fica de fora, e com ele o push
 * (docs/plano-produto.md §8).
 */
export function useInstalacao(): EstadoInstalacao {
  const [instalado, setInstalado] = useState(estaInstalado);
  const [disponivel, setDisponivel] = useState(Boolean(eventoGuardado));
  const ios = ehIOS();

  useEffect(() => {
    const aoDisponibilizar = (evento: Event) => {
      evento.preventDefault();
      eventoGuardado = evento as EventoInstalacao;
      setDisponivel(true);
    };
    const aoInstalar = () => {
      setInstalado(true);
      setDisponivel(false);
      eventoGuardado = null;
    };

    window.addEventListener('beforeinstallprompt', aoDisponibilizar);
    window.addEventListener('appinstalled', aoInstalar);

    const media = window.matchMedia('(display-mode: standalone)');
    const aoMudarModo = () => setInstalado(estaInstalado());
    media.addEventListener('change', aoMudarModo);

    return () => {
      window.removeEventListener('beforeinstallprompt', aoDisponibilizar);
      window.removeEventListener('appinstalled', aoInstalar);
      media.removeEventListener('change', aoMudarModo);
    };
  }, []);

  return {
    instalado,
    podeInstalarDireto: disponivel && !instalado,
    precisaInstruirManualmente: !instalado && !disponivel,
    ios,
    async instalar() {
      if (!eventoGuardado) return 'indisponivel';
      await eventoGuardado.prompt();
      const { outcome } = await eventoGuardado.userChoice;
      eventoGuardado = null;
      setDisponivel(false);
      return outcome;
    },
  };
}
