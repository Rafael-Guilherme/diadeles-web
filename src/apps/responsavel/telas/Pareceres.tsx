import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, ScrollText } from 'lucide-react';
import { api } from '@/shared/api/cliente';
import { Cartao, Carregando, Vazio } from '@/shared/ui/componentes';

const NIVEL_EM_PALAVRAS: Record<string, string> = {
  EM_CONSTRUCAO: 'Em construção',
  EM_DESENVOLVIMENTO: 'Em desenvolvimento',
  CONSOLIDADO: 'Consolidado',
};

/**
 * O parecer descritivo na mão da família.
 *
 * É o documento mais importante que o app entrega — e o único que a família
 * vai querer guardar, imprimir e mostrar para a avó. Por isso a tela é
 * deliberadamente sóbria: sem cartão colorido, sem ícone alegre, com a
 * hierarquia de um documento. É um parecer escolar, não um post.
 *
 * A impressão sai pelo `window.print()` do navegador, com o estilo de
 * impressão em `estilos.css`. Um PDF gerado no servidor exigiria Chromium na
 * API e um bucket para guardá-lo (docs/arquitetura.md §7 e §8) — e o
 * armazenamento em S3 está adiado junto com a mídia. Enquanto isso, o
 * "Salvar como PDF" do próprio navegador entrega o mesmo arquivo.
 */
export function Pareceres() {
  const navegar = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['meus-pareceres'],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/relatorios/meus');
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <Carregando texto="Buscando os pareceres…" />;

  return (
    <div className="mx-auto w-full max-w-md">
      <header className="area-segura-topo px-5 pb-4 nao-imprimir">
        <button
          onClick={() => navegar('/')}
          aria-label="Voltar"
          className="-ml-3 mb-1 flex h-11 w-11 items-center justify-center rounded-full text-[color:var(--color-tinta-suave)] transition active:bg-neutral-100"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="display text-2xl">Pareceres</h1>
        <p className="text-sm leading-relaxed text-[color:var(--color-tinta-suave)]">
          O relatório de desenvolvimento de cada semestre, escrito pela educadora e revisado pela
          coordenação.
        </p>
      </header>

      <main className="space-y-6 px-4 pb-8">
        {data?.length === 0 && (
          <Vazio
            icone={<ScrollText size={22} />}
            titulo="Nenhum parecer ainda"
            descricao="Ao fim de cada semestre, a escola publica aqui o relatório de desenvolvimento."
          />
        )}

        {data?.map((parecer) => (
          <article key={parecer.id} className="documento space-y-4">
            <header className="border-b border-[color:var(--color-borda)] pb-3">
              <h2 className="text-lg font-semibold">{parecer.criancaNome}</h2>
              <p className="text-sm text-[color:var(--color-tinta-suave)]">
                {parecer.periodoNome} · {parecer.turmaNome}
              </p>
            </header>

            {parecer.textoGeral && (
              <p className="text-[15px] leading-relaxed">{parecer.textoGeral}</p>
            )}

            {parecer.itens
              .filter((item) => item.texto.trim().length > 0)
              .map((item) => (
                <section key={item.campo} className="space-y-1">
                  <h3 className="text-sm font-semibold">{item.campoNome}</h3>
                  <p className="text-[15px] leading-relaxed text-[color:var(--color-tinta)]">
                    {item.texto}
                  </p>
                  {item.nivel && (
                    <p className="text-xs text-[color:var(--color-tinta-suave)]">
                      {NIVEL_EM_PALAVRAS[item.nivel] ?? item.nivel}
                    </p>
                  )}
                </section>
              ))}

            <footer className="border-t border-[color:var(--color-borda)] pt-3 text-xs leading-relaxed text-[color:var(--color-tinta-tenue)]">
              Escrito por {parecer.autorNome}
              {parecer.revisorNome ? `, revisado por ${parecer.revisorNome}` : ''}
              {parecer.publicadoEm
                ? ` · publicado em ${new Date(parecer.publicadoEm).toLocaleDateString('pt-BR')}`
                : ''}
              .
            </footer>

            <Cartao interno className="nao-imprimir">
              <button
                onClick={() => window.print()}
                className="flex min-h-11 w-full items-center justify-center gap-2 text-sm font-semibold text-(color:--cor-acao)"
              >
                <Printer size={16} /> Imprimir ou salvar em PDF
              </button>
            </Cartao>
          </article>
        ))}
      </main>
    </div>
  );
}
