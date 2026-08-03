import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variante = 'primario' | 'secundario' | 'fantasma' | 'perigo';

const VARIANTES: Record<Variante, string> = {
  primario: 'bg-[--cor-acao] text-white active:brightness-90 disabled:opacity-40',
  secundario:
    'bg-white text-[color:var(--color-tinta)] border border-[color:var(--color-borda)] active:bg-neutral-50',
  fantasma: 'text-[color:var(--color-tinta-suave)] active:bg-neutral-100',
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
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-semibold transition disabled:cursor-not-allowed ${VARIANTES[variante]} ${bloco ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Cartao({
  children,
  className = '',
  ...props
}: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-[color:var(--color-borda)] bg-white ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function Etiqueta({
  children,
  tom = 'neutro',
}: {
  children: ReactNode;
  tom?: 'neutro' | 'alerta' | 'ok' | 'marca';
}) {
  const tons = {
    neutro: 'bg-neutral-100 text-neutral-600',
    alerta: 'bg-[color:var(--color-alerta-suave)] text-[color:var(--color-alerta)]',
    ok: 'bg-[color:var(--color-ok-suave)] text-[color:var(--color-ok)]',
    marca: 'bg-[--cor-acao-suave] text-[--cor-acao]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${tons[tom]}`}
    >
      {children}
    </span>
  );
}

export function Vazio({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <p className="text-base font-semibold">{titulo}</p>
      {descricao && (
        <p className="max-w-xs text-sm text-[color:var(--color-tinta-suave)]">{descricao}</p>
      )}
      {acao}
    </div>
  );
}

export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-[color:var(--color-tinta-suave)]">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600" />
      {texto}
    </div>
  );
}

export function Aviso({ children, tom = 'alerta' }: { children: ReactNode; tom?: 'alerta' | 'ok' }) {
  const tons = {
    alerta:
      'bg-[color:var(--color-alerta-suave)] text-[color:var(--color-alerta)] border-[color:var(--color-alerta)]/20',
    ok: 'bg-[color:var(--color-ok-suave)] text-[color:var(--color-ok)] border-[color:var(--color-ok)]/20',
  };

  return (
    <div className={`rounded-xl border px-3 py-2 text-sm font-medium ${tons[tom]}`}>{children}</div>
  );
}
