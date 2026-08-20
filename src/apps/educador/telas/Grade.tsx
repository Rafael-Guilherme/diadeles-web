import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ClipboardList, FileText, Pill, ScrollText, UserCheck } from 'lucide-react';
import { api } from '@/shared/api/cliente';
import { fila, type TipoRegistro } from '@/shared/offline/fila';
import { sincronizar, notificarMudancaNaFila } from '@/shared/offline/sincronizador';
import { Botao, Carregando, Etiqueta, RotuloSecao, Vazio } from '@/shared/ui/componentes';
import { Cabecalho } from '../componentes/Cabecalho';
import { PainelRegistro, ICONES_TIPO, ROTULOS_TIPO } from '../componentes/PainelRegistro';
import { Recados } from '../componentes/Recados';

/**
 * A tela principal do educador.
 *
 * A cardinalidade aqui é 1 educador → 20 crianças, não 1 para 1: por isso a
 * unidade de trabalho é a turma inteira e o registro é em lote. Se cada
 * lançamento exigisse abrir a ficha de uma criança, o app seria abandonado na
 * primeira semana (docs/plano-produto.md §2).
 */
export function Grade() {
  const { turmaId = '' } = useParams();
  const clienteQuery = useQueryClient();
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const [tipoAberto, setTipoAberto] = useState<TipoRegistro | null>(null);
  const [recemRegistrados, setRecemRegistrados] = useState<Record<string, TipoRegistro[]>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['grade', turmaId],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/turmas/{id}/grade', {
        params: { path: { id: turmaId } },
      });
      if (error) throw error;
      return data;
    },
  });

  const presentes = useMemo(
    () => data?.criancas.filter((c) => !c.ausente) ?? [],
    [data?.criancas],
  );

  function alternar(criancaId: string) {
    setSelecionadas((atual) => {
      const proxima = new Set(atual);
      if (proxima.has(criancaId)) proxima.delete(criancaId);
      else proxima.add(criancaId);
      return proxima;
    });
  }

  function selecionarTodas() {
    setSelecionadas(
      selecionadas.size === presentes.length ? new Set() : new Set(presentes.map((c) => c.id)),
    );
  }

  /**
   * Grava na fila local e devolve o controle na hora. A UI não espera rede:
   * o educador registra a turma inteira em segundos, com ou sem internet.
   */
  async function registrarEmLote(tipo: TipoRegistro, dados: unknown, observacao?: string) {
    const alvos = [...selecionadas];
    const agora = new Date().toISOString();

    await fila.enfileirarVarios(
      alvos.map((criancaId) => ({
        criancaId,
        turmaId,
        tipo,
        ocorridoEm: agora,
        dados,
        observacao: observacao ?? null,
      })),
    );

    // Marca visualmente antes de qualquer confirmação do servidor.
    setRecemRegistrados((atual) => {
      const proximo = { ...atual };
      for (const id of alvos) proximo[id] = [...(proximo[id] ?? []), tipo];
      return proximo;
    });

    setSelecionadas(new Set());
    setTipoAberto(null);
    notificarMudancaNaFila();

    void sincronizar().then(() => {
      void clienteQuery.invalidateQueries({ queryKey: ['grade', turmaId] });
    });
  }

  if (isLoading) {
    return (
      <>
        <Cabecalho titulo="Carregando…" voltarPara="/" />
        <Carregando texto="Montando a grade do dia…" />
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Cabecalho titulo="Turma" voltarPara="/" />
        <Vazio titulo="Não consegui carregar a turma" descricao="Verifique sua conexão." />
      </>
    );
  }

  const totalSelecionadas = selecionadas.size;

  return (
    <div className="min-h-full pb-40">
      <Cabecalho
        titulo={data.turma.nome}
        subtitulo={`${data.criancas.length} crianças · ${data.completas} com rotina completa`}
        voltarPara="/"
      />

      <div className="flex gap-2 px-4 py-3">
        <Link to={`/turma/${turmaId}/chamada`} className="flex-1">
          <Botao variante="secundario" bloco>
            <UserCheck size={16} /> Chamada
          </Botao>
        </Link>
        <Link to={`/turma/${turmaId}/pendencias`} className="flex-1">
          <Botao variante="secundario" bloco>
            <ClipboardList size={16} /> Fechar turno
          </Botao>
        </Link>
      </div>

      {/* Fora da linha de cima de propósito: chamada e fechamento são do dia,
          e o parecer é do semestre — misturá-los na mesma fileira sugeriria uma
          rotina que não existe. */}
      <div className="px-4 pb-1">
        <Link to={`/turma/${turmaId}/pareceres`}>
          <Botao variante="fantasma" bloco>
            <ScrollText size={16} /> Pareceres do semestre
          </Botao>
        </Link>
      </div>

      <div className="px-4 pb-1">
        <Recados turmaId={turmaId} />
      </div>

      <div className="px-4 pb-2">
        <RotuloSecao
          apoio={
            // `py-3 -my-3` amplia a área de toque para 44px sem empurrar o
            // layout: o texto continua alinhado ao rótulo ao lado.
            <button
              onClick={selecionarTodas}
              className="-my-3 py-3 text-sm font-semibold text-(color:--cor-acao)"
            >
              {totalSelecionadas === presentes.length ? 'Limpar' : 'Selecionar todas'}
            </button>
          }
        >
          Toque para selecionar
        </RotuloSecao>
      </div>

      <ul className="space-y-(--gap-lista) px-4">
        {data.criancas.map((crianca) => {
          const selecionada = selecionadas.has(crianca.id);
          const extras = recemRegistrados[crianca.id] ?? [];
          const tiposFeitos = [
            ...new Set([...crianca.registros.map((r) => r.tipo as TipoRegistro), ...extras]),
          ];

          return (
            <li key={crianca.id} className="relative">
              {/* O atalho para a ficha fica fora do botão de seleção, não
                  dentro: link aninhado em botão é HTML inválido, e o toque
                  disputaria com a seleção — que é o gesto que o educador repete
                  vinte vezes por turno. */}
              <Link
                to={`/turma/${turmaId}/crianca/${crianca.id}`}
                aria-label={`Abrir a ficha de ${crianca.nomeSocial ?? crianca.nome}`}
                className="absolute right-1 top-1 z-10 flex h-10 w-10 items-center justify-center rounded-full text-[color:var(--color-tinta-tenue)] transition active:bg-neutral-100"
              >
                <FileText size={16} />
              </Link>

              <button
                onClick={() => !crianca.ausente && alternar(crianca.id)}
                disabled={crianca.ausente}
                className={`w-full rounded-(--raio-lg) border p-3 pr-12 text-left transition ${
                  crianca.ausente
                    ? 'border-[color:var(--color-borda)] bg-neutral-50 opacity-60'
                    : selecionada
                      ? 'border-(color:--cor-acao) bg-(color:--cor-acao-suave)'
                      : 'border-[color:var(--color-borda)] bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-xs font-bold ${
                      selecionada
                        ? 'border-(color:--cor-acao) bg-(color:--cor-acao) text-white'
                        : 'border-neutral-300'
                    }`}
                  >
                    {selecionada ? '✓' : ''}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-semibold">{crianca.nomeSocial ?? crianca.nome}</span>
                      <span className="text-xs text-[color:var(--color-tinta-suave)]">
                        {crianca.idade}
                      </span>
                      {crianca.ausente && <Etiqueta>ausente</Etiqueta>}
                      {crianca.semPresenca && !crianca.ausente && (
                        <Etiqueta tom="alerta">sem chamada</Etiqueta>
                      )}
                      {crianca.temMedicacaoHoje && (
                        <Etiqueta tom="marca">
                          <Pill size={11} /> medicação
                        </Etiqueta>
                      )}
                    </div>

                    {crianca.alergias.length > 0 && (
                      <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-[color:var(--color-alerta)]">
                        <AlertTriangle size={12} /> Alergia: {crianca.alergias.join(', ')}
                      </p>
                    )}

                    {!crianca.ausente && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {tiposFeitos.map((tipo) => (
                          <span
                            key={tipo}
                            title={ROTULOS_TIPO[tipo]}
                            className="flex h-6 w-6 items-center justify-center rounded-md bg-[color:var(--color-ok-suave)] text-[color:var(--color-ok)]"
                          >
                            {ICONES_TIPO[tipo]}
                          </span>
                        ))}
                        {crianca.pendencias.map((tipo) => (
                          <span
                            key={tipo}
                            title={`Falta: ${ROTULOS_TIPO[tipo as TipoRegistro]}`}
                            className="flex h-6 w-6 items-center justify-center rounded-md border border-dashed border-neutral-300 text-neutral-400"
                          >
                            {ICONES_TIPO[tipo as TipoRegistro]}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {totalSelecionadas > 0 && (
        <div
          className="area-segura-base fixed inset-x-0 bottom-0 z-20 border-t border-[color:var(--color-borda)] bg-white px-4 pt-3"
          style={{ boxShadow: 'var(--sombra-elevada)' }}
        >
          <p className="numerico pb-2 text-sm font-semibold">
            {totalSelecionadas} {totalSelecionadas === 1 ? 'criança' : 'crianças'} · registrar
          </p>
          <div className="grid grid-cols-4 gap-2">
            {/* Quem manda aqui é a escola, não esta tela: a API devolve os tipos
                que ela pratica, na ordem em que o educador decorou os botões.
                Uma creche que não usa o campo de fralda não vê o botão — e
                também não recebe pendência de higiene no fim do turno. */}
            {data.registrosHabilitados.map((tipo) => (
              <button
                key={tipo}
                onClick={() => setTipoAberto(tipo as TipoRegistro)}
                className="flex flex-col items-center gap-1 rounded-(--raio) border border-[color:var(--color-borda)] py-2.5 text-xs font-semibold active:bg-neutral-50"
              >
                {ICONES_TIPO[tipo as TipoRegistro]}
                {ROTULOS_TIPO[tipo as TipoRegistro]}
              </button>
            ))}
          </div>
        </div>
      )}

      {tipoAberto && (
        <PainelRegistro
          tipo={tipoAberto}
          quantidade={totalSelecionadas}
          aoFechar={() => setTipoAberto(null)}
          aoConfirmar={registrarEmLote}
        />
      )}
    </div>
  );
}
