import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Archive, ArchiveRestore, Check, UserRound } from 'lucide-react';
import { api, mensagemDeErro } from '@/shared/api/cliente';
import {
  Area,
  Aviso,
  Botao,
  Campo,
  Cartao,
  Carregando,
  Etiqueta,
  ListaDeItens,
  RotuloSecao,
  Selecao,
} from '@/shared/ui/componentes';
import { Cabecalho } from '../componentes/Cabecalho';

type Ficha = NonNullable<
  Awaited<ReturnType<typeof buscarFicha>>
>;

type Turma = { id: string; nome: string };

interface Formulario {
  nome: string;
  nomeSocial: string;
  dataNascimento: string;
  alergias: string[];
  restricoesAlimentares: string[];
  condicoesSaude: string[];
  observacoesSaude: string;
  turmaId: string;
}

const VAZIO: Formulario = {
  nome: '',
  nomeSocial: '',
  dataNascimento: '',
  alergias: [],
  restricoesAlimentares: [],
  condicoesSaude: [],
  observacoesSaude: '',
  turmaId: '',
};

const VINCULOS: Record<string, string> = {
  MAE: 'Mãe',
  PAI: 'Pai',
  AVO: 'Avó ou avô',
  TIO: 'Tio ou tia',
  PADRASTO_MADRASTA: 'Padrasto ou madrasta',
  RESPONSAVEL_LEGAL: 'Responsável legal',
  OUTRO: 'Responsável',
};

async function buscarFicha(criancaId: string) {
  const { data, error } = await api.GET('/v1/criancas/{id}', {
    params: { path: { id: criancaId } },
  });
  if (error) throw error;
  return data;
}

/**
 * Cadastro da criança. A mesma tela cria e edita — `/gestao/criancas/nova`
 * abre em branco.
 *
 * A turma é escolhida aqui, junto com o cadastro, e não numa etapa separada:
 * criança sem matrícula não aparece na grade de nenhum educador, e é o tipo de
 * pendência que ninguém percebe até a família reclamar que o app está vazio.
 */
export function CriancaCadastro() {
  const { criancaId = '' } = useParams();
  const nova = criancaId === 'nova';

  const turmas = useQuery({
    queryKey: ['turmas'],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/turmas');
      if (error) throw error;
      return data;
    },
  });

  const ficha = useQuery({
    enabled: !nova,
    queryKey: ['crianca', criancaId],
    queryFn: () => buscarFicha(criancaId),
  });

  if (!nova && !ficha.data) {
    return (
      <>
        <Cabecalho titulo="Criança" voltarPara="/gestao/criancas" />
        {ficha.isLoading ? <Carregando /> : <Aviso>Não consegui carregar esta criança.</Aviso>}
      </>
    );
  }

  // O formulário só monta com os dados na mão, e remonta se a criança mudar.
  // É o que substitui sincronizar servidor→formulário dentro de um efeito:
  // aqui não existe o instante em que o campo está vazio e o dado, carregado.
  return (
    <Edicao
      key={ficha.data?.id ?? 'nova'}
      criancaId={criancaId}
      ficha={ficha.data ?? null}
      turmas={turmas.data ?? []}
    />
  );
}

function Edicao({
  criancaId,
  ficha,
  turmas,
}: {
  criancaId: string;
  ficha: Ficha | null;
  turmas: Turma[];
}) {
  const nova = ficha === null;
  const navegar = useNavigate();
  const clienteQuery = useQueryClient();

  const [form, setForm] = useState<Formulario>(() =>
    ficha
      ? {
          nome: ficha.nome,
          nomeSocial: ficha.nomeSocial ?? '',
          dataNascimento: ficha.dataNascimento,
          alergias: ficha.alergias,
          restricoesAlimentares: ficha.restricoesAlimentares,
          condicoesSaude: ficha.condicoesSaude,
          observacoesSaude: ficha.observacoesSaude ?? '',
          turmaId: ficha.matricula?.turmaId ?? '',
        }
      : VAZIO,
  );
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  function invalidar() {
    void clienteQuery.invalidateQueries({ queryKey: ['criancas'] });
    void clienteQuery.invalidateQueries({ queryKey: ['crianca', criancaId] });
    void clienteQuery.invalidateQueries({ queryKey: ['turmas'] });
  }

  const salvar = useMutation({
    mutationFn: async () => {
      const corpo = {
        nome: form.nome.trim(),
        nomeSocial: form.nomeSocial.trim() || undefined,
        dataNascimento: form.dataNascimento,
        alergias: form.alergias,
        restricoesAlimentares: form.restricoesAlimentares,
        condicoesSaude: form.condicoesSaude,
        observacoesSaude: form.observacoesSaude.trim() || undefined,
      };

      if (nova) {
        const { data, error } = await api.POST('/v1/criancas', {
          body: { ...corpo, turmaId: form.turmaId || undefined },
        });
        if (error) throw error;
        return data.id;
      }

      const { error } = await api.PATCH('/v1/criancas/{id}', {
        params: { path: { id: criancaId } },
        body: corpo,
      });
      if (error) throw error;

      // Turma trocada no formulário é transferência de matrícula, uma operação
      // à parte no servidor.
      if (form.turmaId && form.turmaId !== ficha?.matricula?.turmaId) {
        const { error: erroMatricula } = await api.POST('/v1/matriculas', {
          body: { criancaId, turmaId: form.turmaId },
        });
        if (erroMatricula) throw erroMatricula;
      }

      return criancaId;
    },
    onSuccess: (id) => {
      setErro(null);
      invalidar();
      if (nova) {
        navegar(`/gestao/criancas/${id}`, { replace: true });
        return;
      }
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2500);
    },
    onError: (e) => setErro(mensagemDeErro(e)),
  });

  const arquivar = useMutation({
    mutationFn: async (arquivando: boolean) => {
      const rota = arquivando ? '/v1/criancas/{id}/arquivar' : '/v1/criancas/{id}/desarquivar';
      const { error } = await api.POST(rota, { params: { path: { id: criancaId } } });
      if (error) throw error;
    },
    onSuccess: invalidar,
    onError: (e) => setErro(mensagemDeErro(e)),
  });

  const podeSalvar = form.nome.trim().length >= 2 && /^\d{4}-\d{2}-\d{2}$/.test(form.dataNascimento);

  return (
    <div className="min-h-full pb-10">
      <Cabecalho
        titulo={nova ? 'Nova criança' : (ficha.nomeSocial ?? ficha.nome)}
        subtitulo={nova ? undefined : ficha.idade}
        voltarPara="/gestao/criancas"
      />

      <main className="space-y-5 px-4 py-4">
        {ficha?.arquivada && (
          <Aviso>
            Esta criança está arquivada. Ela não aparece nas grades nem nas listagens do dia.
          </Aviso>
        )}

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            salvar.mutate();
          }}
        >
          <section className="space-y-4">
            <RotuloSecao>Dados</RotuloSecao>

            <Campo
              rotulo="Nome completo"
              value={form.nome}
              required
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />

            <Campo
              rotulo="Como é chamada"
              apoio="Preencha só se for diferente do nome de registro — é o que aparece para o educador."
              value={form.nomeSocial}
              onChange={(e) => setForm({ ...form, nomeSocial: e.target.value })}
            />

            <Campo
              rotulo="Data de nascimento"
              type="date"
              value={form.dataNascimento}
              required
              onChange={(e) => setForm({ ...form, dataNascimento: e.target.value })}
            />

            <Selecao
              rotulo="Turma"
              apoio={
                ficha?.matricula && form.turmaId !== ficha.matricula.turmaId
                  ? `Ao salvar, a matrícula em ${ficha.matricula.turmaNome} é encerrada e uma nova é aberta.`
                  : 'Sem turma, a criança não aparece na grade de nenhum educador.'
              }
              value={form.turmaId}
              onChange={(e) => setForm({ ...form, turmaId: e.target.value })}
            >
              <option value="">Sem turma</option>
              {turmas.map((turma) => (
                <option key={turma.id} value={turma.id}>
                  {turma.nome}
                </option>
              ))}
            </Selecao>
          </section>

          <section className="space-y-4">
            <RotuloSecao>Saúde</RotuloSecao>

            <ListaDeItens
              rotulo="Alergias"
              apoio="Aparece em destaque na grade e na ficha, antes de qualquer refeição."
              placeholder="Amendoim"
              itens={form.alergias}
              onMudar={(alergias) => setForm({ ...form, alergias })}
            />

            <ListaDeItens
              rotulo="Restrições alimentares"
              placeholder="Sem lactose"
              itens={form.restricoesAlimentares}
              onMudar={(restricoesAlimentares) => setForm({ ...form, restricoesAlimentares })}
            />

            <ListaDeItens
              rotulo="Condições de saúde"
              placeholder="Asma"
              itens={form.condicoesSaude}
              onMudar={(condicoesSaude) => setForm({ ...form, condicoesSaude })}
            />

            <Area
              rotulo="Observações"
              apoio="O que a equipe precisa saber e não cabe nas listas acima."
              value={form.observacoesSaude}
              onChange={(e) => setForm({ ...form, observacoesSaude: e.target.value })}
            />
          </section>

          {erro && <Aviso>{erro}</Aviso>}

          {salvo && (
            <Aviso tom="ok">
              <Check size={14} className="mr-1 inline" /> Cadastro salvo.
            </Aviso>
          )}

          <Botao type="submit" bloco disabled={!podeSalvar || salvar.isPending}>
            {salvar.isPending ? 'Salvando…' : nova ? 'Cadastrar criança' : 'Salvar alterações'}
          </Botao>
        </form>

        {ficha && (
          <>
            <section className="space-y-2">
              <RotuloSecao>Responsáveis</RotuloSecao>

              {ficha.responsaveis.length === 0 ? (
                <Cartao interno className="space-y-2">
                  <p className="text-sm text-[color:var(--color-tinta-suave)]">
                    Nenhum responsável vinculado. Sem isso a família não vê nada do que é
                    registrado.
                  </p>
                  <Botao variante="secundario" bloco onClick={() => navegar('/gestao/acesso')}>
                    Emitir convite de acesso
                  </Botao>
                </Cartao>
              ) : (
                <ul className="space-y-(--gap-lista)">
                  {ficha.responsaveis.map((r) => (
                    <li key={r.id}>
                      <Cartao interno className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(color:--cor-acao-suave) text-(color:--cor-acao)">
                          <UserRound size={16} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{r.nome}</p>
                          <p className="truncate text-xs text-[color:var(--color-tinta-suave)]">
                            {VINCULOS[r.tipo] ?? r.tipo}
                            {r.celular ? ` · ${r.celular}` : ''}
                          </p>
                        </div>
                        {r.bloqueado ? (
                          <Etiqueta
                            tom="alerta"
                            titulo="Bloqueado por decisão judicial ou medida protetiva"
                          >
                            bloqueado
                          </Etiqueta>
                        ) : r.ativou ? (
                          <Etiqueta tom="ok">no app</Etiqueta>
                        ) : (
                          <Etiqueta>sem acesso</Etiqueta>
                        )}
                      </Cartao>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="space-y-2">
              <RotuloSecao>Encerramento</RotuloSecao>
              <Cartao interno className="space-y-3">
                <p className="text-sm leading-relaxed text-[color:var(--color-tinta-suave)]">
                  Arquivar tira a criança das grades e das listagens, mas mantém tudo o que já foi
                  registrado — a lei exige guardar o registro pedagógico por cinco anos.
                </p>
                <Botao
                  variante="secundario"
                  bloco
                  disabled={arquivar.isPending}
                  onClick={() => arquivar.mutate(!ficha.arquivada)}
                >
                  {ficha.arquivada ? (
                    <>
                      <ArchiveRestore size={16} /> Trazer de volta
                    </>
                  ) : (
                    <>
                      <Archive size={16} /> Arquivar criança
                    </>
                  )}
                </Botao>
              </Cartao>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
