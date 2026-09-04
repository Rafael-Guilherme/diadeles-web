import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { api } from '@/shared/api/cliente';
import { Cabecalho, Folha, Tela } from '../componentes/Cabecalho';
import { Botao, Cartao, Carregando, Etiqueta, Vazio } from '@/shared/ui/componentes';

export function Comunicados() {
  const clienteQuery = useQueryClient();

  const { data: criancas } = useQuery({
    queryKey: ['minhas-criancas'],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/criancas/minhas');
      if (error) throw error;
      return data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['comunicados'],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/comunicados');
      if (error) throw error;
      return data;
    },
  });

  const confirmar = useMutation({
    mutationFn: async (comunicadoId: string) => {
      const criancaId = criancas?.[0]?.id;
      if (!criancaId) return;
      const { error } = await api.POST('/v1/comunicados/{id}/lido', {
        params: { path: { id: comunicadoId } },
        body: { criancaId },
      });
      if (error) throw error;
    },
    onSuccess: () => clienteQuery.invalidateQueries({ queryKey: ['comunicados'] }),
  });

  if (isLoading) return <Carregando />;

  return (
    <Tela>
      {/* "Comunicados", não "Avisos": desde que o sino existe, "aviso" é o
          que aconteceu com a criança hoje. Circular da escola é outra coisa,
          e chamar as duas do mesmo jeito faria a mãe procurar no lugar errado. */}
      <Cabecalho
        titulo="Comunicados"
        descricao="Mão única: a família confirma a leitura, não responde."
      />

      <Folha>
        <div className="space-y-(--gap-lista)">
        {data?.length === 0 && (
          <Vazio
            titulo="Nenhum comunicado por enquanto"
            descricao="Quando a escola publicar algo, aparece aqui e você recebe um aviso."
          />
        )}

        {data?.map((comunicado) => (
          <Cartao key={comunicado.id} interno className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-[15px] leading-snug">{comunicado.titulo}</h2>
              {comunicado.lido && (
                <Etiqueta tom="ok" className="mt-0.5 shrink-0">
                  <Check size={11} /> lido
                </Etiqueta>
              )}
            </div>

            {comunicado.publicadoEm && (
              <p className="text-2xs uppercase tracking-wide text-[color:var(--color-tinta-tenue)]">
                {new Date(comunicado.publicadoEm).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                })}
              </p>
            )}

            <p className="text-sm leading-relaxed text-[color:var(--color-tinta-suave)]">
              {comunicado.corpo}
            </p>

            {comunicado.exigeCiencia && !comunicado.lido && (
              <Botao
                bloco
                onClick={() => confirmar.mutate(comunicado.id)}
                disabled={confirmar.isPending}
              >
                Confirmar que li
              </Botao>
            )}
          </Cartao>
        ))}
        </div>
      </Folha>
    </Tela>
  );
}
