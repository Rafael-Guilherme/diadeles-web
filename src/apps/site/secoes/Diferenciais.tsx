import { DIFERENCIAIS } from '../conteudo';
import { AberturaSecao } from '../componentes';

export function Diferenciais() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <AberturaSecao rotulo="Decisões de produto" titulo="Quatro escolhas que mudam o dia a dia." />

      <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2">
        {DIFERENCIAIS.map((item, indice) => (
          <div key={item.titulo} className="flex gap-4">
            <span className="numerico text-2xl font-bold text-[color:var(--color-borda-forte)]">
              {String(indice + 1).padStart(2, '0')}
            </span>
            <div>
              <h3 className="text-lg leading-snug">{item.titulo}</h3>
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
