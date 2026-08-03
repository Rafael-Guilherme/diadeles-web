import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { api } from '@/shared/api/cliente';
import type { TipoRegistro } from '@/shared/offline/fila';
import { useFila } from '@/shared/offline/sincronizador';
import { fila } from '@/shared/offline/fila';
import { Aviso, Botao, Cartao, Carregando } from '@/shared/ui/componentes';
import { Cabecalho } from '../componentes/Cabecalho';
import { ROTULOS_TIPO } from '../componentes/PainelRegistro';
import { useEffect, useState } from 'react';

/**
 * Fechamento do turno: o que ainda falta registrar, criança a criança.
 *
 * Criança ausente não aparece — cobrar registro de quem não veio é ruído, e
 * ruído faz o educador ignorar o indicador inteiro.
 */
export function Pendencias() {
  const { turmaId = '' } = useParams();
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

  if (isLoading || !data) {
    return (
      <>
        <Cabecalho titulo="Fechar turno" voltarPara={`/turma/${turmaId}`} />
        <Carregando />
      </>
    );
  }

  const comPendencia = data.criancas.filter((c) => !c.ausente && c.pendencias.length > 0);
  const semChamada = data.criancas.filter((c) => c.semPresenca && !c.ausente);

  return (
    <div className="min-h-full space-y-4 px-4 pb-10">
      <Cabecalho
        titulo="Fechar turno"
        subtitulo={data.turma.nome}
        voltarPara={`/turma/${turmaId}`}
      />

      {estadoFila.pendentes > 0 && (
        <Aviso>
          {estadoFila.pendentes} {estadoFila.pendentes === 1 ? 'registro' : 'registros'} ainda
          aguardando envio. Pode fechar o app — eles sobem sozinhos quando a rede voltar.
        </Aviso>
      )}

      {errosNaFila.length > 0 && (
        <Cartao className="space-y-2 border-[color:var(--color-alerta)]/30 p-4">
          <p className="font-semibold text-[color:var(--color-alerta)]">
            {errosNaFila.length}{' '}
            {errosNaFila.length === 1 ? 'registro não pôde' : 'registros não puderam'} ser gravado
          </p>
          {errosNaFila.map((item) => (
            <div key={item.clientId} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-[color:var(--color-tinta-suave)]">{item.erro}</span>
              <Botao
                variante="fantasma"
                onClick={() => void fila.descartar(item.clientId).then(() => setErrosNaFila([]))}
              >
                Descartar
              </Botao>
            </div>
          ))}
        </Cartao>
      )}

      {semChamada.length > 0 && (
        <Cartao className="p-4">
          <p className="font-semibold">Sem chamada</p>
          <p className="mb-2 text-sm text-[color:var(--color-tinta-suave)]">
            Ninguém marcou entrada ou falta para estas crianças.
          </p>
          <ul className="text-sm">
            {semChamada.map((c) => (
              <li key={c.id}>· {c.nomeSocial ?? c.nome}</li>
            ))}
          </ul>
        </Cartao>
      )}

      {comPendencia.length === 0 && semChamada.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-14 text-center">
          <CheckCircle2 size={36} className="text-[color:var(--color-ok)]" />
          <p className="text-base font-semibold">Turno completo</p>
          <p className="max-w-xs text-sm text-[color:var(--color-tinta-suave)]">
            Todas as crianças presentes têm a rotina registrada. As famílias já podem acompanhar.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {comPendencia.map((crianca) => (
            <Cartao key={crianca.id} className="p-3">
              <p className="font-semibold">{crianca.nomeSocial ?? crianca.nome}</p>
              <p className="text-sm text-[color:var(--color-tinta-suave)]">
                Falta registrar:{' '}
                {crianca.pendencias
                  .map((tipo) => ROTULOS_TIPO[tipo as TipoRegistro] ?? tipo)
                  .join(', ')}
              </p>
            </Cartao>
          ))}
        </ul>
      )}
    </div>
  );
}
