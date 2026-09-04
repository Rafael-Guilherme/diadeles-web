import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/shared/api/cliente';
import type { components } from '@/shared/api/schema';
import { ehDaGestao, useSessao } from '@/shared/auth/sessao';
import { sair } from '@/shared/auth/sair';
import { Botao, Cartao, Carregando, Etiqueta, RotuloSecao, Vazio } from '@/shared/ui/componentes';
import { Cabecalho } from '../componentes/Cabecalho';

const GRUPOS: Record<string, string> = {
  BEBES: 'Bebês',
  CRIANCAS_BEM_PEQUENAS: 'Crianças bem pequenas',
  CRIANCAS_PEQUENAS: 'Crianças pequenas',
};

/**
 * A primeira tela do turno.
 *
 * Não é um índice: é o estado das turmas de hoje. Cada cartão diz em que pé
 * está o dia daquela turma e oferece a ação que falta — quase sempre "fazer a
 * chamada", porque é ela que destrava todas as outras colunas da grade.
 */
export function Turmas() {
  const usuario = useSessao((estado) => estado.usuario);
  const [saindo, setSaindo] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['turmas'],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/turmas');
      if (error) throw error;
      return data;
    },
  });

  const gestao = ehDaGestao(usuario?.papeis ?? []);
  const primeiroNome = usuario?.nome.split(' ')[0] ?? '';

  return (
    <div className="min-h-full">
      <Cabecalho titulo={`${saudacao()}, ${primeiroNome}`} subtitulo={hoje()} />

      <main className="space-y-4 px-3 py-3">
        {/* Coordenação e gestão abrem o app para saber como está o dia inteiro,
            não para registrar uma turma. O caminho para o painel vem antes da
            lista por isso — para elas a lista é o detalhe. */}
        {gestao && (
          <Link to="/gestao" className="block">
            <Cartao
              interno
              className="flex items-center gap-3 border-(color:--cor-acao-borda) bg-(color:--cor-acao-suave) transition active:brightness-95"
            >
              <BarChart3 size={19} className="shrink-0 text-(color:--cor-acao)" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-(color:--cor-acao-forte)">A escola hoje</p>
                <p className="text-xs text-[color:var(--color-tinta-suave)]">
                  Painel, pendências e acesso das famílias
                </p>
              </div>
              <ChevronRight size={20} className="shrink-0 text-(color:--cor-acao)" />
            </Cartao>
          </Link>
        )}

        {isLoading && <Carregando texto="Buscando suas turmas…" />}

        {data?.length === 0 && (
          <Vazio
            titulo="Nenhuma turma por aqui"
            descricao="Você ainda não está vinculada a nenhuma turma. Peça à coordenação — leva um minuto no painel da gestão."
          />
        )}

        {data && data.length > 0 && (
          <div className="space-y-(--gap-lista)">
            <RotuloSecao>Suas turmas hoje</RotuloSecao>
            {data.map((turma) => (
              <CartaoDeTurma key={turma.id} turma={turma} />
            ))}
          </div>
        )}

        <button
          onClick={() => {
            setSaindo(true);
            void sair();
          }}
          disabled={saindo}
          className="min-h-11 w-full pt-4 text-center text-sm text-[color:var(--color-tinta-tenue)] underline underline-offset-2 disabled:opacity-50"
        >
          {saindo ? 'Saindo…' : 'Sair'}
        </button>
      </main>
    </div>
  );
}

/**
 * O cartão diz o estado, não só o nome.
 *
 * A faixa de cor à esquerda é a mesma da turma no painel da gestão — é o que
 * deixa a educadora achar o Berçário II sem ler, no meio do corredor.
 */
function CartaoDeTurma({ turma }: { turma: components['schemas']['TurmaDto'] }) {
  return (
    <Cartao className="overflow-hidden">
      <div className="flex items-start gap-3 p-(--padding-cartao)">
        <span
          aria-hidden
          className="mt-0.5 h-9 w-1.5 shrink-0 rounded-full"
          style={{ background: turma.cor ?? 'var(--cor-acao)' }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-lg font-semibold">{turma.nome}</p>
            <Etiqueta tom="neutro">{turma.turno}</Etiqueta>
          </div>
          <p className="numerico text-xs text-[color:var(--color-tinta-suave)]">
            {GRUPOS[turma.grupoEtario] ?? turma.grupoEtario} · {turma.criancasAtivas}{' '}
            {turma.criancasAtivas === 1 ? 'criança' : 'crianças'}
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-t border-[color:var(--color-borda)] p-(--padding-cartao)">
        <Link to={`/turma/${turma.id}/chamada`} className="flex-1">
          <Botao variante="secundario" bloco>
            Chamada
          </Botao>
        </Link>
        <Link to={`/turma/${turma.id}`} className="flex-[1.4]">
          <Botao bloco>Abrir a grade</Botao>
        </Link>
      </div>
    </Cartao>
  );
}

/**
 * "Bom dia" às 7h e "boa tarde" às 15h.
 *
 * A mesma educadora abre o app nos dois turnos, e um "bom dia" às cinco da
 * tarde é o tipo de detalhe que faz o app parecer estrangeiro.
 */
function saudacao(): string {
  const hora = new Date().getHours();
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

function hoje(): string {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}
