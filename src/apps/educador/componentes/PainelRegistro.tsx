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

  async function confirmar() {
    setSalvando(true);
    await aoConfirmar(tipo, dados, observacao.trim() || undefined);
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

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Observação (opcional)</span>
            <textarea
              value={observacao}
              onChange={(evento) => setObservacao(evento.target.value)}
              rows={2}
              placeholder="Algo que a família precisa saber"
              className="w-full resize-none rounded-xl border border-[color:var(--color-borda)] px-3 py-2 text-sm outline-none focus:border-[--cor-acao]"
            />
          </label>
        </div>

        <div className="flex gap-2 py-4">
          <Botao variante="secundario" onClick={aoFechar} className="flex-1">
            Cancelar
          </Botao>
          <Botao onClick={() => void confirmar()} disabled={salvando} className="flex-[2]">
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
            className={`min-h-10 rounded-xl border px-3 text-sm font-medium ${
              valor === chave
                ? 'border-[--cor-acao] bg-[--cor-acao] text-white'
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
      className={`min-h-10 flex-1 rounded-xl border px-3 text-sm font-medium ${
        ativo
          ? 'border-[--cor-acao] bg-[--cor-acao] text-white'
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
      return { titulo: '', participacao: 'PARTICIPOU' };
    default:
      return { texto: '' };
  }
}
