import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { api } from '@/shared/api/cliente';
import type { components } from '@/shared/api/schema';
import { Botao, Carregando, Opcoes, Vazio } from '@/shared/ui/componentes';
import { Cabecalho } from '../componentes/Cabecalho';
import { RegistrarSaida } from '../componentes/RegistrarSaida';

type CriancaDaGrade = components['schemas']['CriancaNaGradeDto'];

interface Marcacao {
  criancaId: string;
  ausente: boolean;
  entreguePorNome?: string;
  justificativa?: string;
}

/** Motivos que a secretaria já usa no papel — texto livre só no "Sem aviso". */
const MOTIVOS = [
  { valor: 'Doença', texto: 'Doença' },
  { valor: 'Consulta', texto: 'Consulta' },
  { valor: 'Viagem', texto: 'Viagem' },
  { valor: 'Sem aviso', texto: 'Sem aviso' },
] as const;

/**
 * Chamada. Presença é o único registro que precisa ir direto à rede: quem
 * chegou e quem saiu é informação de segurança, não de rotina — não pode ficar
 * numa fila local esperando conexão.
 *
 * Mesma malha densa da grade, mas com três estados de presença em vez de dois:
 * presente, ausente e ainda não chamado. É o "ainda não chamado" que a tela
 * existe para zerar, e por isso ele é o único que ganha fundo próprio.
 *
 * Um toque marca e acabou. Quem entregou a criança e o motivo da falta ficam
 * atrás de um segundo toque, opcional, porque a meta é a turma inteira em menos
 * de três minutos (docs/plano-produto.md §11): um formulário obrigatório na
 * porta às 7h30 seria preenchido com qualquer coisa na segunda semana, e aí o
 * dado deixaria de valer.
 */
export function Chamada() {
  const { turmaId = '' } = useParams();
  const navegar = useNavigate();
  const clienteQuery = useQueryClient();
  const [emAndamento, setEmAndamento] = useState<string | null>(null);
  const [detalheAberto, setDetalheAberto] = useState<string | null>(null);
  const [saidaAberta, setSaidaAberta] = useState<string | null>(null);

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

  const registrar = useMutation({
    mutationFn: async (marcacao: Marcacao) => {
      const { error } = await api.POST('/v1/presencas/checkin', {
        body: {
          criancaId: marcacao.criancaId,
          turmaId,
          ausente: marcacao.ausente,
          entreguePorNome: marcacao.entreguePorNome,
          justificativa: marcacao.justificativa,
        },
      });
      if (error) throw error;
    },
    onSettled: async () => {
      setEmAndamento(null);
      await clienteQuery.invalidateQueries({ queryKey: ['grade', turmaId] });
    },
  });

  function marcar(marcacao: Marcacao) {
    setEmAndamento(marcacao.criancaId);
    registrar.mutate(marcacao);
  }

  if (isLoading || !data) {
    return (
      <>
        <Cabecalho titulo="Chamada" voltarPara={`/turma/${turmaId}`} />
        <Carregando texto="Abrindo a lista da turma…" />
      </>
    );
  }

  const presentes = data.criancas.filter((c) => c.presente).length;
  const ausentes = data.criancas.filter((c) => c.ausente).length;
  const semChamar = data.criancas.filter((c) => c.semPresenca).length;
  const total = data.criancas.length;
  const chamadas = total - semChamar;

  const emSaida = data.criancas.find((c) => c.id === saidaAberta);
  const emDetalhe = data.criancas.find((c) => c.id === detalheAberto);

  return (
    <div className="flex min-h-full flex-col pb-28">
      <Cabecalho
        titulo={`Chamada · ${data.turma.nome}`}
        subtitulo={`${dataPorExtenso(data.data)} · ${data.turma.turno}`}
        voltarPara={`/turma/${turmaId}`}
      />

      <section className="border-b border-[color:var(--color-borda)] bg-white px-3 py-2.5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm">
            <strong className="numerico font-semibold">
              {chamadas} de {total}
            </strong>{' '}
            chamadas
          </p>
          {semChamar > 0 && (
            <p className="numerico text-xs font-semibold text-[color:var(--color-sol-700)]">
              {semChamar} sem chamar
            </p>
          )}
        </div>

        <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-[color:var(--color-sol-50)]">
          <span
            className="block h-full bg-[color:var(--color-marca-500)]"
            style={{ width: `${total ? (presentes / total) * 100 : 0}%` }}
          />
          <span
            className="block h-full bg-[color:var(--color-tinta-tenue)]"
            style={{ width: `${total ? (ausentes / total) * 100 : 0}%` }}
          />
        </div>

        {/* Três legendas porque são três estados: cor sozinha não distingue
            "ausente" de "ainda não chamado", e a diferença é o dia inteiro. */}
        <div className="mt-2 flex flex-wrap gap-x-3.5 gap-y-1 text-2xs text-[color:var(--color-tinta-suave)]">
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-[color:var(--color-marca-500)]" />
            {presentes} {presentes === 1 ? 'presente' : 'presentes'}
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-[color:var(--color-tinta-tenue)]" />
            {ausentes} {ausentes === 1 ? 'ausente' : 'ausentes'}
          </span>
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="h-2.5 w-2.5 rounded-sm border border-[color:var(--color-borda)] bg-[color:var(--color-sol-50)]"
            />
            {semChamar} {semChamar === 1 ? 'não chamado' : 'não chamados'}
          </span>
        </div>
      </section>

      {total === 0 ? (
        <div className="px-4 py-6">
          <Vazio
            titulo="Turma sem criança"
            descricao="A gestão ainda não matriculou ninguém nesta turma — não há chamada a fazer."
          />
        </div>
      ) : (
        <div className="border-b border-[color:var(--color-borda-forte)] bg-white">
          <div className="flex h-9 items-center justify-between border-b border-[color:var(--color-borda-forte)] bg-[color:var(--color-papel)] px-3 text-2xs uppercase tracking-[0.1em] text-[color:var(--color-tinta-tenue)]">
            <span>Criança e quem entregou</span>
            <span className="tracking-[0.06em]">Presença</span>
          </div>

          <ul>
            {data.criancas.map((crianca) => (
              <LinhaDeChamada
                key={crianca.id}
                crianca={crianca}
                ocupada={emAndamento === crianca.id}
                aoMarcar={(ausente) => marcar({ criancaId: crianca.id, ausente })}
                aoAbrirDetalhe={() => setDetalheAberto(crianca.id)}
                aoRegistrarSaida={() => setSaidaAberta(crianca.id)}
              />
            ))}
          </ul>
        </div>
      )}

      <div
        className="area-segura-base fixed inset-x-0 bottom-0 z-20 flex items-center gap-3 border-t border-[color:var(--color-borda-forte)] bg-[color:var(--color-papel)] px-3 pt-2.5"
        style={{ boxShadow: 'var(--sombra-elevada)' }}
      >
        <p className="flex-1 text-2xs leading-snug text-[color:var(--color-tinta-suave)]">
          Toque no nome para dizer quem entregou ou por que faltou. É opcional:
          a chamada não espera por isso.
        </p>
        <Botao onClick={() => navegar(`/turma/${turmaId}`)}>Abrir a grade</Botao>
      </div>

      {emDetalhe && (
        <FolhaDeDetalhe
          crianca={emDetalhe}
          aoFechar={() => setDetalheAberto(null)}
          aoSalvar={(campos) => {
            marcar({ criancaId: emDetalhe.id, ausente: emDetalhe.ausente, ...campos });
            setDetalheAberto(null);
          }}
        />
      )}

      {emSaida && (
        <RegistrarSaida
          criancaId={emSaida.id}
          criancaNome={emSaida.nomeSocial ?? emSaida.nome}
          turmaId={turmaId}
          aoFechar={() => setSaidaAberta(null)}
        />
      )}
    </div>
  );
}

/**
 * A linha da chamada.
 *
 * 60px em vez dos 44px da grade: aqui cabe uma segunda linha com hora e quem
 * entregou, e o par "Aqui / Faltou" precisa de dois alvos de 44px lado a lado.
 */
function LinhaDeChamada({
  crianca,
  ocupada,
  aoMarcar,
  aoAbrirDetalhe,
  aoRegistrarSaida,
}: {
  crianca: CriancaDaGrade;
  ocupada: boolean;
  aoMarcar: (ausente: boolean) => void;
  aoAbrirDetalhe: () => void;
  aoRegistrarSaida: () => void;
}) {
  const nome = crianca.nomeSocial ?? crianca.nome;
  const naEscola = crianca.presente && !crianca.saidaEm;
  const faltaSemMotivo = crianca.ausente && !crianca.justificativa;

  const trilho = crianca.presente
    ? 'var(--color-marca-300)'
    : faltaSemMotivo
      ? 'var(--color-alerta)'
      : crianca.ausente
        ? 'var(--color-tinta-tenue)'
        : 'var(--color-borda)';

  const fundo = crianca.semPresenca
    ? 'bg-[color:var(--color-sol-50)]'
    : crianca.ausente
      ? 'bg-[color:var(--color-papel)]'
      : 'bg-white';

  const moldura = crianca.presente
    ? 'border-[color:var(--color-marca-500)]'
    : faltaSemMotivo
      ? 'border-[color:var(--color-alerta)]'
      : crianca.ausente
        ? 'border-[color:var(--color-tinta-suave)]'
        : 'border-[color:var(--color-borda-forte)]';

  return (
    <li
      style={{ borderLeft: `3px solid ${trilho}` }}
      className={`flex min-h-[60px] items-center gap-2 border-b border-[color:var(--color-borda)] py-2 pl-2.5 pr-3 ${fundo} ${
        ocupada ? 'opacity-60' : ''
      }`}
    >
      {/* O nome inteiro abre o detalhe: é o segundo toque, e ele só existe
          depois que a criança já foi marcada. */}
      <button
        onClick={aoAbrirDetalhe}
        disabled={crianca.semPresenca}
        className="min-w-0 flex-1 text-left disabled:cursor-default"
      >
        <span
          className={`block truncate text-sm font-semibold ${
            crianca.ausente ? 'text-[color:var(--color-tinta-suave)]' : ''
          }`}
        >
          {nome}
        </span>
        <span className="block truncate text-2xs">
          <SegundaLinha crianca={crianca} />
        </span>
      </button>

      <div className={`flex shrink-0 overflow-hidden rounded-(--raio) border ${moldura}`}>
        <button
          onClick={() => aoMarcar(false)}
          disabled={ocupada}
          aria-pressed={crianca.presente}
          aria-label={`Marcar ${nome} como presente`}
          className={`h-11 w-14 text-sm ${
            crianca.presente
              ? 'bg-[color:var(--color-marca-500)] font-semibold text-white'
              : 'bg-white text-[color:var(--color-tinta)]'
          }`}
        >
          Aqui
        </button>
        <button
          onClick={() => aoMarcar(true)}
          disabled={ocupada}
          aria-pressed={crianca.ausente}
          aria-label={`Marcar ${nome} como ausente`}
          className={`h-11 w-[52px] border-l text-sm ${moldura} ${
            crianca.ausente
              ? faltaSemMotivo
                ? 'bg-[color:var(--color-alerta)] font-semibold text-white'
                : 'bg-[color:var(--color-tinta-suave)] font-semibold text-white'
              : 'bg-white text-[color:var(--color-tinta-suave)]'
          }`}
        >
          Faltou
        </button>
      </div>

      {/* A vaga da saída existe em toda linha, com botão ou sem: sem ela o par
          "Aqui / Faltou" dança de lugar linha a linha e o polegar erra. */}
      {naEscola ? (
        <button
          onClick={aoRegistrarSaida}
          aria-label={`Registrar a saída de ${nome}`}
          className="flex h-11 w-9 shrink-0 items-center justify-center rounded-(--raio) border border-[color:var(--color-borda-forte)] bg-white text-[color:var(--color-tinta-suave)]"
        >
          <LogOut size={16} />
        </button>
      ) : (
        <span aria-hidden className="w-9 shrink-0" />
      )}
    </li>
  );
}

/**
 * A segunda linha: hora e quem entregou, ou o motivo da falta.
 *
 * A alergia entra antes de tudo quando existe — é a mesma regra da grade, e é
 * na porta, com a mãe ainda ali, que a informação vale mais.
 */
function SegundaLinha({ crianca }: { crianca: CriancaDaGrade }) {
  if (crianca.semPresenca) {
    return <span className="text-[color:var(--color-sol-700)]">ainda não chamado</span>;
  }

  if (crianca.ausente) {
    return crianca.justificativa ? (
      <span className="text-[color:var(--color-tinta-suave)]">{crianca.justificativa}</span>
    ) : (
      <span className="font-semibold text-[color:var(--color-alerta)]">
        ! falta sem justificativa
      </span>
    );
  }

  const partes: string[] = [];
  if (crianca.entradaEm) partes.push(hora(crianca.entradaEm));
  if (crianca.entreguePorNome) partes.push(crianca.entreguePorNome);
  if (crianca.saidaEm) partes.push(`saiu ${hora(crianca.saidaEm)}`);

  if (crianca.alergias.length > 0) {
    return (
      <span className="numerico font-semibold text-[color:var(--color-alerta)]">
        ! alergia a {crianca.alergias.join(', ').toLowerCase()}
        {partes.length > 0 && ` · ${partes.join(', ')}`}
      </span>
    );
  }

  return (
    <span className="numerico text-[color:var(--color-tinta-suave)]">
      {partes.length > 0 ? partes.join(' · ') : 'toque para completar'}
    </span>
  );
}

/**
 * O segundo toque: quem entregou, ou por que faltou.
 *
 * Vem como folha e não como campo na linha porque a justificativa entra no
 * parecer e na frequência — merece a tela inteira por dois segundos, e é o
 * lugar de dizer o que a família vai ver.
 */
function FolhaDeDetalhe({
  crianca,
  aoFechar,
  aoSalvar,
}: {
  crianca: CriancaDaGrade;
  aoFechar: () => void;
  aoSalvar: (campos: { entreguePorNome?: string; justificativa?: string }) => void;
}) {
  const nome = crianca.nomeSocial ?? crianca.nome;
  const [entregue, setEntregue] = useState(crianca.entreguePorNome ?? '');
  const [motivo, setMotivo] = useState<string | null>(
    MOTIVOS.some((m) => m.valor === crianca.justificativa)
      ? (crianca.justificativa ?? null)
      : crianca.justificativa
        ? 'Sem aviso'
        : null,
  );
  const [quemAvisou, setQuemAvisou] = useState('');

  return (
    <div className="fixed inset-0 z-30 flex items-end bg-black/40" onClick={aoFechar}>
      <div
        className="area-segura-base flex max-h-[92vh] w-full flex-col gap-3.5 overflow-y-auto rounded-t-(--raio-lg) border-t border-[color:var(--color-borda-forte)] bg-[color:var(--color-papel)] px-3 pt-3"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="flex items-start gap-2.5">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold">
              {crianca.ausente ? `${nome} faltou` : nome}
            </h2>
            <p className="text-xs text-[color:var(--color-tinta-tenue)]">
              {crianca.ausente
                ? 'A justificativa entra no parecer e na frequência.'
                : 'Quem entregou a criança na porta.'}
            </p>
          </div>
          <button
            onClick={aoFechar}
            aria-label="Fechar"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-(--raio) border border-[color:var(--color-borda-forte)] bg-white text-[color:var(--color-tinta-suave)]"
          >
            ✕
          </button>
        </div>

        {crianca.ausente ? (
          <>
            <Opcoes
              rotulo="Motivo"
              opcoes={MOTIVOS}
              valor={motivo}
              aoEscolher={(v) => setMotivo(v)}
            />
            <label className="block space-y-1.5">
              <span className="block text-2xs uppercase tracking-[0.1em] text-[color:var(--color-tinta-tenue)]">
                Quem avisou · opcional
              </span>
              <input
                value={quemAvisou}
                onChange={(e) => setQuemAvisou(e.target.value)}
                placeholder="Mãe, por telefone às 7:10"
                className="w-full rounded-(--raio) border border-[color:var(--color-borda-forte)] bg-white px-3 text-[16px] outline-none focus:border-(color:--cor-acao)"
                style={{ minHeight: 'var(--altura-controle)' }}
              />
            </label>
            <p className="rounded-(--raio) border border-[color:var(--color-borda)] bg-white p-3 text-sm leading-snug text-[color:var(--color-tinta-suave)]">
              A família vê apenas <strong className="text-[color:var(--color-tinta)]">
                “ausente{motivo ? ` · ${motivo.toLowerCase()}` : ''}”
              </strong>{' '}
              no dia. Nenhum recado é enviado — a comunicação parte da escola quando ela quiser.
            </p>
          </>
        ) : (
          <label className="block space-y-1.5">
            <span className="block text-2xs uppercase tracking-[0.1em] text-[color:var(--color-tinta-tenue)]">
              Quem entregou
            </span>
            <input
              autoFocus
              value={entregue}
              onChange={(e) => setEntregue(e.target.value)}
              placeholder="Mãe, pai, avó…"
              className="w-full rounded-(--raio) border border-[color:var(--color-borda-forte)] bg-white px-3 text-[16px] outline-none focus:border-(color:--cor-acao)"
              style={{ minHeight: 'var(--altura-controle)' }}
            />
          </label>
        )}

        <div className="flex gap-2 pb-3">
          <Botao variante="secundario" onClick={aoFechar} className="flex-1">
            Cancelar
          </Botao>
          <Botao
            className="flex-[2]"
            onClick={() =>
              aoSalvar(
                crianca.ausente
                  ? {
                      justificativa: [motivo, quemAvisou.trim()].filter(Boolean).join(' · ') || undefined,
                    }
                  : { entreguePorNome: entregue.trim() || undefined },
              )
            }
          >
            {crianca.ausente ? 'Salvar falta' : 'Salvar'}
          </Botao>
        </div>
      </div>
    </div>
  );
}

function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function dataPorExtenso(iso: string): string {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return new Date(ano ?? 0, (mes ?? 1) - 1, dia ?? 1).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
  });
}
