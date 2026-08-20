import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Check,
  HeartPulse,
  IdCard,
  MessageSquarePlus,
  Pill,
  ScrollText,
  UserRound,
  Utensils,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { api, mensagemDeErro } from '@/shared/api/cliente';
import { Botao, Cartao, Carregando, Etiqueta, RotuloSecao, Vazio } from '@/shared/ui/componentes';
import { AutorizarMedicamento } from '../componentes/AutorizarMedicamento';

const VINCULOS: Record<string, string> = {
  MAE: 'Mãe',
  PAI: 'Pai',
  AVO: 'Avó ou avô',
  TIO: 'Tio ou tia',
  PADRASTO_MADRASTA: 'Padrasto ou madrasta',
  RESPONSAVEL_LEGAL: 'Responsável legal',
  OUTRO: 'Responsável',
};

/**
 * A ficha da criança na mão da família.
 *
 * Uma coisa aqui não é informativa, é operacional: **quem pode buscar** — a
 * lista que a portaria confere e que a mãe precisa reconhecer como certa.
 *
 * O consentimento de uso de imagem saiu junto com a mídia, adiada para uma
 * atualização futura: os três escopos existiam só para filtrar a galeria, e sem
 * foto no produto não sobrava nada para eles governarem.
 */
export function Crianca() {
  const clienteQuery = useQueryClient();

  const criancas = useQuery({
    queryKey: ['minhas-criancas'],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/criancas/minhas');
      if (error) throw error;
      return data;
    },
  });

  const criancaId = criancas.data?.[0]?.id;

  const ficha = useQuery({
    enabled: Boolean(criancaId),
    queryKey: ['ficha', criancaId],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/criancas/{id}', {
        params: { path: { id: criancaId! } },
      });
      if (error) throw error;
      return data;
    },
  });

  const revogar = useMutation({
    mutationFn: async (autorizacaoId: string) => {
      const { error } = await api.POST('/v1/medicamentos/autorizacoes/{id}/revogar', {
        params: { path: { id: autorizacaoId } },
      });
      if (error) throw error;
    },
    onSuccess: () => clienteQuery.invalidateQueries({ queryKey: ['ficha', criancaId] }),
  });

  if (criancas.isLoading || ficha.isLoading) return <Carregando texto="Buscando a ficha…" />;

  if (!ficha.data) {
    return (
      <Vazio
        titulo="Nenhuma criança vinculada"
        descricao="Peça à escola o convite de acesso para acompanhar o dia."
      />
    );
  }

  const dados = ficha.data;
  const autorizados = dados.autorizados.filter((a) => a.ativo);
  const podemRetirar = dados.responsaveis.filter((r) => r.podeRetirar);

  return (
    <div className="mx-auto w-full max-w-md">
      <header className="area-segura-topo bg-gradient-to-b from-(color:--cor-acao-suave) to-transparent px-5 pb-6">
        <h1 className="display text-2xl">{dados.nomeSocial ?? dados.nome}</h1>
        <p className="text-sm text-[color:var(--color-tinta-suave)]">
          {dados.matricula?.turmaNome ?? 'sem turma'} · {dados.idade}
        </p>
      </header>

      <main className="space-y-5 px-4 pb-6">
        <section className="space-y-2">
          <RotuloSecao>Saúde</RotuloSecao>

          {dados.alergias.length === 0 &&
          dados.restricoesAlimentares.length === 0 &&
          dados.condicoesSaude.length === 0 &&
          !dados.observacoesSaude ? (
            <Cartao interno>
              <p className="text-sm text-[color:var(--color-tinta-suave)]">
                Nada registrado. Se houver alergia ou restrição, avise a escola — é o que a equipe
                consulta antes de cada refeição.
              </p>
            </Cartao>
          ) : (
            <Cartao interno className="space-y-3">
              {dados.alergias.length > 0 && (
                <Linha icone={<AlertTriangle size={16} />} destaque titulo="Alergias">
                  {dados.alergias.join(', ')}
                </Linha>
              )}
              {dados.restricoesAlimentares.length > 0 && (
                <Linha icone={<Utensils size={16} />} titulo="Restrições alimentares">
                  {dados.restricoesAlimentares.join(', ')}
                </Linha>
              )}
              {dados.condicoesSaude.length > 0 && (
                <Linha icone={<HeartPulse size={16} />} titulo="Condições de saúde">
                  {dados.condicoesSaude.join(', ')}
                </Linha>
              )}
              {dados.observacoesSaude && (
                <Linha icone={<HeartPulse size={16} />} titulo="Observações">
                  {dados.observacoesSaude}
                </Linha>
              )}
            </Cartao>
          )}
          <p className="px-1 text-xs leading-relaxed text-[color:var(--color-tinta-tenue)]">
            Para corrigir qualquer dado desta seção, fale com a secretaria — a alteração precisa
            ficar registrada em nome de quem pediu.
          </p>
        </section>

        <section className="space-y-2">
          <RotuloSecao>Quem pode buscar</RotuloSecao>

          <ul className="space-y-(--gap-lista)">
            {podemRetirar.map((r) => (
              <li key={r.id}>
                <Pessoa nome={r.nome} papel={VINCULOS[r.tipo] ?? r.tipo} icone={<UserRound size={16} />} />
              </li>
            ))}
            {autorizados.map((a) => (
              <li key={a.id}>
                <Pessoa
                  nome={a.nome}
                  papel={`${a.parentesco ?? 'Autorizado'} · ${a.documento}`}
                  icone={<IdCard size={16} />}
                  nota={a.validoAte ? `até ${formatarData(a.validoAte)}` : undefined}
                />
              </li>
            ))}
          </ul>

          {podemRetirar.length + autorizados.length === 0 && (
            <Cartao interno>
              <p className="text-sm text-[color:var(--color-tinta-suave)]">
                Ninguém cadastrado para retirada. Procure a secretaria antes do fim do turno.
              </p>
            </Cartao>
          )}

          <p className="px-1 text-xs leading-relaxed text-[color:var(--color-tinta-tenue)]">
            A escola só entrega a criança a quem está nesta lista. Para incluir ou remover alguém,
            fale com a secretaria.
          </p>

          {/* A exceção de um dia — "hoje quem busca é a avó" — não muda o
              cadastro, e por isso não passa pela secretaria: vira recado. */}
          <Link to="/recado" className="block pt-1">
            <Botao variante="secundario" bloco>
              <MessageSquarePlus size={16} /> Avisar quem busca hoje
            </Botao>
          </Link>
        </section>

        <section className="space-y-2">
          <RotuloSecao>Desenvolvimento</RotuloSecao>
          <Link to="/pareceres" className="block">
            <Cartao interno className="flex items-center gap-3 transition active:bg-neutral-50">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(color:--cor-acao-suave) text-(color:--cor-acao)">
                <ScrollText size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">Pareceres do semestre</p>
                <p className="text-xs text-[color:var(--color-tinta-suave)]">
                  O relatório de desenvolvimento que a escola publica
                </p>
              </div>
            </Cartao>
          </Link>
        </section>

        <section className="space-y-2">
          <RotuloSecao>Medicação autorizada</RotuloSecao>

          {dados.medicacoes.length === 0 ? (
            <Cartao interno>
              <p className="text-sm text-[color:var(--color-tinta-suave)]">
                Nenhuma medicação autorizada para hoje. A escola só administra remédio com
                autorização válida e receita.
              </p>
            </Cartao>
          ) : (
            <ul className="space-y-(--gap-lista)">
              {dados.medicacoes.map((m) => (
                <li key={m.id}>
                  <Cartao interno className="space-y-2.5">
                    <div className="flex gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-(--raio) bg-(color:--cor-acao-suave) text-(color:--cor-acao)">
                        <Pill size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{m.medicamento}</p>
                        <p className="text-sm text-[color:var(--color-tinta-suave)]">
                          {m.dosagem} · via {m.via} · até {formatarData(m.fim)}
                        </p>
                        {m.administradoHoje.length > 0 && (
                          <p className="mt-1.5 text-xs text-[color:var(--color-ok)]">
                            <Check size={12} className="mr-0.5 inline" />
                            Administrado hoje às{' '}
                            {m.administradoHoje
                              .map((iso) =>
                                new Date(iso).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }),
                              )
                              .join(', ')}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Cancelar vale na hora: o médico suspender o remédio de
                        manhã não pode esperar a escola ler um recado. */}
                    <button
                      onClick={() => revogar.mutate(m.id)}
                      disabled={revogar.isPending}
                      className="min-h-11 w-full rounded-(--raio) text-sm font-semibold text-[color:var(--color-alerta)] ring-1 ring-inset ring-[color:var(--color-alerta)]/25 transition active:scale-[0.99] disabled:opacity-50"
                    >
                      Cancelar esta autorização
                    </button>
                  </Cartao>
                </li>
              ))}
            </ul>
          )}

          <AutorizarMedicamento criancaId={dados.id} />

          {revogar.isError && (
            <p className="px-1 text-xs text-[color:var(--color-alerta)]">
              {mensagemDeErro(revogar.error)}
            </p>
          )}
        </section>

      </main>
    </div>
  );
}

function Linha({
  icone,
  titulo,
  children,
  destaque = false,
}: {
  icone: ReactNode;
  titulo: string;
  children: ReactNode;
  destaque?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-(--raio-sm) ${
          destaque
            ? 'bg-[color:var(--color-alerta-suave)] text-[color:var(--color-alerta)]'
            : 'bg-[color:var(--color-papel)] text-[color:var(--color-tinta-suave)]'
        }`}
      >
        {icone}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-2xs font-bold uppercase tracking-wider text-[color:var(--color-tinta-tenue)]">
          {titulo}
        </p>
        <p className={`text-sm leading-relaxed ${destaque ? 'font-semibold' : ''}`}>{children}</p>
      </div>
    </div>
  );
}

function Pessoa({
  nome,
  papel,
  icone,
  nota,
}: {
  nome: string;
  papel: string;
  icone: ReactNode;
  nota?: string;
}) {
  return (
    <Cartao interno className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(color:--cor-acao-suave) text-(color:--cor-acao)">
        {icone}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{nome}</p>
        <p className="truncate text-xs text-[color:var(--color-tinta-suave)]">{papel}</p>
      </div>
      {nota && <Etiqueta>{nota}</Etiqueta>}
    </Cartao>
  );
}

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}
