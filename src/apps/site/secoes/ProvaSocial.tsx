/**
 * O espaço da prova social, desenhado e rotulado como vazio.
 *
 * A página pede logo de escola aqui — é onde o olho procura. Preencher com
 * depoimento fabricado, logo sem contrato ou "500 escolas confiam" seria mentir
 * para a gestora logo antes de pedir o cartão dela. O bloco fica assim até
 * existir material aprovado por escrito, e o rótulo diz exatamente isso.
 */
export function ProvaSocial() {
  return (
    <section className="border-y border-[color:var(--color-borda)] bg-[color:var(--color-papel)]">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-14 lg:grid-cols-[1fr_1fr]">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-tinta-tenue)]">
            Espaço reservado · prova social
          </p>
          <h2 className="mt-2 text-lg font-semibold">
            Aqui entram escolas reais, quando houver permissão de uso
          </h2>
          <p className="mt-2 max-w-prose leading-relaxed text-[color:var(--color-tinta-suave)]">
            Nada de depoimento fabricado, logo sem contrato ou número inventado. Enquanto não houver
            material aprovado por escrito, o bloco fica assim: desenhado, rotulado e vazio.
          </p>
        </div>

        <div
          aria-hidden
          className="flex h-[120px] items-center justify-center rounded-(--raio) border border-dashed border-[color:var(--color-borda-forte)] text-xs text-[color:var(--color-tinta-tenue)]"
        >
          3 logos de escola · 160×48 cada
        </div>
      </div>
    </section>
  );
}
