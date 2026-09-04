import type { ReactNode } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/shared/api/cliente';
import { Botao, Carregando } from '@/shared/ui/componentes';

/**
 * O que exige alguém ao telefone.
 *
 * É a inversão que o painel da gestão faz de propósito: os números do dia
 * ficam numa faixa pequena acima, e a coluna larga é desta lista. Quem abre o
 * painel precisa agir, não contemplar — e agir aqui quase sempre quer dizer
 * ligar para uma família (4a).
 *
 * Duas fontes reais alimentam a lista: ocorrência que a família não confirmou
 * ter lido, e recado que ninguém da escola leu. As duas já vêm do resumo da
 * escola; o telefone vem da ficha da criança, buscado só para quem está na
 * lista.
 */
export function PendenciasDaEscola({ compacto = false }: { compacto?: boolean }) {
  const clienteQuery = useQueryClient();

  const ocorrencias = useQuery({
    queryKey: ['ocorrencias'],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/ocorrencias');
      if (error) throw error;
      return data;
    },
  });

  const recados = useQuery({
    queryKey: ['recados'],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/recados');
      if (error) throw error;
      return data;
    },
  });

  const semCiencia = (ocorrencias.data ?? []).filter((o) => !o.cienteEm);
  const semLeitura = (recados.data ?? []).filter((r) => !r.lidoEm);

  // O telefone só é buscado para quem entrou na lista: é o dado que transforma
  // "resolva isto" em "resolva isto agora", e não vale uma varredura da escola.
  const fichas = useQueries({
    queries: [...new Set(semCiencia.map((o) => o.criancaId))].map((criancaId) => ({
      queryKey: ['crianca', criancaId],
      queryFn: async () => {
        const { data, error } = await api.GET('/v1/criancas/{id}', {
          params: { path: { id: criancaId } },
        });
        if (error) throw error;
        return data;
      },
    })),
  });

  const marcarLido = useMutation({
    mutationFn: async (recadoId: string) => {
      const { error } = await api.POST('/v1/recados/{id}/lido', {
        params: { path: { id: recadoId } },
      });
      if (error) throw error;
    },
    onSuccess: () => clienteQuery.invalidateQueries({ queryKey: ['recados'] }),
  });

  if (ocorrencias.isLoading || recados.isLoading) {
    return <Carregando texto="Conferindo o que ficou aberto…" />;
  }

  const total = semCiencia.length + (semLeitura.length > 0 ? 1 : 0);

  if (total === 0) {
    return (
      <div className="rounded-(--raio) border border-[color:var(--color-ok)] bg-[color:var(--color-ok-suave)] p-6">
        <p className="text-lg font-semibold">Nada esperando você</p>
        <p className="mt-1 max-w-prose text-sm leading-relaxed text-[color:var(--color-tinta-suave)]">
          As ocorrências do dia têm ciência da família e nenhum recado está sem leitura. O resto do
          dia está andando sozinho.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-(--raio) border border-[color:var(--color-alerta)] bg-white">
      {semCiencia.map((ocorrencia) => {
        const ficha = fichas.find((f) => f.data?.id === ocorrencia.criancaId)?.data;
        const celular = ficha?.responsaveis.find((r) => r.celular)?.celular ?? null;

        return (
          <Linha
            key={ocorrencia.id}
            grave
            titulo={`Ocorrência sem ciência da família · ${ocorrencia.criancaNome}`}
            detalhe={`${ocorrencia.titulo} · registrada ${desde(ocorrencia.ocorridoEm)}. A família ainda não confirmou que leu.`}
            compacto={compacto}
            acao={
              celular ? (
                <a href={`tel:${somenteDigitos(celular)}`} className="shrink-0">
                  <Botao tamanho="compacto" className="bg-[color:var(--color-alerta)]">
                    Ligar · {comMascara(celular)}
                  </Botao>
                </a>
              ) : (
                <Link to={`/gestao/criancas/${ocorrencia.criancaId}`} className="shrink-0">
                  <Botao tamanho="compacto" variante="secundario">
                    Sem telefone
                  </Botao>
                </Link>
              )
            }
          />
        );
      })}

      {semLeitura.length > 0 && (
        <Linha
          titulo={`Recado da família sem leitura · ${semLeitura.length} ${semLeitura.length === 1 ? 'recado' : 'recados'}`}
          detalhe={`Mais antigo de ${desde(semLeitura[semLeitura.length - 1]!.criadoEm)} · ${[
            ...new Set(semLeitura.map((r) => r.turmaNome).filter(Boolean)),
          ].join(', ')} · a família vê que ninguém leu`}
          compacto={compacto}
          acao={
            <Botao
              tamanho="compacto"
              variante="secundario"
              disabled={marcarLido.isPending}
              onClick={() => semLeitura.forEach((r) => marcarLido.mutate(r.id))}
            >
              Dar por lidos
            </Botao>
          }
        />
      )}
    </div>
  );
}

function Linha({
  titulo,
  detalhe,
  acao,
  grave = false,
  compacto,
}: {
  titulo: string;
  detalhe: string;
  acao: ReactNode;
  grave?: boolean;
  compacto: boolean;
}) {
  return (
    <div className="border-b border-[color:var(--color-borda)] p-(--padding-cartao) last:border-b-0">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-(--raio-sm) text-xs font-bold ${
            grave
              ? 'bg-[color:var(--color-alerta)] text-white'
              : 'border border-[color:var(--color-sol-300)] bg-[color:var(--color-sol-50)]'
          }`}
        >
          {grave ? '!' : ''}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{titulo}</p>
          <p className="text-xs leading-snug text-[color:var(--color-tinta-suave)]">{detalhe}</p>
        </div>
        {/* No computador a ação fica na mesma linha; no celular ela desce para
            uma linha própria, porque "Ligar · (11) 99400-0000" ao lado do nome
            espremeria os dois em duas palavras por linha. */}
        {!compacto && acao}
      </div>
      {compacto && <div className="pt-2.5 pl-[30px]">{acao}</div>}
    </div>
  );
}

/** "há 2h 14min" — o tempo aberto é o que decide a ordem do telefonema. */
function desde(iso: string): string {
  const minutos = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas}h ${minutos % 60}min`;
  const dias = Math.floor(horas / 24);
  return `há ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
}

/** `tel:` não aceita máscara — e um número com parênteses não disca. */
function somenteDigitos(celular: string): string {
  return celular.replace(/\D/g, '');
}

/**
 * "11994000000" não é um telefone que alguém lê em voz alta.
 *
 * O botão é para ser conferido antes de tocar — quem liga confere o DDD com o
 * cadastro na cabeça, e onze dígitos colados impedem isso.
 */
function comMascara(celular: string): string {
  const d = somenteDigitos(celular);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return celular;
}
