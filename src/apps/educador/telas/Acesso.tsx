import { useQuery } from '@tanstack/react-query';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { api } from '@/shared/api/cliente';
import { Carregando, Cartao, Etiqueta, Metrica, RotuloSecao, Vazio } from '@/shared/ui/componentes';
import { LayoutGestao, Tabela, Td, Th, Tr } from '../componentes/LayoutGestao';

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
      <LayoutGestao titulo="Acesso das famílias">
        <Carregando texto="Buscando os convites…" />
      </LayoutGestao>
    );
  }

  const pendentes = convites.data?.filter((c) => !c.usadoEm) ?? [];
  const usados = convites.data?.filter((c) => c.usadoEm) ?? [];
  const faltantes = semAcesso.data ?? [];

  return (
    <LayoutGestao
      titulo="Acesso das famílias"
      descricao={`${faltantes.length} ${faltantes.length === 1 ? 'criança' : 'crianças'} sem nenhum responsável ativo`}
    >
      <div className="space-y-5">
        {/* Os três números vêm antes da lista porque são a pergunta que a
            gestora faz: quantas famílias estão de fato vendo o app. */}
        <section className="grid grid-cols-3 gap-x-6 border-b border-[color:var(--color-borda)] pb-4">
          <Metrica rotulo="Convites usados" valor={usados.length} />
          <Metrica rotulo="Convite não aceito" valor={pendentes.length} tom={pendentes.length > 0 ? 'alerta' : 'neutro'} />
          <Metrica rotulo="Sem responsável" valor={faltantes.length} tom={faltantes.length > 0 ? 'alerta' : 'neutro'} />
        </section>

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
              <Tabela>
                <thead>
                  <tr>
                    <Th>Criança</Th>
                    <Th className="text-right">Situação</Th>
                  </tr>
                </thead>
                <tbody>
                  {faltantes.map((crianca) => (
                    <Tr key={crianca.id} atencao>
                      <Td className="font-semibold">{crianca.nome}</Td>
                      <Td className="text-right text-[color:var(--color-sol-700)]">sem acesso</Td>
                    </Tr>
                  ))}
                </tbody>
              </Tabela>
              <p className="text-xs leading-relaxed text-[color:var(--color-tinta-tenue)]">
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
              titulo="Nenhum convite emitido"
              descricao="O convite vira QR no mural ou link no grupo — é assim que a família entra."
            />
          ) : (
            <Tabela>
              <thead>
                <tr>
                  <Th>Criança</Th>
                  <Th>Responsável</Th>
                  <Th className="text-right">Código</Th>
                </tr>
              </thead>
              <tbody>
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
              </tbody>
            </Tabela>
          )}
        </section>
      </div>
    </LayoutGestao>
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
    <Tr atencao={!usado && !expirado}>
      <Td className="font-semibold">{crianca}</Td>
      <Td className="text-[color:var(--color-tinta-suave)]">{vinculo}</Td>
      <Td className="text-right">
        {usado ? (
          <Etiqueta tom="ok">
            <Check size={12} /> usado
          </Etiqueta>
        ) : expirado ? (
          <Etiqueta tom="alerta">expirado</Etiqueta>
        ) : (
          /* O código fica clicável e legível ao mesmo tempo: a secretaria
             tanto copia para o grupo quanto lê em voz alta na porta. */
          <button
            onClick={() => void copiar()}
            aria-label={`Copiar código ${codigo}`}
            className="numerico -my-1 inline-flex min-h-9 items-center gap-1.5 rounded-(--raio-sm) px-2 text-sm font-semibold tracking-wide text-(color:--cor-acao) transition active:bg-(color:--cor-acao-suave)"
          >
            {codigo}
            {copiado ? <Check size={14} /> : <Copy size={14} />}
          </button>
        )}
      </Td>
    </Tr>
  );
}
