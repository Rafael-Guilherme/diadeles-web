import { ChevronDown } from 'lucide-react';
import { PERGUNTAS } from '../conteudo';
import { AberturaSecao } from '../componentes';

export function Perguntas() {
  return (
    <section id="perguntas" className="mx-auto max-w-3xl px-5 py-20">
      <AberturaSecao rotulo="Perguntas" titulo="O que costumam perguntar." />

      <div className="mt-10 divide-y divide-[color:var(--color-borda)] border-y border-[color:var(--color-borda)]">
        {PERGUNTAS.map((item, indice) => (
          // <details> em vez de estado em React: funciona sem JavaScript, é
          // acessível por padrão e o conteúdo entra no HTML para busca.
          <details key={item.pergunta} className="group py-4" open={indice === 0}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
              {item.pergunta}
              <ChevronDown
                size={18}
                className="shrink-0 text-[color:var(--color-tinta-tenue)] transition group-open:rotate-180"
              />
            </summary>
            <p className="mt-3 leading-relaxed text-[color:var(--color-tinta-suave)]">
              {item.resposta}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
