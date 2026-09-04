import { useQueries, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { api } from '@/shared/api/cliente';
import { Barra, Botao, Carregando, Metrica, RotuloSecao } from '@/shared/ui/componentes';
import { LayoutGestao } from '../componentes/LayoutGestao';
import { PendenciasDaEscola } from '../componentes/PendenciasDaEscola';

/**
 * Painel de quem responde pela escola.
 *
 * A hierarquia inverte o padrão de dashboard de propósito: as pendências que
 * exigem um telefonema vêm primeiro e ocupam a coluna larga; os números do dia
 * ficam numa faixa acima, pequenos. Um painel que abre com seis números
 * grandes e nenhuma ação ensina a gestora a olhar para ele uma vez por semana
 * (4a).
 */
export function Gestao() {
  const resumo = useQuery({
    queryKey: ['escola-resumo'],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/escola/resumo');
      if (error) throw error;
      return data;
    },
  });

  const turmas = useQuery({
    queryKey: ['turmas'],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/turmas');
      if (error) throw error;
      return data;
    },
  });

  /**
   * A adesão por turma sai da própria grade de cada turma.
   *
   * A API não tem um endpoint de adesão por turma — ela devolve adesão por
   * educadora. Montar aqui custa uma chamada por turma, e uma escola tem
   * cinco: é barato, e o número sai do mesmo lugar que a educadora vê, sem
   * risco de as duas telas discordarem.
   */
  const grades = useQueries({
    queries: (turmas.data ?? []).map((turma) => ({
      queryKey: ['grade', turma.id],
      queryFn: async () => {
        const { data, error } = await api.GET('/v1/turmas/{id}/grade', {
          params: { path: { id: turma.id } },
        });
        if (error) throw error;
        return data;
      },
    })),
  });

  const comunicados = useQuery({
    queryKey: ['comunicados'],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/comunicados');
      if (error) throw error;
      return data;
    },
  });

  const assinatura = useQuery({
    queryKey: ['assinatura'],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/assinatura');
      if (error) throw error;
      return data;
    },
  });

  if (resumo.isLoading || !resumo.data) {
    return (
      <LayoutGestao titulo="Painel do dia">
        <Carregando texto="Levantando os números…" />
      </LayoutGestao>
    );
  }

  const data = resumo.data;

  // A API entrega presentes e ausentes; quem não é nem um nem outro ainda não
  // passou pela chamada. É o único número aqui que pede providência.
  const semChamada = Math.max(0, data.criancasAtivas - data.presentesHoje - data.ausentesHoje);

  const linhas = (turmas.data ?? []).map((turma, indice) => {
    const grade = grades[indice]?.data;
    const presentes = grade?.criancas.filter((c) => !c.ausente) ?? [];
    const esperados = presentes.length * (grade?.registrosHabilitados.length ?? 0);
    const faltando = presentes.reduce((soma, c) => soma + c.pendencias.length, 0);

    return {
      turma,
      presentes: presentes.length,
      total: grade?.criancas.length ?? turma.criancasAtivas,
      adesao: esperados === 0 ? 1 : (esperados - faltando) / esperados,
      educadoras: turma.educadores.map((e) => e.nome).join(' · ') || '—',
    };
  });

  const turnoRegistrado =
    linhas.length === 0 ? 1 : linhas.reduce((s, l) => s + l.adesao, 0) / linhas.length;

  return (
    <LayoutGestao
      titulo={hojePorExtenso()}
      descricao={data.escola.nome}
      acoes={
        <Link to="/gestao/comunicados">
          <Botao tamanho="compacto">Novo comunicado</Botao>
        </Link>
      }
    >
      {/* A faixa de números é fina e vem antes da lista, não no lugar dela. */}
      <section className="grid grid-cols-2 gap-x-6 gap-y-4 border-b border-[color:var(--color-borda)] pb-4 sm:grid-cols-3 lg:grid-cols-5">
        <Metrica rotulo="Presentes" valor={data.presentesHoje} apoio={`de ${data.criancasAtivas}`} />
        <Metrica rotulo="Turno registrado" valor={`${Math.round(turnoRegistrado * 100)}%`} />
        <Metrica
          rotulo="Sem chamada"
          valor={semChamada}
          tom={semChamada > 0 ? 'alerta' : 'neutro'}
        />
        <Metrica
          rotulo="Ocorrências abertas"
          valor={data.ocorrenciasAbertas}
          tom={data.ocorrenciasAbertas > 0 ? 'alerta' : 'neutro'}
        />
        <Metrica rotulo="Registros hoje" valor={data.registrosHoje} />
      </section>

      <div className="grid gap-6 pt-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0 space-y-6">
          <section className="space-y-2">
            <div className="flex items-baseline gap-2.5">
              <h2 className="text-lg font-semibold">Precisa de alguém ao telefone</h2>
              <span className="text-xs text-[color:var(--color-tinta-tenue)]">
                o resto do dia está andando sozinho
              </span>
            </div>
            <PendenciasDaEscola />
          </section>

          <section className="space-y-2">
            <div className="flex items-baseline gap-2.5">
              <h2 className="text-lg font-semibold">Adesão por turma</h2>
              <span className="text-xs text-[color:var(--color-tinta-tenue)]">
                registros feitos sobre o esperado até agora
              </span>
            </div>

            {turmas.isLoading ? (
              <Carregando texto="Somando as turmas…" />
            ) : (
              <div className="overflow-x-auto rounded-(--raio) border border-[color:var(--color-borda)] bg-white">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[color:var(--color-borda)]">
                      <Th>Turma</Th>
                      <Th>Presentes</Th>
                      <Th className="w-[45%]">Adesão do turno</Th>
                      <Th>Educadora</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {linhas.map((linha) => (
                      <tr
                        key={linha.turma.id}
                        className={`border-b border-[color:var(--color-borda)] last:border-b-0 ${
                          linha.adesao < 0.8 ? 'bg-[color:var(--color-sol-50)]' : ''
                        }`}
                      >
                        <td className="px-3 py-2.5 font-semibold">
                          <Link to={`/turma/${linha.turma.id}`} className="hover:underline">
                            {linha.turma.nome}
                          </Link>
                        </td>
                        <td className="numerico px-3 py-2.5 text-[color:var(--color-tinta-suave)]">
                          {linha.presentes} / {linha.total}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <Barra
                              valor={linha.adesao}
                              tom={linha.adesao < 0.8 ? 'sol' : 'marca'}
                              rotulo={`Adesão de ${linha.turma.nome}`}
                            />
                            <span
                              className={`numerico shrink-0 text-xs font-semibold ${
                                linha.adesao < 0.8 ? 'text-[color:var(--color-sol-700)]' : ''
                              }`}
                            >
                              {Math.round(linha.adesao * 100)}%
                            </span>
                          </div>
                        </td>
                        <td className="truncate px-3 py-2.5 text-[color:var(--color-tinta-suave)]">
                          {linha.educadoras}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <div className="min-w-0 space-y-6">
          <section className="space-y-2">
            <RotuloSecao>Comunicados · taxa de leitura</RotuloSecao>
            <div className="space-y-3 rounded-(--raio) border border-[color:var(--color-borda)] bg-white p-(--padding-cartao)">
              {(comunicados.data ?? []).filter((c) => !c.rascunho).length === 0 ? (
                <p className="text-sm text-[color:var(--color-tinta-suave)]">
                  Nenhum comunicado publicado ainda.
                </p>
              ) : (
                (comunicados.data ?? [])
                  .filter((c) => !c.rascunho)
                  .slice(0, 3)
                  .map((comunicado) => {
                    const taxa =
                      data.familiasVinculadas === 0
                        ? 0
                        : comunicado.totalLeituras / data.familiasVinculadas;
                    return (
                      <div key={comunicado.id}>
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="min-w-0 truncate text-sm font-semibold">
                            {comunicado.titulo}
                          </p>
                          <span
                            className={`numerico shrink-0 text-sm font-semibold ${
                              taxa < 0.5 ? 'text-[color:var(--color-sol-700)]' : ''
                            }`}
                          >
                            {Math.round(taxa * 100)}%
                          </span>
                        </div>
                        <Barra
                          className="mt-1.5"
                          valor={taxa}
                          tom={taxa < 0.5 ? 'sol' : 'marca'}
                          rotulo={`Leitura de ${comunicado.titulo}`}
                        />
                        <p className="numerico mt-1 text-2xs text-[color:var(--color-tinta-tenue)]">
                          {comunicado.totalLeituras} de {data.familiasVinculadas} famílias
                        </p>
                      </div>
                    );
                  })
              )}
              <Link to="/gestao/comunicados" className="block">
                <Botao variante="secundario" bloco tamanho="compacto">
                  Ver todos
                </Botao>
              </Link>
            </div>
          </section>

          {assinatura.data?.proximaApuracao && (
            <section className="space-y-2">
              <RotuloSecao>Assinatura</RotuloSecao>
              <div className="rounded-(--raio) border border-[color:var(--color-borda)] bg-white p-(--padding-cartao)">
                <p className="text-base font-semibold first-letter:uppercase">
                  {assinatura.data.plano} · {assinatura.data.criancasAtivas} crianças
                </p>
                <p className="numerico mt-1 text-sm text-[color:var(--color-tinta-suave)]">
                  Próxima fatura {emReais(assinatura.data.valorEstimado)} em{' '}
                  {dataCurta(assinatura.data.proximaApuracao)}.
                </p>
                <p className="mt-2 rounded-(--raio-sm) bg-[color:var(--color-papel)] p-3 text-xs leading-snug text-[color:var(--color-tinta-suave)]">
                  A cobrança é pelas crianças ativas no fechamento. Uma matrícula encerrada hoje já
                  não entra nesta fatura.
                </p>
              </div>
            </section>
          )}

          {/* No celular a lateral não existe, e estas telas ficariam sem
              caminho nenhum. São trabalho de mesa — por isso entram como lista
              discreta no fim do painel, e não como abas. */}
          <section className="space-y-2 lg:hidden">
            <RotuloSecao>Mais da escola</RotuloSecao>
            <nav className="divide-y divide-[color:var(--color-borda)] overflow-hidden rounded-(--raio) border border-[color:var(--color-borda)] bg-white">
              {[
                ['/gestao/criancas', 'Crianças e cadastro'],
                ['/gestao/equipe', 'Equipe'],
                ['/gestao/acesso', 'Acesso das famílias'],
                ['/gestao/adesao', 'Adesão'],
                ['/gestao/cardapio', 'Cardápio da semana'],
                ['/gestao/rotina', 'Tipos de registro'],
                ['/gestao/ano-letivo', 'Ano letivo'],
                ['/gestao/assinatura', 'Assinatura e faturas'],
              ].map(([para, rotulo]) => (
                <Link
                  key={para}
                  to={para!}
                  className="flex min-h-11 items-center gap-2 px-3 text-sm transition active:bg-[color:var(--color-papel)]"
                >
                  <span className="flex-1">{rotulo}</span>
                  <ChevronRight size={18} className="text-[color:var(--color-tinta-tenue)]" />
                </Link>
              ))}
            </nav>
          </section>
        </div>
      </div>
    </LayoutGestao>
  );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={`px-3 py-2 text-2xs font-medium uppercase tracking-[0.1em] text-[color:var(--color-tinta-tenue)] ${className}`}
    >
      {children}
    </th>
  );
}

function hojePorExtenso(): string {
  const texto = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function dataCurta(iso: string): string {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return new Date(ano ?? 0, (mes ?? 1) - 1, dia ?? 1).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
}

/** A API devolve "238.00"; no Brasil isso se lê R$ 238,00. */
function emReais(valor: string): string {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
