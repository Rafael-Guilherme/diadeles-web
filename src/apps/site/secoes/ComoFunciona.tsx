import { PASSOS } from '../conteudo';
import { AberturaSecao } from '../componentes';

export function ComoFunciona() {
  return (
    <section
      id="como-funciona"
      className="border-y border-[color:var(--color-borda)] bg-(color:--color-papel)"
    >
      <div className="mx-auto max-w-6xl px-5 py-20">
        <AberturaSecao rotulo="Como funciona" titulo="Três movimentos, e o dia inteiro fica registrado.">
          O que hoje se perde entre a agenda de papel, o grupo de mensagens e a memória de quem
          estava na sala.
        </AberturaSecao>

        <ol className="mt-12 grid gap-(--gap-lista) md:grid-cols-3">
          {PASSOS.map((passo) => (
            <li
              key={passo.numero}
              className="rounded-(--raio-xl) border border-[color:var(--color-borda)] bg-white p-(--padding-cartao)"
            >
              <span className="numerico text-sm font-bold text-(color:--cor-acao)">{passo.numero}</span>
              <h3 className="mt-3 text-lg leading-snug">{passo.titulo}</h3>
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
