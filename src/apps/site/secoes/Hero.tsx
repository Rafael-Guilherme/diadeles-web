import { ArrowRight } from 'lucide-react';

/**
 * A amostra do hero é a grade de rotina, não a tela da família.
 *
 * Quem lê esta página é a gestora, e o que ela precisa acreditar em dois
 * segundos é que a turma inteira cabe numa tela e que dá para ver o que falta.
 * A tela da família aparece logo abaixo, em "para quem é" — ali ela é o
 * argumento; aqui, seria uma promessa para a pessoa errada.
 */
const COLUNAS = ['CHA', 'REF', 'SON', 'FRA'];

const LINHAS: { nome: string; feitos: boolean[]; atencao?: boolean }[] = [
  { nome: 'Ana Clara', feitos: [true, true, false, false], atencao: true },
  { nome: 'Benjamim Rocha', feitos: [true, true, true, true] },
  { nome: 'Cecília Prado', feitos: [true, false, false, false], atencao: true },
  { nome: 'Davi Nakamura', feitos: [true, true, true, true] },
];

const FATOS = ['30 dias grátis', 'Sem anúncios, nunca', 'Funciona sem internet'];

export function Hero() {
  return (
    <section id="topo" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-(color:--cor-acao-suave) to-transparent"
      />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-20">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-tinta-tenue)]">
            Rotina diária para creche e pré-escola
          </p>

          {/* 56px uma única vez em todo o sistema, e é aqui. Os tamanhos vêm da
              escala em estilos.css: havia um `lg:text-[3.4rem]` que, depois da
              escala nova, ficou menor que o `sm:text-5xl` — o título encolhia ao
              passar para telas grandes. */}
          <h1 className="mt-3 text-balance text-4xl sm:text-5xl">
            A turma inteira registrada antes do café.
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-[color:var(--color-tinta-suave)]">
            A educadora registra chamada, refeição, sono, fralda e humor em lote, de pé, com uma
            mão. A família acompanha em tempo real. E o parecer descritivo do semestre sai pronto do
            que já foi registrado.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#experimentar"
              className="inline-flex items-center justify-center gap-2 rounded-(--raio) bg-(color:--cor-acao) px-6 py-3.5 font-semibold text-white transition hover:brightness-110"
            >
              Ver funcionando agora <ArrowRight size={18} />
            </a>
            <a
              href="#planos"
              className="inline-flex items-center justify-center rounded-(--raio) border border-[color:var(--color-borda-forte)] bg-white px-6 py-3.5 font-semibold transition hover:bg-[color:var(--color-papel)]"
            >
              Ver planos
            </a>
          </div>

          {/* Três fatos, sem adjetivo, separados do bloco por uma linha: é o que
              a gestora leva anotado para a reunião do conselho. */}
          <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-2 border-t border-[color:var(--color-borda)] pt-4 text-sm text-[color:var(--color-tinta-suave)]">
            {FATOS.map((fato) => (
              <li key={fato}>{fato}</li>
            ))}
          </ul>
        </div>

        <AmostraDaGrade />
      </div>
    </section>
  );
}

function AmostraDaGrade() {
  return (
    <div className="mx-auto w-full max-w-[420px] overflow-hidden rounded-(--raio-lg) border border-[color:var(--color-borda-forte)] bg-white">
      <p className="border-b border-[color:var(--color-borda)] bg-[color:var(--color-papel)] px-3 py-2 text-2xs uppercase tracking-[0.1em] text-[color:var(--color-tinta-tenue)]">
        Grade de rotina · Berçário II
      </p>

      <div className="border-b border-[color:var(--color-borda)] px-3 py-2.5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm">
            <strong className="numerico font-semibold">14 de 22</strong> com o dia completo
          </p>
          <p className="numerico text-xs font-semibold text-[color:var(--color-sol-700)]">
            28 faltando
          </p>
        </div>
        <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-[color:var(--color-sol-50)]">
          <span className="block h-full w-[64%] bg-[color:var(--color-marca-500)]" />
          <span className="block h-full w-[12%] bg-[color:var(--color-sol-300)]" />
        </div>
      </div>

      <table className="w-full border-collapse text-left" style={{ tableLayout: 'fixed' }}>
        <colgroup>
          <col />
          {COLUNAS.map((c) => (
            <col key={c} style={{ width: 44 }} />
          ))}
        </colgroup>
        <thead>
          <tr className="bg-[color:var(--color-papel)]">
            <th className="border-b border-[color:var(--color-borda)] px-3 py-1.5 text-2xs font-medium uppercase tracking-[0.1em] text-[color:var(--color-tinta-tenue)]">
              Criança
            </th>
            {COLUNAS.map((coluna) => (
              <th
                key={coluna}
                className="border-b border-l border-[color:var(--color-borda)] py-1.5 text-center text-2xs font-semibold text-[color:var(--color-tinta-suave)]"
              >
                {coluna}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {LINHAS.map((linha) => (
            <tr key={linha.nome} className="border-b border-[color:var(--color-borda)] last:border-b-0">
              <th
                scope="row"
                style={{
                  borderLeft: `3px solid ${
                    linha.atencao ? 'var(--color-sol-300)' : 'var(--color-marca-300)'
                  }`,
                }}
                className="h-11 px-2.5 text-left text-sm font-normal"
              >
                {linha.nome}
              </th>
              {linha.feitos.map((feito, indice) => (
                <td
                  key={indice}
                  className={`h-11 border-l border-[color:var(--color-borda)] ${
                    feito ? '' : 'bg-[color:var(--color-sol-50)]'
                  }`}
                >
                  <span className="flex h-11 items-center justify-center" aria-hidden>
                    {feito ? (
                      <span className="flex h-[22px] w-[22px] items-center justify-center rounded-md bg-[color:var(--color-marca-500)] text-xs text-white">
                        ✓
                      </span>
                    ) : (
                      <span className="h-2.5 w-2.5 rounded-full border-[1.5px] border-[color:var(--color-borda-forte)]" />
                    )}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center justify-between gap-3 border-t border-[color:var(--color-borda-forte)] bg-[color:var(--color-papel)] px-3 py-2.5">
        <span className="numerico text-sm font-semibold">3 selecionadas</span>
        <span className="rounded-(--raio) bg-(color:--cor-acao) px-3 py-2 text-sm font-semibold text-white">
          Registrar em lote
        </span>
      </div>
    </div>
  );
}
