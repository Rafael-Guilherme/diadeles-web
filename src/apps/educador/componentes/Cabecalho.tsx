import { ArrowLeft, CloudOff, CloudUpload, Check, Download } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFila } from '@/shared/offline/sincronizador';
import { useInstalacao } from '@/shared/pwa/instalacao';
import { Etiqueta } from '@/shared/ui/componentes';

/**
 * O indicador de fila fica sempre visível. Silêncio sobre o que ainda não subiu
 * destrói a confiança no app — o educador precisa saber, a qualquer momento,
 * que o trabalho dele está salvo (docs/plano-produto.md §8).
 */
export function Cabecalho({
  titulo,
  subtitulo,
  voltarPara,
  acao,
}: {
  titulo: string;
  subtitulo?: string;
  voltarPara?: string;
  acao?: ReactNode;
}) {
  const navegar = useNavigate();
  const fila = useFila();
  const { instalado } = useInstalacao();

  return (
    <header className="area-segura-topo sticky top-0 z-10 border-b border-[color:var(--color-borda)] bg-white/90 px-4 pb-3 backdrop-blur-md">
      <div className="flex items-center gap-2">
        {voltarPara && (
          <button
            onClick={() => navegar(voltarPara)}
            aria-label="Voltar"
            className="-ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[color:var(--color-tinta-suave)] transition active:bg-neutral-100"
          >
            <ArrowLeft size={20} />
          </button>
        )}

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg leading-tight">{titulo}</h1>
          {subtitulo && (
            <p className="truncate text-xs text-[color:var(--color-tinta-tenue)]">{subtitulo}</p>
          )}
        </div>

        {acao}
        <IndicadorFila
          pendentes={fila.pendentes}
          comErro={fila.comErro}
          enviando={fila.enviando}
          online={fila.online}
        />
        {!instalado && (
          <Link
            to="/instalar"
            aria-label="Instalar aplicativo"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-(color:--cor-acao) transition active:bg-neutral-100"
          >
            <Download size={18} />
          </Link>
        )}
      </div>
    </header>
  );
}

function IndicadorFila({
  pendentes,
  comErro,
  enviando,
  online,
}: {
  pendentes: number;
  comErro: number;
  enviando: boolean;
  online: boolean;
}) {
  // `numerico` mantém a contagem na mesma largura enquanto ela sobe e desce —
  // o número treme menos e o cabeçalho não empurra o título ao lado.
  const forma = 'shrink-0 px-2.5 py-1 numerico';

  if (comErro > 0) {
    return (
      <Etiqueta tom="alerta" className={forma} titulo="Registros que não puderam ser gravados">
        <CloudOff size={14} /> {comErro}
      </Etiqueta>
    );
  }

  if (!online) {
    return (
      <Etiqueta tom="neutro" className={forma} titulo="Sem rede — os registros ficam salvos aqui">
        <CloudOff size={14} /> {pendentes > 0 ? pendentes : 'sem rede'}
      </Etiqueta>
    );
  }

  if (pendentes > 0 || enviando) {
    return (
      <Etiqueta tom="marca" className={forma} titulo="Enviando o que foi registrado">
        <CloudUpload size={14} className={enviando ? 'animate-pulse' : ''} />
        {pendentes > 0 ? pendentes : 'enviando'}
      </Etiqueta>
    );
  }

  return (
    <Etiqueta tom="ok" className={forma} titulo="Tudo sincronizado">
      <Check size={14} /> salvo
    </Etiqueta>
  );
}
