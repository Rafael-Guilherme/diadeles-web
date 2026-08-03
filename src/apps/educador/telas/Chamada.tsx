import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { AlertTriangle, Check, X } from 'lucide-react';
import { api } from '@/shared/api/cliente';
import { Carregando, Etiqueta } from '@/shared/ui/componentes';
import { Cabecalho } from '../componentes/Cabecalho';

/**
 * Chamada. Presença é o único registro que precisa ir direto à rede: quem
 * chegou e quem saiu é informação de segurança, não de rotina — não pode ficar
 * numa fila local esperando conexão.
 */
export function Chamada() {
  const { turmaId = '' } = useParams();
  const clienteQuery = useQueryClient();
  const [emAndamento, setEmAndamento] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['grade', turmaId],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/turmas/{id}/grade', {
        params: { path: { id: turmaId } },
      });
      if (error) throw error;
      return data;
    },
  });

  const registrar = useMutation({
    mutationFn: async ({ criancaId, ausente }: { criancaId: string; ausente: boolean }) => {
      const { error } = await api.POST('/v1/presencas/checkin', {
        body: { criancaId, turmaId, ausente },
      });
      if (error) throw error;
    },
    onSettled: async () => {
      setEmAndamento(null);
      await clienteQuery.invalidateQueries({ queryKey: ['grade', turmaId] });
    },
  });

  function marcar(criancaId: string, ausente: boolean) {
    setEmAndamento(criancaId);
    registrar.mutate({ criancaId, ausente });
  }

  if (isLoading || !data) {
    return (
      <>
        <Cabecalho titulo="Chamada" voltarPara={`/turma/${turmaId}`} />
        <Carregando />
      </>
    );
  }

  const semChamada = data.criancas.filter((c) => c.semPresenca).length;

  return (
    <div className="min-h-full pb-8">
      <Cabecalho
        titulo="Chamada"
        subtitulo={
          semChamada > 0
            ? `${semChamada} ${semChamada === 1 ? 'criança falta' : 'crianças faltam'} marcar`
            : 'Todas as crianças já foram marcadas'
        }
        voltarPara={`/turma/${turmaId}`}
      />

      <ul className="space-y-(--gap-lista) px-4 py-4">
        {data.criancas.map((crianca) => {
          const carregando = emAndamento === crianca.id;

          return (
            <li
              key={crianca.id}
              className="flex items-center gap-3 rounded-(--raio-lg) border border-[color:var(--color-borda)] bg-white p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{crianca.nomeSocial ?? crianca.nome}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-[color:var(--color-tinta-suave)]">
                    {crianca.idade}
                  </span>
                  {crianca.entradaEm && (
                    <Etiqueta tom="ok">
                      entrou{' '}
                      {new Date(crianca.entradaEm).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Etiqueta>
                  )}
                  {crianca.ausente && <Etiqueta>faltou</Etiqueta>}
                </div>
                {crianca.alergias.length > 0 && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-[color:var(--color-alerta)]">
                    <AlertTriangle size={12} /> {crianca.alergias.join(', ')}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 gap-1.5">
                <button
                  onClick={() => marcar(crianca.id, false)}
                  disabled={carregando}
                  aria-label={`Marcar ${crianca.nome} como presente`}
                  className={`flex h-11 w-11 items-center justify-center rounded-(--raio) border-2 transition ${
                    crianca.presente
                      ? 'border-[color:var(--color-ok)] bg-[color:var(--color-ok)] text-white'
                      : 'border-[color:var(--color-borda)] text-neutral-400'
                  }`}
                >
                  <Check size={20} />
                </button>
                <button
                  onClick={() => marcar(crianca.id, true)}
                  disabled={carregando}
                  aria-label={`Marcar ${crianca.nome} como ausente`}
                  className={`flex h-11 w-11 items-center justify-center rounded-(--raio) border-2 transition ${
                    crianca.ausente
                      ? 'border-[color:var(--color-alerta)] bg-[color:var(--color-alerta)] text-white'
                      : 'border-[color:var(--color-borda)] text-neutral-400'
                  }`}
                >
                  <X size={20} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
