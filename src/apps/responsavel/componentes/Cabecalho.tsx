import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * O cabeçalho do app da família.
 *
 * Fundo quente até onde o título vai, e a folha clara do conteúdo começando
 * logo abaixo: é a mesma divisão da tela Hoje, e é ela que faz as seis telas
 * parecerem o mesmo app. Título em Fraunces porque aqui o tom importa mais que
 * a densidade — o oposto exato do cabeçalho do educador.
 */
export function Cabecalho({
  titulo,
  descricao,
  voltar = false,
  acao,
}: {
  titulo: string;
  descricao?: ReactNode;
  /** Telas de segundo nível (aviso, recado, parecer) mostram a volta. */
  voltar?: boolean;
  acao?: ReactNode;
}) {
  const navegar = useNavigate();

  return (
    <header className="area-segura-topo bg-[color:var(--color-sol-50)] px-4 pb-4">
      <div className="flex items-start gap-2">
        {voltar && (
          <button
            onClick={() => navegar(-1)}
            aria-label="Voltar"
            className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[color:var(--color-sol-700)] transition active:bg-[color:var(--color-sol-100)]"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="display text-2xl leading-[1.1]">{titulo}</h1>
          {descricao && (
            <p className="mt-1 text-sm leading-snug text-[color:var(--color-sol-700)]">
              {descricao}
            </p>
          )}
        </div>
        {acao}
      </div>
    </header>
  );
}

/**
 * A folha clara sob o cabeçalho.
 *
 * Todo conteúdo da família mora aqui dentro: o canto arredondado no topo é o
 * que separa "quem é esta tela" de "o que tem nela".
 */
export function Folha({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 rounded-t-(--raio-xl) border-t border-[color:var(--color-borda)] bg-[color:var(--color-papel)] px-4 pb-6 pt-4">
      {children}
    </div>
  );
}

/** Envolve a tela inteira: papel quente atrás, largura de leitura no tablet. */
export function Tela({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col bg-[color:var(--color-sol-50)]">
      {children}
    </div>
  );
}
