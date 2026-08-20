import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, FileText, Sparkles } from 'lucide-react';
import { api, mensagemDeErro } from '@/shared/api/cliente';
import { Aviso, Botao, Cartao, Carregando, Etiqueta, RotuloSecao } from '@/shared/ui/componentes';
import { Cabecalho } from '../componentes/Cabecalho';

const ROTULO_STATUS: Record<string, string> = {
  RASCUNHO: 'rascunho',
  EM_REVISAO: 'em revisão',
  PUBLICADO: 'publicado',
};

/** "2026-1" e "2026-2", do semestre corrente para trás. */
function periodosRecentes(): string[] {
  const hoje = new Date();
  const ano = hoje.getUTCFullYear();
  const semestre = hoje.getUTCMonth() < 6 ? 1 : 2;

  const lista = [`${ano}-${semestre}`];
  if (semestre === 2) lista.push(`${ano}-1`);
  else lista.push(`${ano - 1}-2`);
  return lista;
}

function nomeDoPeriodo(periodo: string): string {
  const [ano, semestre] = periodo.split('-');
  return `${semestre}º sem. ${ano}`;
}

/**
 * Os pareceres descritivos da turma, por semestre.
 *
 * A obrigação é por criança, e o jeito de não esquecer ninguém é listar a
 * turma inteira — inclusive quem ainda não tem nada. Em dezembro, uma
 * educadora com vinte crianças precisa ver de longe quantas faltam.
 */
export function Pareceres() {
  const { turmaId = '' } = useParams();
  const navegar = useNavigate();
  const clienteQuery = useQueryClient();
  const [periodo, setPeriodo] = useState(() => periodosRecentes()[0]!);
  const [erro, setErro] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['pareceres', turmaId, periodo],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/relatorios/turma/{turmaId}', {
        params: { path: { turmaId }, query: { periodo } },
      });
      if (error) throw error;
      return data;
    },
  });

  const gerar = useMutation({
    mutationFn: async (criancaId: string) => {
      const { data, error } = await api.POST('/v1/relatorios/gerar', {
        body: { criancaId, periodo },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (relatorio) => {
      void clienteQuery.invalidateQueries({ queryKey: ['pareceres'] });
      navegar(`/turma/${turmaId}/parecer/${relatorio.id}`);
    },
    onError: (e) => setErro(mensagemDeErro(e)),
  });

  if (isLoading || !data) {
    return (
      <>
        <Cabecalho titulo="Pareceres" voltarPara={`/turma/${turmaId}`} />
        <Carregando texto="Levantando o semestre…" />
      </>
    );
  }

  const publicados = data.filter((p) => p.status === 'PUBLICADO').length;
  const semParecer = data.filter((p) => !p.relatorioId).length;

  return (
    <div className="min-h-full pb-10">
      <Cabecalho
        titulo="Pareceres"
        subtitulo={`${publicados} de ${data.length} publicados`}
        voltarPara={`/turma/${turmaId}`}
      />

      <main className="space-y-4 px-4 py-4">
        <div className="flex gap-2">
          {periodosRecentes().map((opcao) => (
            <button
              key={opcao}
              onClick={() => setPeriodo(opcao)}
              aria-pressed={periodo === opcao}
              className={`min-h-11 flex-1 rounded-(--raio) border text-sm font-semibold transition ${
                periodo === opcao
                  ? 'border-(color:--cor-acao) bg-(color:--cor-acao-suave) text-(color:--cor-acao)'
                  : 'border-[color:var(--color-borda)] bg-white'
              }`}
            >
              {nomeDoPeriodo(opcao)}
            </button>
          ))}
        </div>

        <p className="text-sm leading-relaxed text-[color:var(--color-tinta-suave)]">
          O rascunho nasce do que foi registrado no semestre — presença, rotina e atividades por
          campo de experiência. O texto que a família vai ler é o seu.
        </p>

        {erro && <Aviso>{erro}</Aviso>}

        <section className="space-y-2">
          <RotuloSecao apoio={semParecer > 0 ? `${semParecer} sem parecer` : undefined}>
            Crianças da turma
          </RotuloSecao>

          <ul className="space-y-(--gap-lista)">
            {data.map((linha) => (
              <li key={linha.criancaId}>
                {linha.relatorioId ? (
                  <button
                    onClick={() => navegar(`/turma/${turmaId}/parecer/${linha.relatorioId}`)}
                    className="w-full text-left"
                  >
                    <Cartao interno className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(color:--cor-acao-suave) text-(color:--cor-acao)">
                        <FileText size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{linha.criancaNome}</p>
                        <p className="text-xs text-[color:var(--color-tinta-suave)]">
                          {linha.camposEscritos} de 5 campos escritos
                        </p>
                      </div>
                      <Etiqueta tom={linha.status === 'PUBLICADO' ? 'ok' : 'neutro'}>
                        {ROTULO_STATUS[linha.status ?? ''] ?? linha.status}
                      </Etiqueta>
                      <ChevronRight
                        size={20}
                        className="shrink-0 text-[color:var(--color-tinta-tenue)]"
                      />
                    </Cartao>
                  </button>
                ) : (
                  <Cartao interno className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{linha.criancaNome}</p>
                      <p className="text-xs text-[color:var(--color-tinta-suave)]">
                        Sem parecer neste semestre
                      </p>
                    </div>
                    <Botao
                      variante="secundario"
                      className="shrink-0"
                      disabled={gerar.isPending}
                      onClick={() => {
                        setErro(null);
                        gerar.mutate(linha.criancaId);
                      }}
                    >
                      <Sparkles size={16} /> Gerar
                    </Botao>
                  </Cartao>
                )}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
