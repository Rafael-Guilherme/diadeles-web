import { Check } from 'lucide-react';
import { PLANOS } from '../conteudo';

export function Planos() {
  return (
    <section
      id="planos"
      className="border-y border-[color:var(--color-borda)] bg-[--color-papel]"
    >
      <div className="mx-auto max-w-6xl px-5 py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-wider text-[--cor-acao]">Planos</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Você paga por criança matriculada.
          </h2>
          <p className="mt-4 text-lg text-[color:var(--color-tinta-suave)]">
            Sem taxa de implantação e sem cobrança por usuário: pais, avós e a equipe inteira
            entram sem custo adicional. A conta acompanha o tamanho da escola, inclusive quando ela
            diminui.
          </p>
        </div>

        <div className="mt-12 grid items-start gap-6 lg:grid-cols-3">
          {PLANOS.map((plano) => (
            <div
              key={plano.nome}
              className={`flex flex-col rounded-2xl border bg-white p-6 ${
                plano.destaque
                  ? 'border-[--cor-acao] shadow-lg ring-1 ring-[--cor-acao]'
                  : 'border-[color:var(--color-borda)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">{plano.nome}</h3>
                {plano.destaque && (
                  <span className="rounded-full bg-[--cor-acao-suave] px-2.5 py-1 text-xs font-bold text-[--cor-acao]">
                    mais escolhido
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm text-[color:var(--color-tinta-suave)]">{plano.para}</p>

              <p className="mt-5 flex items-baseline gap-1">
                {plano.unidade && <span className="text-lg font-semibold">R$</span>}
                <span className="text-4xl font-bold tracking-tight">{plano.preco}</span>
                <span className="text-sm text-[color:var(--color-tinta-suave)]">
                  {plano.unidade}
                </span>
              </p>
              <p className="mt-1 text-xs text-[color:var(--color-tinta-suave)]">{plano.minimo}</p>

              <ul className="mt-6 flex-1 space-y-2.5">
                {plano.itens.map((item) => (
                  <li key={item} className="flex gap-2.5 text-[15px] leading-snug">
                    <Check size={17} className="mt-0.5 shrink-0 text-[--cor-acao]" />
                    <span className="text-[color:var(--color-tinta-suave)]">{item}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#experimentar"
                className={`mt-6 rounded-xl px-4 py-3 text-center font-semibold transition ${
                  plano.destaque
                    ? 'bg-[--cor-acao] text-white hover:brightness-110'
                    : 'border border-[color:var(--color-borda)] hover:bg-neutral-50'
                }`}
              >
                {plano.preco === 'Sob medida' ? 'Falar com a gente' : 'Começar 30 dias grátis'}
              </a>
            </div>
          ))}
        </div>

        <p className="mt-8 max-w-3xl text-sm text-[color:var(--color-tinta-suave)]">
          O melhor momento para contratar é entre novembro e dezembro, junto do planejamento do ano
          letivo seguinte — mas a escola pode começar em qualquer mês, com cobrança proporcional às
          crianças ativas.
        </p>
      </div>
    </section>
  );
}
