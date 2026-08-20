import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { useState } from 'react';
import { api, mensagemDeErro } from '@/shared/api/cliente';
import { Aviso, Botao, Campo, Cartao, Carregando, RotuloSecao } from '@/shared/ui/componentes';
import { Cabecalho } from '../componentes/Cabecalho';

const REFEICOES = [
  ['lancheManha', 'Lanche da manhã'],
  ['almoco', 'Almoço'],
  ['lancheTarde', 'Lanche da tarde'],
  ['jantar', 'Jantar'],
] as const;

const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'] as const;

type Semana = Record<string, Record<string, string>>;

/**
 * O cardápio da semana, editado de uma vez só.
 *
 * A cozinha planeja de segunda a sexta num fôlego, e salvar dia a dia deixaria
 * a tela num estado meio-salvo se a rede caísse no meio. Dia esvaziado é
 * apagado no servidor: a família precisa distinguir "ainda não publicaram" de
 * "publicaram um dia em branco".
 */
export function CardapioGestao() {
  const cliente = useQueryClient();
  const [referencia, setReferencia] = useState(() => isoDaSegunda(new Date()));

  // As edições ficam por semana, sobrepostas ao que veio do servidor. Guardar
  // uma cópia do servidor no estado exigiria ressincronizar a cada troca de
  // semana — e é justamente aí que o rascunho de uma vazaria para a outra.
  const [edicoes, setEdicoes] = useState<Record<string, Semana>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['cardapio', referencia],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/cardapios/semana', {
        params: { query: { data: referencia } },
      });
      if (error) throw error;
      return data;
    },
  });

  const doServidor: Semana = {};
  for (const dia of data ?? []) doServidor[dia.data] = dia.refeicoes;

  const daSemana = edicoes[referencia] ?? {};

  const valorDe = (dia: string, refeicao: string): string =>
    daSemana[dia]?.[refeicao] ?? doServidor[dia]?.[refeicao] ?? '';

  const definir = (dia: string, refeicao: string, valor: string) =>
    setEdicoes((atual) => ({
      ...atual,
      [referencia]: {
        ...atual[referencia],
        [dia]: { ...atual[referencia]?.[dia], [refeicao]: valor },
      },
    }));

  const salvar = useMutation({
    mutationFn: async (dias: string[]) => {
      const { error } = await api.PUT('/v1/cardapios', {
        body: {
          dias: dias.map((d) => ({
            data: d,
            refeicoes: { ...doServidor[d], ...daSemana[d] },
          })),
        },
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      // O rascunho desta semana já virou o estado do servidor.
      setEdicoes((atual) => {
        const { [referencia]: _descartado, ...resto } = atual;
        return resto;
      });
      await cliente.invalidateQueries({ queryKey: ['cardapio'] });
    },
  });

  const datas = DIAS.map((_, i) => somarDias(referencia, i));

  return (
    <div className="min-h-full pb-10">
      <Cabecalho titulo="Cardápio" voltarPara="/gestao" />

      <main className="space-y-4 px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <Botao
            variante="secundario"
            aria-label="Semana anterior"
            onClick={() => setReferencia(somarDias(referencia, -7))}
          >
            <ChevronLeft size={16} />
          </Botao>
          <p className="numerico text-sm font-semibold">
            {formatar(referencia)} a {formatar(somarDias(referencia, 4))}
          </p>
          <Botao
            variante="secundario"
            aria-label="Próxima semana"
            onClick={() => setReferencia(somarDias(referencia, 7))}
          >
            <ChevronRight size={16} />
          </Botao>
        </div>

        {salvar.error && <Aviso>{mensagemDeErro(salvar.error)}</Aviso>}
        {salvar.isSuccess && !salvar.isPending && <Aviso tom="ok">Cardápio salvo.</Aviso>}

        {isLoading ? (
          <Carregando texto="Buscando o cardápio…" />
        ) : (
          <>
            {datas.map((dia, i) => (
              <Cartao key={dia} interno className="space-y-2.5">
                <RotuloSecao apoio={<span className="numerico">{formatar(dia)}</span>}>
                  {DIAS[i]}
                </RotuloSecao>

                {REFEICOES.map(([chave, rotulo]) => (
                  <Campo
                    key={chave}
                    rotulo={rotulo}
                    value={valorDe(dia, chave)}
                    placeholder="—"
                    onChange={(e) => definir(dia, chave, e.target.value)}
                  />
                ))}
              </Cartao>
            ))}

            <Botao bloco disabled={salvar.isPending} onClick={() => salvar.mutate(datas)}>
              <Save size={16} /> {salvar.isPending ? 'Salvando…' : 'Salvar a semana'}
            </Botao>
          </>
        )}
      </main>
    </div>
  );
}

function isoDaSegunda(referencia: Date): string {
  const dia = referencia.getDay(); // 0 = domingo
  const copia = new Date(referencia);
  copia.setDate(copia.getDate() + (dia === 0 ? 1 : 1 - dia));
  return copia.toISOString().slice(0, 10);
}

function somarDias(iso: string, dias: number): string {
  const data = new Date(`${iso}T00:00:00.000Z`);
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString().slice(0, 10);
}

function formatar(iso: string): string {
  const [, mes, dia] = iso.split('-');
  return `${dia}/${mes}`;
}
