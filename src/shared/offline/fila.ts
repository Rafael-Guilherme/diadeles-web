import Dexie, { type Table } from 'dexie';

export type TipoRegistro =
  | 'ALIMENTACAO'
  | 'SONO'
  | 'HIGIENE'
  | 'HIDRATACAO'
  | 'HUMOR'
  | 'ATIVIDADE'
  | 'OBSERVACAO';

export interface EnvelopePendente {
  clientId: string;
  criancaId: string;
  turmaId: string;
  tipo: TipoRegistro;
  ocorridoEm: string;
  dados: unknown;
  observacao?: string | null;
  tentativas: number;
  criadoEm: number;
  /** Preenchido quando a API rejeita por regra de negócio — nunca some em silêncio. */
  erro?: string;
}

class BancoOffline extends Dexie {
  pendentes!: Table<EnvelopePendente, string>;

  constructor() {
    super('diadeles-offline');
    this.version(1).stores({
      pendentes: 'clientId, turmaId, criadoEm, erro',
    });
  }
}

export const banco = new BancoOffline();

/**
 * Fila de saída do app do educador.
 *
 * Toda ação é gravada aqui *antes* de qualquer rede e refletida na UI na hora.
 * O envio é assíncrono, e o `clientId` gerado no cliente é a chave de
 * idempotência que faz o reenvio virar no-op na API (docs/arquitetura.md §6).
 */
export const fila = {
  async enfileirar(
    envelope: Omit<EnvelopePendente, 'clientId' | 'tentativas' | 'criadoEm'>,
  ): Promise<string> {
    const clientId = crypto.randomUUID();
    await banco.pendentes.add({
      ...envelope,
      clientId,
      tentativas: 0,
      criadoEm: Date.now(),
    });
    return clientId;
  },

  async enfileirarVarios(
    envelopes: Omit<EnvelopePendente, 'clientId' | 'tentativas' | 'criadoEm'>[],
  ): Promise<number> {
    const agora = Date.now();
    await banco.pendentes.bulkAdd(
      envelopes.map((e) => ({
        ...e,
        clientId: crypto.randomUUID(),
        tentativas: 0,
        criadoEm: agora,
      })),
    );
    return envelopes.length;
  },

  /** Só itens ainda enviáveis — os que falharam por regra de negócio ficam de fora. */
  async prontosParaEnvio(limite = 100): Promise<EnvelopePendente[]> {
    const todos = await banco.pendentes.orderBy('criadoEm').limit(limite).toArray();
    return todos.filter((item) => !item.erro);
  },

  async comErro(): Promise<EnvelopePendente[]> {
    return (await banco.pendentes.toArray()).filter((item) => Boolean(item.erro));
  },

  async remover(clientIds: string[]): Promise<void> {
    await banco.pendentes.bulkDelete(clientIds);
  },

  async marcarErro(clientId: string, erro: string): Promise<void> {
    await banco.pendentes.update(clientId, { erro });
  },

  async incrementarTentativa(clientIds: string[]): Promise<void> {
    await banco.transaction('rw', banco.pendentes, async () => {
      for (const id of clientIds) {
        const item = await banco.pendentes.get(id);
        if (item) await banco.pendentes.update(id, { tentativas: item.tentativas + 1 });
      }
    });
  },

  async descartar(clientId: string): Promise<void> {
    await banco.pendentes.delete(clientId);
  },

  contar(): Promise<number> {
    return banco.pendentes.count();
  },
};
