import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { api } from '@/shared/api/cliente';
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
    <div className="mx-auto w-full max-w-md">
      <header className="area-segura-topo px-5 pb-3">
        <h1 className="text-2xl font-bold tracking-tight">Avisos da escola</h1>
      </header>

      <main className="space-y-3 px-4 pb-6">
        {data?.length === 0 && <Vazio titulo="Nenhum aviso por enquanto" />}

        {data?.map((comunicado) => (
          <Cartao key={comunicado.id} className="space-y-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-semibold leading-snug">{comunicado.titulo}</h2>
              {comunicado.lido && (
                <Etiqueta tom="ok">
                  <Check size={11} /> lido
                </Etiqueta>
              )}
            </div>

            {comunicado.publicadoEm && (
              <p className="text-xs text-[color:var(--color-tinta-suave)]">
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
      </main>
    </div>
  );
}
