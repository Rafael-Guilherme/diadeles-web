import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  Baby,
  Check,
  Droplets,
  HeartPulse,
  IdCard,
  LogIn,
  LogOut,
  Moon,
  NotebookPen,
  Pill,
  Smile,
  Sparkles,
  UserRound,
  Utensils,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { api } from '@/shared/api/cliente';
import { Botao, Cartao, Carregando, Etiqueta, RotuloSecao, Vazio } from '@/shared/ui/componentes';
import { Cabecalho } from '../componentes/Cabecalho';

const VINCULOS: Record<string, string> = {
  MAE: 'Mãe',
  PAI: 'Pai',
  AVO: 'Avó ou avô',
  TIO: 'Tio ou tia',
  PADRASTO_MADRASTA: 'Padrasto ou madrasta',
  RESPONSAVEL_LEGAL: 'Responsável legal',
  OUTRO: 'Responsável',
};

const ICONES: Record<string, ReactNode> = {
  ALIMENTACAO: <Utensils size={14} />,
  SONO: <Moon size={14} />,
  HIGIENE: <Baby size={14} />,
  HIDRATACAO: <Droplets size={14} />,
  HUMOR: <Smile size={14} />,
  ATIVIDADE: <Sparkles size={14} />,
  OBSERVACAO: <NotebookPen size={14} />,
};

/**
 * A ficha que o educador abre na exceção — quando uma criança precisa de
 * atenção individual, não do registro em lote da turma.
 *
 * A ordem da tela é a ordem da urgência: alergia e restrição primeiro, porque
 * é o que não pode passar batido antes de uma refeição; medicação em seguida,
 * com o que já foi dado hoje; e só então a linha do tempo, que é consulta.
 */
export function FichaCrianca() {
  const { turmaId = '', criancaId = '' } = useParams();

  const dia = useQuery({
    queryKey: ['dia', criancaId],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/criancas/{id}/dia', {
        params: { path: { id: criancaId } },
      });
      if (error) throw error;
      return data;
    },
  });

  const ficha = useQuery({
    queryKey: ['crianca', criancaId],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/criancas/{id}', {
        params: { path: { id: criancaId } },
      });
      if (error) throw error;
      return data;
    },
  });

  if (dia.isLoading || ficha.isLoading) {
    return (
      <>
        <Cabecalho titulo="Ficha" voltarPara={`/turma/${turmaId}`} />
        <Carregando />
      </>
    );
  }

  if (!dia.data || !ficha.data) {
    return (
      <>
        <Cabecalho titulo="Ficha" voltarPara={`/turma/${turmaId}`} />
        <Vazio titulo="Não consegui carregar esta criança" />
      </>
    );
  }

  const dados = ficha.data;
  const temAlerta =
    dados.alergias.length > 0 ||
    dados.restricoesAlimentares.length > 0 ||
    dados.condicoesSaude.length > 0 ||
    Boolean(dados.observacoesSaude);

  const podemRetirar = dados.responsaveis.filter((r) => r.podeRetirar);
  const autorizados = dados.autorizados.filter((a) => a.ativo);

  return (
    <div className="min-h-full pb-10">
      <Cabecalho
        titulo={dados.nomeSocial ?? dados.nome}
        subtitulo={`${dados.idade} · ${dados.matricula?.turmaNome ?? 'sem turma'}`}
        voltarPara={`/turma/${turmaId}`}
      />

      <main className="space-y-5 px-4 py-4">
        <div className="flex flex-wrap gap-2">
          {dia.data.ausente ? (
            <Etiqueta tom="alerta">ausente hoje</Etiqueta>
          ) : dia.data.entradaEm ? (
            <Etiqueta tom="ok">
              entrou às{' '}
              {new Date(dia.data.entradaEm).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Etiqueta>
          ) : (
            <Etiqueta tom="alerta">sem chamada</Etiqueta>
          )}
          {dia.data.saidaEm && (
            <Etiqueta>
              saiu às{' '}
              {new Date(dia.data.saidaEm).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Etiqueta>
          )}
        </div>

        {/* Alergia em vermelho e no topo: o educador consulta esta tela com uma
            criança no colo e três minutos até o almoço. */}
        {temAlerta && (
          <Cartao
            interno
            className="space-y-3 border-[color:var(--color-alerta)]/30 bg-[color:var(--color-alerta-suave)]/40"
          >
            {dados.alergias.length > 0 && (
              <Alerta icone={<AlertTriangle size={16} />} titulo="Alergias" forte>
                {dados.alergias.join(', ')}
              </Alerta>
            )}
            {dados.restricoesAlimentares.length > 0 && (
              <Alerta icone={<Utensils size={16} />} titulo="Restrições alimentares">
                {dados.restricoesAlimentares.join(', ')}
              </Alerta>
            )}
            {dados.condicoesSaude.length > 0 && (
              <Alerta icone={<HeartPulse size={16} />} titulo="Condições de saúde">
                {dados.condicoesSaude.join(', ')}
              </Alerta>
            )}
            {dados.observacoesSaude && (
              <Alerta icone={<NotebookPen size={16} />} titulo="Observações">
                {dados.observacoesSaude}
              </Alerta>
            )}
          </Cartao>
        )}

        {dia.data.medicacoes.length > 0 && (
          <section className="space-y-2">
            <RotuloSecao>Medicação de hoje</RotuloSecao>
            <ul className="space-y-(--gap-lista)">
              {dia.data.medicacoes.map((m) => {
                const dado = m.administradoHoje.length > 0;
                return (
                  <li key={m.id}>
                    <Cartao
                      interno
                      className={`flex gap-3 ${dado ? '' : 'border-(color:--cor-acao)/40'}`}
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-(--raio) ${
                          dado
                            ? 'bg-[color:var(--color-ok-suave)] text-[color:var(--color-ok)]'
                            : 'bg-(color:--cor-acao-suave) text-(color:--cor-acao)'
                        }`}
                      >
                        {dado ? <Check size={16} /> : <Pill size={16} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{m.medicamento}</p>
                        <p className="text-sm text-[color:var(--color-tinta-suave)]">
                          {m.dosagem} · via {m.via} · {descreverHorarios(m.horarios)}
                        </p>
                        <p
                          className={`mt-1 text-xs font-semibold ${
                            dado ? 'text-[color:var(--color-ok)]' : 'text-(color:--cor-acao)'
                          }`}
                        >
                          {dado
                            ? `Dado hoje às ${m.administradoHoje
                                .map((iso) =>
                                  new Date(iso).toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  }),
                                )
                                .join(', ')}`
                            : 'Ainda não foi dado hoje'}
                        </p>
                        {m.observacoes && (
                          <p className="mt-1 text-xs text-[color:var(--color-tinta-suave)]">
                            {m.observacoes}
                          </p>
                        )}
                      </div>
                    </Cartao>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Fora de qualquer seção e sempre visível: quando o educador abre esta
            tela porque algo aconteceu, procurar onde registrar é tempo que a
            criança está esperando. */}
        <Link to={`/turma/${turmaId}/crianca/${criancaId}/ocorrencia`} className="block">
          <Botao variante="secundario" bloco>
            <AlertTriangle size={16} /> Registrar ocorrência
          </Botao>
        </Link>

        <section className="space-y-2">
          <RotuloSecao apoio={<span className="text-2xs">{dia.data.resumo}</span>}>
            O dia
          </RotuloSecao>

          {dia.data.timeline.length === 0 ? (
            <Cartao interno>
              <p className="text-sm text-[color:var(--color-tinta-suave)]">
                Nada registrado hoje ainda.
              </p>
            </Cartao>
          ) : (
            <Cartao interno className="space-y-3">
              {dia.data.timeline.map((item) => (
                <div key={item.id} className="flex gap-2.5">
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-(--raio-sm) ${
                      item.categoria === 'OCORRENCIA'
                        ? 'bg-[color:var(--color-alerta-suave)] text-[color:var(--color-alerta)]'
                        : 'bg-[color:var(--color-papel)] text-[color:var(--color-tinta-suave)]'
                    }`}
                  >
                    {item.categoria === 'ENTRADA' ? (
                      <LogIn size={14} />
                    ) : item.categoria === 'SAIDA' ? (
                      <LogOut size={14} />
                    ) : item.categoria === 'OCORRENCIA' ? (
                      <AlertTriangle size={14} />
                    ) : item.categoria === 'MEDICACAO' ? (
                      <Pill size={14} />
                    ) : (
                      (ICONES[item.tipo ?? ''] ?? <Sparkles size={14} />)
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold leading-snug">{item.titulo}</p>
                      <time className="numerico shrink-0 text-2xs text-[color:var(--color-tinta-tenue)]">
                        {new Date(item.ocorridoEm).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                    </div>
                    {item.detalhe && (
                      <p className="text-xs leading-relaxed text-[color:var(--color-tinta-suave)]">
                        {item.detalhe}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </Cartao>
          )}
        </section>

        <section className="space-y-2">
          <RotuloSecao>Quem pode retirar</RotuloSecao>

          {podemRetirar.length + autorizados.length === 0 ? (
            <Cartao interno>
              <p className="text-sm text-[color:var(--color-alerta)]">
                Ninguém autorizado a retirar. Não entregue a criança sem falar com a coordenação.
              </p>
            </Cartao>
          ) : (
            <Cartao interno className="space-y-2.5">
              {podemRetirar.map((r) => (
                <Pessoa
                  key={r.id}
                  icone={<UserRound size={14} />}
                  nome={r.nome}
                  detalhe={VINCULOS[r.tipo] ?? r.tipo}
                />
              ))}
              {autorizados.map((a) => (
                <Pessoa
                  key={a.id}
                  icone={<IdCard size={14} />}
                  nome={a.nome}
                  detalhe={`${a.parentesco ?? 'Autorizado'} · ${a.documento}`}
                />
              ))}
            </Cartao>
          )}

          {/* Bloqueio judicial não é exceção rara: é a informação que impede a
              escola de entregar uma criança a quem não podia buscá-la. */}
          {dados.responsaveis.some((r) => r.bloqueado) && (
            <Cartao interno className="border-[color:var(--color-alerta)]/40">
              <p className="text-sm font-semibold text-[color:var(--color-alerta)]">
                Não pode retirar:{' '}
                {dados.responsaveis
                  .filter((r) => r.bloqueado)
                  .map((r) => r.nome)
                  .join(', ')}
              </p>
              <p className="mt-1 text-xs text-[color:var(--color-tinta-suave)]">
                Se essa pessoa aparecer na portaria, chame a coordenação antes de qualquer coisa.
              </p>
            </Cartao>
          )}
        </section>
      </main>
    </div>
  );
}

function Alerta({
  icone,
  titulo,
  children,
  forte = false,
}: {
  icone: ReactNode;
  titulo: string;
  children: ReactNode;
  forte?: boolean;
}) {
  return (
    <div className="flex gap-2.5">
      <span className="mt-0.5 shrink-0 text-[color:var(--color-alerta)]">{icone}</span>
      <div className="min-w-0 flex-1">
        <p className="text-2xs font-bold uppercase tracking-wider text-[color:var(--color-alerta)]">
          {titulo}
        </p>
        <p className={`text-sm leading-relaxed ${forte ? 'font-semibold' : ''}`}>{children}</p>
      </div>
    </div>
  );
}

function Pessoa({
  icone,
  nome,
  detalhe,
}: {
  icone: ReactNode;
  nome: string;
  detalhe: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-papel)] text-[color:var(--color-tinta-suave)]">
        {icone}
      </span>
      <p className="min-w-0 flex-1 truncate text-sm">
        <span className="font-semibold">{nome}</span>{' '}
        <span className="text-[color:var(--color-tinta-tenue)]">· {detalhe}</span>
      </p>
    </div>
  );
}

/** `horarios` é Json na API: pode ser uma lista de horas ou "se necessário". */
function descreverHorarios(horarios: unknown): string {
  if (Array.isArray(horarios)) return horarios.map(String).join(', ');
  if (horarios && typeof horarios === 'object' && 'seNecessario' in horarios) {
    return 'se necessário';
  }
  return 'sem horário fixo';
}
