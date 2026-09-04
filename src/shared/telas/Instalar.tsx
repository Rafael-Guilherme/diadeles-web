import { Check, Smartphone } from 'lucide-react';
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
  /*
    O sistema é detectado, mas dá para trocar à mão: metade das instalações
    acontece com a secretaria lendo o passo a passo por telefone para uma mãe
    que está com outro aparelho na mão.
  */
  const [sistema, setSistema] = useState<'iphone' | 'android'>(ios ? 'iphone' : 'android');

  async function instalar() {
    const saida = await instalacao.instalar();
    if (saida === 'dismissed') setResultado('Tudo bem — você pode instalar depois por aqui.');
    if (saida === 'indisponivel') setResultado('Use o menu do navegador para adicionar à tela.');
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-5 px-5 py-8">
      <header className="-mx-5 -mt-8 mb-1 bg-[color:var(--color-sol-50)] px-5 pb-5 pt-8">
        <h1 className="text-2xl">Deixe o Diadeles na tela inicial</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--color-sol-700)]">
          Abre como um aplicativo, sem barra do navegador, e avisa quando houver registro novo. Não
          precisa de loja de apps.
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
      ) : (
        <div className="space-y-4">
          <div className="flex rounded-(--raio) border border-[color:var(--color-borda-forte)] bg-white p-1">
            {(
              [
                ['iphone', 'iPhone'],
                ['android', 'Android'],
              ] as const
            ).map(([valor, rotulo]) => (
              <button
                key={valor}
                onClick={() => setSistema(valor)}
                aria-pressed={sistema === valor}
                className={`min-h-11 flex-1 rounded-(--raio-sm) text-sm font-semibold transition ${
                  sistema === valor
                    ? 'bg-[color:var(--color-tinta)] text-white'
                    : 'text-[color:var(--color-tinta-suave)]'
                }`}
              >
                {rotulo}
              </button>
            ))}
          </div>

          {sistema === 'iphone' ? (
            <ol className="space-y-(--gap-lista)">
              <Passo numero={1} titulo="Use o Safari">
                Se abriu pelo Chrome ou pelo Instagram, o iPhone não deixa instalar. Copie o
                endereço e cole no Safari.
              </Passo>
              <Passo numero={2} titulo="Toque em Compartilhar">
                É o botão do meio, na barra de baixo do Safari — o quadrado com a seta para cima.
              </Passo>
              <Passo numero={3} titulo="Escolha “Adicionar à Tela de Início”">
                Role a lista para baixo e toque em Adicionar.
              </Passo>
            </ol>
          ) : (
            <ol className="space-y-(--gap-lista)">
              <Passo numero={1} titulo="Abra o menu do navegador">
                É o ⋮ no canto da barra de endereços.
              </Passo>
              <Passo numero={2} titulo="Toque em “Instalar aplicativo”">
                Em alguns aparelhos aparece como “Adicionar à tela inicial”.
              </Passo>
              <Passo numero={3} titulo="Confirme">
                O ícone aparece junto dos seus outros aplicativos.
              </Passo>
            </ol>
          )}

          {sistema === 'iphone' && (
            <Aviso>
              No iPhone, os avisos só funcionam depois de adicionar à tela de início. É uma regra do
              próprio sistema.
            </Aviso>
          )}

          <p className="rounded-(--raio) border border-[color:var(--color-borda)] bg-white p-(--padding-cartao) text-sm leading-snug text-[color:var(--color-tinta-suave)]">
            Já instalou e não achou? O ícone entra na última página da tela inicial.
          </p>
        </div>
      )}

      {voltar && (
        <Botao variante="secundario" bloco onClick={voltar}>
          Voltar
        </Botao>
      )}
    </div>
  );
}

function Passo({
  numero,
  titulo,
  children,
}: {
  numero: number;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <li className="flex gap-3 rounded-(--raio) border border-[color:var(--color-borda)] bg-white p-(--padding-cartao)">
      <span className="numerico flex h-6 w-6 shrink-0 items-center justify-center rounded-(--raio-sm) bg-[color:var(--color-sol-50)] text-xs font-bold text-[color:var(--color-sol-700)]">
        {numero}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{titulo}</p>
        <p className="mt-0.5 text-sm leading-snug text-[color:var(--color-tinta-suave)]">
          {children}
        </p>
      </div>
    </li>
  );
}
