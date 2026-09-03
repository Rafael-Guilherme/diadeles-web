import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ChevronRight } from 'lucide-react';
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

  const conteudo = (
    <div
      className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium leading-snug ${
        data.bloqueado
          ? 'bg-[color:var(--color-alerta)] text-white'
          : 'bg-[color:var(--color-alerta-suave)] text-[color:var(--color-alerta)]'
      }`}
    >
      <AlertTriangle size={16} className="shrink-0" />
      <span className="min-w-0 flex-1">{data.mensagem}</span>
      {gestao && <ChevronRight size={16} className="shrink-0" />}
    </div>
  );

  if (!gestao) return <div role="status">{conteudo}</div>;

  return (
    <Link to="/gestao/assinatura" role="status" className="block">
      {conteudo}
    </Link>
  );
}
