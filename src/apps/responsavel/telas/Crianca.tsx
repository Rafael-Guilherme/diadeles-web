import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Check,
  HeartPulse,
  IdCard,
  Pill,
  ShieldCheck,
  UserRound,
  Utensils,
  X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { api, mensagemDeErro } from '@/shared/api/cliente';
import { Cartao, Carregando, Etiqueta, RotuloSecao, Vazio } from '@/shared/ui/componentes';

const VINCULOS: Record<string, string> = {
  MAE: 'Mãe',
  PAI: 'Pai',
  AVO: 'Avó ou avô',
  TIO: 'Tio ou tia',
  PADRASTO_MADRASTA: 'Padrasto ou madrasta',
  RESPONSAVEL_LEGAL: 'Responsável legal',
  OUTRO: 'Responsável',
};

const CONSENTIMENTOS: Record<string, { titulo: string; descricao: string }> = {
  INTERNO: {
    titulo: 'Fotos dentro do app',
    descricao: 'A escola pode registrar fotos e enviá-las só para você, aqui no aplicativo.',
  },
  MATERIAL_DIVULGACAO: {
    titulo: 'Material impresso da escola',
    descricao: 'Mural, informativo e álbum de fim de ano feitos pela própria escola.',
  },
  REDES_SOCIAIS: {
    titulo: 'Redes sociais da escola',
    descricao: 'Publicações abertas no Instagram, Facebook e site da escola.',
  },
};

/**
 * A ficha da criança na mão da família.
 *
 * Duas coisas aqui não são informativas, são operacionais: **quem pode buscar**
 * — a lista que a portaria confere e que a mãe precisa reconhecer como certa —
 * e o **uso de imagem**, que a lei manda ser revogável a qualquer momento, com
 * efeito imediato (LGPD art. 14, docs/plano-produto.md §11). Por isso o
 * consentimento é um botão, não um texto explicando que basta ligar para a
 * secretaria.
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

  const decidir = useMutation({
    mutationFn: async (params: { escopo: string; concedido: boolean }) => {
      const { error } = await api.POST('/v1/criancas/{id}/consentimentos', {
        params: { path: { id: criancaId! } },
        body: params as { escopo: 'INTERNO' | 'MATERIAL_DIVULGACAO' | 'REDES_SOCIAIS'; concedido: boolean },
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
                  <Cartao interno className="flex gap-3">
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
                  </Cartao>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-2">
          <RotuloSecao>Uso de imagem</RotuloSecao>

          <p className="px-1 text-xs leading-relaxed text-[color:var(--color-tinta-suave)]">
            Você decide cada uso separadamente e pode mudar de ideia quando quiser — vale na hora.
          </p>

          <ul className="space-y-(--gap-lista)">
            {dados.consentimentos.map((c) => {
              const texto = CONSENTIMENTOS[c.escopo];
              return (
                <li key={c.escopo}>
                  <Cartao interno className="space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold">{texto?.titulo ?? c.escopo}</p>
                        <p className="mt-0.5 text-sm leading-relaxed text-[color:var(--color-tinta-suave)]">
                          {texto?.descricao}
                        </p>
                      </div>
                      {c.semResposta ? (
                        <Etiqueta>sem resposta</Etiqueta>
                      ) : c.concedido ? (
                        <Etiqueta tom="ok">
                          <Check size={11} /> autorizado
                        </Etiqueta>
                      ) : (
                        <Etiqueta tom="alerta">
                          <X size={11} /> negado
                        </Etiqueta>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <BotaoEscolha
                        ativo={!c.semResposta && c.concedido}
                        disabled={decidir.isPending}
                        onClick={() => decidir.mutate({ escopo: c.escopo, concedido: true })}
                      >
                        Autorizo
                      </BotaoEscolha>
                      <BotaoEscolha
                        ativo={!c.semResposta && !c.concedido}
                        disabled={decidir.isPending}
                        onClick={() => decidir.mutate({ escopo: c.escopo, concedido: false })}
                      >
                        Não autorizo
                      </BotaoEscolha>
                    </div>
                  </Cartao>
                </li>
              );
            })}
          </ul>

          {decidir.isError && (
            <p className="px-1 text-xs text-[color:var(--color-alerta)]">
              {mensagemDeErro(decidir.error)}
            </p>
          )}

          <p className="flex items-start gap-1.5 px-1 pt-1 text-xs leading-relaxed text-[color:var(--color-tinta-tenue)]">
            <ShieldCheck size={13} className="mt-0.5 shrink-0" />
            Cada resposta fica registrada com a data. Nada é apagado — é assim que a escola comprova
            o que foi autorizado.
          </p>
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

function BotaoEscolha({
  ativo,
  disabled,
  onClick,
  children,
}: {
  ativo: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={ativo}
      className={`min-h-11 flex-1 rounded-(--raio) text-sm font-semibold transition disabled:opacity-50 ${
        ativo
          ? 'bg-(color:--cor-acao) text-white'
          : 'bg-white text-[color:var(--color-tinta-suave)] ring-1 ring-inset ring-[color:var(--color-borda-forte)]'
      }`}
    >
      {children}
    </button>
  );
}

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}
