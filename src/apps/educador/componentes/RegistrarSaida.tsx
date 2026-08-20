import { useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, IdCard, LogOut, MessageSquare, UserRound } from 'lucide-react';
import { api, mensagemDeErro } from '@/shared/api/cliente';
import { Area, Aviso, Botao, Campo, Carregando } from '@/shared/ui/componentes';

/** Marca a escolha "não é ninguém da lista" sem colidir com um id de verdade. */
const OUTRA_PESSOA = 'outra-pessoa';

/**
 * A saída da criança.
 *
 * É a operação mais séria do app: errar aqui significa entregar uma criança a
 * quem não podia buscá-la (docs/plano-produto.md §11). Por isso a tela não tem
 * campo de texto livre no caminho normal — o educador escolhe um nome na lista
 * que a secretaria cadastrou e confere o documento na mão da pessoa contra o
 * que está escrito aqui.
 *
 * A exceção continua existindo, porque a criança não pode ficar retida quando
 * a mãe manda a tia com autorização por escrito. Mas ela se declara como
 * exceção, exige motivo e vai inteira para a trilha de auditoria — em vez de
 * passar como se tivesse sido conferida.
 */
export function RegistrarSaida({
  criancaId,
  criancaNome,
  turmaId,
  aoFechar,
}: {
  criancaId: string;
  criancaNome: string;
  turmaId: string;
  aoFechar: () => void;
}) {
  const clienteQuery = useQueryClient();
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const [nomeExcecao, setNomeExcecao] = useState('');
  const [justificativa, setJustificativa] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const lista = useQuery({
    queryKey: ['quem-pode-retirar', criancaId],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/presencas/quem-pode-retirar/{criancaId}', {
        params: { path: { criancaId } },
      });
      if (error) throw error;
      return data;
    },
  });

  /*
   * O recado de retirada do dia, na tela em que ele importa.
   *
   * "Hoje quem busca é a avó Marta" chega de manhã e é lido às 7h; a saída
   * acontece às 17h, por outra pessoa da equipe. Mostrar o recado aqui é o que
   * transforma o aviso da família em informação no momento da decisão, em vez
   * de um bilhete que alguém precisa lembrar de ter visto.
   */
  const recados = useQuery({
    queryKey: ['recados', criancaId, 'retirada'],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/recados', {
        params: { query: { criancaId, categoria: 'retirada' } },
      });
      if (error) throw error;
      return data;
    },
  });

  const registrar = useMutation({
    mutationFn: async () => {
      const pessoa = (lista.data ?? []).find((p) => p.id === escolhido);

      const { error } = await api.POST('/v1/presencas/checkout', {
        body: {
          criancaId,
          ...(pessoa?.origem === 'vinculo' ? { retiradoPorVinculoId: pessoa.id } : {}),
          ...(pessoa?.origem === 'autorizado' ? { retiradoPorAutorizadoId: pessoa.id } : {}),
          ...(pessoa
            ? {}
            : { retiradoPorNome: nomeExcecao.trim(), justificativa: justificativa.trim() }),
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void clienteQuery.invalidateQueries({ queryKey: ['grade', turmaId] });
      void clienteQuery.invalidateQueries({ queryKey: ['dia', criancaId] });
      aoFechar();
    },
    onError: (e) => setErro(mensagemDeErro(e)),
  });

  const excecao = escolhido === OUTRA_PESSOA;
  const podeEnviar = excecao
    ? nomeExcecao.trim().length >= 2 && justificativa.trim().length >= 5
    : Boolean(escolhido);

  const doDia = (recados.data ?? []).filter((r) => !r.referenteA || r.referenteA === hojeIso());

  return (
    <div className="fixed inset-0 z-30 flex items-end bg-black/40" onClick={aoFechar}>
      <div
        className="area-segura-base max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white px-5 pt-5"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-neutral-300" />

        <h2 className="text-lg font-bold">Saída de {criancaNome}</h2>
        <p className="mb-4 text-sm text-[color:var(--color-tinta-suave)]">
          Confira o documento de quem veio buscar antes de registrar.
        </p>

        {doDia.map((recado) => (
          <div
            key={recado.id}
            className="mb-4 flex gap-2.5 rounded-(--raio) bg-(color:--cor-acao-suave) px-3.5 py-3 text-sm leading-relaxed ring-1 ring-inset ring-(color:--cor-acao-borda)"
          >
            <MessageSquare size={16} className="mt-0.5 shrink-0 text-(color:--cor-acao)" />
            <span>
              <b className="font-semibold">Recado de {recado.autorNome}: </b>
              {recado.corpo}
            </span>
          </div>
        ))}

        {lista.isLoading ? (
          <Carregando texto="Buscando quem pode retirar…" />
        ) : (
          <form
            className="space-y-4 pb-2"
            onSubmit={(evento) => {
              evento.preventDefault();
              setErro(null);
              registrar.mutate();
            }}
          >
            <ul className="space-y-(--gap-lista)">
              {(lista.data ?? []).map((pessoa) => (
                <li key={pessoa.id}>
                  <Opcao
                    marcada={escolhido === pessoa.id}
                    aoMarcar={() => setEscolhido(pessoa.id)}
                    icone={
                      pessoa.origem === 'vinculo' ? <UserRound size={16} /> : <IdCard size={16} />
                    }
                    titulo={pessoa.nome}
                    detalhe={
                      pessoa.documento ? `${pessoa.papel} · ${pessoa.documento}` : pessoa.papel
                    }
                  />
                </li>
              ))}

              <li>
                <Opcao
                  marcada={excecao}
                  aoMarcar={() => setEscolhido(OUTRA_PESSOA)}
                  icone={<AlertTriangle size={16} />}
                  titulo="Outra pessoa"
                  detalhe="Saída excepcional — exige motivo registrado"
                  alerta
                />
              </li>
            </ul>

            {(lista.data ?? []).length === 0 && (
              <Aviso>
                Ninguém está cadastrado para retirar esta criança. Peça à secretaria para incluir
                quem pode buscá-la.
              </Aviso>
            )}

            {excecao && (
              <div className="space-y-4 rounded-(--raio) bg-[color:var(--color-alerta-suave)] p-3.5">
                <Campo
                  rotulo="Quem está levando"
                  placeholder="Nome completo, como está no documento"
                  value={nomeExcecao}
                  onChange={(e) => setNomeExcecao(e.target.value)}
                  required
                />
                <Area
                  rotulo="Por que a saída foi liberada"
                  apoio="Fica registrado com o seu nome. Ex.: autorização por escrito da mãe, conferida pela coordenação."
                  value={justificativa}
                  onChange={(e) => setJustificativa(e.target.value)}
                  required
                />
              </div>
            )}

            {erro && <Aviso>{erro}</Aviso>}

            <Botao type="submit" bloco disabled={!podeEnviar || registrar.isPending}>
              {registrar.isPending ? (
                'Registrando…'
              ) : (
                <>
                  <LogOut size={16} /> Confirmar saída
                </>
              )}
            </Botao>
          </form>
        )}
      </div>
    </div>
  );
}

function Opcao({
  marcada,
  aoMarcar,
  icone,
  titulo,
  detalhe,
  alerta = false,
}: {
  marcada: boolean;
  aoMarcar: () => void;
  icone: ReactNode;
  titulo: string;
  detalhe: string;
  alerta?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={aoMarcar}
      aria-pressed={marcada}
      className={`flex w-full items-center gap-3 rounded-(--raio-lg) border p-3 text-left transition ${
        marcada
          ? alerta
            ? 'border-[color:var(--color-alerta)] bg-[color:var(--color-alerta-suave)]'
            : 'border-(color:--cor-acao) bg-(color:--cor-acao-suave)'
          : 'border-[color:var(--color-borda)] bg-white'
      }`}
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
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{titulo}</span>
        <span className="block truncate text-xs text-[color:var(--color-tinta-suave)]">
          {detalhe}
        </span>
      </span>
      <span
        className={`h-5 w-5 shrink-0 rounded-full border-2 ${
          marcada ? 'border-(color:--cor-acao) bg-(color:--cor-acao)' : 'border-neutral-300'
        }`}
      />
    </button>
  );
}

function hojeIso(): string {
  return new Date().toLocaleDateString('en-CA');
}
