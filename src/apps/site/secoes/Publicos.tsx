import { Check } from 'lucide-react';
import { PUBLICOS } from '../conteudo';
import { AberturaSecao } from '../componentes';

export function Publicos() {
  return (
    <section id="publicos" className="mx-auto max-w-6xl px-5 py-20">
      <AberturaSecao rotulo="Para quem" titulo="Três pessoas, três necessidades que não se parecem." />

      <div className="mt-12 grid gap-(--gap-lista) lg:grid-cols-3">
        {PUBLICOS.map((publico) => (
          <div
            key={publico.titulo}
            className="flex flex-col rounded-(--raio-xl) border border-[color:var(--color-borda)] p-(--padding-cartao)"
          >
            <h3 className="text-lg">{publico.titulo}</h3>
            <p className="mt-1 text-[15px] italic text-(color:--cor-acao)">{publico.frase}</p>

            <ul className="mt-5 space-y-2.5">
              {publico.itens.map((item) => (
                <li key={item} className="flex gap-2.5 text-[15px] leading-snug">
                  <Check size={17} className="mt-0.5 shrink-0 text-(color:--cor-acao)" />
                  <span className="text-[color:var(--color-tinta-suave)]">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
