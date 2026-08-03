import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

/**
 * Componentes compartilhados pelos três builds.
 *
 * Nenhum valor de forma é fixado aqui: raio, sombra e densidade vêm dos tokens
 * que cada app define em `tema.css`. É isso que permite o mesmo `Cartao` sair
 * sóbrio no educador e caloroso na família sem existirem dois componentes.
 */

type Variante = 'primario' | 'secundario' | 'fantasma' | 'perigo';

const VARIANTES: Record<Variante, string> = {
  primario:
    'bg-(color:--cor-acao) text-white shadow-sm active:brightness-90 hover:brightness-110 disabled:opacity-40 disabled:shadow-none',
  secundario:
    'bg-white text-[color:var(--color-tinta)] border border-[color:var(--color-borda-forte)] hover:bg-[color:var(--color-papel)] active:bg-neutral-100',
  fantasma:
    'text-[color:var(--color-tinta-suave)] hover:bg-[color:var(--color-papel)] active:bg-neutral-100',
  perigo: 'bg-[color:var(--color-alerta)] text-white active:brightness-90',
};

interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  bloco?: boolean;
  children: ReactNode;
}

export function Botao({
  variante = 'primario',
  bloco = false,
  className = '',
  children,
  ...props
}: BotaoProps) {
  return (
    <button
      // min-h-11: alvo de toque confortável para quem registra com uma criança no colo
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-(--raio) px-4 text-sm font-semibold transition duration-150 disabled:cursor-not-allowed ${VARIANTES[variante]} ${bloco ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

interface CartaoProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Aplica o padding do tema. Desligue quando o conteúdo controla o próprio. */
  interno?: boolean;
  elevado?: boolean;
}

export function Cartao({
  children,
  className = '',
  interno = false,
  elevado = false,
  ...props
}: CartaoProps) {
  return (
    <div
      className={`rounded-(--raio-lg) border border-[color:var(--color-borda)] bg-white ${
        interno ? 'p-(--padding-cartao)' : ''
      } ${className}`}
      style={{ boxShadow: elevado ? 'var(--sombra-elevada)' : 'var(--sombra-cartao)' }}
      {...props}
    >
      {children}
    </div>
  );
}

export function Etiqueta({
  children,
  tom = 'neutro',
  titulo,
  className = '',
}: {
  children: ReactNode;
  tom?: 'neutro' | 'alerta' | 'ok' | 'marca';
  /** Vira `title`: use quando o rótulo é curto demais para se explicar sozinho. */
  titulo?: string;
  className?: string;
}) {
  const tons = {
    neutro:
      'bg-[color:var(--color-papel)] text-[color:var(--color-tinta-suave)] ring-[color:var(--color-borda)]',
    alerta:
      'bg-[color:var(--color-alerta-suave)] text-[color:var(--color-alerta)] ring-[color:var(--color-alerta)]/15',
    ok: 'bg-[color:var(--color-ok-suave)] text-[color:var(--color-ok)] ring-[color:var(--color-ok)]/15',
    marca: 'bg-(color:--cor-acao-suave) text-(color:--cor-acao) ring-(color:--cor-acao-borda)',
  };

  return (
    <span
      title={titulo}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold ring-1 ring-inset ${tons[tom]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Vazio({
  titulo,
  descricao,
  acao,
  icone,
}: {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
  icone?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      {icone && (
        <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-papel)] text-[color:var(--color-tinta-tenue)] ring-1 ring-[color:var(--color-borda)]">
          {icone}
        </span>
      )}
      <p className="text-base font-semibold">{titulo}</p>
      {descricao && (
        <p className="max-w-xs text-sm leading-relaxed text-[color:var(--color-tinta-suave)]">
          {descricao}
        </p>
      )}
      {acao && <div className="mt-2">{acao}</div>}
    </div>
  );
}

export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  return (
    <div className="flex items-center justify-center gap-2.5 py-14 text-sm text-[color:var(--color-tinta-suave)]">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[color:var(--color-borda-forte)] border-t-(color:--cor-acao)" />
      {texto}
    </div>
  );
}

export function Aviso({ children, tom = 'alerta' }: { children: ReactNode; tom?: 'alerta' | 'ok' }) {
  const tons = {
    alerta:
      'bg-[color:var(--color-alerta-suave)] text-[color:var(--color-alerta)] ring-[color:var(--color-alerta)]/20',
    ok: 'bg-[color:var(--color-ok-suave)] text-[color:var(--color-ok)] ring-[color:var(--color-ok)]/20',
  };

  return (
    <div
      className={`rounded-(--raio) px-3.5 py-2.5 text-sm font-medium leading-snug ring-1 ring-inset ${tons[tom]}`}
    >
      {children}
    </div>
  );
}

/**
 * Rótulo de um bloco de lista, com uma ação opcional à direita.
 *
 * Não é um `<h2>` de propósito: o texto costuma ser instrução ("toque para
 * selecionar"), e virar cabeçalho poluiria a navegação por títulos de quem
 * usa leitor de tela.
 */
export function RotuloSecao({ children, apoio }: { children: ReactNode; apoio?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <p className="text-2xs font-bold uppercase tracking-wider text-[color:var(--color-tinta-tenue)]">
        {children}
      </p>
      {apoio}
    </div>
  );
}
