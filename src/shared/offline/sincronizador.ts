import { useEffect, useState } from 'react';
import { api } from '../api/cliente';
import { fila, type EnvelopePendente } from './fila';

export interface EstadoFila {
  pendentes: number;
  comErro: number;
  enviando: boolean;
  online: boolean;
  ultimoEnvio: number | null;
  /**
   * O primeiro registro travado, para o cabeçalho poder dizer qual é.
   *
   * "1 erro" não é informação acionável: a educadora precisa saber que foi a
   * dose do Davi e que falta a segunda checagem, senão o indicador vira
   * enfeite e ela para de olhar para ele.
   */
  primeiroErro: { clientId: string; turmaId: string; erro: string } | null;
}

type Ouvinte = (estado: EstadoFila) => void;

let estado: EstadoFila = {
  pendentes: 0,
  comErro: 0,
  enviando: false,
  online: navigator.onLine,
  ultimoEnvio: null,
  primeiroErro: null,
};

const ouvintes = new Set<Ouvinte>();

function publicar(mudanca: Partial<EstadoFila>): void {
  estado = { ...estado, ...mudanca };
  for (const ouvinte of ouvintes) ouvinte(estado);
}

async function atualizarContagem(): Promise<void> {
  const [pendentes, erros] = await Promise.all([fila.contar(), fila.comErro()]);
  const primeiro = erros[0];
  publicar({
    pendentes: pendentes - erros.length,
    comErro: erros.length,
    primeiroErro: primeiro
      ? {
          clientId: primeiro.clientId,
          turmaId: primeiro.turmaId,
          erro: primeiro.erro ?? 'Não foi possível registrar.',
        }
      : null,
  });
}

/**
 * Envia o que estiver na fila. Seguro chamar a qualquer momento — nunca há dois
 * envios simultâneos, e o `clientId` cobre qualquer reenvio.
 */
export async function sincronizar(): Promise<void> {
  if (estado.enviando || !navigator.onLine) return;

  const itens = await fila.prontosParaEnvio();
  if (!itens.length) {
    await atualizarContagem();
    return;
  }

  publicar({ enviando: true });

  try {
    const { data, error } = await api.POST('/v1/registros/sync', {
      body: {
        itens: itens.map((item: EnvelopePendente) => ({
          clientId: item.clientId,
          criancaId: item.criancaId,
          turmaId: item.turmaId,
          tipo: item.tipo,
          ocorridoEm: item.ocorridoEm,
          dados: item.dados as Record<string, never>,
          observacao: item.observacao ?? null,
        })),
      },
    });

    if (error || !data) {
      /*
       * Mantém tudo na fila e tenta de novo depois — inclusive quando a recusa
       * é o corte por inadimplência (402 `ASSINATURA_SUSPENSA`).
       *
       * A tentação seria marcar o lote como erro e tirá-lo da fila, mas o que
       * o educador registrou aconteceu de verdade: a criança comeu, dormiu,
       * trocou. Guardar e continuar tentando faz o dia inteiro subir sozinho no
       * minuto em que a escola pagar. Quem explica a espera é a faixa de aviso,
       * que aparece em toda tela.
       */
      await fila.incrementarTentativa(itens.map((i) => i.clientId));
      return;
    }

    const resolvidos: string[] = [];

    for (const resultado of data.resultados) {
      if (resultado.status === 'criado' || resultado.status === 'duplicado') {
        resolvidos.push(resultado.clientId);
      } else {
        // Erro de regra de negócio: sai da fila de envio e vira aviso visível.
        // O que não pode acontecer é sumir em silêncio.
        await fila.marcarErro(
          resultado.clientId,
          resultado.mensagem ?? 'Não foi possível registrar.',
        );
      }
    }

    if (resolvidos.length) await fila.remover(resolvidos);
    publicar({ ultimoEnvio: Date.now() });
  } finally {
    publicar({ enviando: false });
    await atualizarContagem();
  }
}

/**
 * Três gatilhos de envio. O Safari não implementa Background Sync, então
 * `online` e `visibilitychange` são o que faz a fila esvaziar no iPhone —
 * detalhe que vários concorrentes erram (docs/plano-produto.md §8).
 */
export function iniciarSincronizacao(): () => void {
  const aoVoltarOnline = () => {
    publicar({ online: true });
    void sincronizar();
  };
  const aoFicarOffline = () => publicar({ online: false });
  const aoVoltarParaOApp = () => {
    if (document.visibilityState === 'visible') void sincronizar();
  };

  window.addEventListener('online', aoVoltarOnline);
  window.addEventListener('offline', aoFicarOffline);
  document.addEventListener('visibilitychange', aoVoltarParaOApp);

  void atualizarContagem();
  void sincronizar();

  const intervalo = window.setInterval(() => void sincronizar(), 30_000);

  return () => {
    window.removeEventListener('online', aoVoltarOnline);
    window.removeEventListener('offline', aoFicarOffline);
    document.removeEventListener('visibilitychange', aoVoltarParaOApp);
    window.clearInterval(intervalo);
  };
}

export function useFila(): EstadoFila {
  const [atual, setAtual] = useState(estado);

  useEffect(() => {
    ouvintes.add(setAtual);
    void atualizarContagem();
    return () => {
      ouvintes.delete(setAtual);
    };
  }, []);

  return atual;
}

export function notificarMudancaNaFila(): void {
  void atualizarContagem();
}
