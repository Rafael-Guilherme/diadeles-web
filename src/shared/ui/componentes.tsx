import { useId, useState, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

/**
 * Componentes compartilhados pelos três builds.
 *
 * Nenhum valor de forma é fixado aqui: raio, sombra, altura de controle e
 * densidade vêm dos tokens que cada app define em `tema.css`. É isso que
 * permite o mesmo `Cartao` sair sóbrio no educador e caloroso na família sem
 * existirem dois componentes — e é a única diferença entre eles.
 */

type Variante = 'primario' | 'secundario' | 'fantasma' | 'perigo';

const VARIANTES: Record<Variante, string> = {
  primario:
    'bg-(color:--cor-acao) text-white active:brightness-90 hover:brightness-110 disabled:opacity-40 disabled:shadow-none',
  secundario:
    'bg-white text-[color:var(--color-tinta)] border border-[color:var(--color-borda-forte)] hover:bg-[color:var(--color-papel)] active:bg-neutral-100',
  fantasma:
    'text-[color:var(--color-tinta-suave)] hover:bg-[color:var(--color-papel)] active:bg-neutral-100',
  perigo: 'bg-[color:var(--color-alerta)] text-white active:brightness-90',
};

interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  bloco?: boolean;
  /**
   * `compacto` é a ação que acompanha uma linha de lista — "Registrar",
   * "Resolver", "Ver". Ela não é a ação da tela e não pode ter o peso de uma:
   * 36px de altura e 14px de texto deixam o título da linha respirar. Continua
   * fora do fluxo de registro, onde o alvo de 44px é regra.
   */
  tamanho?: 'normal' | 'compacto';
  children: ReactNode;
}

export function Botao({
  variante = 'primario',
  bloco = false,
  tamanho = 'normal',
  className = '',
  children,
  ...props
}: BotaoProps) {
  const compacto = tamanho === 'compacto';

  return (
    <button
      // A altura vem do tema — 44px no educador (alvo de toque para quem
      // registra com uma criança no colo) e 52px na família. Os 16px de texto
      // são a mesma medida do campo: botão e campo formam uma linha só.
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-(--raio) font-semibold transition duration-150 disabled:cursor-not-allowed ${
        compacto ? 'min-h-9 px-3 text-sm' : 'text-base'
      } ${VARIANTES[variante]} ${bloco ? 'w-full' : ''} ${className}`}
      style={{
        minHeight: compacto ? undefined : 'var(--altura-controle)',
        paddingInline: compacto ? undefined : 'var(--padding-controle)',
        boxShadow: variante === 'primario' ? 'var(--sombra-botao, none)' : undefined,
      }}
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
      className={`rounded-(--raio) border border-[color:var(--color-borda)] bg-white ${
        interno ? 'p-(--padding-cartao)' : ''
      } ${className}`}
      style={{ boxShadow: elevado ? 'var(--sombra-elevada)' : 'var(--sombra-cartao)' }}
      {...props}
    >
      {children}
    </div>
  );
}

const TONS_ETIQUETA = {
  neutro:
    'bg-[color:var(--color-papel)] text-[color:var(--color-tinta-suave)] border-[color:var(--color-borda)]',
  alerta:
    'bg-[color:var(--color-alerta-suave)] text-[color:var(--color-alerta)] border-[color:var(--color-alerta)]',
  ok: 'bg-[color:var(--color-ok-suave)] text-[color:var(--color-ok)] border-[color:var(--color-ok)]',
  marca: 'bg-(color:--cor-acao-suave) text-(color:--cor-acao-forte) border-(color:--cor-acao-borda)',
};

/**
 * Carimbo de estado.
 *
 * No educador ela é retangular e em versalete de 11px: o olho reconhece a
 * forma sem gastar uma leitura. Na família vira pílula de 12px, porque ali ela
 * também carrega conteúdo — "Sono · 1h20" é informação, não estado.
 */
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
  return (
    <span
      title={titulo}
      className={`inline-flex items-center gap-1.5 border font-semibold ${TONS_ETIQUETA[tom]} ${className}`}
      style={{
        borderRadius: 'var(--raio-etiqueta)',
        fontSize: 'var(--etiqueta-fonte)',
        padding: 'var(--etiqueta-padding)',
        textTransform: 'var(--etiqueta-caixa)' as never,
        letterSpacing: 'var(--etiqueta-tracking)',
        lineHeight: 1.2,
      }}
    >
      {children}
    </span>
  );
}

/** Bolinha de estado da etiqueta — cor nunca é o único portador, mas ajuda. */
export function Ponto({ className = '' }: { className?: string }) {
  return <span aria-hidden className={`h-1.5 w-1.5 shrink-0 rounded-full bg-current ${className}`} />;
}

/**
 * Iniciais da pessoa.
 *
 * Não é foto: mídia está adiada junto com o S3, e uma foto de criança carregada
 * de terceiro seria o pior lugar para começar. As iniciais dão âncora visual à
 * linha da lista sem prometer o que não existe.
 */
export function Avatar({
  nome,
  tamanho = 'md',
  className = '',
}: {
  nome: string;
  tamanho?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const iniciais = nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? '')
    .join('');

  const tamanhos = {
    sm: 'h-6 w-6 rounded-md text-2xs',
    md: 'h-8 w-8 rounded-(--raio-sm) text-xs',
    lg: 'h-11 w-11 rounded-(--raio) text-lg',
  };

  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center bg-(color:--cor-acao-suave) font-semibold text-(color:--cor-acao-forte) ${tamanhos[tamanho]} ${className}`}
    >
      {iniciais}
    </span>
  );
}

/**
 * Barra de progresso de leitura, não de espera.
 *
 * Ela responde "quanto falta" num relance — completude da criança, adesão da
 * turma, taxa de leitura do comunicado. O `valor` já vem em 0–1.
 */
export function Barra({
  valor,
  tom = 'marca',
  rotulo,
  className = '',
}: {
  valor: number;
  tom?: 'marca' | 'sol' | 'alerta';
  /** Descrição para leitor de tela — a barra sozinha não diz do que ela é. */
  rotulo: string;
  className?: string;
}) {
  const proporcao = Math.max(0, Math.min(1, valor));
  const cores = {
    marca: 'bg-[color:var(--color-marca-500)]',
    sol: 'bg-[color:var(--color-sol-500)]',
    alerta: 'bg-[color:var(--color-alerta)]',
  };

  return (
    <div
      role="progressbar"
      aria-label={rotulo}
      aria-valuenow={Math.round(proporcao * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--color-borda)] ${className}`}
    >
      <span className={`block h-full rounded-full ${cores[tom]}`} style={{ width: `${proporcao * 100}%` }} />
    </div>
  );
}

/**
 * Número do painel: valor grande em cima de um rótulo em versalete.
 *
 * A faixa de números do dia fica acima da lista de pendências e menor que ela,
 * de propósito — quem abre o painel precisa agir, não contemplar (4a).
 */
export function Metrica({
  rotulo,
  valor,
  apoio,
  tom = 'neutro',
}: {
  rotulo: string;
  valor: ReactNode;
  apoio?: ReactNode;
  tom?: 'neutro' | 'alerta';
}) {
  return (
    <div className="min-w-0">
      <p className="text-2xs font-medium uppercase tracking-[0.1em] text-[color:var(--color-tinta-tenue)]">
        {rotulo}
      </p>
      <p className="numerico mt-1 flex items-baseline gap-1.5">
        <span
          className={`text-2xl font-semibold ${tom === 'alerta' ? 'text-[color:var(--color-alerta)]' : ''}`}
        >
          {valor}
        </span>
        {apoio && <span className="text-sm text-[color:var(--color-tinta-suave)]">{apoio}</span>}
      </p>
    </div>
  );
}

/**
 * Vazio com saída.
 *
 * Alinhado à esquerda e dentro de uma moldura, não centralizado no meio de uma
 * tela em branco: o vazio aqui é um estado da lista, e o texto tem de dizer
 * por que está vazio e qual é a próxima ação (docs/plano-produto.md §9).
 */
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
    <div className="flex flex-col items-start gap-2 rounded-(--raio) border border-dashed border-[color:var(--color-borda-forte)] bg-[color:var(--color-papel)] p-6">
      <p className="text-lg font-semibold">{titulo}</p>
      {descricao && (
        <p className="max-w-prose text-sm leading-relaxed text-[color:var(--color-tinta-suave)]">
          {descricao}
        </p>
      )}
      {acao && <div className="mt-1">{acao}</div>}
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

/**
 * Esqueleto de linha, para a grade e as listas enquanto o dia carrega.
 *
 * Vale mais que um spinner centralizado porque já mostra a forma do que vem —
 * a educadora reconhece a grade antes de ela existir e não acha que errou de
 * tela.
 */
export function Esqueleto({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`block animate-pulse rounded-(--raio-sm) bg-[color:var(--color-borda)] ${className}`}
    />
  );
}

/**
 * Aviso com marcador.
 *
 * O quadradinho com "!" é o que faz a alergia sobreviver a uma olhada de dois
 * segundos: cor sozinha não passa em AA para quem não distingue vermelho, e
 * ícone sozinho não diz qual é o alimento (5d).
 */
export function Aviso({
  children,
  titulo,
  tom = 'alerta',
  acao,
}: {
  children?: ReactNode;
  titulo?: ReactNode;
  tom?: 'alerta' | 'ok' | 'neutro';
  acao?: ReactNode;
}) {
  const tons = {
    alerta: {
      caixa: 'border-[color:var(--color-alerta)] bg-[color:var(--color-alerta-suave)]',
      marca: 'bg-[color:var(--color-alerta)] text-white',
      titulo: 'text-[color:var(--color-sol-700)]',
      simbolo: '!',
    },
    ok: {
      caixa: 'border-[color:var(--color-ok)] bg-[color:var(--color-ok-suave)]',
      marca: 'bg-[color:var(--color-ok)] text-white',
      titulo: 'text-[color:var(--color-ok)]',
      simbolo: '✓',
    },
    neutro: {
      caixa: 'border-[color:var(--color-borda)] bg-[color:var(--color-papel)]',
      marca: 'bg-[color:var(--color-tinta-tenue)] text-white',
      titulo: 'text-[color:var(--color-tinta)]',
      simbolo: 'i',
    },
  }[tom];

  return (
    <div className={`flex items-start gap-2.5 rounded-(--raio) border p-(--padding-cartao) ${tons.caixa}`}>
      <span
        aria-hidden
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-(--raio-sm) text-xs font-bold ${tons.marca}`}
      >
        {tons.simbolo}
      </span>
      <div className="min-w-0 flex-1 text-sm leading-snug">
        {titulo && <p className={`font-semibold ${tons.titulo}`}>{titulo}</p>}
        {children && (
          <div className={titulo ? 'mt-0.5 text-[color:var(--color-tinta-suave)]' : 'font-medium'}>
            {children}
          </div>
        )}
      </div>
      {acao && <div className="shrink-0">{acao}</div>}
    </div>
  );
}

const CONTROLE =
  'w-full rounded-(--raio) border border-[color:var(--color-borda-forte)] bg-white px-3 text-[16px] leading-normal outline-none transition placeholder:text-[color:var(--color-tinta-tenue)] focus:border-(color:--cor-acao) focus:ring-2 focus:ring-(color:--cor-acao-suave) disabled:bg-[color:var(--color-papel)] disabled:text-[color:var(--color-tinta-suave)]';

const ALTURA_CONTROLE = { minHeight: 'var(--altura-controle)' };

/**
 * Rótulo de campo, na forma que cada identidade pede.
 *
 * Versalete tênue no educador — o formulário é denso e o rótulo não pode
 * competir com o valor digitado. Frase de 14px na família, onde o campo é raro
 * e a pessoa precisa entender o que está sendo pedido.
 */
export function RotuloCampo({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-[color:var(--rotulo-cor)]"
      style={{
        fontSize: 'var(--rotulo-fonte)',
        textTransform: 'var(--rotulo-caixa)' as never,
        letterSpacing: 'var(--rotulo-tracking)',
        fontWeight: 'var(--rotulo-peso)' as never,
      }}
    >
      {children}
    </label>
  );
}

/**
 * Campo de formulário com rótulo.
 *
 * O texto de 16px não é escolha estética: abaixo disso o Safari do iPhone dá
 * zoom ao focar o campo, e a secretaria digita o cadastro no celular.
 */
export function Campo({
  rotulo,
  apoio,
  erro,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { rotulo: string; apoio?: string; erro?: string }) {
  const id = useId();

  return (
    <div className="space-y-1.5">
      <RotuloCampo htmlFor={id}>{rotulo}</RotuloCampo>
      <input id={id} className={CONTROLE} style={ALTURA_CONTROLE} {...props} />
      {erro ? (
        <p className="text-xs text-[color:var(--color-alerta)]">{erro}</p>
      ) : (
        apoio && <p className="text-xs text-[color:var(--color-tinta-tenue)]">{apoio}</p>
      )}
    </div>
  );
}

export function Area({
  rotulo,
  apoio,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { rotulo: string; apoio?: string }) {
  const id = useId();

  return (
    <div className="space-y-1.5">
      <RotuloCampo htmlFor={id}>{rotulo}</RotuloCampo>
      <textarea id={id} rows={3} className={`${CONTROLE} py-2.5`} {...props} />
      {apoio && <p className="text-xs text-[color:var(--color-tinta-tenue)]">{apoio}</p>}
    </div>
  );
}

export function Selecao({
  rotulo,
  apoio,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { rotulo: string; apoio?: string }) {
  const id = useId();

  return (
    <div className="space-y-1.5">
      <RotuloCampo htmlFor={id}>{rotulo}</RotuloCampo>
      <select id={id} className={CONTROLE} style={ALTURA_CONTROLE} {...props}>
        {children}
      </select>
      {apoio && <p className="text-xs text-[color:var(--color-tinta-tenue)]">{apoio}</p>}
    </div>
  );
}

/**
 * Escolha entre poucas opções, sem abrir menu.
 *
 * A educadora escolhe o motivo da falta e a quantidade da refeição de pé, com
 * uma mão. Um `select` custaria dois toques e uma roleta do sistema; aqui todas
 * as opções ficam visíveis e cada uma é um alvo de 44px.
 */
export function Opcoes<T extends string>({
  rotulo,
  opcoes,
  valor,
  aoEscolher,
  colunas,
}: {
  rotulo: string;
  opcoes: readonly { valor: T; texto: ReactNode }[];
  valor: T | null;
  aoEscolher: (valor: T) => void;
  /** Fixa o número de colunas; sem isso as opções fluem e quebram sozinhas. */
  colunas?: number;
}) {
  return (
    // `min-w-0`: o `fieldset` do navegador nasce com `min-width: min-content`
    // e, sem isto, uma linha de quatro opções empurra a folha inteira para
    // fora da tela em vez de dividir o espaço que existe.
    <fieldset className="min-w-0 space-y-1.5">
      <legend className="sr-only">{rotulo}</legend>
      <RotuloCampo>{rotulo}</RotuloCampo>
      <div
        className="flex flex-wrap gap-2"
        style={colunas ? { display: 'grid', gridTemplateColumns: `repeat(${colunas}, minmax(0, 1fr))` } : undefined}
      >
        {opcoes.map((opcao) => {
          const escolhida = valor === opcao.valor;
          return (
            <button
              key={opcao.valor}
              type="button"
              aria-pressed={escolhida}
              onClick={() => aoEscolher(opcao.valor)}
              className={`inline-flex items-center justify-center rounded-(--raio) border px-3 text-base font-medium transition ${
                escolhida
                  ? 'border-(color:--cor-acao) bg-(color:--cor-acao) font-semibold text-white'
                  : 'border-[color:var(--color-borda-forte)] bg-white active:bg-[color:var(--color-papel)]'
              }`}
              style={ALTURA_CONTROLE}
            >
              {opcao.texto}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * Lista de itens curtos — alergia, restrição, condição de saúde.
 *
 * Um campo de texto livre com vírgulas seria mais rápido de programar e
 * traiçoeiro de ler: "amendoim, leite" viraria uma alergia só, e o educador
 * confere isso antes de servir o almoço. Cada item entra e sai isolado.
 */
export function ListaDeItens({
  rotulo,
  apoio,
  itens,
  onMudar,
  placeholder = 'Digite e toque em adicionar',
}: {
  rotulo: string;
  apoio?: string;
  itens: string[];
  onMudar: (itens: string[]) => void;
  placeholder?: string;
}) {
  const [rascunho, setRascunho] = useState('');
  const id = useId();

  function adicionar() {
    const valor = rascunho.trim();
    if (!valor || itens.includes(valor)) {
      setRascunho('');
      return;
    }
    onMudar([...itens, valor]);
    setRascunho('');
  }

  return (
    <div className="space-y-1.5">
      <RotuloCampo htmlFor={id}>{rotulo}</RotuloCampo>

      {itens.length > 0 && (
        <ul className="flex flex-wrap gap-1.5 pb-1">
          {itens.map((item) => (
            <li key={item}>
              <button
                type="button"
                onClick={() => onMudar(itens.filter((i) => i !== item))}
                aria-label={`Remover ${item}`}
                className="flex items-center gap-1.5 rounded-full bg-[color:var(--color-papel)] py-1.5 pl-3 pr-2 text-sm ring-1 ring-inset ring-[color:var(--color-borda)] transition active:scale-95"
              >
                {item}
                <span aria-hidden className="text-[color:var(--color-tinta-tenue)]">×</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          id={id}
          value={rascunho}
          placeholder={placeholder}
          onChange={(e) => setRascunho(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            // Enter dentro de um formulário submeteria o cadastro inteiro com
            // a alergia ainda por adicionar.
            e.preventDefault();
            adicionar();
          }}
          className={CONTROLE}
          style={ALTURA_CONTROLE}
        />
        <Botao type="button" variante="secundario" onClick={adicionar} disabled={!rascunho.trim()}>
          Adicionar
        </Botao>
      </div>

      {apoio && <p className="text-xs text-[color:var(--color-tinta-tenue)]">{apoio}</p>}
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
