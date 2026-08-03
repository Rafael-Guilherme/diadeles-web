import { Check, Share, SquarePlus, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { useInstalacao } from '../pwa/instalacao';
import { Botao, Cartao } from '../ui/componentes';

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
        <h1 className="text-2xl font-bold tracking-tight">Instalar o aplicativo</h1>
        <p className="text-sm text-[color:var(--color-tinta-suave)]">
          Instalando, o app abre direto da tela de início e passa a avisar quando houver novidade.
        </p>
      </header>

      {instalado ? (
        <Cartao className="flex items-center gap-3 p-4">
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
        <Cartao className="space-y-3 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[--cor-acao-suave] text-[--cor-acao]">
              <Smartphone size={20} />
            </span>
            <p className="text-sm">Seu navegador permite instalar com um toque.</p>
          </div>
          <Botao bloco onClick={() => void instalar()}>
            Instalar agora
          </Botao>
          {resultado && (
            <p className="text-xs text-[color:var(--color-tinta-suave)]">{resultado}</p>
          )}
        </Cartao>
      ) : ios ? (
        <Cartao className="space-y-4 p-4">
          <p className="text-sm font-semibold">No iPhone ou iPad, em 3 passos:</p>
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold">
                1
              </span>
              <span className="flex items-center gap-1.5">
                Toque em <Share size={16} className="inline" /> <b>Compartilhar</b>, na barra do
                Safari.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold">
                2
              </span>
              <span className="flex items-center gap-1.5">
                Escolha <SquarePlus size={16} className="inline" />{' '}
                <b>Adicionar à Tela de Início</b>.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold">
                3
              </span>
              <span>
                Confirme em <b>Adicionar</b>. Pronto — abra o app pelo novo ícone.
              </span>
            </li>
          </ol>
          <p className="rounded-lg bg-[color:var(--color-alerta-suave)] px-3 py-2 text-xs text-[color:var(--color-alerta)]">
            No iPhone, os avisos só funcionam depois de adicionar à tela de início. É uma regra do
            próprio sistema.
          </p>
        </Cartao>
      ) : (
        <Cartao className="space-y-3 p-4">
          <p className="text-sm font-semibold">No Android ou no computador:</p>
          <ol className="space-y-2 text-sm text-[color:var(--color-tinta-suave)]">
            <li>1. Abra o menu do navegador (⋮).</li>
            <li>
              2. Toque em <b>Instalar aplicativo</b> ou <b>Adicionar à tela inicial</b>.
            </li>
            <li>3. Confirme. O ícone aparece junto dos seus outros apps.</li>
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
