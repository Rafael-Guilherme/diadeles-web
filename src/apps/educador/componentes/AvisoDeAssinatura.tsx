import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/shared/api/cliente';
import { ehDaGestao, useSessao } from '@/shared/auth/sessao';

/**
 * A faixa de inadimplência — o D+10 e o D+20 da régua (docs/plano-produto.md §10).
 *
 * Aparece para toda a equipe, e não só para a gestão, por uma razão prática: no
 * D+20 o educador aperta "salvar" e nada grava. Sem esta faixa ele conclui que
 * o app quebrou, liga para a coordenação no meio do turno e a escola perde a
 * manhã descobrindo o que a API já sabia dizer.
 *
 * A frase sobre as famílias vem antes do botão de pagar, nas três larguras: é a
 * informação que evita a ligação em pânico da gestora achando que o app apagou
 * o histórico da escola (5b).
 *
 * O caminho para pagar só aparece para quem pode pagar. Mandar o educador
 * para uma tela de faturas que a API vai recusar seria pior do que não
 * oferecer link nenhum.
 */
export function AvisoDeAssinatura() {
  const usuario = useSessao((estado) => estado.usuario);
  const gestao = ehDaGestao(usuario?.papeis ?? []);

  const { data } = useQuery({
    queryKey: ['assinatura', 'aviso'],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/assinatura/aviso');
      if (error) throw error;
      return data ?? null;
    },
    // A régua mexe nisto uma vez por dia; consultar a cada foco de janela
    // gastaria requisição para ver o mesmo número.
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  // `mensagem` e não só `data`: a rota devolve nulo quando não há nada a
  // avisar, e uma faixa vermelha em branco seria pior que faixa nenhuma.
  if (!data?.mensagem) return null;

  const bloqueado = data.bloqueado;
  const titulo = bloqueado
    ? `Registro bloqueado · fatura em atraso há ${data.atrasoEmDias ?? 20} dias`
    : `Fatura${data.competenciaNome ? ` de ${data.competenciaNome}` : ''} em atraso há ${data.atrasoEmDias ?? 10} dias`;

  return (
    <div
      role="status"
      className={`flex items-start gap-2.5 border-b px-3 py-2.5 ${
        bloqueado
          ? 'border-[color:var(--color-alerta)] bg-[color:var(--color-alerta-suave)]'
          : 'border-[color:var(--color-sol-200)] bg-[color:var(--color-sol-50)]'
      }`}
    >
      <span
        aria-hidden
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-(--raio-sm) text-xs font-bold text-white ${
          bloqueado ? 'bg-[color:var(--color-alerta)]' : 'bg-[color:var(--color-sol-600)]'
        }`}
      >
        !
      </span>

      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-semibold ${
            bloqueado
              ? 'text-[color:var(--color-alerta)]'
              : 'text-[color:var(--color-sol-700)]'
          }`}
        >
          {titulo}
        </p>

        {/* A frase que evita o telefonema: nada foi apagado, e a família
            continua vendo o que já estava lá. */}
        <p className="mt-0.5 text-sm leading-snug text-[color:var(--color-tinta-suave)]">
          {bloqueado ? (
            <>
              <strong className="font-semibold text-[color:var(--color-tinta)]">
                As famílias continuam vendo tudo o que já foi registrado
              </strong>{' '}
              e recebendo comunicados. Nada foi apagado. O que para é o registro novo pela equipe, e
              ele volta minutos depois do pagamento.
            </>
          ) : (
            <>
              Nada mudou no app ainda. No <strong className="font-semibold">20º dia</strong> o
              registro é bloqueado para a equipe — as famílias continuam vendo o histórico.
            </>
          )}
        </p>

        {/* Sem link, quem não pode pagar ainda precisa saber o que fazer. */}
        {!gestao && (
          <p className="mt-1 text-xs text-[color:var(--color-tinta-tenue)]">
            {data.mensagem}
          </p>
        )}
      </div>

      {gestao && (
        <Link to="/gestao/assinatura" className="shrink-0">
          <span
            className={`inline-flex min-h-9 items-center rounded-(--raio-sm) px-3 text-sm font-semibold text-white ${
              bloqueado ? 'bg-[color:var(--color-alerta)]' : 'bg-[color:var(--color-sol-600)]'
            }`}
          >
            Ver a fatura{data.valor ? ` · ${emReais(data.valor)}` : ''}
          </span>
        </Link>
      )}
    </div>
  );
}

/** A API devolve "999.60"; no Brasil isso se lê R$ 999,60. */
function emReais(valor: string): string {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
