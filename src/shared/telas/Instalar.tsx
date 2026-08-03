import { Check, Share, SquarePlus, Smartphone } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useInstalacao } from '../pwa/instalacao';
import { Aviso, Botao, Cartao } from '../ui/componentes';

/**
 * Página dedicada de instalação.
 *
 * É a etapa mais crítica do funil: sem WhatsApp, o push é o único canal em
 * tempo real, e no iOS o push só existe com o app na tela de início. Por isso
 * as instruções manuais do iPhone não são um detalhe — são o produto
 * funcionando ou não (docs/plano-produto.md §8).
 */
export function Instalar({ voltar }: { voltar?: () => void }) {
  const { instalado, podeInstalarDireto, ios } = useInstalacao();
  const instalacao = useInstalacao();
  const [resultado, setResultado] = useState<string | null>(null);

  async function instalar() {
    const saida = await instalacao.instalar();
    if (saida === 'dismissed') setResultado('Tudo bem — você pode instalar depois por aqui.');
    if (saida === 'indisponivel') setResultado('Use o menu do navegador para adicionar à tela.');
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-5 px-5 py-8">
      <header className="space-y-1">
        <h1 className="text-2xl">Instalar o aplicativo</h1>
        <p className="text-sm leading-relaxed text-[color:var(--color-tinta-suave)]">
          Instalando, o app abre direto da tela de início e passa a avisar quando houver novidade.
        </p>
      </header>

      {instalado ? (
        <Cartao interno className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-ok-suave)] text-[color:var(--color-ok)]">
            <Check size={20} />
          </span>
          <div>
            <p className="font-semibold">Já está instalado</p>
            <p className="text-sm text-[color:var(--color-tinta-suave)]">
              Você está usando o aplicativo agora.
            </p>
          </div>
        </Cartao>
      ) : podeInstalarDireto ? (
        <Cartao interno className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(color:--cor-acao-suave) text-(color:--cor-acao)">
              <Smartphone size={20} />
            </span>
            <p className="text-sm">Seu navegador permite instalar com um toque.</p>
          </div>
          <Botao bloco onClick={() => void instalar()}>
            Instalar agora
          </Botao>
          {resultado && <p className="text-xs text-[color:var(--color-tinta-suave)]">{resultado}</p>}
        </Cartao>
      ) : ios ? (
        <Cartao interno className="space-y-4">
          <p className="text-sm font-semibold">No iPhone ou iPad, em 3 passos:</p>
          <ol className="space-y-3 text-sm">
            <Passo numero={1}>
              Toque em <Share size={16} className="inline shrink-0" /> <b>Compartilhar</b>, na barra
              do Safari.
            </Passo>
            <Passo numero={2}>
              Escolha <SquarePlus size={16} className="inline shrink-0" />{' '}
              <b>Adicionar à Tela de Início</b>.
            </Passo>
            <Passo numero={3}>
              Confirme em <b>Adicionar</b>. Pronto — abra o app pelo novo ícone.
            </Passo>
          </ol>
          <Aviso>
            No iPhone, os avisos só funcionam depois de adicionar à tela de início. É uma regra do
            próprio sistema.
          </Aviso>
        </Cartao>
      ) : (
        <Cartao interno className="space-y-4">
          <p className="text-sm font-semibold">No Android ou no computador:</p>
          <ol className="space-y-3 text-sm">
            <Passo numero={1}>Abra o menu do navegador (⋮).</Passo>
            <Passo numero={2}>
              Toque em <b>Instalar aplicativo</b> ou <b>Adicionar à tela inicial</b>.
            </Passo>
            <Passo numero={3}>Confirme. O ícone aparece junto dos seus outros apps.</Passo>
          </ol>
        </Cartao>
      )}

      {voltar && (
        <Botao variante="secundario" bloco onClick={voltar}>
          Voltar
        </Botao>
      )}
    </div>
  );
}

function Passo({ numero, children }: { numero: number; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="numerico flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-papel)] text-xs font-bold ring-1 ring-[color:var(--color-borda)]">
        {numero}
      </span>
      <span className="flex flex-wrap items-center gap-x-1.5 leading-relaxed">{children}</span>
    </li>
  );
}
