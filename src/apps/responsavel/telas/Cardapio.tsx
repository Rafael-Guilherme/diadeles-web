import { useQuery } from '@tanstack/react-query';

import { api } from '@/shared/api/cliente';
import { Cabecalho, Folha, Tela } from '../componentes/Cabecalho';
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
    <Tela>
      <Cabecalho titulo="Cardápio" descricao="A semana da escola, adaptada à restrição da criança." />

      <Folha>
        <div className="space-y-(--gap-lista)">
        {data?.length === 0 && (
          <Vazio
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
        </div>
      </Folha>
    </Tela>
  );
}
