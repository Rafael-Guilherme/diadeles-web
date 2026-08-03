import { useQuery } from '@tanstack/react-query';
import { UtensilsCrossed } from 'lucide-react';
import { api } from '@/shared/api/cliente';
import { Cartao, Carregando, Etiqueta, Vazio } from '@/shared/ui/componentes';

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
      <header className="area-segura-topo px-5 pb-4">
        <h1 className="display text-2xl">Cardápio da semana</h1>
      </header>

      <main className="space-y-(--gap-lista) px-4 pb-6">
        {data?.length === 0 && (
          <Vazio
            icone={<UtensilsCrossed size={22} />}
            titulo="A escola ainda não publicou o cardápio"
            descricao="Assim que a semana for publicada, ela aparece aqui."
          />
        )}

        {data?.map((dia) => {
          const ehHoje = dia.data === hoje;
          const data_ = new Date(`${dia.data}T12:00:00`);

          return (
            <Cartao
              key={dia.id}
              interno
              elevado={ehHoje}
              className={ehHoje ? 'border-(color:--cor-acao-borda) bg-(color:--cor-acao-suave)' : ''}
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-semibold capitalize">
                  {data_.toLocaleDateString('pt-BR', { weekday: 'long' })}
                </p>
                {ehHoje && <Etiqueta tom="marca">hoje</Etiqueta>}
              </div>
              <p className="mb-3 text-2xs uppercase tracking-wide text-[color:var(--color-tinta-tenue)]">
                {data_.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
              </p>

              <dl className="space-y-2">
                {Object.entries(dia.refeicoes).map(([chave, valor]) => (
                  <div key={chave}>
                    <dt className="text-2xs font-bold uppercase tracking-wider text-[color:var(--color-tinta-tenue)]">
                      {ROTULOS[chave] ?? chave}
                    </dt>
                    <dd className="text-sm leading-relaxed">{String(valor)}</dd>
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
