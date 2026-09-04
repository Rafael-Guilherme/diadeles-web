import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  Baby,
  Check,
  Droplets,
  LogIn,
  LogOut,
  Moon,
  NotebookPen,
  Pill,
  Smile,
  Sparkles,
  Utensils,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { api } from '@/shared/api/cliente';
import {
  Avatar,
  Aviso,
  Botao,
  Cartao,
  Carregando,
  Etiqueta,
  RotuloSecao,
  Vazio,
} from '@/shared/ui/componentes';
import { Cabecalho } from '../componentes/Cabecalho';
import { RegistrarDose } from '../componentes/RegistrarDose';
import { Recados } from '../componentes/Recados';

const VINCULOS: Record<string, string> = {
  MAE: 'mãe',
  PAI: 'pai',
  AVO: 'avó ou avô',
  TIO: 'tio ou tia',
  PADRASTO_MADRASTA: 'padrasto ou madrasta',
  RESPONSAVEL_LEGAL: 'responsável legal',
  OUTRO: 'responsável',
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
 * A restrição vem **antes do nome**, não depois: quem abre a ficha correndo,
 * três minutos antes do almoço, precisa ler a alergia primeiro e o nome
 * depois — ele já sabe de quem é a ficha, foi ele quem a abriu (5d).
 */
export function FichaCrianca() {
  const { turmaId = '', criancaId = '' } = useParams();
  const [doseAberta, setDoseAberta] = useState<string | null>(null);

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
        <Cabecalho titulo="Ficha da criança" voltarPara={`/turma/${turmaId}`} />
        <Carregando />
      </>
    );
  }

  if (!dia.data || !ficha.data) {
    return (
      <>
        <Cabecalho titulo="Ficha da criança" voltarPara={`/turma/${turmaId}`} />
        <div className="px-4 py-6">
          <Vazio
            titulo="Não consegui carregar esta criança"
            descricao="Verifique a conexão e tente de novo. Se persistir, a matrícula pode ter sido encerrada."
          />
        </div>
      </>
    );
  }

  const dados = ficha.data;
  const nome = dados.nomeSocial ?? dados.nome;
  const restricoes = [...dados.alergias, ...dados.restricoesAlimentares];

  const podemRetirar = dados.responsaveis.filter((r) => r.podeRetirar);
  const autorizados = dados.autorizados.filter((a) => a.ativo);
  const bloqueados = dados.responsaveis.filter((r) => r.bloqueado);

  return (
    <div className="min-h-full pb-10">
      <Cabecalho
        titulo="Ficha da criança"
        subtitulo={dados.matricula?.turmaNome ?? 'sem turma'}
        voltarPara={`/turma/${turmaId}`}
      />

      {/* A faixa é a primeira coisa da tela, de ponta a ponta, e é sempre a
          palavra do alimento — nunca só uma cor ou só um ícone. */}
      {dados.alergias.length > 0 && (
        <div className="border-b border-[color:var(--color-alerta)] bg-[color:var(--color-alerta-suave)] px-3 py-2.5">
          <div className="flex gap-2.5">
            <span
              aria-hidden
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-(--raio-sm) bg-[color:var(--color-alerta)] text-xs font-bold text-white"
            >
              !
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[color:var(--color-alerta)]">
                Alergia a {dados.alergias.join(', ').toLowerCase()}
              </p>
              {(dados.observacoesSaude || dados.restricoesAlimentares.length > 0) && (
                <p className="mt-0.5 text-sm leading-snug text-[color:var(--color-tinta-suave)]">
                  {dados.restricoesAlimentares.length > 0 &&
                    `Também não pode: ${dados.restricoesAlimentares.join(', ').toLowerCase()}. `}
                  {dados.observacoesSaude}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {dados.alergias.length === 0 && restricoes.length > 0 && (
        <div className="border-b border-[color:var(--color-sol-200)] bg-[color:var(--color-sol-50)] px-3 py-2.5">
          <p className="text-sm font-semibold text-[color:var(--color-sol-700)]">
            Restrição alimentar: {dados.restricoesAlimentares.join(', ').toLowerCase()}
          </p>
        </div>
      )}

      <div className="flex items-center gap-3 border-b border-[color:var(--color-borda)] bg-white px-3 py-3">
        <Avatar nome={nome} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold">{dados.nome}</p>
          <p className="text-xs text-[color:var(--color-tinta-suave)]">
            {dados.matricula?.turmaNome ?? 'sem turma'} · {dados.idade} ·{' '}
            {dia.data.ausente ? 'ausente hoje' : dia.data.entradaEm ? 'presente' : 'sem chamada'}
          </p>
        </div>
        {dia.data.entradaEm && !dia.data.saidaEm && <Etiqueta tom="ok">na escola</Etiqueta>}
        {dia.data.saidaEm && <Etiqueta>saiu {hora(dia.data.saidaEm)}</Etiqueta>}
      </div>

      <main className="space-y-5 px-3 py-4">
        {dados.condicoesSaude.length > 0 && (
          <Aviso tom="neutro" titulo="Condições de saúde">
            {dados.condicoesSaude.join(', ')}
          </Aviso>
        )}

        <section className="space-y-2">
          <RotuloSecao>Medicação de hoje</RotuloSecao>

          {dia.data.medicacoes.length === 0 ? (
            <Cartao interno>
              <p className="text-sm font-semibold">Nenhuma dose hoje</p>
              <p className="text-xs text-[color:var(--color-tinta-suave)]">
                Sem autorização vigente da família. Sem ela, a escola não pode dar nenhum
                medicamento.
              </p>
            </Cartao>
          ) : (
            <ul className="space-y-(--gap-lista)">
              {dia.data.medicacoes.map((m) => {
                const dado = m.administradoHoje.length > 0;
                return (
                  <li key={m.id}>
                    <Cartao
                      interno
                      className={dado ? '' : 'border-[color:var(--color-alerta)]'}
                    >
                      <div className="flex gap-3">
                        <span
                          aria-hidden
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-(--raio-sm) ${
                            dado
                              ? 'bg-[color:var(--color-ok-suave)] text-[color:var(--color-ok)]'
                              : 'bg-[color:var(--color-alerta-suave)] text-[color:var(--color-alerta)]'
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
                              dado ? 'text-[color:var(--color-ok)]' : 'text-[color:var(--color-alerta)]'
                            }`}
                          >
                            {dado
                              ? `Dado hoje às ${m.administradoHoje.map(hora).join(', ')}`
                              : 'Ainda não foi dado hoje'}
                          </p>
                          {m.observacoes && (
                            <p className="mt-1 text-xs text-[color:var(--color-tinta-suave)]">
                              {m.observacoes}
                            </p>
                          )}
                        </div>
                      </div>

                      {doseAberta !== m.id && (
                        <Botao
                          variante="secundario"
                          bloco
                          className="mt-2.5"
                          onClick={() => setDoseAberta(m.id)}
                        >
                          {dado ? 'Registrar outra dose' : 'Registrar dose'}
                        </Botao>
                      )}
                    </Cartao>

                    {doseAberta === m.id && (
                      <div className="pt-2">
                        <RegistrarDose
                          medicacao={m}
                          criancaId={criancaId}
                          aoFechar={() => setDoseAberta(null)}
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="space-y-2">
          <RotuloSecao apoio={<span className="text-2xs">{autorizados.length + podemRetirar.length}</span>}>
            Autorizados a retirar
          </RotuloSecao>

          {podemRetirar.length + autorizados.length === 0 ? (
            <Aviso titulo="Ninguém autorizado a retirar">
              Não entregue a criança sem falar com a coordenação.
            </Aviso>
          ) : (
            <Cartao className="divide-y divide-[color:var(--color-borda)]">
              {podemRetirar.map((r) => (
                <Pessoa key={r.id} nome={r.nome} detalhe={VINCULOS[r.tipo] ?? r.tipo} />
              ))}
              {autorizados.map((a) => (
                <Pessoa
                  key={a.id}
                  nome={a.nome}
                  detalhe={`${a.parentesco ?? 'autorizado'} · ${a.documento}`}
                  nota={a.validoAte ? `até ${dataCurta(a.validoAte)}` : undefined}
                />
              ))}
            </Cartao>
          )}

          {/* Bloqueio judicial não é exceção rara: é a informação que impede a
              escola de entregar uma criança a quem não podia buscá-la. */}
          {bloqueados.length > 0 && (
            <Aviso titulo={`Não pode retirar: ${bloqueados.map((r) => r.nome).join(', ')}`}>
              Se essa pessoa aparecer na portaria, chame a coordenação antes de qualquer coisa.
            </Aviso>
          )}
        </section>

        <Recados criancaId={criancaId} incluirLidos titulo="Recados da família" />

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
                    aria-hidden
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
                        {hora(item.ocorridoEm)}
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
      </main>

      {/* As três saídas da ficha ficam juntas no rodapé, e a ocorrência é a
          única em vermelho: quando o educador abre esta tela porque algo
          aconteceu, procurar onde registrar é tempo que a criança espera. */}
      <div
        className="area-segura-base sticky bottom-0 flex gap-2 border-t border-[color:var(--color-borda-forte)] bg-[color:var(--color-papel)] px-3 pt-2.5"
        style={{ boxShadow: 'var(--sombra-elevada)' }}
      >
        <Link to={`/turma/${turmaId}`} className="flex-1">
          <Botao variante="secundario" bloco>
            Ver o dia
          </Botao>
        </Link>
        <Link to={`/turma/${turmaId}/pareceres`} className="flex-1">
          <Botao variante="secundario" bloco>
            Pareceres
          </Botao>
        </Link>
        <Link to={`/turma/${turmaId}/crianca/${criancaId}/ocorrencia`} className="flex-1">
          <Botao
            variante="secundario"
            bloco
            className="border-[color:var(--color-alerta)] text-[color:var(--color-alerta)]"
          >
            Ocorrência
          </Botao>
        </Link>
      </div>
    </div>
  );
}

function Pessoa({ nome, detalhe, nota }: { nome: string; detalhe: string; nota?: string }) {
  return (
    <div className="flex items-center gap-2.5 p-(--padding-cartao)">
      <Avatar nome={nome} tamanho="sm" />
      <p className="min-w-0 flex-1 truncate text-sm">
        <span className="font-semibold">{nome}</span>{' '}
        <span className="text-[color:var(--color-tinta-tenue)]">· {detalhe}</span>
      </p>
      {nota && <Etiqueta>{nota}</Etiqueta>}
    </div>
  );
}

function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function dataCurta(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

/** `horarios` é Json na API: pode ser uma lista de horas ou "se necessário". */
function descreverHorarios(horarios: unknown): string {
  if (Array.isArray(horarios)) return horarios.map(String).join(', ');
  if (horarios && typeof horarios === 'object' && 'seNecessario' in horarios) {
    return 'se necessário';
  }
  return 'sem horário fixo';
}
