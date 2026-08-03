import { PASSOS } from '../conteudo';

export function ComoFunciona() {
  return (
    <section id="como-funciona" className="border-y border-[color:var(--color-borda)] bg-[--color-papel]">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-wider text-[--cor-acao]">
            Como funciona
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Três movimentos, e o dia inteiro fica registrado.
          </h2>
          <p className="mt-4 text-lg text-[color:var(--color-tinta-suave)]">
            O que hoje se perde entre a agenda de papel, o grupo de mensagens e a memória de quem
            estava na sala.
          </p>
        </div>

        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {PASSOS.map((passo) => (
            <li
              key={passo.numero}
              className="rounded-2xl border border-[color:var(--color-borda)] bg-white p-6"
            >
              <span className="text-sm font-bold text-[--cor-acao]">{passo.numero}</span>
              <h3 className="mt-3 text-lg font-bold leading-snug">{passo.titulo}</h3>
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
