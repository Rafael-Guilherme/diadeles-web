import { ArrowLeft, Download } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFila, type EstadoFila } from '@/shared/offline/sincronizador';
import { useInstalacao } from '@/shared/pwa/instalacao';

/**
 * O indicador de fila fica sempre visível. Silêncio sobre o que ainda não subiu
 * destrói a confiança no app — o educador precisa saber, a qualquer momento,
 * que o trabalho dele está salvo (docs/plano-produto.md §8).
 *
 * São quatro estados e só um deles pede ação. Os outros três informam sem
 * alarmar: verde confirma, cinza avisa que está subindo, laranja promete que
 * vai subir sozinho. Vermelho só quando existe algo a consertar.
 */
export function Cabecalho({
  titulo,
  subtitulo,
  voltarPara,
  acao,
}: {
  titulo: string;
  subtitulo?: string;
  voltarPara?: string;
  acao?: ReactNode;
}) {
  const navegar = useNavigate();
  const fila = useFila();
  const { instalado } = useInstalacao();

  return (
    <header className="area-segura-topo sticky top-0 z-10 border-b border-[color:var(--color-borda)] bg-white/95 backdrop-blur-md">
      <div className="flex items-center gap-2.5 px-3 pb-2.5">
        {voltarPara && (
          <button
            onClick={() => navegar(voltarPara)}
            aria-label="Voltar"
            // h-11 = 44px, o mesmo alvo do `Botao`. A margem negativa cresce
            // junto para o ícone não deslocar da posição que já tinha.
            className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[color:var(--color-tinta-suave)] transition active:bg-neutral-100"
          >
            <ArrowLeft size={20} />
          </button>
        )}

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg leading-tight">{titulo}</h1>
          {subtitulo && (
            <p className="truncate text-xs text-[color:var(--color-tinta-tenue)]">{subtitulo}</p>
          )}
        </div>

        {acao}
        <IndicadorFila fila={fila} />
        {!instalado && (
          <Link
            to="/instalar"
            aria-label="Instalar aplicativo"
            className="-mr-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-(color:--cor-acao) transition active:bg-neutral-100"
          >
            <Download size={18} />
          </Link>
        )}
      </div>

      <FaixaDaFila fila={fila} />
    </header>
  );
}

/**
 * A pastilha de estado, sempre no mesmo lugar.
 *
 * O ponto colorido é o que se lê a meio metro de distância; o texto é o que
 * confirma de perto. Cor sozinha não basta — a palavra muda em todos os quatro.
 */
function IndicadorFila({ fila }: { fila: EstadoFila }) {
  const forma =
    'numerico flex h-8 shrink-0 items-center gap-1.5 rounded-(--raio-sm) border px-2 text-xs font-semibold';

  if (fila.comErro > 0) {
    return (
      <span
        className={`${forma} border-[color:var(--color-alerta)] bg-[color:var(--color-alerta-suave)] text-[color:var(--color-sol-700)]`}
        title="Registros que não puderam ser gravados"
      >
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-alerta)]" />
        erro ({fila.comErro})
      </span>
    );
  }

  if (!fila.online) {
    return (
      <span
        className={`${forma} border-[color:var(--color-sol-200)] bg-[color:var(--color-sol-50)] text-[color:var(--color-sol-700)]`}
        title="Sem rede — os registros ficam salvos aqui"
      >
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-sol-600)]" />
        sem rede{fila.pendentes > 0 ? ` (${fila.pendentes})` : ''}
      </span>
    );
  }

  if (fila.pendentes > 0 || fila.enviando) {
    return (
      <span
        className={`${forma} border-[color:var(--color-borda-forte)] bg-[color:var(--color-papel)] text-[color:var(--color-tinta-suave)]`}
        title="Enviando o que foi registrado"
      >
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-tinta-tenue)]" />
        enviando{fila.pendentes > 0 ? ` (${fila.pendentes})` : ''}
      </span>
    );
  }

  return (
    <span
      className={`${forma} border-[color:var(--color-ok)] bg-[color:var(--color-ok-suave)] text-[color:var(--color-ok)]`}
      title="Tudo sincronizado"
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-ok)]" />
      salvo
    </span>
  );
}

/**
 * A faixa abaixo do cabeçalho.
 *
 * Só aparece quando há o que prometer ou o que consertar. "Salvo" e "enviando"
 * não ganham faixa: a pastilha já disse tudo, e uma faixa permanente comeria
 * uma linha da grade o turno inteiro.
 */
function FaixaDaFila({ fila }: { fila: EstadoFila }) {
  if (fila.comErro > 0 && fila.primeiroErro) {
    return (
      <div className="flex items-center gap-2.5 border-t border-[color:var(--color-alerta)] bg-[color:var(--color-alerta-suave)] px-3 py-2.5">
        <span
          aria-hidden
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-(--raio-sm) bg-[color:var(--color-alerta)] text-xs font-bold text-white"
        >
          !
        </span>
        <p className="flex-1 text-xs leading-snug text-[color:var(--color-sol-700)]">
          <strong>
            {fila.comErro} {fila.comErro === 1 ? 'registro precisa' : 'registros precisam'} de você.
          </strong>{' '}
          {fila.primeiroErro.erro}
        </p>
        <Link
          to={`/turma/${fila.primeiroErro.turmaId}/pendencias`}
          className="flex h-9 shrink-0 items-center rounded-(--raio-sm) bg-[color:var(--color-alerta)] px-3 text-sm font-semibold text-white"
        >
          Resolver
        </Link>
      </div>
    );
  }

  if (!fila.online && fila.pendentes > 0) {
    return (
      <p className="border-t border-[color:var(--color-sol-200)] bg-[color:var(--color-sol-50)] px-3 py-2 text-xs leading-snug text-[color:var(--color-sol-700)]">
        Continue registrando. {fila.pendentes === 1 ? 'O' : 'Os'} <strong>{fila.pendentes}</strong>{' '}
        {fila.pendentes === 1 ? 'sobe sozinho' : 'sobem sozinhos'} quando a rede voltar, com o
        horário original.
      </p>
    );
  }

  // A linha de 2px é o único movimento do cabeçalho: subir é normal, não alerta.
  if (fila.enviando) {
    return (
      <div className="h-0.5 overflow-hidden bg-[color:var(--color-borda)]">
        <span className="block h-full w-2/5 animate-pulse bg-[color:var(--color-marca-500)]" />
      </div>
    );
  }

  return null;
}
