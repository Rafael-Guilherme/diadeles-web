import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { api, mensagemDeErro } from '@/shared/api/cliente';
import type { TipoRegistro } from '@/shared/offline/fila';
import { Aviso, Botao, Cartao, Carregando, RotuloSecao } from '@/shared/ui/componentes';
import { Cabecalho } from '../componentes/Cabecalho';
import { ICONES_TIPO, ROTULOS_TIPO } from '../componentes/PainelRegistro';

/**
 * O que cada tipo significa na prática, para a decisão não depender de o
 * gestor imaginar a tela do educador.
 */
const EXPLICACAO: Record<TipoRegistro, string> = {
  ALIMENTACAO: 'Refeição e quanto a criança aceitou',
  SONO: 'Início, fim e como dormiu',
  HIGIENE: 'Troca de fralda ou ida ao banheiro',
  HUMOR: 'Como a criança esteve ao longo do dia',
  ATIVIDADE: 'Atividade dirigida e como participou',
  HIDRATACAO: 'Água oferecida, em ml',
  OBSERVACAO: 'Recado curto da turma para a família',
};

const ORDEM: TipoRegistro[] = [
  'ALIMENTACAO',
  'SONO',
  'HIGIENE',
  'HUMOR',
  'ATIVIDADE',
  'HIDRATACAO',
  'OBSERVACAO',
];

/**
 * O que esta escola registra.
 *
 * Uma pré-escola não registra fralda; um berçário não faz atividade dirigida.
 * Oferecer os sete tipos a todo mundo enche a barra do educador de botões que
 * ninguém toca — e, pior, faz o fechamento do turno cobrar pendência de um
 * campo que a escola decidiu não usar.
 *
 * A lista já existia em `escola.configuracoes` desde a primeira migration e
 * ninguém a lia: o seed gravava e o produto ignorava. Esta tela é o que a
 * torna real, junto com a grade e as pendências, que passaram a respeitá-la.
 */
export function RotinaGestao() {
  const clienteQuery = useQueryClient();
  // `null` significa "ainda não mexeram": a seleção mostrada é a da escola até
  // alguém tocar em algum item. Derivar em vez de copiar num efeito evita a
  // janela em que a tela mostra uma lista velha depois de recarregar os dados.
  const [escolha, setEscolha] = useState<TipoRegistro[] | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['escola'],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/escola');
      if (error) throw error;
      return data;
    },
  });

  const salvar = useMutation({
    mutationFn: async (tipos: TipoRegistro[]) => {
      const { error } = await api.PATCH('/v1/escola', {
        body: { registrosHabilitados: tipos },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setErro(null);
      setSalvo(true);
      setEscolha(null);
      setTimeout(() => setSalvo(false), 2500);
      // A grade do educador desenha os botões a partir disto.
      void clienteQuery.invalidateQueries({ queryKey: ['escola'] });
      void clienteQuery.invalidateQueries({ queryKey: ['grade'] });
    },
    onError: (e) => setErro(mensagemDeErro(e)),
  });

  if (isLoading || !data) {
    return (
      <>
        <Cabecalho titulo="Rotina" voltarPara="/gestao" />
        <Carregando />
      </>
    );
  }

  const original = (data.registrosHabilitados ?? []) as TipoRegistro[];
  const selecionados = escolha ?? original;

  function alternar(tipo: TipoRegistro) {
    setSalvo(false);
    setEscolha(
      selecionados.includes(tipo)
        ? selecionados.filter((t) => t !== tipo)
        : [...selecionados, tipo],
    );
  }

  const mudou =
    selecionados.length !== original.length ||
    selecionados.some((t) => !original.includes(t));

  return (
    <div className="min-h-full pb-10">
      <Cabecalho titulo="Rotina" subtitulo="O que esta escola registra" voltarPara="/gestao" />

      <main className="space-y-5 px-4 py-4">
        <p className="text-sm leading-relaxed text-[color:var(--color-tinta-suave)]">
          Só o que estiver ligado aqui aparece para o educador registrar — e só isso é cobrado no
          fechamento do turno.
        </p>

        <section className="space-y-2">
          <RotuloSecao>Tipos de registro</RotuloSecao>

          <ul className="space-y-(--gap-lista)">
            {ORDEM.map((tipo) => {
              const ligado = selecionados.includes(tipo);

              return (
                <li key={tipo}>
                  <button
                    onClick={() => alternar(tipo)}
                    aria-pressed={ligado}
                    className="w-full text-left"
                  >
                    <Cartao
                      interno
                      className={`flex items-center gap-3 transition ${
                        ligado ? 'border-(color:--cor-acao)/40' : 'opacity-60'
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          ligado
                            ? 'bg-(color:--cor-acao-suave) text-(color:--cor-acao)'
                            : 'bg-[color:var(--color-papel)] text-[color:var(--color-tinta-tenue)]'
                        }`}
                      >
                        {ICONES_TIPO[tipo]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{ROTULOS_TIPO[tipo]}</p>
                        <p className="text-xs text-[color:var(--color-tinta-suave)]">
                          {EXPLICACAO[tipo]}
                        </p>
                      </div>
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${
                          ligado
                            ? 'border-(color:--cor-acao) bg-(color:--cor-acao) text-white'
                            : 'border-neutral-300'
                        }`}
                      >
                        {ligado && <Check size={14} />}
                      </span>
                    </Cartao>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Desligar tudo deixaria o educador sem nada para registrar, e o
            produto inteiro sem razão de existir naquela escola. */}
        {selecionados.length === 0 && (
          <Aviso>Deixe ao menos um tipo ligado — sem nenhum, não há o que registrar.</Aviso>
        )}

        {erro && <Aviso>{erro}</Aviso>}
        {salvo && <Aviso tom="ok">Salvo. O app do educador já está com os novos botões.</Aviso>}

        <p className="text-xs leading-relaxed text-[color:var(--color-tinta-tenue)]">
          Desligar um tipo não apaga o que já foi registrado nele — o histórico das crianças
          continua inteiro.
        </p>

        <Botao
          bloco
          disabled={!mudou || selecionados.length === 0 || salvar.isPending}
          onClick={() => salvar.mutate(selecionados)}
        >
          {salvar.isPending ? 'Salvando…' : 'Salvar'}
        </Botao>
      </main>
    </div>
  );
}
