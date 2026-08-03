import { Check } from 'lucide-react';
import { Etiqueta } from '@/shared/ui/componentes';
import { PLANOS } from '../conteudo';
import { AberturaSecao } from '../componentes';

export function Planos() {
  return (
    <section id="planos" className="border-y border-[color:var(--color-borda)] bg-(color:--color-papel)">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <AberturaSecao rotulo="Planos" titulo="Você paga por criança matriculada.">
          Sem taxa de implantação e sem cobrança por usuário: pais, avós e a equipe inteira entram
          sem custo adicional. A conta acompanha o tamanho da escola, inclusive quando ela diminui.
        </AberturaSecao>

        <div className="mt-12 grid items-start gap-(--gap-lista) lg:grid-cols-3">
          {PLANOS.map((plano) => (
            <div
              key={plano.nome}
              style={plano.destaque ? { boxShadow: 'var(--sombra-elevada)' } : undefined}
              className={`flex flex-col rounded-(--raio-xl) border bg-white p-(--padding-cartao) ${
                plano.destaque
                  ? 'border-(color:--cor-acao) ring-1 ring-(color:--cor-acao)'
                  : 'border-[color:var(--color-borda)]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg">{plano.nome}</h3>
                {plano.destaque && <Etiqueta tom="marca">mais escolhido</Etiqueta>}
              </div>

              <p className="mt-1 text-sm text-[color:var(--color-tinta-suave)]">{plano.para}</p>

              <p className="numerico mt-5 flex items-baseline gap-1">
                {plano.unidade && <span className="text-lg font-semibold">R$</span>}
                <span className="text-4xl font-bold tracking-tight">{plano.preco}</span>
                <span className="text-sm text-[color:var(--color-tinta-suave)]">
                  {plano.unidade}
                </span>
              </p>
              <p className="mt-1 text-xs text-[color:var(--color-tinta-tenue)]">{plano.minimo}</p>

              <ul className="mt-6 flex-1 space-y-2.5">
                {plano.itens.map((item) => (
                  <li key={item} className="flex gap-2.5 text-[15px] leading-snug">
                    <Check size={17} className="mt-0.5 shrink-0 text-(color:--cor-acao)" />
                    <span className="text-[color:var(--color-tinta-suave)]">{item}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#experimentar"
                className={`mt-6 rounded-(--raio) px-4 py-3 text-center font-semibold transition ${
                  plano.destaque
                    ? 'bg-(color:--cor-acao) text-white hover:brightness-110'
                    : 'border border-[color:var(--color-borda-forte)] hover:bg-[color:var(--color-papel)]'
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
