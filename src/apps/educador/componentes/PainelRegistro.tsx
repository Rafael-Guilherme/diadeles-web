import { useState, type ReactNode } from 'react';
import { Baby, Droplets, Moon, Smile, Sparkles, Utensils, NotebookPen } from 'lucide-react';
import type { TipoRegistro } from '@/shared/offline/fila';
import { Botao } from '@/shared/ui/componentes';

export const ICONES_TIPO: Record<TipoRegistro, ReactNode> = {
  ALIMENTACAO: <Utensils size={16} />,
  SONO: <Moon size={16} />,
  HIGIENE: <Baby size={16} />,
  HIDRATACAO: <Droplets size={16} />,
  HUMOR: <Smile size={16} />,
  ATIVIDADE: <Sparkles size={16} />,
  OBSERVACAO: <NotebookPen size={16} />,
};

/**
 * Os cinco campos da BNCC, em rótulo curto.
 *
 * O nome oficial de cada campo é uma frase — "Espaços, tempos, quantidades,
 * relações e transformações" — que não cabe num botão de tela de celular. O
 * nome inteiro aparece no parecer, que é onde ele importa.
 */
const CAMPOS_BNCC: [string, string][] = [
  ['', 'Nenhum'],
  ['EU_OUTRO_NOS', 'Eu, o outro e o nós'],
  ['CORPO_GESTOS_MOVIMENTOS', 'Corpo e movimento'],
  ['TRACOS_SONS_CORES_FORMAS', 'Traços, sons e cores'],
  ['ESCUTA_FALA_PENSAMENTO_IMAGINACAO', 'Escuta, fala e imaginação'],
  ['ESPACOS_TEMPOS_QUANTIDADES', 'Espaços e quantidades'],
];

export const ROTULOS_TIPO: Record<TipoRegistro, string> = {
  ALIMENTACAO: 'Refeição',
  SONO: 'Sono',
  HIGIENE: 'Fralda',
  HIDRATACAO: 'Água',
  HUMOR: 'Humor',
  ATIVIDADE: 'Atividade',
  OBSERVACAO: 'Recado',
};

/**
 * Preenchimento do lote. Poucas opções, alvos grandes, uma decisão por tela —
 * quem usa isso está de pé, com uma criança no colo.
 */
export function PainelRegistro({
  tipo,
  quantidade,
  aoFechar,
  aoConfirmar,
}: {
  tipo: TipoRegistro;
  quantidade: number;
  aoFechar: () => void;
  aoConfirmar: (tipo: TipoRegistro, dados: unknown, observacao?: string) => Promise<void>;
}) {
  const [dados, setDados] = useState<Record<string, unknown>>(() => valorInicial(tipo));
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);

  /*
   * Dois tipos precisam de texto para existir: a API monta a frase da linha do
   * tempo a partir dele (`timeline.ts`), então sem título ou sem recado a
   * família receberia um item em branco no dia da criança.
   */
  const completo =
    tipo === 'ATIVIDADE'
      ? String(dados.titulo ?? '').trim().length > 0
      : tipo === 'OBSERVACAO'
        ? String(dados.texto ?? '').trim().length > 0
        : true;

  async function confirmar() {
    setSalvando(true);
    await aoConfirmar(
      tipo,
      // O texto livre chega com espaços do teclado do celular; a frase que a
      // família lê não deve começar com eles.
      tipo === 'ATIVIDADE'
        ? { ...dados, titulo: String(dados.titulo).trim() }
        : tipo === 'OBSERVACAO'
          ? { texto: String(dados.texto).trim() }
          : dados,
      observacao.trim() || undefined,
    );
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end bg-black/40" onClick={aoFechar}>
      <div
        className="area-segura-base w-full rounded-t-3xl bg-white px-5 pt-5"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-neutral-300" />

        <h2 className="text-lg font-bold">{ROTULOS_TIPO[tipo]}</h2>
        <p className="mb-4 text-sm text-[color:var(--color-tinta-suave)]">
          Vale para {quantidade} {quantidade === 1 ? 'criança selecionada' : 'crianças selecionadas'}.
        </p>

        <div className="space-y-4 pb-2">
          {tipo === 'ALIMENTACAO' && (
            <>
              <Escolha
                rotulo="Refeição"
                opcoes={[
                  ['CAFE_MANHA', 'Café'],
                  ['LANCHE_MANHA', 'Lanche manhã'],
                  ['ALMOCO', 'Almoço'],
                  ['LANCHE_TARDE', 'Lanche tarde'],
                ]}
                valor={String(dados.refeicao)}
                aoEscolher={(v) => setDados({ ...dados, refeicao: v })}
              />
              <Escolha
                rotulo="Aceitação"
                opcoes={[
                  ['TUDO', 'Comeu tudo'],
                  ['METADE', 'Metade'],
                  ['POUCO', 'Pouco'],
                  ['RECUSOU', 'Recusou'],
                ]}
                valor={String(dados.aceitacao)}
                aoEscolher={(v) => setDados({ ...dados, aceitacao: v })}
              />
            </>
          )}

          {tipo === 'SONO' && (
            <Escolha
              rotulo="Como dormiu"
              opcoes={[
                ['TRANQUILO', 'Tranquilo'],
                ['AGITADO', 'Agitado'],
                ['NAO_DORMIU', 'Não dormiu'],
              ]}
              valor={String(dados.qualidade)}
              aoEscolher={(v) => setDados({ ...dados, qualidade: v })}
            />
          )}

          {tipo === 'HIGIENE' && (
            <>
              <Escolha
                rotulo="Onde"
                opcoes={[
                  ['FRALDA', 'Fralda'],
                  ['BANHEIRO', 'Banheiro'],
                ]}
                valor={String(dados.tipo)}
                aoEscolher={(v) => setDados({ ...dados, tipo: v })}
              />
              <div className="flex gap-2">
                <Alternador
                  rotulo="Xixi"
                  ativo={Boolean(dados.urina)}
                  aoAlternar={() => setDados({ ...dados, urina: !dados.urina })}
                />
                <Alternador
                  rotulo="Cocô"
                  ativo={Boolean(dados.evacuacao)}
                  aoAlternar={() => setDados({ ...dados, evacuacao: !dados.evacuacao })}
                />
                <Alternador
                  rotulo="Trocou roupa"
                  ativo={Boolean(dados.trocaRoupa)}
                  aoAlternar={() => setDados({ ...dados, trocaRoupa: !dados.trocaRoupa })}
                />
              </div>
            </>
          )}

          {tipo === 'HUMOR' && (
            <Escolha
              rotulo="Como estava"
              opcoes={[
                ['FELIZ', 'Alegre'],
                ['TRANQUILO', 'Tranquila'],
                ['CHOROSO', 'Chorosa'],
                ['IRRITADO', 'Irritada'],
                ['SONOLENTO', 'Com sono'],
                ['ADOENTADO', 'Adoentada'],
              ]}
              valor={String(dados.humor)}
              aoEscolher={(v) => setDados({ ...dados, humor: v })}
            />
          )}

          {tipo === 'HIDRATACAO' && (
            /* Em ml e por toque: a quantidade que importa para a família é a
               ordem de grandeza, não o número exato, e teclado numérico numa
               tela de lote custaria mais que o dado vale. */
            <Escolha
              rotulo="Quanto bebeu"
              opcoes={[
                ['100', '100 ml'],
                ['150', '150 ml'],
                ['200', '200 ml'],
                ['250', '250 ml'],
              ]}
              valor={String(dados.quantidadeMl)}
              aoEscolher={(v) => setDados({ ...dados, quantidadeMl: Number(v) })}
            />
          )}

          {tipo === 'ATIVIDADE' && (
            <>
              {/* O título vira a frase que a família lê na linha do tempo — sem
                  ele o dia da criança mostraria um item em branco. */}
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">Qual foi a atividade</span>
                <input
                  value={String(dados.titulo ?? '')}
                  onChange={(evento) => setDados({ ...dados, titulo: evento.target.value })}
                  placeholder="Pintura com guache"
                  className="min-h-11 w-full rounded-(--raio) border border-[color:var(--color-borda)] px-3 text-[16px] outline-none focus:border-(color:--cor-acao)"
                />
              </label>
              <Escolha
                rotulo="Como participou"
                opcoes={[
                  ['PARTICIPOU', 'Participou'],
                  ['PARCIAL', 'Em parte'],
                  ['NAO_PARTICIPOU', 'Não quis'],
                ]}
                valor={String(dados.participacao)}
                aoEscolher={(v) => setDados({ ...dados, participacao: v })}
              />

              {/*
                O toque que faz o parecer do semestre se escrever sozinho.
                Sem o campo de experiência, a atividade fica sem lugar no
                relatório de desenvolvimento — e a coordenação volta a redigir
                cinco seções de memória em dezembro (docs/plano-produto.md §1).
                Opcional de propósito: brincadeira livre não precisa entrar em
                campo nenhum, e um campo obrigatório seria preenchido no chute.
              */}
              <Escolha
                rotulo="Campo de experiência (BNCC)"
                opcoes={CAMPOS_BNCC}
                valor={String(dados.campoExperiencia ?? '')}
                aoEscolher={(v) =>
                  setDados({ ...dados, campoExperiencia: v === '' ? null : v })
                }
              />
            </>
          )}

          {tipo === 'OBSERVACAO' ? (
            /* Aqui o texto é o registro, não um complemento dele: por isso
               substitui o campo de observação em vez de conviver com ele. */
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">O recado</span>
              <textarea
                value={String(dados.texto ?? '')}
                onChange={(evento) => setDados({ ...dados, texto: evento.target.value })}
                rows={3}
                placeholder="Levou a touca para casa; devolver amanhã"
                className="w-full resize-none rounded-(--raio) border border-[color:var(--color-borda)] px-3 py-2 text-[16px] outline-none focus:border-(color:--cor-acao)"
              />
            </label>
          ) : (
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Observação (opcional)</span>
            <textarea
              value={observacao}
              onChange={(evento) => setObservacao(evento.target.value)}
              rows={2}
              placeholder="Algo que a família precisa saber"
              className="w-full resize-none rounded-(--raio) border border-[color:var(--color-borda)] px-3 py-2 text-sm outline-none focus:border-(color:--cor-acao)"
            />
          </label>
          )}
        </div>

        <div className="flex gap-2 py-4">
          <Botao variante="secundario" onClick={aoFechar} className="flex-1">
            Cancelar
          </Botao>
          <Botao
            onClick={() => void confirmar()}
            disabled={salvando || !completo}
            className="flex-[2]"
          >
            {salvando ? 'Salvando…' : `Registrar para ${quantidade}`}
          </Botao>
        </div>
      </div>
    </div>
  );
}

function Escolha({
  rotulo,
  opcoes,
  valor,
  aoEscolher,
}: {
  rotulo: string;
  opcoes: [string, string][];
  valor: string;
  aoEscolher: (valor: string) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold">{rotulo}</p>
      <div className="flex flex-wrap gap-2">
        {opcoes.map(([chave, texto]) => (
          <button
            key={chave}
            onClick={() => aoEscolher(chave)}
            className={`min-h-10 rounded-(--raio) border px-3 text-sm font-medium ${
              valor === chave
                ? 'border-(color:--cor-acao) bg-(color:--cor-acao) text-white'
                : 'border-[color:var(--color-borda)] bg-white'
            }`}
          >
            {texto}
          </button>
        ))}
      </div>
    </div>
  );
}

function Alternador({
  rotulo,
  ativo,
  aoAlternar,
}: {
  rotulo: string;
  ativo: boolean;
  aoAlternar: () => void;
}) {
  return (
    <button
      onClick={aoAlternar}
      className={`min-h-10 flex-1 rounded-(--raio) border px-3 text-sm font-medium ${
        ativo
          ? 'border-(color:--cor-acao) bg-(color:--cor-acao) text-white'
          : 'border-[color:var(--color-borda)] bg-white'
      }`}
    >
      {rotulo}
    </button>
  );
}

function valorInicial(tipo: TipoRegistro): Record<string, unknown> {
  switch (tipo) {
    case 'ALIMENTACAO':
      return { refeicao: 'ALMOCO', aceitacao: 'TUDO', itens: [] };
    case 'SONO': {
      const agora = new Date();
      const inicio = new Date(agora.getTime() - 60 * 60 * 1000);
      return { inicio: inicio.toISOString(), fim: agora.toISOString(), qualidade: 'TRANQUILO' };
    }
    case 'HIGIENE':
      return { tipo: 'FRALDA', urina: true, evacuacao: false, trocaRoupa: false };
    case 'HIDRATACAO':
      return { quantidadeMl: 150 };
    case 'HUMOR':
      return { humor: 'FELIZ' };
    case 'ATIVIDADE':
      return { titulo: '', campoExperiencia: null, participacao: 'PARTICIPOU' };
    default:
      return { texto: '' };
  }
}
