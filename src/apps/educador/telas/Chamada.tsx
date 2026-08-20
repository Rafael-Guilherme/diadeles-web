import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { AlertTriangle, Check, LogOut, X } from 'lucide-react';
import { api } from '@/shared/api/cliente';
import { Carregando, Etiqueta } from '@/shared/ui/componentes';
import { Cabecalho } from '../componentes/Cabecalho';
import { RegistrarSaida } from '../componentes/RegistrarSaida';

interface Marcacao {
  criancaId: string;
  ausente: boolean;
  entreguePorNome?: string;
  justificativa?: string;
}

/**
 * Chamada. Presença é o único registro que precisa ir direto à rede: quem
 * chegou e quem saiu é informação de segurança, não de rotina — não pode ficar
 * numa fila local esperando conexão.
 *
 * Um toque marca presente ou ausente e acabou. Quem entregou a criança e o
 * motivo da falta ficam atrás de um segundo toque, opcional, porque a meta é
 * a turma inteira em menos de três minutos (docs/plano-produto.md §11): um
 * formulário obrigatório na porta às 7h30 seria preenchido com qualquer coisa
 * na segunda semana, e aí o dado deixaria de valer.
 */
export function Chamada() {
  const { turmaId = '' } = useParams();
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
    setDetalheAberto(null);
    registrar.mutate(marcacao);
  }

  if (isLoading || !data) {
    return (
      <>
        <Cabecalho titulo="Chamada" voltarPara={`/turma/${turmaId}`} />
        <Carregando />
      </>
    );
  }

  const semChamada = data.criancas.filter((c) => c.semPresenca).length;
  const emSaida = data.criancas.find((c) => c.id === saidaAberta);

  return (
    <div className="min-h-full pb-8">
      <Cabecalho
        titulo="Chamada"
        subtitulo={
          semChamada > 0
            ? `${semChamada} ${semChamada === 1 ? 'criança falta' : 'crianças faltam'} marcar`
            : 'Todas as crianças já foram marcadas'
        }
        voltarPara={`/turma/${turmaId}`}
      />

      <ul className="space-y-(--gap-lista) px-4 py-4">
        {data.criancas.map((crianca) => {
          const carregando = emAndamento === crianca.id;
          const nome = crianca.nomeSocial ?? crianca.nome;
          const naEscola = crianca.presente && !crianca.saidaEm;

          return (
            <li
              key={crianca.id}
              className="rounded-(--raio-lg) border border-[color:var(--color-borda)] bg-white p-3"
            >
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{nome}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-[color:var(--color-tinta-suave)]">
                      {crianca.idade}
                    </span>
                    {crianca.entradaEm && <Etiqueta tom="ok">entrou {hora(crianca.entradaEm)}</Etiqueta>}
                    {crianca.saidaEm && <Etiqueta>saiu {hora(crianca.saidaEm)}</Etiqueta>}
                    {crianca.ausente && <Etiqueta>faltou</Etiqueta>}
                  </div>
                  {crianca.alergias.length > 0 && (
                    <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-[color:var(--color-alerta)]">
                      <AlertTriangle size={12} /> {crianca.alergias.join(', ')}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => marcar({ criancaId: crianca.id, ausente: false })}
                    disabled={carregando}
                    aria-label={`Marcar ${crianca.nome} como presente`}
                    className={`flex h-11 w-11 items-center justify-center rounded-(--raio) border-2 transition ${
                      crianca.presente
                        ? 'border-[color:var(--color-ok)] bg-[color:var(--color-ok)] text-white'
                        : 'border-[color:var(--color-borda)] text-neutral-400'
                    }`}
                  >
                    <Check size={20} />
                  </button>
                  <button
                    onClick={() => marcar({ criancaId: crianca.id, ausente: true })}
                    disabled={carregando}
                    aria-label={`Marcar ${crianca.nome} como ausente`}
                    className={`flex h-11 w-11 items-center justify-center rounded-(--raio) border-2 transition ${
                      crianca.ausente
                        ? 'border-[color:var(--color-alerta)] bg-[color:var(--color-alerta)] text-white'
                        : 'border-[color:var(--color-borda)] text-neutral-400'
                    }`}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* A segunda linha só existe depois que a criança foi marcada: até
                  lá o cartão é só o gesto de um toque. */}
              {crianca.presente && (
                <Complemento
                  rotulo="Quem entregou"
                  valor={crianca.entreguePorNome}
                  vazio="Registrar quem entregou"
                  aberto={detalheAberto === crianca.id}
                  aoAbrir={() => setDetalheAberto(crianca.id)}
                  aoFechar={() => setDetalheAberto(null)}
                  aoSalvar={(texto) =>
                    marcar({ criancaId: crianca.id, ausente: false, entreguePorNome: texto })
                  }
                  placeholder="Mãe, pai, avó…"
                />
              )}

              {crianca.ausente && (
                <Complemento
                  rotulo="Motivo"
                  valor={crianca.justificativa}
                  vazio="Registrar o motivo da falta"
                  aberto={detalheAberto === crianca.id}
                  aoAbrir={() => setDetalheAberto(crianca.id)}
                  aoFechar={() => setDetalheAberto(null)}
                  aoSalvar={(texto) =>
                    marcar({ criancaId: crianca.id, ausente: true, justificativa: texto })
                  }
                  placeholder="Consulta médica, viagem…"
                />
              )}

              {naEscola && (
                <button
                  onClick={() => setSaidaAberta(crianca.id)}
                  className="mt-2.5 flex min-h-11 w-full items-center justify-center gap-2 rounded-(--raio) border border-[color:var(--color-borda-forte)] text-sm font-semibold transition active:bg-neutral-50"
                >
                  <LogOut size={16} /> Registrar saída
                </button>
              )}

              {crianca.saidaEm && crianca.retiradoPorNome && (
                <p className="mt-2 text-xs text-[color:var(--color-tinta-suave)]">
                  Retirada por <b className="font-semibold">{crianca.retiradoPorNome}</b>
                </p>
              )}
            </li>
          );
        })}
      </ul>

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
 * Campo opcional que fica recolhido até alguém precisar dele.
 *
 * Recolhido, é uma linha de texto; aberto, um campo com um botão. Nenhum dos
 * dois entra no caminho de marcar a turma — o toque que abre é sempre o
 * segundo, nunca o primeiro.
 */
function Complemento({
  rotulo,
  valor,
  vazio,
  aberto,
  aoAbrir,
  aoFechar,
  aoSalvar,
  placeholder,
}: {
  rotulo: string;
  valor?: string | null;
  vazio: string;
  aberto: boolean;
  aoAbrir: () => void;
  aoFechar: () => void;
  aoSalvar: (texto: string) => void;
  placeholder: string;
}) {
  const [texto, setTexto] = useState(valor ?? '');

  if (!aberto) {
    return (
      <button
        onClick={aoAbrir}
        className="mt-2 block max-w-full truncate text-left text-xs text-[color:var(--color-tinta-suave)] underline decoration-dotted underline-offset-2"
      >
        {valor ? `${rotulo}: ${valor}` : vazio}
      </button>
    );
  }

  return (
    <form
      className="mt-2.5 flex gap-2"
      onSubmit={(evento) => {
        evento.preventDefault();
        const limpo = texto.trim();
        if (limpo) aoSalvar(limpo);
        else aoFechar();
      }}
    >
      <input
        autoFocus
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={placeholder}
        aria-label={rotulo}
        className="min-h-11 w-full rounded-(--raio) border border-[color:var(--color-borda-forte)] px-3 text-[16px] outline-none focus:border-(color:--cor-acao) focus:ring-2 focus:ring-(color:--cor-acao-suave)"
      />
      <button
        type="submit"
        className="min-h-11 shrink-0 rounded-(--raio) bg-(color:--cor-acao) px-4 text-sm font-semibold text-white"
      >
        Salvar
      </button>
    </form>
  );
}

function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
