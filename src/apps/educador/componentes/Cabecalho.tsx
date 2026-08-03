import { ArrowLeft, CloudOff, CloudUpload, Check, Download } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFila } from '@/shared/offline/sincronizador';
import { useInstalacao } from '@/shared/pwa/instalacao';

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
    <header className="area-segura-topo sticky top-0 z-10 border-b border-[color:var(--color-borda)] bg-white/95 px-4 pb-3 backdrop-blur">
      <div className="flex items-center gap-3">
        {voltarPara && (
          <button
            onClick={() => navegar(voltarPara)}
            aria-label="Voltar"
            className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full active:bg-neutral-100"
          >
            <ArrowLeft size={20} />
          </button>
        )}

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold leading-tight">{titulo}</h1>
          {subtitulo && (
            <p className="truncate text-xs text-[color:var(--color-tinta-suave)]">{subtitulo}</p>
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
            className="flex h-9 w-9 items-center justify-center rounded-full text-[--cor-acao] active:bg-neutral-100"
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
  if (comErro > 0) {
    return (
      <span className="flex items-center gap-1 rounded-full bg-[color:var(--color-alerta-suave)] px-2.5 py-1 text-xs font-semibold text-[color:var(--color-alerta)]">
        <CloudOff size={14} /> {comErro}
      </span>
    );
  }

  if (!online) {
    return (
      <span className="flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600">
        <CloudOff size={14} /> {pendentes > 0 ? pendentes : 'sem rede'}
      </span>
    );
  }

  if (pendentes > 0 || enviando) {
    return (
      <span className="flex items-center gap-1 rounded-full bg-[--cor-acao-suave] px-2.5 py-1 text-xs font-semibold text-[--cor-acao]">
        <CloudUpload size={14} className={enviando ? 'animate-pulse' : ''} />
        {pendentes > 0 ? pendentes : 'enviando'}
      </span>
    );
  }

  return (
    <span
      className="flex items-center gap-1 rounded-full bg-[color:var(--color-ok-suave)] px-2.5 py-1 text-xs font-semibold text-[color:var(--color-ok)]"
      title="Tudo sincronizado"
    >
      <Check size={14} /> salvo
    </span>
  );
}
