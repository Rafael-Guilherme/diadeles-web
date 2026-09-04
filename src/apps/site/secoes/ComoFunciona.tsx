import { PASSOS } from '../conteudo';
import { AberturaSecao } from '../componentes';

export function ComoFunciona() {
  return (
    <section
      id="como-funciona"
      className="border-y border-[color:var(--color-borda)] bg-(color:--color-papel)"
    >
      <div className="mx-auto max-w-6xl px-5 py-20">
        <AberturaSecao rotulo="Como funciona" titulo="Um registro só, aproveitado quatro vezes.">
          A educadora registra uma vez. O mesmo dado vira a linha do tempo da família, o painel da
          gestão e o parecer do semestre — sem ninguém redigitar nada.
        </AberturaSecao>

        <ol className="mt-12 grid gap-(--gap-lista) sm:grid-cols-2 lg:grid-cols-4">
          {PASSOS.map((passo) => (
            <li
              key={passo.numero}
              className="rounded-(--raio-xl) border border-[color:var(--color-borda)] bg-white p-(--padding-cartao)"
            >
              {/* O número é grande e claro: ele é régua de leitura, não rótulo
                  — quem passa os olhos conta quatro passos sem ler nenhum. */}
              <span className="numerico block text-2xl font-semibold text-[color:var(--color-marca-300)]">
                {passo.numero}
              </span>
              <h3 className="mt-2 text-lg leading-snug">{passo.titulo}</h3>
              <p className="mt-2 leading-relaxed text-[color:var(--color-tinta-suave)]">
                {passo.texto}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
