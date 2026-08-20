import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, MessageSquare } from 'lucide-react';
import { Cartao, Etiqueta, RotuloSecao } from '@/shared/ui/componentes';
import { api } from '@/shared/api/cliente';

const ROTULO_CATEGORIA: Record<string, string> = {
  retirada: 'quem busca',
  ausencia: 'falta',
  saude: 'saúde',
  geral: 'recado',
};

/**
 * Recados que as famílias mandaram para a escola.
 *
 * Na grade da turma aparece só o que está pendente, e some assim que é lido:
 * ali a lista existe para gerar ação, e a grade é o que o educador abre vinte
 * vezes por turno — um recado atrás de uma caixa de entrada é um recado que
 * ninguém lê. Na ficha da criança aparece o histórico inteiro, porque ali a
 * pergunta é outra: o que esta família já avisou.
 */
export function Recados({
  turmaId,
  criancaId,
  incluirLidos = false,
  titulo,
}: {
  turmaId?: string;
  criancaId?: string;
  incluirLidos?: boolean;
  titulo?: string;
}) {
  const clienteQuery = useQueryClient();

  const { data } = useQuery({
    queryKey: ['recados', { turmaId, criancaId, incluirLidos }],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/recados', {
        params: {
          query: {
            ...(turmaId ? { turmaId } : {}),
            ...(criancaId ? { criancaId } : {}),
            ...(incluirLidos ? {} : { pendentes: 'true' }),
          },
        },
      });
      if (error) throw error;
      return data;
    },
  });

  const darPorLido = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.POST('/v1/recados/{id}/lido', { params: { path: { id } } });
      if (error) throw error;
    },
    onSuccess: () => clienteQuery.invalidateQueries({ queryKey: ['recados'] }),
  });

  const recados = data ?? [];
  if (recados.length === 0) return null;

  return (
    <section className="space-y-2">
      <RotuloSecao>
        {titulo ??
          (recados.length === 1 ? 'Recado da família' : `Recados das famílias (${recados.length})`)}
      </RotuloSecao>

      <ul className="space-y-(--gap-lista)">
        {recados.map((recado) => (
          <li key={recado.id}>
            <Cartao interno className="space-y-2.5">
              <div className="flex gap-3">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    recado.lidoEm
                      ? 'bg-[color:var(--color-papel)] text-[color:var(--color-tinta-tenue)]'
                      : 'bg-(color:--cor-acao-suave) text-(color:--cor-acao)'
                  }`}
                >
                  <MessageSquare size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    {!criancaId && <p className="font-semibold">{recado.criancaNome}</p>}
                    <Etiqueta tom="marca">
                      {ROTULO_CATEGORIA[recado.categoria] ?? recado.categoria}
                    </Etiqueta>
                    {/* Um recado sobre amanhã não pode se disfarçar de recado de
                        hoje: a data é o que separa "vai faltar" de "faltou". */}
                    {recado.referenteA && recado.referenteA !== hojeIso() && (
                      <Etiqueta tom="alerta">{diaCurto(recado.referenteA)}</Etiqueta>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm leading-relaxed">{recado.corpo}</p>
                  <p className="mt-1 text-xs text-[color:var(--color-tinta-tenue)]">
                    {recado.autorNome} · {hora(recado.criadoEm)}
                  </p>
                </div>
              </div>

              {recado.lidoEm ? (
                <p className="flex items-center gap-1 text-xs text-[color:var(--color-ok)]">
                  <Check size={13} /> {recado.lidoPorNome} leu às {hora(recado.lidoEm)}
                </p>
              ) : (
                <button
                  onClick={() => darPorLido.mutate(recado.id)}
                  disabled={darPorLido.isPending}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-(--raio) bg-(color:--cor-acao-suave) text-sm font-semibold text-(color:--cor-acao) transition active:scale-[0.99] disabled:opacity-50"
                >
                  <Check size={16} /> Li o recado
                </button>
              )}
            </Cartao>
          </li>
        ))}
      </ul>
    </section>
  );
}

function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function diaCurto(iso: string): string {
  const [, mes, dia] = iso.split('-');
  return `${dia}/${mes}`;
}

function hojeIso(): string {
  return new Date().toLocaleDateString('en-CA');
}
