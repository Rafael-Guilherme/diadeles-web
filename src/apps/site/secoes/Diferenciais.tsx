import { DIFERENCIAIS } from '../conteudo';

/**
 * As quatro decisões, em duas colunas.
 *
 * O título fica à esquerda e as escolhas à direita, em cartões 2×2: são quatro
 * afirmações independentes, e enfileirá-las embaixo do título faria a leitura
 * virar lista de recursos — que é exatamente o que elas não são.
 */
export function Diferenciais() {
  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-5 py-20 lg:grid-cols-[0.8fr_1.2fr]">
      <div>
        <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-tinta-tenue)]">
          Decisões de produto
        </p>
        <h2 className="mt-2 text-balance text-3xl sm:text-4xl">Diferenciais</h2>
        <p className="mt-4 max-w-sm text-lg leading-relaxed text-[color:var(--color-tinta-suave)]">
          Quatro decisões de produto que a gente não pretende reverter.
        </p>
      </div>

      <div className="grid gap-(--gap-lista) sm:grid-cols-2">
        {DIFERENCIAIS.map((item) => (
          <div
            key={item.titulo}
            className="rounded-(--raio) border border-[color:var(--color-borda)] bg-white p-(--padding-cartao)"
          >
            <h3 className="text-base font-semibold leading-snug">{item.titulo}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-tinta-suave)]">
              {item.texto}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
