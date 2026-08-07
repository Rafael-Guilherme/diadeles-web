import { useQuery } from '@tanstack/react-query';
import { Check, CircleSlash, Copy } from 'lucide-react';
import { useState } from 'react';
import { api } from '@/shared/api/cliente';
import { Cartao, Carregando, Etiqueta, RotuloSecao, Vazio } from '@/shared/ui/componentes';
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

/**
 * Acesso das famílias — a régua de instalação do app.
 *
 * A lista de quem ainda não entrou vem primeiro de propósito. Família que não
 * instalou não recebe nada do que a escola registra, conclui que o produto não
 * entrega, e é ela quem a escola cita quando decide não renovar
 * (docs/plano-produto.md §2). Convite emitido é meio caminho; app aberto é o
 * que conta.
 */
export function Acesso() {
  const convites = useQuery({
    queryKey: ['convites'],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/convites');
      if (error) throw error;

      // "Já expirou?" depende do relógio, e ler o relógio durante o render
      // daria um resultado que muda sem que nada tenha mudado. O momento certo
      // de decidir isso é quando a lista chega.
      const agora = Date.now();
      return data.map((convite) => ({
        ...convite,
        expirado: !convite.usadoEm && new Date(convite.expiraEm).getTime() < agora,
      }));
    },
  });

  const semAcesso = useQuery({
    queryKey: ['familias-sem-acesso'],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/familias-sem-acesso');
      if (error) throw error;
      return data;
    },
  });

  if (convites.isLoading || semAcesso.isLoading) {
    return (
      <>
        <Cabecalho titulo="Acesso das famílias" voltarPara="/gestao" />
        <Carregando />
      </>
    );
  }

  const pendentes = convites.data?.filter((c) => !c.usadoEm) ?? [];
  const usados = convites.data?.filter((c) => c.usadoEm) ?? [];
  const faltantes = semAcesso.data ?? [];

  return (
    <div className="min-h-full pb-10">
      <Cabecalho titulo="Acesso das famílias" voltarPara="/gestao" />

      <main className="space-y-5 px-4 py-4">
        <section className="space-y-2">
          <RotuloSecao>Ainda não entraram</RotuloSecao>

          {faltantes.length === 0 ? (
            <Cartao interno className="flex items-center gap-2.5">
              <Check size={18} className="shrink-0 text-[color:var(--color-ok)]" />
              <p className="text-sm text-[color:var(--color-tinta-suave)]">
                Todas as famílias já acessaram o app pelo menos uma vez.
              </p>
            </Cartao>
          ) : (
            <>
              <Cartao interno className="space-y-1">
                {faltantes.map((crianca) => (
                  <p key={crianca.id} className="text-sm">
                    · Família de {crianca.nome}
                  </p>
                ))}
              </Cartao>
              <p className="px-1 text-xs leading-relaxed text-[color:var(--color-tinta-tenue)]">
                {faltantes.length === 1
                  ? 'Esta família não vê nada do que é registrado.'
                  : `Estas ${faltantes.length} famílias não veem nada do que é registrado.`}{' '}
                Um convite entregue na porta resolve.
              </p>
            </>
          )}
        </section>

        <section className="space-y-2">
          <RotuloSecao>Convites emitidos</RotuloSecao>

          {pendentes.length === 0 && usados.length === 0 ? (
            <Vazio
              icone={<CircleSlash size={22} />}
              titulo="Nenhum convite emitido"
              descricao="O convite vira QR no mural ou link no grupo — é assim que a família entra."
            />
          ) : (
            <div className="space-y-(--gap-lista)">
              {[...pendentes, ...usados].map((convite) => (
                <LinhaConvite
                  key={convite.id}
                  codigo={convite.codigo}
                  crianca={convite.criancaNome}
                  vinculo={VINCULOS[convite.tipoVinculo] ?? convite.tipoVinculo}
                  usado={Boolean(convite.usadoEm)}
                  expirado={convite.expirado}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function LinhaConvite({
  codigo,
  crianca,
  vinculo,
  usado,
  expirado,
}: {
  codigo: string;
  crianca: string;
  vinculo: string;
  usado: boolean;
  expirado: boolean;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Navegador sem permissão de área de transferência: o código está na
      // tela e pode ser lido em voz alta, que é como a secretaria já faz.
    }
  }

  return (
    <Cartao interno className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{crianca}</p>
        <p className="truncate text-xs text-[color:var(--color-tinta-tenue)]">{vinculo}</p>
      </div>

      {usado ? (
        <Etiqueta tom="ok">
          <Check size={12} /> usado
        </Etiqueta>
      ) : expirado ? (
        <Etiqueta tom="alerta">expirado</Etiqueta>
      ) : (
        <button
          onClick={() => void copiar()}
          aria-label={`Copiar código ${codigo}`}
          className="numerico -my-2 flex min-h-11 shrink-0 items-center gap-1.5 rounded-(--raio) px-2 text-sm font-semibold tracking-wide text-(color:--cor-acao) transition active:bg-(color:--cor-acao-suave)"
        >
          {codigo}
          {copiado ? <Check size={14} /> : <Copy size={14} />}
        </button>
      )}
    </Cartao>
  );
}
