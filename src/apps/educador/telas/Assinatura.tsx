import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check, ExternalLink, RefreshCw } from 'lucide-react';
import { api, mensagemDeErro } from '@/shared/api/cliente';
import { Aviso, Botao, Cartao, Carregando, Etiqueta, RotuloSecao } from '@/shared/ui/componentes';
import { Cabecalho } from '../componentes/Cabecalho';

const ROTULO_STATUS: Record<string, string> = {
  TRIAL: 'em avaliação',
  ATIVA: 'ativa',
  INADIMPLENTE: 'inadimplente',
  SUSPENSA: 'suspensa',
  CANCELADA: 'cancelada',
};

const ROTULO_PLANO: Record<string, string> = {
  essencial: 'Essencial',
  profissional: 'Profissional',
  rede: 'Rede',
};

/**
 * A assinatura da escola.
 *
 * O modelo é por criança ativa/mês (docs/plano-produto.md §10), então o valor
 * muda todo mês — e a pergunta que a escola faz é sempre a mesma: "por que
 * este número?". A tela responde antes de ser perguntada: quantas crianças
 * foram medidas, quantas foram cobradas, e por que os dois números diferem
 * quando o mínimo do plano entra.
 */
export function Assinatura() {
  const clienteQuery = useQueryClient();
  const [erro, setErro] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['assinatura'],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/assinatura');
      if (error) throw error;
      return data;
    },
  });

  const apurar = useMutation({
    mutationFn: async () => {
      const { error } = await api.POST('/v1/faturamento/apurar', { body: {} });
      if (error) throw error;
    },
    onSuccess: () => {
      setErro(null);
      void clienteQuery.invalidateQueries({ queryKey: ['assinatura'] });
    },
    onError: (e) => setErro(mensagemDeErro(e)),
  });

  if (isLoading || !data) {
    return (
      <>
        <Cabecalho titulo="Assinatura" voltarPara="/gestao" />
        <Carregando />
      </>
    );
  }

  const emAtraso = data.faturas.filter((f) => f.emAtraso).length;
  const minimoAplicado = data.criancasAtivas < data.minimoCriancas;

  return (
    <div className="min-h-full pb-10">
      <Cabecalho
        titulo="Assinatura"
        subtitulo={`Plano ${ROTULO_PLANO[data.plano] ?? data.plano}`}
        voltarPara="/gestao"
      />

      <main className="space-y-5 px-4 py-4">
        {/* Sem chave do provedor nada é cobrado de verdade. A tela precisa
            dizer isso antes que alguém saia procurando o boleto. */}
        {data.ambiente !== 'producao' && (
          <Aviso>
            {data.ambiente === 'simulado'
              ? 'Nenhuma cobrança é emitida de verdade neste ambiente: as faturas abaixo são simuladas.'
              : 'Ambiente de teste do provedor — as cobranças não são reais.'}
          </Aviso>
        )}

        {data.status === 'TRIAL' && data.diasDeTrial > 0 && (
          <Aviso tom="ok">
            Período de avaliação: faltam {data.diasDeTrial}{' '}
            {data.diasDeTrial === 1 ? 'dia' : 'dias'}. Nada é cobrado até lá.
          </Aviso>
        )}

        {emAtraso > 0 && (
          <Aviso>
            <AlertTriangle size={14} className="mr-1 inline" />
            {emAtraso === 1 ? '1 fatura vencida' : `${emAtraso} faturas vencidas`}.
          </Aviso>
        )}

        <section className="space-y-2">
          <RotuloSecao>Este mês</RotuloSecao>

          <Cartao interno className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <p className="numerico text-2xl font-semibold leading-none">
                  R$ {data.valorEstimado.replace('.', ',')}
                </p>
                <p className="mt-1 text-xs text-[color:var(--color-tinta-suave)]">
                  estimativa para a próxima apuração
                </p>
              </div>
              <Etiqueta tom={data.status === 'ATIVA' ? 'ok' : 'neutro'}>
                {ROTULO_STATUS[data.status] ?? data.status}
              </Etiqueta>
            </div>

            <div className="border-t border-[color:var(--color-borda)] pt-2.5 text-sm leading-relaxed text-[color:var(--color-tinta-suave)]">
              <p className="numerico">
                {data.criancasAtivas}{' '}
                {data.criancasAtivas === 1 ? 'criança matriculada' : 'crianças matriculadas'} × R${' '}
                {data.precoPorCrianca.replace('.', ',')}
              </p>

              {/* A linha que evita a ligação para o suporte. */}
              {minimoAplicado && (
                <p className="numerico mt-1 text-[color:var(--color-tinta)]">
                  Cobrança sobre o mínimo do plano: {data.minimoCriancas} crianças.
                </p>
              )}

              <p className="mt-1">
                Apuração em {formatarData(data.proximaApuracao)}, vencimento no dia{' '}
                {data.diaVencimento}.
              </p>
            </div>
          </Cartao>
        </section>

        <section className="space-y-2">
          <RotuloSecao>Faturas</RotuloSecao>

          {data.faturas.length === 0 ? (
            <Cartao interno>
              <p className="text-sm text-[color:var(--color-tinta-suave)]">
                Nenhuma fatura ainda. A primeira sai na apuração do mês que vem.
              </p>
            </Cartao>
          ) : (
            <ul className="space-y-(--gap-lista)">
              {data.faturas.map((fatura) => (
                <li key={fatura.id}>
                  <Cartao interno className="space-y-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-semibold capitalize">{fatura.competenciaNome}</p>
                      <p className="numerico font-semibold">
                        R$ {fatura.valor.replace('.', ',')}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {fatura.status === 'PAGA' ? (
                        <Etiqueta tom="ok">
                          <Check size={11} /> paga
                        </Etiqueta>
                      ) : fatura.emAtraso ? (
                        <Etiqueta tom="alerta">vencida</Etiqueta>
                      ) : (
                        <Etiqueta>a vencer</Etiqueta>
                      )}
                      <span className="numerico text-xs text-[color:var(--color-tinta-suave)]">
                        vence {formatarData(fatura.vencimento)}
                      </span>
                      {fatura.simulada && <Etiqueta>simulada</Etiqueta>}
                    </div>

                    <p className="numerico text-xs text-[color:var(--color-tinta-tenue)]">
                      {fatura.criancasAtivas}{' '}
                      {fatura.criancasAtivas === 1 ? 'criança medida' : 'crianças medidas'}
                      {fatura.criancasCobradas !== fatura.criancasAtivas
                        ? ` · ${fatura.criancasCobradas} cobradas pelo mínimo do plano`
                        : ''}
                    </p>

                    {fatura.linkPagamento && fatura.status !== 'PAGA' && (
                      <a
                        href={fatura.linkPagamento}
                        target="_blank"
                        rel="noreferrer"
                        className="flex min-h-11 items-center justify-center gap-2 rounded-(--raio) bg-(color:--cor-acao-suave) text-sm font-semibold text-(color:--cor-acao)"
                      >
                        <ExternalLink size={16} /> Pagar
                      </a>
                    )}
                  </Cartao>
                </li>
              ))}
            </ul>
          )}
        </section>

        {erro && <Aviso>{erro}</Aviso>}

        <section className="space-y-2">
          <RotuloSecao>Operação</RotuloSecao>
          <Botao
            variante="secundario"
            bloco
            disabled={apurar.isPending}
            onClick={() => apurar.mutate()}
          >
            <RefreshCw size={16} /> {apurar.isPending ? 'Apurando…' : 'Apurar este mês agora'}
          </Botao>
          <p className="text-xs leading-relaxed text-[color:var(--color-tinta-tenue)]">
            A apuração roda sozinha no dia 1. Rodar de novo não gera segunda cobrança da mesma
            competência.
          </p>
        </section>
      </main>
    </div>
  );
}

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}
