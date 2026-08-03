import { Check } from 'lucide-react';
import { PUBLICOS } from '../conteudo';

export function Publicos() {
  return (
    <section id="publicos" className="mx-auto max-w-6xl px-5 py-20">
      <div className="max-w-2xl">
        <p className="text-sm font-bold uppercase tracking-wider text-[--cor-acao]">Para quem</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Três pessoas, três necessidades que não se parecem.
        </h2>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {PUBLICOS.map((publico) => (
          <div
            key={publico.titulo}
            className="flex flex-col rounded-2xl border border-[color:var(--color-borda)] p-6"
          >
            <h3 className="text-lg font-bold">{publico.titulo}</h3>
            <p className="mt-1 text-[15px] italic text-[--cor-acao]">{publico.frase}</p>

            <ul className="mt-5 space-y-2.5">
              {publico.itens.map((item) => (
                <li key={item} className="flex gap-2.5 text-[15px] leading-snug">
                  <Check size={17} className="mt-0.5 shrink-0 text-[--cor-acao]" />
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
