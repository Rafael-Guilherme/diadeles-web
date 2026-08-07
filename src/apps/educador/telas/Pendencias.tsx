import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { CheckCircle2, Send } from 'lucide-react';
import { api } from '@/shared/api/cliente';
import type { TipoRegistro } from '@/shared/offline/fila';
import { useFila } from '@/shared/offline/sincronizador';
import { fila } from '@/shared/offline/fila';
import { Aviso, Botao, Cartao, Carregando, Vazio } from '@/shared/ui/componentes';
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
        <Cartao interno className="space-y-2 border-[color:var(--color-alerta)]/30">
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
        <Cartao interno>
          <p className="font-semibold">Sem chamada</p>
          <p className="mb-2 text-sm text-[color:var(--color-tinta-suave)]">
            Ninguém marcou entrada ou falta para estas crianças.
          </p>
          <ul className="space-y-0.5 text-sm text-[color:var(--color-tinta-suave)]">
            {semChamada.map((c) => (
              <li key={c.id}>· {c.nomeSocial ?? c.nome}</li>
            ))}
          </ul>
        </Cartao>
      )}

      {comPendencia.length === 0 && semChamada.length === 0 ? (
        <Vazio
          icone={<CheckCircle2 size={24} className="text-[color:var(--color-ok)]" />}
          titulo="Turno completo"
          descricao="Todas as crianças presentes têm a rotina registrada. As famílias já podem acompanhar."
        />
      ) : (
        <ul className="space-y-(--gap-lista)">
          {comPendencia.map((crianca) => (
            <Cartao key={crianca.id} interno>
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

      {/* Disponível mesmo com pendências: uma criança sem registro de sono não
          pode impedir que as outras dezenove famílias saibam do dia. Um botão
          que só libera com tudo preenchido ensina o educador a preencher
          qualquer coisa para liberá-lo. */}
      <div className="space-y-3 pt-2">
        {fechar.data ? (
          <Aviso tom="ok">
            {fechar.data.familiasAvisadas > 0
              ? `Turno fechado. ${fechar.data.familiasAvisadas} ${
                  fechar.data.familiasAvisadas === 1 ? 'família recebeu' : 'famílias receberam'
                } o resumo do dia.`
              : 'Turno fechado. As famílias já tinham recebido o resumo de hoje.'}
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
        ) : (
          <Botao bloco disabled={fechar.isPending} onClick={() => fechar.mutate()}>
            {fechar.isPending ? (
              'Enviando…'
            ) : (
              <>
                <Send size={16} /> Fechar turno e avisar as famílias
              </>
            )}
          </Botao>
        )}

        {fechar.isError && (
          <Aviso>Não consegui fechar o turno agora. Verifique a conexão e tente de novo.</Aviso>
        )}

        {estadoFila.pendentes > 0 && !fechar.data && (
          <p className="text-center text-xs leading-relaxed text-[color:var(--color-tinta-suave)]">
            O que ainda está na fila sobe sozinho e entra no dia da criança — mas não entra neste
            resumo. Se der, espere a fila zerar antes de fechar.
          </p>
        )}
      </div>
    </div>
  );
}
