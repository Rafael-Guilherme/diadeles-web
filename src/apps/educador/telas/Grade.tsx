import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ClipboardList, ScrollText, UserCheck } from 'lucide-react';
import { api } from '@/shared/api/cliente';
import type { components } from '@/shared/api/schema';
import { fila, type TipoRegistro } from '@/shared/offline/fila';
import { sincronizar, notificarMudancaNaFila } from '@/shared/offline/sincronizador';
import { Botao, Carregando, Esqueleto, Vazio } from '@/shared/ui/componentes';
import { Cabecalho } from '../componentes/Cabecalho';
import { PainelRegistro, ROTULOS_TIPO, SIGLAS_TIPO } from '../componentes/PainelRegistro';
import { Recados } from '../componentes/Recados';

/**
 * A tela principal do educador.
 *
 * A cardinalidade aqui é 1 educador → 20 crianças, não 1 para 1: por isso a
 * unidade de trabalho é a turma inteira e o registro é em lote. Se cada
 * lançamento exigisse abrir a ficha de uma criança, o app seria abandonado na
 * primeira semana (docs/plano-produto.md §2).
 *
 * A forma é uma malha: linha = criança, coluna = tipo de registro. É o que
 * responde "o que falta" num relance — a pergunta que a educadora faz vinte
 * vezes por turno e que uma lista de cartões só respondia rolando a tela.
 */
export function Grade() {
  const { turmaId = '' } = useParams();
  const clienteQuery = useQueryClient();
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const [painelAberto, setPainelAberto] = useState(false);
  const [recemRegistrados, setRecemRegistrados] = useState<Record<string, TipoRegistro[]>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['grade', turmaId],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/turmas/{id}/grade', {
        params: { path: { id: turmaId } },
      });
      if (error) throw error;
      return data;
    },
  });

  const presentes = useMemo(
    () => data?.criancas.filter((c) => !c.ausente) ?? [],
    [data?.criancas],
  );

  /** Pendências já descontadas do que acabou de ser enfileirado nesta sessão. */
  const faltamPorCrianca = useMemo(() => {
    const mapa = new Map<string, TipoRegistro[]>();
    for (const crianca of data?.criancas ?? []) {
      const feitos = new Set(recemRegistrados[crianca.id] ?? []);
      mapa.set(
        crianca.id,
        (crianca.pendencias as TipoRegistro[]).filter((tipo) => !feitos.has(tipo)),
      );
    }
    return mapa;
  }, [data?.criancas, recemRegistrados]);

  // Memoizado porque a contagem por coluna depende dele: sem isto, `colunas`
  // é um array novo a cada render e o `useMemo` de baixo nunca aproveita nada.
  const colunas = useMemo(
    () => (data?.registrosHabilitados ?? []) as TipoRegistro[],
    [data?.registrosHabilitados],
  );

  /**
   * Quantas crianças ainda faltam em cada coluna.
   *
   * É a contagem que transforma a malha em plano de ação: em vez de procurar
   * buracos linha a linha, a educadora lê o cabeçalho e sabe que hoje o que
   * falta é fralda.
   */
  const faltamPorTipo = useMemo(() => {
    const contagem = new Map<TipoRegistro, number>(colunas.map((tipo) => [tipo, 0]));
    for (const crianca of presentes) {
      for (const tipo of faltamPorCrianca.get(crianca.id) ?? []) {
        contagem.set(tipo, (contagem.get(tipo) ?? 0) + 1);
      }
    }
    return contagem;
  }, [colunas, presentes, faltamPorCrianca]);

  const semChamada = presentes.filter((c) => c.semPresenca).length;
  const totalFaltando = [...faltamPorTipo.values()].reduce((soma, n) => soma + n, 0);
  const completas = presentes.filter((c) => (faltamPorCrianca.get(c.id) ?? []).length === 0).length;

  const maioresFaltas = [...faltamPorTipo.entries()]
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  function alternar(criancaId: string) {
    setSelecionadas((atual) => {
      const proxima = new Set(atual);
      if (proxima.has(criancaId)) proxima.delete(criancaId);
      else proxima.add(criancaId);
      return proxima;
    });
  }

  function selecionarTodas() {
    setSelecionadas(
      selecionadas.size === presentes.length ? new Set() : new Set(presentes.map((c) => c.id)),
    );
  }

  /**
   * Grava na fila local e devolve o controle na hora. A UI não espera rede:
   * o educador registra a turma inteira em segundos, com ou sem internet.
   */
  async function registrarEmLote(tipo: TipoRegistro, dados: unknown, observacao?: string) {
    const alvos = [...selecionadas];
    const agora = new Date().toISOString();

    await fila.enfileirarVarios(
      alvos.map((criancaId) => ({
        criancaId,
        turmaId,
        tipo,
        ocorridoEm: agora,
        dados,
        observacao: observacao ?? null,
      })),
    );

    // Marca visualmente antes de qualquer confirmação do servidor.
    setRecemRegistrados((atual) => {
      const proximo = { ...atual };
      for (const id of alvos) proximo[id] = [...(proximo[id] ?? []), tipo];
      return proximo;
    });

    setSelecionadas(new Set());
    setPainelAberto(false);
    notificarMudancaNaFila();

    void sincronizar().then(() => {
      void clienteQuery.invalidateQueries({ queryKey: ['grade', turmaId] });
    });
  }

  if (isLoading) {
    return (
      <>
        <Cabecalho titulo="Carregando…" subtitulo="carregando o dia de hoje…" voltarPara="/" />
        <GradeEsqueleto />
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Cabecalho titulo="Turma" voltarPara="/" />
        <div className="px-4 py-6">
          <Vazio
            titulo="Não consegui carregar a turma"
            descricao="A grade abre com o que já está no aparelho. Se estiver vazia, verifique a conexão e tente de novo."
          />
        </div>
      </>
    );
  }

  const selecionada = [...selecionadas][0];
  const totalSelecionadas = selecionadas.size;

  return (
    <div className="flex min-h-full flex-col pb-32">
      <Cabecalho
        titulo={data.turma.nome}
        subtitulo={`${data.criancas.length} crianças · ${data.turma.turno} · ${dataCurta(data.data)}`}
        voltarPara="/"
      />

      {/* Quanto falta, antes de qualquer linha: é a resposta que a educadora
          procura ao desbloquear o telefone no meio do corredor. */}
      <section className="border-b border-[color:var(--color-borda)] bg-white px-3 py-2.5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm">
            <strong className="numerico font-semibold">
              {completas} de {presentes.length}
            </strong>{' '}
            com o dia completo
          </p>
          <p className="numerico text-xs font-semibold text-[color:var(--color-sol-700)]">
            {totalFaltando === 0
              ? 'nada faltando'
              : `${totalFaltando} ${totalFaltando === 1 ? 'registro' : 'registros'} faltando`}
          </p>
        </div>

        <BarraDeTurma completas={completas} presentes={presentes.length} />

        {maioresFaltas.length > 0 && (
          <p className="mt-2 text-2xs text-[color:var(--color-tinta-suave)]">
            Falta mais:{' '}
            {maioresFaltas.map(([tipo, n], indice) => (
              <span key={tipo}>
                {indice > 0 && ' · '}
                <span className={indice === 0 ? 'font-semibold text-[color:var(--color-sol-700)]' : ''}>
                  {ROTULOS_TIPO[tipo].toLowerCase()} ({n})
                </span>
              </span>
            ))}
          </p>
        )}
      </section>

      {data.criancas.length === 0 ? (
        <div className="px-4 py-6">
          <Vazio
            titulo="Turma sem criança"
            descricao="A gestão ainda não matriculou ninguém aqui. Você pode trazer crianças de outra turma do mesmo turno."
          />
        </div>
      ) : (
        <Malha
          criancas={data.criancas}
          colunas={colunas}
          faltamPorTipo={faltamPorTipo}
          faltamPorCrianca={faltamPorCrianca}
          semChamada={semChamada}
          selecionadas={selecionadas}
          aoAlternar={alternar}
        />
      )}

      <div className="space-y-2 px-4 py-3">
        <div className="flex gap-2">
          <Link to={`/turma/${turmaId}/chamada`} className="flex-1">
            <Botao variante="secundario" bloco>
              <UserCheck size={16} /> Chamada
            </Botao>
          </Link>
          <Link to={`/turma/${turmaId}/pendencias`} className="flex-1">
            <Botao variante="secundario" bloco>
              <ClipboardList size={16} /> Fechar turno
            </Botao>
          </Link>
        </div>

        {/* Fora da linha de cima de propósito: chamada e fechamento são do dia,
            e o parecer é do semestre — misturá-los na mesma fileira sugeriria uma
            rotina que não existe. */}
        <Link to={`/turma/${turmaId}/pareceres`}>
          <Botao variante="fantasma" bloco>
            <ScrollText size={16} /> Pareceres do semestre
          </Botao>
        </Link>

        <Recados turmaId={turmaId} />
      </div>

      {/* A barra só existe quando há seleção: sem ela, o rodapé fixo comeria
          duas linhas da malha o turno inteiro. */}
      {totalSelecionadas > 0 && (
        <div
          className="area-segura-base fixed inset-x-0 bottom-0 z-20 flex items-center gap-2.5 border-t border-[color:var(--color-borda-forte)] bg-[color:var(--color-papel)] px-3 pt-2.5"
          style={{ boxShadow: 'var(--sombra-elevada)' }}
        >
          <div className="min-w-0 flex-1">
            <p className="numerico truncate text-sm font-semibold">
              {totalSelecionadas} {totalSelecionadas === 1 ? 'selecionada' : 'selecionadas'}
            </p>
            <button
              onClick={() => setSelecionadas(new Set())}
              className="-my-1 py-1 text-xs text-(color:--cor-acao-forte) underline"
            >
              limpar seleção
            </button>
          </div>

          {/* Com uma só criança na mão, o atalho para a ficha vale mais que o
              botão de turma inteira: é o momento em que se abre a alergia. */}
          {totalSelecionadas === 1 ? (
            <Link to={`/turma/${turmaId}/crianca/${selecionada}`}>
              <Botao variante="secundario">Ficha</Botao>
            </Link>
          ) : (
            <Botao variante="secundario" onClick={selecionarTodas}>
              Turma toda
            </Botao>
          )}
          <Botao onClick={() => setPainelAberto(true)}>Registrar</Botao>
        </div>
      )}

      {painelAberto && (
        <PainelRegistro
          tiposHabilitados={colunas}
          nomes={data.criancas
            .filter((c) => selecionadas.has(c.id))
            .map((c) => c.nomeSocial ?? c.nome)}
          restricoes={data.criancas
            .filter((c) => selecionadas.has(c.id) && c.alergias.length + c.restricoesAlimentares.length > 0)
            .map((c) => ({
              nome: c.nomeSocial ?? c.nome,
              itens: [...c.alergias, ...c.restricoesAlimentares],
            }))}
          aoFechar={() => setPainelAberto(false)}
          aoConfirmar={registrarEmLote}
        />
      )}
    </div>
  );
}

/**
 * Duas cores numa barra só: o que já está completo e o que ainda falta.
 *
 * O trilho é sol-50, não cinza — o vazio aqui não é neutro, é trabalho a
 * fazer, e a cor já diz isso antes de o número ser lido.
 */
function BarraDeTurma({ completas, presentes }: { completas: number; presentes: number }) {
  const proporcao = presentes === 0 ? 0 : completas / presentes;

  return (
    <div
      role="progressbar"
      aria-label="Crianças com o dia completo"
      aria-valuenow={Math.round(proporcao * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-[color:var(--color-sol-50)]"
    >
      <span
        className="block h-full bg-[color:var(--color-marca-500)]"
        style={{ width: `${proporcao * 100}%` }}
      />
      <span
        className="block h-full bg-[color:var(--color-sol-300)]"
        style={{ width: `${Math.min(12, (1 - proporcao) * 100)}%` }}
      />
    </div>
  );
}

type CriancaDaGrade = components['schemas']['CriancaNaGradeDto'];

function Malha({
  criancas,
  colunas,
  faltamPorTipo,
  faltamPorCrianca,
  semChamada,
  selecionadas,
  aoAlternar,
}: {
  criancas: CriancaDaGrade[];
  colunas: TipoRegistro[];
  faltamPorTipo: Map<TipoRegistro, number>;
  faltamPorCrianca: Map<string, TipoRegistro[]>;
  semChamada: number;
  selecionadas: Set<string>;
  aoAlternar: (id: string) => void;
}) {
  return (
    // `min-w-0`: num contêiner flex o filho tem `min-width:auto`, e sem isso a
    // coluna a mais empurra a página inteira em vez de rolar aqui dentro.
    <div className="min-w-0 border-y border-[color:var(--color-borda-forte)] bg-white">
      {/*
        Rola na horizontal quando a escola pratica muitos tipos; a coluna do
        nome fica presa à esquerda para a linha nunca virar anônima.

        `contain: paint` não é enfeite: sem ele o Chrome do celular alarga o
        *viewport* para caber a tabela — a página inteira sai desenhada a 453px
        num aparelho de 390 e o app aparece encolhido. Rolar de lado é papel
        desta caixa, não da tela.
      */}
      <div className="overflow-x-auto" style={{ contain: 'paint' }}>
        {/*
          `table-fixed` com larguras declaradas é o que segura a malha em 390px:
          sem isso o nome mais comprido da turma manda na largura da coluna e a
          grade inteira sai da tela. Escola que pratica muitos tipos passa dos
          390 e aí a tabela rola na horizontal, com o nome preso à esquerda.
        */}
        <table
          className="border-collapse text-left"
          style={{ tableLayout: 'fixed', width: 150 + 40 * (colunas.length + 1), minWidth: '100%' }}
        >
          <colgroup>
            <col style={{ width: 150 }} />
            {Array.from({ length: colunas.length + 1 }).map((_, i) => (
              <col key={i} style={{ width: 40 }} />
            ))}
          </colgroup>
          <thead>
            <tr className="bg-[color:var(--color-papel)]">
              <th
                scope="col"
                className="sticky left-0 z-10 w-[150px] border-b border-[color:var(--color-borda-forte)] bg-[color:var(--color-papel)] px-2 py-0 text-2xs font-medium uppercase tracking-[0.1em] text-[color:var(--color-tinta-tenue)]"
              >
                Criança
              </th>
              <CabecalhoDeColuna sigla="CHA" faltam={semChamada} titulo="Chamada" />
              {colunas.map((tipo) => (
                <CabecalhoDeColuna
                  key={tipo}
                  sigla={SIGLAS_TIPO[tipo]}
                  faltam={faltamPorTipo.get(tipo) ?? 0}
                  titulo={ROTULOS_TIPO[tipo]}
                />
              ))}
            </tr>
          </thead>

          <tbody>
            {criancas.map((crianca) => (
              <Linha
                key={crianca.id}
                crianca={crianca}
                colunas={colunas}
                faltam={faltamPorCrianca.get(crianca.id) ?? []}
                selecionada={selecionadas.has(crianca.id)}
                aoAlternar={() => aoAlternar(crianca.id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <Legenda />
    </div>
  );
}

function CabecalhoDeColuna({
  sigla,
  faltam,
  titulo,
}: {
  sigla: string;
  faltam: number;
  titulo: string;
}) {
  return (
    <th
      scope="col"
      title={titulo}
      className="h-11 w-10 min-w-10 border-b border-l border-[color:var(--color-borda-forte)] border-l-[color:var(--color-borda)] px-0 text-center align-middle font-normal"
    >
      <span className="block text-2xs font-semibold text-[color:var(--color-tinta-suave)]">
        {sigla}
      </span>
      <span
        className={`numerico block text-2xs ${
          faltam === 0
            ? 'text-[color:var(--color-ok)]'
            : 'font-semibold text-[color:var(--color-sol-700)]'
        }`}
      >
        {faltam === 0 ? '✓' : faltam}
      </span>
      <span className="sr-only">
        {titulo} — {faltam === 0 ? 'nada faltando' : `${faltam} faltando`}
      </span>
    </th>
  );
}

/**
 * A linha da criança.
 *
 * 44px de altura com 1px de divisor: a densidade vem do divisor, não do
 * encolhimento do alvo de toque. A barra de 3px à esquerda é o resumo da linha
 * — laranja falta alguma coisa, verde está completa, cinza não se aplica.
 */
function Linha({
  crianca,
  colunas,
  faltam,
  selecionada,
  aoAlternar,
}: {
  crianca: CriancaDaGrade;
  colunas: TipoRegistro[];
  faltam: TipoRegistro[];
  selecionada: boolean;
  aoAlternar: () => void;
}) {
  const feitos = new Set(crianca.registros.map((r) => r.tipo as TipoRegistro));
  const nome = crianca.nomeSocial ?? crianca.nome;
  const nota = notaDaLinha(crianca);

  const trilho = crianca.ausente
    ? 'var(--color-borda)'
    : faltam.length === 0
      ? 'var(--color-marca-300)'
      : 'var(--color-sol-300)';

  return (
    <tr
      className={`border-b border-[color:var(--color-borda)] ${
        selecionada ? 'bg-[color:var(--color-marca-50)]' : ''
      } ${crianca.ausente ? 'opacity-70' : ''}`}
    >
      <th
        scope="row"
        style={{ borderLeft: `3px solid ${trilho}` }}
        className={`sticky left-0 z-10 h-11 w-[150px] p-0 text-left font-normal ${
          selecionada ? 'bg-[color:var(--color-marca-50)]' : 'bg-white'
        }`}
      >
        <button
          onClick={aoAlternar}
          disabled={crianca.ausente}
          aria-pressed={selecionada}
          className="flex h-11 w-full items-center gap-[7px] px-2 text-left disabled:cursor-not-allowed"
        >
          <span
            aria-hidden
            className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] text-2xs text-white ${
              selecionada
                ? 'bg-(color:--cor-acao)'
                : 'border-[1.5px] border-[color:var(--color-borda-forte)]'
            }`}
          >
            {selecionada ? '✓' : ''}
          </span>
          <span className="flex min-w-0 flex-1 flex-col justify-center gap-px">
            <span className="truncate text-sm leading-[1.15]">{nome}</span>
            {nota && (
              <span
                className={`truncate text-2xs font-semibold leading-[1.1] tracking-[0.04em] ${
                  nota.grave
                    ? 'text-[color:var(--color-alerta)]'
                    : 'text-[color:var(--color-tinta-suave)]'
                }`}
              >
                {nota.texto}
              </span>
            )}
          </span>
        </button>
      </th>

      <Celula
        estado={crianca.ausente ? 'ausente' : crianca.semPresenca ? 'falta' : 'feito'}
        rotulo={`Chamada de ${nome}`}
      />
      {colunas.map((tipo) => (
        <Celula
          key={tipo}
          estado={
            crianca.ausente
              ? 'naoSeAplica'
              : feitos.has(tipo) || !faltam.includes(tipo)
                ? 'feito'
                : 'falta'
          }
          rotulo={`${ROTULOS_TIPO[tipo]} de ${nome}`}
        />
      ))}
    </tr>
  );
}

/**
 * A célula, em quatro estados.
 *
 * O caso registrado é o silencioso — quadradinho verde e nada mais. É a falta
 * que ganha fundo próprio, porque é ela que precisa ser encontrada.
 */
function Celula({
  estado,
  rotulo,
}: {
  estado: 'feito' | 'falta' | 'ausente' | 'naoSeAplica';
  rotulo: string;
}) {
  const conteudo = {
    feito: (
      <span className="flex h-[22px] w-[22px] items-center justify-center rounded-md bg-[color:var(--color-marca-500)] text-xs text-white">
        ✓
      </span>
    ),
    falta: (
      <span className="h-2.5 w-2.5 rounded-full border-[1.5px] border-[color:var(--color-borda-forte)]" />
    ),
    ausente: (
      <span className="flex h-[22px] w-[22px] items-center justify-center rounded-md border-[1.5px] border-[color:var(--color-borda-forte)] text-xs text-[color:var(--color-tinta-tenue)]">
        –
      </span>
    ),
    naoSeAplica: <span className="h-0.5 w-2.5 bg-[color:var(--color-borda)]" />,
  }[estado];

  const legenda = {
    feito: 'registrado',
    falta: 'falta',
    ausente: 'ausente',
    naoSeAplica: 'não se aplica',
  }[estado];

  return (
    <td
      className={`h-11 w-10 min-w-10 border-l border-[color:var(--color-borda)] p-0 ${
        estado === 'falta' ? 'bg-[color:var(--color-sol-50)]' : ''
      }`}
    >
      <span className="flex h-11 items-center justify-center" aria-hidden>
        {conteudo}
      </span>
      <span className="sr-only">
        {rotulo}: {legenda}
      </span>
    </td>
  );
}

function Legenda() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[color:var(--color-borda)] bg-[color:var(--color-papel)] px-3 py-2 text-2xs text-[color:var(--color-tinta-suave)]">
      <span className="flex items-center gap-1.5">
        <span aria-hidden className="h-3.5 w-3.5 rounded bg-[color:var(--color-marca-500)]" />
        registrado
      </span>
      <span className="flex items-center gap-1.5">
        <span
          aria-hidden
          className="h-3.5 w-3.5 rounded border border-[color:var(--color-borda)] bg-[color:var(--color-sol-50)]"
        />
        falta
      </span>
      <span className="flex items-center gap-1.5">
        <span aria-hidden className="h-0.5 w-2.5 bg-[color:var(--color-borda)]" />
        não se aplica
      </span>
    </div>
  );
}

/**
 * A segunda linha do nome.
 *
 * Só uma cabe, então a ordem é a da consequência: alergia erra o almoço, dose
 * erra o remédio, ausência explica a linha vazia, chamada é o que destrava as
 * outras colunas (5d).
 */
function notaDaLinha(crianca: CriancaDaGrade): { texto: string; grave: boolean } | null {
  // Quem não veio não tem decisão de alergia hoje: a linha vazia é o que
  // precisa de explicação, e é ela que a segunda linha dá.
  if (crianca.ausente) {
    return {
      texto: crianca.justificativa ? `– ausente, ${crianca.justificativa}` : '– ausente',
      grave: false,
    };
  }
  if (crianca.alergias.length > 0) {
    return { texto: `! alergia a ${crianca.alergias.join(', ').toLowerCase()}`, grave: true };
  }
  if (crianca.temMedicacaoHoje) return { texto: '! medicação hoje', grave: true };
  if (crianca.semPresenca) return { texto: '– ainda não chamado', grave: false };
  return null;
}

function dataCurta(iso: string): string {
  const [ano, mes, dia] = iso.split('-').map(Number);
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  return `${dia} ${meses[(mes ?? 1) - 1]}${ano === new Date().getFullYear() ? '' : ` ${ano}`}`;
}

/**
 * A malha antes de a malha existir.
 *
 * Um giro no meio da tela faria a educadora achar que errou de turma; o
 * esqueleto já tem a forma da grade e ela reconhece onde chegou.
 */
function GradeEsqueleto() {
  return (
    <div className="min-w-0 border-y border-[color:var(--color-borda-forte)] bg-white">
      <Esqueleto className="m-3 h-1.5" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex h-11 items-center gap-2 border-t border-[color:var(--color-borda)] px-3">
          <Esqueleto className="h-3 flex-1" />
          <Esqueleto className="h-[22px] w-[22px]" />
          <Esqueleto className="h-[22px] w-[22px]" />
          <Esqueleto className="h-[22px] w-[22px]" />
        </div>
      ))}
      <Carregando texto="Montando a grade do dia…" />
    </div>
  );
}
