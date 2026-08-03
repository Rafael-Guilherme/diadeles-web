import type { ReactNode } from 'react';

/**
 * Abertura de seção do site: rótulo, título e um texto de apoio opcional.
 *
 * Cinco seções repetiam este mesmo bloco com tamanhos ligeiramente diferentes,
 * que é como uma página perde o ritmo — o leitor sente o desalinhamento antes
 * de conseguir apontá-lo.
 */
export function AberturaSecao({
  rotulo,
  titulo,
  children,
}: {
  rotulo: string;
  titulo: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-bold uppercase tracking-wider text-(color:--cor-acao)">{rotulo}</p>
      <h2 className="mt-2 text-balance text-3xl sm:text-4xl">{titulo}</h2>
      {children && (
        <p className="mt-4 text-lg leading-relaxed text-[color:var(--color-tinta-suave)]">
          {children}
        </p>
      )}
    </div>
  );
}
