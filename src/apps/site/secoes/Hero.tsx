import { ArrowRight, Baby, Moon, Utensils, WifiOff } from 'lucide-react';

/** Amostra da tela da família. Dados ilustrativos, iguais aos da demonstração. */
const LINHA_DO_TEMPO = [
  { hora: '07h42', icone: <Utensils size={14} />, titulo: 'Chegou na escola', detalhe: 'Entregue por Marina' },
  {
    hora: '09h15',
    icone: <Utensils size={14} />,
    titulo: 'No lanche da manhã, comeu tudo',
    detalhe: 'Fruta da estação, suco natural',
  },
  { hora: '10h10', icone: <Baby size={14} />, titulo: 'Troca de fralda (xixi e cocô)', detalhe: null },
  {
    hora: '12h45',
    icone: <Moon size={14} />,
    titulo: 'Dormiu tranquila',
    detalhe: 'das 12h45 às 14h15',
  },
];

export function Hero() {
  return (
    <section id="topo" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-(color:--cor-acao-suave) to-transparent"
      />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-20">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-borda)] bg-white px-3 py-1 text-xs font-semibold text-(color:--cor-acao)">
            Para creches e pré-escolas
          </p>

          {/* Os tamanhos vêm da escala em estilos.css. Havia um `lg:text-[3.4rem]`
              aqui que, depois da escala nova, ficou menor que o `sm:text-5xl` —
              o título encolhia ao passar para telas grandes. */}
          <h1 className="text-balance text-4xl sm:text-5xl">
            O dia deles, para quem não pode estar lá.
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-[color:var(--color-tinta-suave)]">
            A educadora registra a turma inteira em segundos — com ou sem internet. A família
            acompanha em tempo real, em português claro. E o relatório do semestre já sai pronto.
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

          <p className="mt-4 text-sm text-[color:var(--color-tinta-suave)]">
            Demonstração aberta, sem cadastro. 30 dias grátis para a escola quando decidir começar.
          </p>
        </div>

        {/* `amostra-familia` troca os tokens de cor e raio pelos do app da
            família: a amostra tem que parecer o produto, não o site. */}
        <div className="amostra-familia relative mx-auto w-full max-w-[320px]">
          <div className="rounded-[2.2rem] border-[10px] border-neutral-900 bg-white shadow-2xl">
            <div className="rounded-[1.6rem] bg-(color:--cor-acao-suave) px-4 pb-4 pt-5">
              <p className="text-2xs font-bold uppercase tracking-wider text-(color:--cor-acao)">
                Escola Modelo
              </p>
              <p className="display text-xl leading-tight">Sofia Prado</p>
              <p className="text-xs text-[color:var(--color-tinta-suave)]">Berçário II · 2a 4m</p>
              <p className="display mt-3 text-[15px] leading-snug text-[color:var(--color-sol-700)]">
                Sofia comeu bem, dormiu e estava alegre.
              </p>
            </div>

            <ul className="space-y-2 p-3">
              {LINHA_DO_TEMPO.map((item) => (
                <li
                  key={item.hora}
                  className="flex gap-2.5 rounded-(--raio) border border-[color:var(--color-borda)] p-2.5"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-(--raio-sm) bg-(color:--cor-acao-suave) text-(color:--cor-acao)">
                    {item.icone}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-[13px] font-semibold leading-tight">
                        {item.titulo}
                      </p>
                      <time className="shrink-0 text-2xs text-[color:var(--color-tinta-tenue)]">
                        {item.hora}
                      </time>
                    </div>
                    {item.detalhe && (
                      <p className="truncate text-[11px] text-[color:var(--color-tinta-suave)]">
                        {item.detalhe}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="absolute -bottom-4 -left-6 hidden items-center gap-2 rounded-(--raio) border border-[color:var(--color-borda)] bg-white px-3 py-2 shadow-lg sm:flex">
            <WifiOff size={16} className="text-[color:var(--color-marca-500)]" />
            <span className="text-xs font-semibold">
              Registrado sem internet
              <span className="block font-normal text-[color:var(--color-tinta-suave)]">
                enviado sozinho depois
              </span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
