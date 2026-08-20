import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PauseCircle, PlayCircle, Square } from 'lucide-react';
import { api, mensagemDeErro } from '@/shared/api/cliente';
import { Aviso, Botao, Cartao, Etiqueta, RotuloSecao } from '@/shared/ui/componentes';

type Status = 'ATIVA' | 'TRANCADA' | 'ENCERRADA' | 'LISTA_ESPERA';

const ROTULO_STATUS: Record<Status, string> = {
  ATIVA: 'ativa',
  TRANCADA: 'trancada',
  ENCERRADA: 'encerrada',
  LISTA_ESPERA: 'lista de espera',
};

/**
 * A matrícula da criança, com o histórico.
 *
 * Trocar de turma já era possível pelo formulário acima — mudar o campo é uma
 * transferência, encerrada e reaberta na mesma transação. O que faltava era o
 * meio-termo que toda creche vive: a família que some por dois meses e volta.
 * Sem `Trancar`, a secretaria só tinha a opção de arquivar a criança, que é a
 * porta de saída, ou deixar a vaga ocupada indefinidamente.
 *
 * O histórico fica junto porque é o que responde "em que turma ela estava no
 * primeiro semestre" — pergunta de parecer descritivo, não de curiosidade.
 */
export function Matricula({
  criancaId,
  arquivada,
  aoMudar,
}: {
  criancaId: string;
  arquivada: boolean;
  aoMudar: () => void;
}) {
  const clienteQuery = useQueryClient();
  const [erro, setErro] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ['matriculas', criancaId],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/matriculas/crianca/{criancaId}', {
        params: { path: { criancaId } },
      });
      if (error) throw error;
      return data;
    },
  });

  const mudarStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      const { error } = await api.PATCH('/v1/matriculas/{id}', {
        params: { path: { id } },
        body: { status },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setErro(null);
      void clienteQuery.invalidateQueries({ queryKey: ['matriculas', criancaId] });
      aoMudar();
    },
    onError: (e) => setErro(mensagemDeErro(e)),
  });

  const matriculas = data ?? [];
  if (matriculas.length === 0) return null;

  // Vigente é ativa ou trancada: as duas ocupam vaga na turma.
  const vigente = matriculas.find((m) => m.status === 'ATIVA' || m.status === 'TRANCADA');
  const anteriores = matriculas.filter((m) => m.id !== vigente?.id);

  return (
    <section className="space-y-2">
      <RotuloSecao>Matrícula</RotuloSecao>

      {vigente ? (
        <Cartao interno className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold">{vigente.turmaNome}</p>
              <p className="text-xs text-[color:var(--color-tinta-suave)]">
                desde {formatarData(vigente.inicio)}
              </p>
            </div>
            <Etiqueta tom={vigente.status === 'ATIVA' ? 'ok' : 'alerta'}>
              {ROTULO_STATUS[vigente.status as Status]}
            </Etiqueta>
          </div>

          {vigente.status === 'ATIVA' ? (
            <Botao
              variante="secundario"
              bloco
              disabled={mudarStatus.isPending}
              onClick={() => mudarStatus.mutate({ id: vigente.id, status: 'TRANCADA' })}
            >
              <PauseCircle size={16} /> Trancar matrícula
            </Botao>
          ) : (
            <Botao
              variante="secundario"
              bloco
              disabled={mudarStatus.isPending}
              onClick={() => mudarStatus.mutate({ id: vigente.id, status: 'ATIVA' })}
            >
              <PlayCircle size={16} /> Reativar matrícula
            </Botao>
          )}

          <p className="text-xs leading-relaxed text-[color:var(--color-tinta-tenue)]">
            {vigente.status === 'ATIVA'
              ? 'Trancada, a criança sai da grade do dia e a vaga continua reservada para ela.'
              : 'Enquanto trancada, a criança não aparece na grade do educador — mas segue ocupando vaga na turma.'}
          </p>

          <button
            disabled={mudarStatus.isPending}
            onClick={() => mudarStatus.mutate({ id: vigente.id, status: 'ENCERRADA' })}
            className="min-h-11 w-full text-sm font-semibold text-[color:var(--color-alerta)] disabled:opacity-50"
          >
            <Square size={14} className="mr-1 inline" /> Encerrar matrícula e liberar a vaga
          </button>
        </Cartao>
      ) : (
        <Cartao interno>
          <p className="text-sm leading-relaxed text-[color:var(--color-tinta-suave)]">
            {arquivada
              ? 'Matrícula encerrada quando a criança foi arquivada. Para matricular de novo, traga a criança de volta e escolha a turma acima.'
              : 'Sem matrícula vigente. Escolha uma turma no formulário acima — sem isso a criança não aparece na grade de nenhum educador.'}
          </p>
        </Cartao>
      )}

      {erro && <Aviso>{erro}</Aviso>}

      {anteriores.length > 0 && (
        <Cartao interno className="space-y-2">
          <p className="text-2xs font-bold uppercase tracking-wider text-[color:var(--color-tinta-tenue)]">
            Antes
          </p>
          {anteriores.map((m) => (
            <div key={m.id} className="flex items-baseline justify-between gap-2 text-sm">
              <span className="min-w-0 flex-1 truncate">{m.turmaNome}</span>
              <span className="shrink-0 text-xs text-[color:var(--color-tinta-suave)]">
                {formatarData(m.inicio)} – {m.fim ? formatarData(m.fim) : '…'} ·{' '}
                {ROTULO_STATUS[m.status as Status]}
              </span>
            </div>
          ))}
        </Cartao>
      )}
    </section>
  );
}

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}
