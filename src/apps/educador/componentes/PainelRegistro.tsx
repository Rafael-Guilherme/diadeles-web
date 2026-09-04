import { useState, type ReactNode } from 'react';
import { Baby, Droplets, Moon, Smile, Sparkles, Utensils, NotebookPen } from 'lucide-react';
import type { TipoRegistro } from '@/shared/offline/fila';
import { Aviso, Botao, Opcoes, RotuloCampo } from '@/shared/ui/componentes';

export const ICONES_TIPO: Record<TipoRegistro, ReactNode> = {
  ALIMENTACAO: <Utensils size={16} />,
  SONO: <Moon size={16} />,
  HIGIENE: <Baby size={16} />,
  HIDRATACAO: <Droplets size={16} />,
  HUMOR: <Smile size={16} />,
  ATIVIDADE: <Sparkles size={16} />,
  OBSERVACAO: <NotebookPen size={16} />,
};

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
 * Três letras por coluna da grade.
 *
 * A coluna tem 40px: o rótulo inteiro não cabe, e abreviar por conta própria
 * daria "REF" em uma tela e "ALI" em outra. O `title` da coluna e o texto para
 * leitor de tela continuam com o nome por extenso.
 */
export const SIGLAS_TIPO: Record<TipoRegistro, string> = {
  ALIMENTACAO: 'REF',
  SONO: 'SON',
  HIGIENE: 'FRA',
  HIDRATACAO: 'ÁGU',
  HUMOR: 'HUM',
  ATIVIDADE: 'ATV',
  OBSERVACAO: 'REC',
};

/**
 * Os cinco campos da BNCC, em rótulo curto.
 *
 * O nome oficial de cada campo é uma frase — "Espaços, tempos, quantidades,
 * relações e transformações" — que não cabe num botão de tela de celular. O
 * nome inteiro aparece no parecer, que é onde ele importa.
 */
const CAMPOS_BNCC = [
  { valor: '', texto: 'Nenhum' },
  { valor: 'EU_OUTRO_NOS', texto: 'Eu, o outro e o nós' },
  { valor: 'CORPO_GESTOS_MOVIMENTOS', texto: 'Corpo e movimento' },
  { valor: 'TRACOS_SONS_CORES_FORMAS', texto: 'Traços, sons e cores' },
  { valor: 'ESCUTA_FALA_PENSAMENTO_IMAGINACAO', texto: 'Escuta, fala e imaginação' },
  { valor: 'ESPACOS_TEMPOS_QUANTIDADES', texto: 'Espaços e quantidades' },
] as const;

export interface RestricaoDoLote {
  nome: string;
  itens: string[];
}

/**
 * A folha que sobe do rodapé da grade.
 *
 * O tipo de registro é escolhido aqui dentro, não na barra de baixo: com a
 * seleção já feita, trocar "fralda" por "sono" é um toque, e não voltar,
 * desfazer e recomeçar. Poucas opções, alvos de 44px, uma decisão por bloco —
 * quem usa isto está de pé, com uma criança no colo.
 */
export function PainelRegistro({
  tiposHabilitados,
  nomes,
  restricoes,
  aoFechar,
  aoConfirmar,
}: {
  tiposHabilitados: TipoRegistro[];
  nomes: string[];
  restricoes: RestricaoDoLote[];
  aoFechar: () => void;
  aoConfirmar: (tipo: TipoRegistro, dados: unknown, observacao?: string) => Promise<void>;
}) {
  const [tipo, setTipo] = useState<TipoRegistro>(tiposHabilitados[0] ?? 'ALIMENTACAO');
  const [dados, setDados] = useState<Record<string, unknown>>(() => valorInicial(tiposHabilitados[0] ?? 'ALIMENTACAO'));
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);

  const quantidade = nomes.length;

  function trocarTipo(novo: TipoRegistro) {
    setTipo(novo);
    setDados(valorInicial(novo));
  }

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
        className="area-segura-base flex max-h-[92vh] w-full flex-col gap-3.5 overflow-y-auto rounded-t-(--raio-lg) border-t border-[color:var(--color-borda-forte)] bg-[color:var(--color-papel)] px-3 pt-3"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="flex items-center gap-2.5">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold">Registrar em lote</h2>
            <p className="truncate text-xs text-[color:var(--color-tinta-tenue)]">
              {nomes.join(' · ')}
            </p>
          </div>
          <button
            onClick={aoFechar}
            aria-label="Fechar"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-(--raio) border border-[color:var(--color-borda-forte)] bg-white text-[color:var(--color-tinta-suave)]"
          >
            ✕
          </button>
        </div>

        <Opcoes
          rotulo="Tipo de registro"
          opcoes={tiposHabilitados.map((t) => ({ valor: t, texto: ROTULOS_TIPO[t] }))}
          valor={tipo}
          aoEscolher={trocarTipo}
        />

        {tipo === 'ALIMENTACAO' && (
          <>
            <Opcoes
              rotulo="Refeição"
              opcoes={[
                { valor: 'CAFE_MANHA', texto: 'Café' },
                { valor: 'LANCHE_MANHA', texto: 'Lanche manhã' },
                { valor: 'ALMOCO', texto: 'Almoço' },
                { valor: 'LANCHE_TARDE', texto: 'Lanche tarde' },
              ]}
              valor={String(dados.refeicao)}
              aoEscolher={(v) => setDados({ ...dados, refeicao: v })}
            />
            <Opcoes
              rotulo="Quanto comeu"
              colunas={4}
              opcoes={[
                { valor: 'RECUSOU', texto: 'Nada' },
                { valor: 'POUCO', texto: 'Pouco' },
                { valor: 'METADE', texto: 'Metade' },
                { valor: 'TUDO', texto: 'Tudo' },
              ]}
              valor={String(dados.aceitacao)}
              aoEscolher={(v) => setDados({ ...dados, aceitacao: v })}
            />
          </>
        )}

        {tipo === 'SONO' && (
          <Opcoes
            rotulo="Como dormiu"
            opcoes={[
              { valor: 'TRANQUILO', texto: 'Tranquilo' },
              { valor: 'AGITADO', texto: 'Agitado' },
              { valor: 'NAO_DORMIU', texto: 'Não dormiu' },
            ]}
            valor={String(dados.qualidade)}
            aoEscolher={(v) => setDados({ ...dados, qualidade: v })}
          />
        )}

        {tipo === 'HIGIENE' && (
          <>
            <Opcoes
              rotulo="Onde"
              opcoes={[
                { valor: 'FRALDA', texto: 'Fralda' },
                { valor: 'BANHEIRO', texto: 'Banheiro' },
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
          <Opcoes
            rotulo="Como estava"
            opcoes={[
              { valor: 'FELIZ', texto: 'Alegre' },
              { valor: 'TRANQUILO', texto: 'Tranquila' },
              { valor: 'CHOROSO', texto: 'Chorosa' },
              { valor: 'IRRITADO', texto: 'Irritada' },
              { valor: 'SONOLENTO', texto: 'Com sono' },
              { valor: 'ADOENTADO', texto: 'Adoentada' },
            ]}
            valor={String(dados.humor)}
            aoEscolher={(v) => setDados({ ...dados, humor: v })}
          />
        )}

        {tipo === 'HIDRATACAO' && (
          /* Em ml e por toque: a quantidade que importa para a família é a
             ordem de grandeza, não o número exato, e teclado numérico numa
             tela de lote custaria mais que o dado vale. */
          <Opcoes
            rotulo="Quanto bebeu"
            colunas={4}
            opcoes={[
              { valor: '100', texto: '100 ml' },
              { valor: '150', texto: '150 ml' },
              { valor: '200', texto: '200 ml' },
              { valor: '250', texto: '250 ml' },
            ]}
            valor={String(dados.quantidadeMl)}
            aoEscolher={(v) => setDados({ ...dados, quantidadeMl: Number(v) })}
          />
        )}

        {tipo === 'ATIVIDADE' && (
          <>
            {/* O título vira a frase que a família lê na linha do tempo — sem
                ele o dia da criança mostraria um item em branco. */}
            <label className="block space-y-1.5">
              <RotuloCampo>Qual foi a atividade</RotuloCampo>
              <input
                value={String(dados.titulo ?? '')}
                onChange={(evento) => setDados({ ...dados, titulo: evento.target.value })}
                placeholder="Pintura com guache"
                className="w-full rounded-(--raio) border border-[color:var(--color-borda-forte)] bg-white px-3 text-[16px] outline-none focus:border-(color:--cor-acao)"
                style={{ minHeight: 'var(--altura-controle)' }}
              />
            </label>
            <Opcoes
              rotulo="Como participou"
              opcoes={[
                { valor: 'PARTICIPOU', texto: 'Participou' },
                { valor: 'PARCIAL', texto: 'Em parte' },
                { valor: 'NAO_PARTICIPOU', texto: 'Não quis' },
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
            <Opcoes
              rotulo="Campo de experiência (BNCC)"
              opcoes={CAMPOS_BNCC}
              valor={String(dados.campoExperiencia ?? '')}
              aoEscolher={(v) => setDados({ ...dados, campoExperiencia: v === '' ? null : v })}
            />
          </>
        )}

        {tipo === 'OBSERVACAO' ? (
          /* Aqui o texto é o registro, não um complemento dele: por isso
             substitui o campo de observação em vez de conviver com ele. */
          <label className="block space-y-1.5">
            <RotuloCampo>O recado</RotuloCampo>
            <textarea
              value={String(dados.texto ?? '')}
              onChange={(evento) => setDados({ ...dados, texto: evento.target.value })}
              rows={3}
              placeholder="Levou a touca para casa; devolver amanhã"
              className="w-full resize-none rounded-(--raio) border border-[color:var(--color-borda-forte)] bg-white px-3 py-2.5 text-[16px] outline-none focus:border-(color:--cor-acao)"
            />
          </label>
        ) : (
          <label className="block space-y-1.5">
            <RotuloCampo>
              Observação · opcional, vai para {quantidade === 1 ? 'a família' : `as ${quantidade} famílias`}
            </RotuloCampo>
            <textarea
              value={observacao}
              onChange={(evento) => setObservacao(evento.target.value)}
              rows={2}
              placeholder="Ex.: pediu repetição"
              className="w-full resize-none rounded-(--raio) border border-[color:var(--color-borda-forte)] bg-white px-3 py-2.5 text-[16px] outline-none focus:border-(color:--cor-acao)"
            />
          </label>
        )}

        {/* A restrição aparece no momento em que a decisão é tomada — é o
            único instante em que o registro em lote pode errar feio (5d). */}
        {tipo === 'ALIMENTACAO' && restricoes.length > 0 && (
          <Aviso
            titulo={`${restricoes.length} das ${quantidade} crianças ${restricoes.length === 1 ? 'tem' : 'têm'} restrição`}
          >
            {restricoes.map((r) => (
              <p key={r.nome}>
                <strong className="text-[color:var(--color-alerta)]">
                  {r.nome} · {r.itens.join(', ')}.
                </strong>{' '}
                Confira o prato antes de aplicar.
              </p>
            ))}
          </Aviso>
        )}

        <div className="pb-3">
          <Botao
            bloco
            onClick={() => void confirmar()}
            disabled={salvando || !completo || quantidade === 0}
          >
            {salvando
              ? 'Salvando…'
              : `Aplicar a ${quantidade} ${quantidade === 1 ? 'criança' : 'crianças'}`}
          </Botao>
        </div>
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
      aria-pressed={ativo}
      className={`flex-1 rounded-(--raio) border px-3 text-base font-medium ${
        ativo
          ? 'border-(color:--cor-acao) bg-(color:--cor-acao) font-semibold text-white'
          : 'border-[color:var(--color-borda-forte)] bg-white'
      }`}
      style={{ minHeight: 'var(--altura-controle)' }}
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
