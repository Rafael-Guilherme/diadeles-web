import { useQuery } from '@tanstack/react-query';
import { Printer } from 'lucide-react';
import { api } from '@/shared/api/cliente';
import { useSessao } from '@/shared/auth/sessao';
import { Cabecalho, Folha, Tela } from '../componentes/Cabecalho';
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
  const escolaNome = useSessao((estado) => estado.usuario?.escolaNome) ?? 'Escola';

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
    <Tela>
      <div className="nao-imprimir">
        <Cabecalho
          voltar
          titulo="Pareceres"
          descricao="Documento escolar. Guarde, imprima e leve à reunião."
        />
      </div>

      <Folha>
        <div className="space-y-6">
        {data?.length === 0 && (
          <Vazio
            titulo="Nenhum parecer ainda"
            descricao="Ao fim de cada semestre, a escola publica aqui o relatório de desenvolvimento."
          />
        )}

        {data?.map((parecer) => (
          /*
            Daqui para baixo é documento, não tela: os estilos de impressão em
            `estilos.css` tiram a navegação e deixam só este bloco na folha A4.
            A família guarda, imprime e leva à reunião — e é por isso que ele
            tem cabeçalho de instituição, seções numeradas e linha de assinatura
            em vez do tom do resto do app (4c).
          */
          <article key={parecer.id} className="documento space-y-5 rounded-(--raio) border border-[color:var(--color-borda)] bg-white p-5 print:rounded-none print:border-0 print:p-0">
            <header className="flex items-start justify-between gap-4 border-b-2 border-[color:var(--color-tinta)] pb-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{escolaNome}</p>
                <p className="text-xs text-[color:var(--color-tinta-suave)]">
                  {parecer.criancaNome} · {parecer.turmaNome} · {parecer.periodoNome}
                </p>
              </div>
              <p className="shrink-0 text-right text-xs text-[color:var(--color-tinta-suave)]">
                Documento escolar
              </p>
            </header>

            <div>
              <h2 className="text-lg font-semibold">Parecer descritivo · {parecer.periodoNome}</h2>

              <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 rounded-(--raio-sm) border border-[color:var(--color-borda)] p-3 text-sm sm:grid-cols-2">
                <Identificacao rotulo="Criança" valor={parecer.criancaNome} />
                <Identificacao rotulo="Turma" valor={parecer.turmaNome} />
                <Identificacao rotulo="Professora" valor={parecer.autorNome} />
                <Identificacao
                  rotulo="Publicado em"
                  valor={
                    parecer.publicadoEm
                      ? new Date(parecer.publicadoEm).toLocaleDateString('pt-BR')
                      : '—'
                  }
                />
              </dl>
            </div>

            {parecer.textoGeral && (
              <p className="text-[15px] leading-relaxed">{parecer.textoGeral}</p>
            )}

            {parecer.itens
              .filter((item) => item.texto.trim().length > 0)
              .map((item, indice) => (
                <section key={item.campo} className="space-y-1">
                  <h3 className="text-2xs font-semibold uppercase tracking-[0.06em]">
                    {indice + 1} · {item.campoNome}
                  </h3>
                  <p className="text-[15px] leading-relaxed">{item.texto}</p>
                  {item.nivel && (
                    <p className="text-xs text-[color:var(--color-tinta-suave)]">
                      {NIVEL_EM_PALAVRAS[item.nivel] ?? item.nivel}
                    </p>
                  )}
                </section>
              ))}

            {/* As três assinaturas são o que faz o papel valer numa reunião. Só
                aparecem na impressão: na tela elas seriam três linhas vazias. */}
            <div className="hidden grid-cols-3 gap-6 pt-10 print:grid">
              <Assinatura nome={parecer.autorNome} papel="Professora da turma" />
              <Assinatura nome={parecer.revisorNome ?? ''} papel="Coordenação pedagógica" />
              <Assinatura nome="" papel="Ciência do responsável · data" />
            </div>

            <footer className="rounded-(--raio-sm) border border-[color:var(--color-borda)] p-3 text-xs leading-relaxed text-[color:var(--color-tinta-suave)]">
              Documento gerado pelo sistema Diadeles a partir dos registros de rotina do semestre.
              Escrito por {parecer.autorNome}
              {parecer.revisorNome ? `, revisado e publicado por ${parecer.revisorNome}` : ''}
              {parecer.publicadoEm
                ? ` em ${new Date(parecer.publicadoEm).toLocaleDateString('pt-BR')}`
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
        </div>
      </Folha>
    </Tela>
  );
}

function Identificacao({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-24 shrink-0 text-[color:var(--color-tinta-suave)]">{rotulo}</dt>
      <dd className="min-w-0 font-semibold">{valor}</dd>
    </div>
  );
}

/** Linha de assinatura: o traço vem primeiro, o nome debaixo dele. */
function Assinatura({ nome, papel }: { nome: string; papel: string }) {
  return (
    <div className="border-t border-[color:var(--color-tinta)] pt-1 text-xs">
      <p className="font-semibold">{nome || '\u00a0'}</p>
      <p className="text-[color:var(--color-tinta-suave)]">{papel}</p>
    </div>
  );
}
