import { DIFERENCIAIS } from '../conteudo';

export function Diferenciais() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <div className="max-w-2xl">
        <p className="text-sm font-bold uppercase tracking-wider text-[--cor-acao]">
          Decisões de produto
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Quatro escolhas que mudam o dia a dia.
        </h2>
      </div>

      <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2">
        {DIFERENCIAIS.map((item, indice) => (
          <div key={item.titulo} className="flex gap-4">
            <span className="text-2xl font-bold text-[color:var(--color-borda)]">
              {String(indice + 1).padStart(2, '0')}
            </span>
            <div>
              <h3 className="text-lg font-bold leading-snug">{item.titulo}</h3>
              <p className="mt-1.5 leading-relaxed text-[color:var(--color-tinta-suave)]">
                {item.texto}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
