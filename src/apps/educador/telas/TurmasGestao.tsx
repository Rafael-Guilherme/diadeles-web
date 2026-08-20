import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarRange, Pencil, Plus, Trash2, UserPlus, X } from 'lucide-react';
import { useState } from 'react';
import { api, mensagemDeErro } from '@/shared/api/cliente';
import {
  Aviso,
  Botao,
  Campo,
  Cartao,
  Carregando,
  Etiqueta,
  RotuloSecao,
  Selecao,
  Vazio,
} from '@/shared/ui/componentes';
import { Cabecalho } from '../componentes/Cabecalho';

const GRUPOS = {
  BEBES: 'Bebês (0 a 1a6m)',
  CRIANCAS_BEM_PEQUENAS: 'Bem pequenas (1a7m a 3a11m)',
  CRIANCAS_PEQUENAS: 'Pequenas (4a a 5a11m)',
} as const;

const TURNOS = { manha: 'Manhã', tarde: 'Tarde', integral: 'Integral' } as const;

type GrupoEtario = keyof typeof GRUPOS;
type Turno = keyof typeof TURNOS;

interface Formulario {
  nome: string;
  grupoEtario: GrupoEtario;
  turno: Turno;
  capacidade: string;
}

const VAZIO: Formulario = {
  nome: '',
  grupoEtario: 'CRIANCAS_BEM_PEQUENAS',
  turno: 'integral',
  capacidade: '',
};

/**
 * Turmas na mão da secretaria.
 *
 * Até aqui a escola só conseguia operar com as turmas que vieram do seed. Esta
 * tela é o que separa uma demonstração de um produto que uma creche instala em
 * fevereiro e usa o ano inteiro.
 */
export function TurmasGestao() {
  const cliente = useQueryClient();
  const [formulario, setFormulario] = useState<Formulario | null>(null);
  const [editando, setEditando] = useState<string | null>(null);

  const turmas = useQuery({
    queryKey: ['turmas'],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/turmas');
      if (error) throw error;
      return data;
    },
  });

  const anos = useQuery({
    queryKey: ['anos-letivos'],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/anos-letivos');
      if (error) throw error;
      return data;
    },
  });

  const equipe = useQuery({
    queryKey: ['equipe'],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/equipe');
      if (error) throw error;
      return data;
    },
  });

  const recarregar = () => cliente.invalidateQueries({ queryKey: ['turmas'] });

  const salvar = useMutation({
    mutationFn: async (dados: Formulario & { id?: string }) => {
      const corpo = {
        nome: dados.nome.trim(),
        grupoEtario: dados.grupoEtario,
        turno: dados.turno,
        ...(dados.capacidade ? { capacidade: Number(dados.capacidade) } : {}),
      };

      if (dados.id) {
        const { error } = await api.PATCH('/v1/turmas/{id}', {
          params: { path: { id: dados.id } },
          body: corpo,
        });
        if (error) throw error;
        return;
      }

      const { error } = await api.POST('/v1/turmas', { body: corpo });
      if (error) throw error;
    },
    onSuccess: async () => {
      setFormulario(null);
      setEditando(null);
      await recarregar();
    },
  });

  const excluir = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.DELETE('/v1/turmas/{id}', { params: { path: { id } } });
      if (error) throw error;
    },
    onSuccess: recarregar,
  });

  const vincular = useMutation({
    mutationFn: async ({ turmaId, usuarioId }: { turmaId: string; usuarioId: string }) => {
      const { error } = await api.POST('/v1/turmas/{id}/educadores', {
        params: { path: { id: turmaId } },
        body: { usuarioId },
      });
      if (error) throw error;
    },
    onSuccess: recarregar,
  });

  const desvincular = useMutation({
    mutationFn: async ({ turmaId, usuarioId }: { turmaId: string; usuarioId: string }) => {
      const { error } = await api.DELETE('/v1/turmas/{id}/educadores/{usuarioId}', {
        params: { path: { id: turmaId, usuarioId } },
      });
      if (error) throw error;
    },
    onSuccess: recarregar,
  });

  if (turmas.isLoading || !turmas.data) {
    return (
      <>
        <Cabecalho titulo="Turmas" voltarPara="/gestao" />
        <Carregando texto="Buscando as turmas…" />
      </>
    );
  }

  const anoCorrente = anos.data?.find((a) => a.corrente);
  const erro = salvar.error ?? excluir.error ?? vincular.error ?? desvincular.error;

  return (
    <div className="min-h-full pb-10">
      <Cabecalho
        titulo="Turmas"
        subtitulo={`${turmas.data.length} ${turmas.data.length === 1 ? 'turma' : 'turmas'}`}
        voltarPara="/gestao"
      />

      <main className="space-y-4 px-4 py-4">
        {!anoCorrente && (
          <Aviso>
            Nenhum ano letivo aberto. Abra o ano em <strong>Ano letivo</strong> antes de criar
            turmas — sem ele a turma não tem onde existir.
          </Aviso>
        )}

        {erro && <Aviso>{mensagemDeErro(erro)}</Aviso>}

        {formulario ? (
          <Cartao interno className="space-y-3">
            <RotuloSecao>{editando ? 'Editar turma' : 'Nova turma'}</RotuloSecao>

            <Campo
              rotulo="Nome"
              value={formulario.nome}
              placeholder="Berçário II"
              onChange={(e) => setFormulario({ ...formulario, nome: e.target.value })}
            />

            <Selecao
              rotulo="Faixa etária"
              value={formulario.grupoEtario}
              onChange={(e) =>
                setFormulario({ ...formulario, grupoEtario: e.target.value as GrupoEtario })
              }
              apoio="Define quais registros a grade cobra no fechamento do turno."
            >
              {Object.entries(GRUPOS).map(([valor, texto]) => (
                <option key={valor} value={valor}>
                  {texto}
                </option>
              ))}
            </Selecao>

            <Selecao
              rotulo="Turno"
              value={formulario.turno}
              onChange={(e) => setFormulario({ ...formulario, turno: e.target.value as Turno })}
            >
              {Object.entries(TURNOS).map(([valor, texto]) => (
                <option key={valor} value={valor}>
                  {texto}
                </option>
              ))}
            </Selecao>

            <Campo
              rotulo="Capacidade"
              type="number"
              inputMode="numeric"
              min={1}
              value={formulario.capacidade}
              placeholder="15"
              apoio="Opcional. Só orienta a secretaria na hora de matricular."
              onChange={(e) => setFormulario({ ...formulario, capacidade: e.target.value })}
            />

            <div className="flex gap-2">
              <Botao
                bloco
                disabled={salvar.isPending || formulario.nome.trim().length < 2}
                onClick={() => salvar.mutate({ ...formulario, id: editando ?? undefined })}
              >
                {salvar.isPending ? 'Salvando…' : 'Salvar'}
              </Botao>
              <Botao
                variante="secundario"
                onClick={() => {
                  setFormulario(null);
                  setEditando(null);
                }}
              >
                Cancelar
              </Botao>
            </div>
          </Cartao>
        ) : (
          <Botao bloco disabled={!anoCorrente} onClick={() => setFormulario(VAZIO)}>
            <Plus size={16} /> Nova turma
          </Botao>
        )}

        {turmas.data.length === 0 && !formulario && (
          <Vazio
            icone={<CalendarRange size={22} />}
            titulo="Nenhuma turma ainda"
            descricao="Crie a primeira turma para que a equipe possa fazer chamada e registrar a rotina."
          />
        )}

        <div className="space-y-(--gap-lista)">
          {turmas.data.map((turma) => (
            <Cartao key={turma.id} interno className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{turma.nome}</p>
                  <p className="text-xs text-[color:var(--color-tinta-suave)]">
                    {GRUPOS[turma.grupoEtario as GrupoEtario] ?? turma.grupoEtario} ·{' '}
                    {TURNOS[turma.turno as Turno] ?? turma.turno} · {turma.ano}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <BotaoIcone
                    rotulo={`Editar ${turma.nome}`}
                    onClick={() => {
                      setEditando(turma.id);
                      setFormulario({
                        nome: turma.nome,
                        grupoEtario: turma.grupoEtario as GrupoEtario,
                        turno: turma.turno as Turno,
                        capacidade: turma.capacidade ? String(turma.capacidade) : '',
                      });
                    }}
                  >
                    <Pencil size={15} />
                  </BotaoIcone>
                  <BotaoIcone
                    rotulo={`Excluir ${turma.nome}`}
                    perigo
                    disabled={excluir.isPending}
                    onClick={() => excluir.mutate(turma.id)}
                  >
                    <Trash2 size={15} />
                  </BotaoIcone>
                </div>
              </div>

              <p className="numerico text-xs text-[color:var(--color-tinta-suave)]">
                {turma.criancasAtivas}{' '}
                {turma.criancasAtivas === 1 ? 'criança matriculada' : 'crianças matriculadas'}
                {turma.capacidade ? ` de ${turma.capacidade}` : ''}
              </p>

              <div className="flex flex-wrap gap-1">
                {turma.educadores.length === 0 && (
                  <p className="text-xs text-[color:var(--color-alerta)]">
                    Sem educador — ninguém vê esta turma no app.
                  </p>
                )}
                {turma.educadores.map((e) => (
                  <span
                    key={e.usuarioId}
                    className="inline-flex items-center gap-1 rounded-full bg-[color:var(--color-papel)] py-0.5 pr-1 pl-2 text-xs"
                  >
                    {e.nome}
                    {e.principal && <Etiqueta tom="marca">regente</Etiqueta>}
                    <button
                      aria-label={`Tirar ${e.nome} de ${turma.nome}`}
                      className="rounded-full p-0.5 text-[color:var(--color-tinta-tenue)] transition active:bg-neutral-200"
                      onClick={() =>
                        desvincular.mutate({ turmaId: turma.id, usuarioId: e.usuarioId })
                      }
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>

              <SeletorDeEducador
                turmaId={turma.id}
                jaNaTurma={turma.educadores.map((e) => e.usuarioId)}
                equipe={equipe.data ?? []}
                onEscolher={(usuarioId) => vincular.mutate({ turmaId: turma.id, usuarioId })}
              />
            </Cartao>
          ))}
        </div>
      </main>
    </div>
  );
}

/**
 * Só oferece quem ainda não está na turma. Repetir a lista inteira faria a
 * secretaria clicar num nome que já está ali e não entender por que nada mudou.
 */
function SeletorDeEducador({
  turmaId,
  jaNaTurma,
  equipe,
  onEscolher,
}: {
  turmaId: string;
  jaNaTurma: string[];
  equipe: { id: string; nome: string; ativo: boolean }[];
  onEscolher: (usuarioId: string) => void;
}) {
  const disponiveis = equipe.filter((m) => m.ativo && !jaNaTurma.includes(m.id));

  if (disponiveis.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <UserPlus size={14} className="shrink-0 text-[color:var(--color-tinta-tenue)]" />
      <select
        aria-label="Adicionar educador à turma"
        value=""
        className="min-h-9 flex-1 rounded-(--raio) border border-[color:var(--color-borda-forte)] bg-white px-2 text-xs"
        onChange={(e) => {
          if (e.target.value) onEscolher(e.target.value);
        }}
      >
        <option value="">Adicionar alguém da equipe…</option>
        {disponiveis.map((m) => (
          <option key={`${turmaId}-${m.id}`} value={m.id}>
            {m.nome}
          </option>
        ))}
      </select>
    </div>
  );
}

function BotaoIcone({
  rotulo,
  perigo = false,
  disabled = false,
  onClick,
  children,
}: {
  rotulo: string;
  perigo?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={rotulo}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-(--raio) border border-[color:var(--color-borda-forte)] transition active:bg-neutral-100 disabled:opacity-40 ${
        perigo ? 'text-[color:var(--color-alerta)]' : 'text-[color:var(--color-tinta-suave)]'
      }`}
    >
      {children}
    </button>
  );
}
