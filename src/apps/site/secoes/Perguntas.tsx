import { ChevronDown } from 'lucide-react';
import { PERGUNTAS } from '../conteudo';

/**
 * As perguntas em duas colunas.
 *
 * O título e a saída para uma conversa ficam à esquerda e acompanham a
 * rolagem: quem chega até aqui já leu a página inteira e a dúvida que ficou
 * costuma não estar na lista — a saída precisa continuar à mão enquanto ela
 * procura.
 */
export function Perguntas() {
  return (
    <section id="perguntas" className="mx-auto grid max-w-6xl gap-10 px-5 py-20 lg:grid-cols-[0.7fr_1.3fr]">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-tinta-tenue)]">
          Perguntas
        </p>
        <h2 className="mt-2 text-balance text-3xl sm:text-4xl">Perguntas frequentes</h2>
        <p className="mt-4 max-w-xs leading-relaxed text-[color:var(--color-tinta-suave)]">
          O que a coordenação costuma perguntar na primeira conversa.
        </p>
        <a
          href="#experimentar"
          className="mt-6 inline-flex items-center justify-center rounded-(--raio) border border-[color:var(--color-borda-forte)] bg-white px-5 py-3 font-semibold transition hover:bg-[color:var(--color-papel)]"
        >
          Falar com uma pessoa
        </a>
      </div>

      <div className="divide-y divide-[color:var(--color-borda)] border-y border-[color:var(--color-borda)]">
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
            <p className="mt-3 max-w-prose leading-relaxed text-[color:var(--color-tinta-suave)]">
              {item.resposta}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
