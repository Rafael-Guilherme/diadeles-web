import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '@/shared/api/cliente';
import type { TipoRegistro } from '@/shared/offline/fila';
import { useFila } from '@/shared/offline/sincronizador';
import { fila } from '@/shared/offline/fila';
import { Aviso, Botao, Carregando, RotuloSecao, Vazio } from '@/shared/ui/componentes';
import { Cabecalho } from '../componentes/Cabecalho';
import { ROTULOS_TIPO } from '../componentes/PainelRegistro';

/**
 * Fechamento do turno: o que ainda falta registrar, agrupado por tipo.
 *
 * Por tipo e não por criança porque é assim que a educadora resolve — ela não
 * abre a Cecília, depois o Davi, depois a Isadora; ela seleciona as quatro que
 * faltam fralda e registra as quatro de uma vez. A lista por criança pedia
 * vinte toques para o que a grade faz em três.
 *
 * Criança ausente não aparece — cobrar registro de quem não veio é ruído, e
 * ruído faz o educador ignorar o indicador inteiro.
 */
export function Pendencias() {
  const { turmaId = '' } = useParams();
  const navegar = useNavigate();
  const estadoFila = useFila();
  const [errosNaFila, setErrosNaFila] = useState<{ clientId: string; erro?: string }[]>([]);

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

  useEffect(() => {
    void fila.comErro().then(setErrosNaFila);
  }, [estadoFila.comErro]);

  const fechar = useMutation({
    mutationFn: async () => {
      const { data, error } = await api.POST('/v1/turmas/{id}/fechar-turno', {
        params: { path: { id: turmaId } },
      });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading || !data) {
    return (
      <>
        <Cabecalho titulo="Fechar o turno" voltarPara={`/turma/${turmaId}`} />
        <Carregando texto="Conferindo o que falta…" />
      </>
    );
  }

  const presentes = data.criancas.filter((c) => !c.ausente);
  const completas = presentes.filter((c) => c.pendencias.length === 0).length;
  const semChamada = presentes.filter((c) => c.semPresenca);
  const comDose = presentes.filter((c) => c.temMedicacaoHoje);

  /** Uma linha por tipo, com quem falta — é a unidade de resolução. */
  const porTipo = (data.registrosHabilitados as TipoRegistro[])
    .map((tipo) => ({
      tipo,
      criancas: presentes.filter((c) => (c.pendencias as TipoRegistro[]).includes(tipo)),
    }))
    .filter((linha) => linha.criancas.length > 0)
    .sort((a, b) => b.criancas.length - a.criancas.length);

  const totalPendencias = porTipo.length + (semChamada.length > 0 ? 1 : 0);

  const resolvidos = [
    presentes.length - semChamada.length > 0 &&
      `Chamada de ${presentes.length - semChamada.length} ${presentes.length - semChamada.length === 1 ? 'criança' : 'crianças'}`,
    ...(data.registrosHabilitados as TipoRegistro[])
      .filter((tipo) => !porTipo.some((l) => l.tipo === tipo))
      .map((tipo) => `${ROTULOS_TIPO[tipo]} de ${presentes.length} ${presentes.length === 1 ? 'presente' : 'presentes'}`),
  ].filter(Boolean) as string[];

  return (
    <div className="flex min-h-full flex-col pb-28">
      <Cabecalho
        titulo="Fechar o turno"
        subtitulo={`${data.turma.nome} · ${data.turma.turno}`}
        voltarPara={`/turma/${turmaId}`}
      />

      <section className="border-b border-[color:var(--color-borda)] bg-white px-3 py-2.5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm">
            <strong className="numerico font-semibold">
              {completas} de {presentes.length}
            </strong>{' '}
            com o dia completo
          </p>
          <p className="numerico text-xs font-semibold text-[color:var(--color-sol-700)]">
            {totalPendencias === 0
              ? 'sem pendências'
              : `${totalPendencias} ${totalPendencias === 1 ? 'pendência' : 'pendências'}`}
          </p>
        </div>
        <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-[color:var(--color-sol-50)]">
          <span
            className="block h-full bg-[color:var(--color-marca-500)]"
            style={{ width: `${presentes.length ? (completas / presentes.length) * 100 : 100}%` }}
          />
        </div>
      </section>

      <main className="space-y-4 px-3 py-4">
        {errosNaFila.length > 0 && (
          <div className="space-y-2">
            <RotuloSecao>Não subiu e precisa de você</RotuloSecao>
            {errosNaFila.map((item) => (
              <Aviso
                key={item.clientId}
                titulo="Registro recusado pela escola"
                acao={
                  <Botao
                    variante="secundario"
                    tamanho="compacto"
                    onClick={() => void fila.descartar(item.clientId).then(() => setErrosNaFila([]))}
                  >
                    Descartar
                  </Botao>
                }
              >
                {item.erro}
              </Aviso>
            ))}
          </div>
        )}

        {totalPendencias === 0 && comDose.length === 0 ? (
          <Vazio
            titulo="Nada esperando você"
            descricao="Todas as crianças presentes têm a rotina registrada. Pode fechar o turno — as famílias recebem o resumo do dia."
          />
        ) : (
          <div className="space-y-2">
            <RotuloSecao>Resolva antes de fechar</RotuloSecao>

            {/* A dose vem primeiro e com marca de alerta: é a única pendência
                em que o erro tem consequência clínica, não pedagógica. */}
            {comDose.map((crianca) => (
              <Aviso
                key={crianca.id}
                titulo="Medicação prevista para hoje"
                acao={
                  <Link to={`/turma/${turmaId}/crianca/${crianca.id}`}>
                    <Botao variante="secundario" tamanho="compacto">Ver</Botao>
                  </Link>
                }
              >
                {crianca.nomeSocial ?? crianca.nome} · confira na ficha se a dose foi dada e
                registrada com a dupla checagem.
              </Aviso>
            ))}

            {semChamada.length > 0 && (
              <LinhaDePendencia
                titulo={`Sem chamada · ${semChamada.length} ${semChamada.length === 1 ? 'criança' : 'crianças'}`}
                nomes={semChamada.map((c) => c.nomeSocial ?? c.nome)}
                acao="Chamar"
                aoAgir={() => navegar(`/turma/${turmaId}/chamada`)}
              />
            )}

            {porTipo.map(({ tipo, criancas }) => (
              <LinhaDePendencia
                key={tipo}
                titulo={`${ROTULOS_TIPO[tipo]} sem registro · ${criancas.length} ${criancas.length === 1 ? 'criança' : 'crianças'}`}
                nomes={criancas.map((c) => c.nomeSocial ?? c.nome)}
                acao="Registrar"
                aoAgir={() => navegar(`/turma/${turmaId}`)}
              />
            ))}
          </div>
        )}

        {resolvidos.length > 0 && (
          <div className="space-y-2">
            <RotuloSecao>Já resolvido</RotuloSecao>
            <ul className="space-y-1">
              {resolvidos.map((texto) => (
                <li key={texto} className="flex items-center gap-2 text-sm">
                  <span
                    aria-hidden
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] bg-[color:var(--color-ok)] text-[10px] text-white"
                  >
                    ✓
                  </span>
                  {texto}
                </li>
              ))}
            </ul>
          </div>
        )}

        {fechar.data && (
          <Aviso tom="ok" titulo="Turno fechado">
            {fechar.data.familiasAvisadas > 0
              ? `${fechar.data.familiasAvisadas} ${
                  fechar.data.familiasAvisadas === 1 ? 'família recebeu' : 'famílias receberam'
                } o resumo do dia.`
              : 'As famílias já tinham recebido o resumo de hoje.'}
            {fechar.data.semResponsavel > 0 && (
              <>
                {' '}
                {fechar.data.semResponsavel}{' '}
                {fechar.data.semResponsavel === 1
                  ? 'criança ainda não tem responsável'
                  : 'crianças ainda não têm responsável'}{' '}
                com acesso ao app — a secretaria precisa enviar o convite.
              </>
            )}
          </Aviso>
        )}

        {fechar.isError && (
          <Aviso titulo="Não consegui fechar o turno">
            Verifique a conexão e tente de novo. Nada do que você registrou se perdeu.
          </Aviso>
        )}

        {estadoFila.pendentes > 0 && !fechar.data && (
          <p className="text-xs leading-relaxed text-[color:var(--color-tinta-suave)]">
            {estadoFila.pendentes}{' '}
            {estadoFila.pendentes === 1 ? 'registro ainda está' : 'registros ainda estão'} na fila.
            Sobem sozinhos e entram no dia da criança — mas não entram neste resumo. Se der, espere
            a fila zerar antes de fechar.
          </p>
        )}
      </main>

      {/* Fechar com pendência é permitido de propósito: uma criança sem sono
          registrado não pode impedir que as outras dezenove famílias saibam do
          dia. Um botão que só libera com tudo preenchido ensina a equipe a
          preencher qualquer coisa para liberá-lo. */}
      <div
        className="area-segura-base fixed inset-x-0 bottom-0 z-20 border-t border-[color:var(--color-borda-forte)] bg-[color:var(--color-papel)] px-3 pt-2.5"
        style={{ boxShadow: 'var(--sombra-elevada)' }}
      >
        <p className="pb-2 text-2xs leading-snug text-[color:var(--color-tinta-suave)]">
          Fechar com pendência é permitido — elas passam para o próximo turno com o seu nome.
        </p>
        <div className="flex gap-2">
          <Botao variante="secundario" onClick={() => navegar(`/turma/${turmaId}`)} className="flex-1">
            Voltar
          </Botao>
          <Botao
            className="flex-[2]"
            disabled={fechar.isPending || Boolean(fechar.data)}
            onClick={() => fechar.mutate()}
          >
            {fechar.isPending
              ? 'Enviando…'
              : fechar.data
                ? 'Turno fechado'
                : totalPendencias > 0
                  ? `Fechar turno · ${totalPendencias} ${totalPendencias === 1 ? 'pendência' : 'pendências'}`
                  : 'Fechar turno e avisar as famílias'}
          </Botao>
        </div>
      </div>
    </div>
  );
}

/**
 * Uma pendência de tipo, com quem falta e o botão que resolve.
 *
 * Os nomes ficam à vista, não atrás de um "ver quem": são três ou quatro, e
 * lê-los é o que faz a educadora lembrar que a Isadora chegou depois do lanche.
 */
function LinhaDePendencia({
  titulo,
  nomes,
  acao,
  aoAgir,
}: {
  titulo: string;
  nomes: string[];
  acao: string;
  aoAgir: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-(--raio) border border-[color:var(--color-borda)] bg-white p-(--padding-cartao)">
      <span
        aria-hidden
        className="h-4 w-4 shrink-0 rounded-[4px] border border-[color:var(--color-sol-300)] bg-[color:var(--color-sol-50)]"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{titulo}</p>
        <p className="truncate text-xs text-[color:var(--color-tinta-suave)]">{nomes.join(', ')}</p>
      </div>
      <Botao variante="secundario" tamanho="compacto" onClick={aoAgir}>
        {acao}
      </Botao>
    </div>
  );
}
