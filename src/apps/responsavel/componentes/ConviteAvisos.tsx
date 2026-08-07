import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, X } from 'lucide-react';
import { useAvisos } from '@/shared/push/avisos';
import { Botao, Cartao } from '@/shared/ui/componentes';

const CHAVE_DISPENSADO = 'diadeles.avisos.dispensado';

/**
 * O pedido de permissão, oferecido **depois do primeiro momento de valor** —
 * nunca no primeiro carregamento (docs/plano-produto.md §8).
 *
 * A diferença não é de etiqueta: permissão negada é definitiva no navegador,
 * só as configurações do sistema revertem. Pedir antes de a mãe ver o dia da
 * filha na tela troca a chance de avisá-la todos os dias por um "Bloquear"
 * reflexo. Por isso quem chama só monta este cartão quando já há algo
 * registrado na timeline.
 */
export function ConviteAvisos() {
  const { estado, ativando, ativar } = useAvisos();
  const [dispensado, setDispensado] = useState(
    () => localStorage.getItem(CHAVE_DISPENSADO) === 'sim',
  );
  const [recado, setRecado] = useState<string | null>(null);

  function dispensar() {
    localStorage.setItem(CHAVE_DISPENSADO, 'sim');
    setDispensado(true);
  }

  async function ligar() {
    const resultado = await ativar();

    if (resultado === 'ligado') return;
    if (resultado === 'negado') {
      setRecado(
        'Os avisos estão bloqueados para este site. Para reativar, é preciso liberar nas configurações do navegador.',
      );
      return;
    }
    if (resultado === 'sem-configuracao') {
      setRecado('Os avisos ainda não estão configurados no servidor da escola.');
      return;
    }
    setRecado('Não consegui ativar agora. Tente de novo daqui a pouco.');
  }

  if (dispensado || estado === 'ligado' || estado === 'indisponivel') return null;

  // No iPhone o push só existe com o app na tela de início. Pedir permissão
  // aqui falharia — o caminho é a página de instalação.
  if (estado === 'precisa-instalar') {
    return (
      <Cartao interno className="space-y-3">
        <Cabecalho titulo="Quer saber na hora?" onDispensar={dispensar} />
        <p className="text-sm leading-relaxed text-[color:var(--color-tinta-suave)]">
          No iPhone, os avisos funcionam depois de adicionar o app à tela de início. São três
          toques.
        </p>
        <Link to="/instalar">
          <Botao bloco>Adicionar à tela de início</Botao>
        </Link>
      </Cartao>
    );
  }

  return (
    <Cartao interno className="space-y-3">
      <Cabecalho titulo="Quer saber na hora?" onDispensar={dispensar} />
      <p className="text-sm leading-relaxed text-[color:var(--color-tinta-suave)]">
        Ative os avisos e receba o resumo do dia assim que a escola fechar o turno — sem precisar
        abrir o app para conferir.
      </p>
      <Botao bloco disabled={ativando || estado === 'negado'} onClick={() => void ligar()}>
        {ativando ? (
          'Ativando…'
        ) : (
          <>
            <Bell size={16} /> Ativar avisos
          </>
        )}
      </Botao>
      {recado && <p className="text-xs leading-relaxed text-[color:var(--color-alerta)]">{recado}</p>}
    </Cartao>
  );
}

function Cabecalho({ titulo, onDispensar }: { titulo: string; onDispensar: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <p className="flex items-center gap-2 font-semibold">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(color:--cor-acao-suave) text-(color:--cor-acao)">
          <Bell size={16} />
        </span>
        {titulo}
      </p>
      <button
        onClick={onDispensar}
        aria-label="Agora não"
        className="-m-2 p-2 text-[color:var(--color-tinta-tenue)]"
      >
        <X size={18} />
      </button>
    </div>
  );
}

/** Estado dos avisos na tela de avisos, onde ligar e desligar é explícito. */
export function ControleAvisos() {
  const { estado, ativando, ativar, desativar } = useAvisos();

  if (estado === 'indisponivel') return null;

  if (estado === 'ligado') {
    return (
      <div className="flex items-center justify-between gap-3 px-1 py-2">
        <p className="flex items-center gap-2 text-sm text-[color:var(--color-ok)]">
          <Check size={16} /> Avisos ativados neste aparelho
        </p>
        <button
          onClick={() => void desativar()}
          className="text-xs text-[color:var(--color-tinta-suave)] underline"
        >
          Desligar
        </button>
      </div>
    );
  }

  if (estado === 'precisa-instalar') {
    return (
      <Link to="/instalar" className="block">
        <Botao variante="secundario" bloco>
          <Bell size={16} /> Instalar o app para receber avisos
        </Botao>
      </Link>
    );
  }

  if (estado === 'negado') {
    return (
      <p className="px-1 text-xs leading-relaxed text-[color:var(--color-tinta-suave)]">
        Os avisos estão bloqueados nas configurações do navegador para este site.
      </p>
    );
  }

  return (
    <Botao variante="secundario" bloco disabled={ativando} onClick={() => void ativar()}>
      {ativando ? (
        'Ativando…'
      ) : (
        <>
          <Bell size={16} /> Ativar avisos neste aparelho
        </>
      )}
    </Botao>
  );
}
