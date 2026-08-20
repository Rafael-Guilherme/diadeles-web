import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Baby,
  CalendarDays,
  ChevronRight,
  KeyRound,
  LayoutGrid,
  ListChecks,
  Megaphone,
  MessageSquare,
  TrendingUp,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { api } from '@/shared/api/cliente';
import { Cartao, Carregando, RotuloSecao } from '@/shared/ui/componentes';
import { Cabecalho } from '../componentes/Cabecalho';

/**
 * Painel de quem responde pela escola.
 *
 * A coordenação e a gestão não fazem chamada — elas querem saber, em um olhar,
 * se o dia está sendo registrado. Por isso o primeiro bloco é o de hoje, e
 * dentro dele o número que exige ação: quantas crianças ainda não têm chamada.
 * Os totais da escola vêm depois, porque mudam uma vez por semestre.
 */
export function Gestao() {
  const { data, isLoading } = useQuery({
    queryKey: ['escola-resumo'],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/escola/resumo');
      if (error) throw error;
      return data;
    },
  });

  if (isLoading || !data) {
    return (
      <>
        <Cabecalho titulo="A escola hoje" voltarPara="/" />
        <Carregando texto="Levantando os números…" />
      </>
    );
  }

  // A API entrega presentes e ausentes; quem não é nem um nem outro ainda não
  // passou pela chamada. É o único número aqui que pede providência.
  const semChamada = Math.max(0, data.criancasAtivas - data.presentesHoje - data.ausentesHoje);

  return (
    <div className="min-h-full pb-10">
      <Cabecalho titulo="A escola hoje" subtitulo={data.escola.nome} voltarPara="/" />

      <main className="space-y-5 px-4 py-4">
        <section className="space-y-2">
          <RotuloSecao>Hoje</RotuloSecao>
          <div className="grid grid-cols-3 gap-2">
            <Indicador valor={data.presentesHoje} rotulo="presentes" />
            <Indicador valor={data.ausentesHoje} rotulo="ausentes" />
            <Indicador valor={semChamada} rotulo="sem chamada" atencao={semChamada > 0} />
          </div>
          <Cartao interno>
            <p className="numerico text-sm text-[color:var(--color-tinta-suave)]">
              <strong className="font-semibold text-[color:var(--color-tinta)]">
                {data.registrosHoje}
              </strong>{' '}
              {data.registrosHoje === 1 ? 'registro lançado' : 'registros lançados'} até agora — é o
              que as famílias já conseguem ver no app.
            </p>
          </Cartao>

          {/* Os dois números que pedem alguém ao telefone, e não mais um
              relatório: ocorrência que a família não confirmou ter lido e
              recado que ninguém da escola leu. Só aparecem quando existem —
              zero pendência não merece cartão. */}
          {(data.ocorrenciasAbertas > 0 || data.recadosPendentes > 0) && (
            <div className="space-y-(--gap-lista)">
              {data.ocorrenciasAbertas > 0 && (
                <Pendencia
                  icone={<AlertTriangle size={16} />}
                  texto={
                    data.ocorrenciasAbertas === 1
                      ? '1 ocorrência sem ciência da família nos últimos 7 dias'
                      : `${data.ocorrenciasAbertas} ocorrências sem ciência da família nos últimos 7 dias`
                  }
                  alerta
                />
              )}
              {data.recadosPendentes > 0 && (
                <Pendencia
                  icone={<MessageSquare size={16} />}
                  texto={
                    data.recadosPendentes === 1
                      ? '1 recado de família ainda não lido pela escola'
                      : `${data.recadosPendentes} recados de famílias ainda não lidos pela escola`
                  }
                />
              )}
            </div>
          )}
        </section>

        <section className="space-y-2">
          <RotuloSecao>A escola</RotuloSecao>
          <div className="grid grid-cols-3 gap-2">
            <Indicador valor={data.criancasAtivas} rotulo="crianças" />
            <Indicador valor={data.turmas} rotulo={data.turmas === 1 ? 'turma' : 'turmas'} />
            <Indicador valor={data.familiasVinculadas} rotulo="famílias" />
          </div>
        </section>

        <section className="space-y-(--gap-lista)">
          <RotuloSecao>Administração</RotuloSecao>
          <Atalho
            para="/gestao/criancas"
            icone={<Baby size={18} />}
            titulo="Crianças"
            descricao={`${data.criancasAtivas} ${
              data.criancasAtivas === 1 ? 'matrícula ativa' : 'matrículas ativas'
            } — cadastro, turma e saúde`}
          />
          <Atalho
            para="/gestao/equipe"
            icone={<Users size={18} />}
            titulo="Equipe"
            descricao={`${data.educadores} ${
              data.educadores === 1 ? 'pessoa registra' : 'pessoas registram'
            } rotina nas turmas`}
          />
          <Atalho
            para="/gestao/turmas"
            icone={<LayoutGrid size={18} />}
            titulo="Turmas"
            descricao={`${data.turmas} ${
              data.turmas === 1 ? 'turma' : 'turmas'
            } — faixa, turno e quem rege cada uma`}
          />
          <Atalho
            para="/gestao/acesso"
            icone={<KeyRound size={18} />}
            titulo="Acesso das famílias"
            descricao="Convites emitidos e quem ainda não entrou no app"
          />
          <Atalho
            para="/gestao/adesao"
            icone={<TrendingUp size={18} />}
            titulo="Adesão"
            descricao="Quem registra e quem abre o app, turma por turma"
          />
        </section>

        <section className="space-y-(--gap-lista)">
          <RotuloSecao>O que a escola publica</RotuloSecao>
          <Atalho
            para="/gestao/comunicados"
            icone={<Megaphone size={18} />}
            titulo="Comunicados"
            descricao="Escrever, publicar e ver quem leu"
          />
          <Atalho
            para="/gestao/cardapio"
            icone={<UtensilsCrossed size={18} />}
            titulo="Cardápio"
            descricao="A semana que aparece no app da família"
          />
          <Atalho
            para="/gestao/rotina"
            icone={<ListChecks size={18} />}
            titulo="Rotina"
            descricao="Quais registros a escola usa — e quais o turno cobra"
          />
          <Atalho
            para="/gestao/ano-letivo"
            icone={<CalendarDays size={18} />}
            titulo="Ano letivo"
            descricao="Abrir e encerrar o ano — a moldura das turmas"
          />
        </section>
      </main>
    </div>
  );
}

function Indicador({
  valor,
  rotulo,
  atencao = false,
}: {
  valor: number;
  rotulo: string;
  atencao?: boolean;
}) {
  return (
    <Cartao interno className="text-center">
      {/* `numerico` trava a largura dos dígitos: os três cartões ficam alinhados
          mesmo quando um número passa de uma casa para duas. */}
      <p
        className={`numerico text-2xl font-semibold leading-none ${
          atencao ? 'text-[color:var(--color-alerta)]' : ''
        }`}
      >
        {valor}
      </p>
      <p className="mt-1 text-2xs leading-tight text-[color:var(--color-tinta-tenue)]">{rotulo}</p>
    </Cartao>
  );
}

function Pendencia({
  icone,
  texto,
  alerta = false,
}: {
  icone: ReactNode;
  texto: string;
  alerta?: boolean;
}) {
  return (
    <Cartao
      interno
      className={`flex items-center gap-3 ${alerta ? 'border-[color:var(--color-alerta)]/30' : ''}`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          alerta
            ? 'bg-[color:var(--color-alerta-suave)] text-[color:var(--color-alerta)]'
            : 'bg-(color:--cor-acao-suave) text-(color:--cor-acao)'
        }`}
      >
        {icone}
      </span>
      <p className="text-sm leading-snug">{texto}</p>
    </Cartao>
  );
}

function Atalho({
  para,
  icone,
  titulo,
  descricao,
}: {
  para: string;
  icone: ReactNode;
  titulo: string;
  descricao: string;
}) {
  return (
    <Link to={para} className="block">
      <Cartao interno className="flex items-center gap-3 transition active:bg-neutral-50">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(color:--cor-acao-suave) text-(color:--cor-acao)">
          {icone}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{titulo}</p>
          <p className="text-xs text-[color:var(--color-tinta-suave)]">{descricao}</p>
        </div>
        <ChevronRight size={20} className="shrink-0 text-[color:var(--color-tinta-tenue)]" />
      </Cartao>
    </Link>
  );
}
