import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/cliente';
import { Cartao, Carregando, Vazio } from '@/shared/ui/componentes';

const ROTULOS: Record<string, string> = {
  lancheManha: 'Lanche da manhã',
  almoco: 'Almoço',
  lancheTarde: 'Lanche da tarde',
  jantar: 'Jantar',
};

export function Cardapio() {
  const { data, isLoading } = useQuery({
    queryKey: ['cardapio'],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/cardapios/semana');
      if (error) throw error;
      return data;
    },
  });

  const hoje = new Date().toISOString().slice(0, 10);

  if (isLoading) return <Carregando />;

  return (
    <div className="mx-auto w-full max-w-md">
      <header className="area-segura-topo px-5 pb-3">
        <h1 className="text-2xl font-bold tracking-tight">Cardápio da semana</h1>
      </header>

      <main className="space-y-3 px-4 pb-6">
        {data?.length === 0 && <Vazio titulo="A escola ainda não publicou o cardápio" />}

        {data?.map((dia) => {
          const ehHoje = dia.data === hoje;
          const data_ = new Date(`${dia.data}T12:00:00`);

          return (
            <Cartao
              key={dia.id}
              className={`p-4 ${ehHoje ? 'border-[--cor-acao] bg-[--cor-acao-suave]' : ''}`}
            >
              <p className="text-sm font-bold capitalize">
                {data_.toLocaleDateString('pt-BR', { weekday: 'long' })}
                {ehHoje && <span className="ml-2 text-xs font-semibold text-[--cor-acao]">hoje</span>}
              </p>
              <p className="mb-2 text-xs text-[color:var(--color-tinta-suave)]">
                {data_.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
              </p>

              <dl className="space-y-1.5">
                {Object.entries(dia.refeicoes).map(([chave, valor]) => (
                  <div key={chave}>
                    <dt className="text-xs font-semibold text-[color:var(--color-tinta-suave)]">
                      {ROTULOS[chave] ?? chave}
                    </dt>
                    <dd className="text-sm">{String(valor)}</dd>
                  </div>
                ))}
              </dl>
            </Cartao>
          );
        })}
      </main>
    </div>
  );
}
