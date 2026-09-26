/**
 * A escola do app, lida do endereço: `app.diadeles.com.br/cantinho-feliz/…`
 * (docs/arquitetura.md §17.2).
 *
 * **Uma escola por carregamento de página.** A escola sai do primeiro trecho
 * do caminho quando a página abre e não muda até ela recarregar. É o que deixa
 * sessão, fila offline e caches presos a uma escola sem ninguém ter que
 * lembrar disso: trocar de escola é sempre navegação completa, e tudo o que
 * guarda estado nasce de novo com o nome certo.
 *
 * O React Router trabalha abaixo dela (`basename`), então as rotas do app —
 * `/turma/:id`, `/gestao/assinatura` — continuam escritas como sempre.
 */

const FORMA_DO_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** A escola que a página inicial abre na primeira visita. */
export const ESCOLA_INICIAL = import.meta.env.VITE_ESCOLA || 'demonstracao';

const CHAVE_ULTIMA_ESCOLA = 'diadeles.ultima-escola';
const CHAVE_ESCOLA_ANTERIOR = 'diadeles.escola-anterior';

/**
 * Primeiros trechos que são rota do app, e não escola. Um link antigo, de
 * antes da escola no endereço (`/instalar?convite=…`, `/turma/…`), cai aqui e
 * é levado para dentro da escola em vez de virar "escola não encontrada".
 * A API admin recusa esses nomes como endereço de escola pelo mesmo motivo.
 */
const ROTAS_DO_APP = new Set([
  'instalar',
  'redefinir-senha',
  'esqueci-senha',
  'trocar-senha',
  'turma',
  'gestao',
  'comunicados',
  'cardapio',
  'crianca',
  'avisos',
  'recado',
  'pareceres',
]);

/** `/cantinho-feliz/turma/1` → `cantinho-feliz`; `/`, `/instalar` → `null`. */
export function escolaDoCaminho(caminho: string): string | null {
  const primeiro = caminho.split('/').filter(Boolean)[0];
  if (!primeiro) return null;

  const slug = decodeURIComponent(primeiro).toLowerCase();
  if (!FORMA_DO_SLUG.test(slug) || slug.length > 40 || ROTAS_DO_APP.has(slug)) return null;
  return slug;
}

/**
 * Para onde vai quem abriu o app sem escola no endereço: a última escola
 * usada neste aparelho, ou a inicial do build.
 *
 * O resto do endereço é preservado — `/instalar?convite=X` vira
 * `/<escola>/instalar?convite=X`. E `?ir=/comunicados` escolhe a tela, que é
 * como os atalhos do app instalado funcionam sem saber a escola de antemão.
 */
export function destinoSemEscola(endereco: { pathname: string; search: string; hash: string }): string {
  const escola = ultimaEscola() ?? ESCOLA_INICIAL;
  const busca = new URLSearchParams(endereco.search);

  const ir = busca.get('ir');
  busca.delete('ir');
  // Só caminho interno: `//outro-site` seria um redirecionamento para fora.
  const tela = ir && ir.startsWith('/') && !ir.startsWith('//') ? ir : endereco.pathname;

  const resto = busca.toString();
  return `/${escola}${tela === '/' ? '/' : tela}${resto ? `?${resto}` : ''}${endereco.hash}`;
}

/** A escola desta página. Nos testes (endereço `/`), a inicial. */
export const ESCOLA: string =
  (typeof window !== 'undefined' ? escolaDoCaminho(window.location.pathname) : null) ??
  ESCOLA_INICIAL;

export function lembrarEscola(slug: string): void {
  try {
    const atual = localStorage.getItem(CHAVE_ULTIMA_ESCOLA);
    // A anterior fica guardada: se esta se revelar inexistente, é para ela que
    // a página inicial volta (esquecerEscola).
    if (atual && atual !== slug) localStorage.setItem(CHAVE_ESCOLA_ANTERIOR, atual);
    localStorage.setItem(CHAVE_ULTIMA_ESCOLA, slug);
  } catch {
    // Sem armazenamento (aba privada restrita): a página inicial abre a escola inicial.
  }
}

/**
 * Escola que não existe (ou foi encerrada) não pode prender a página inicial
 * num erro — e um endereço digitado errado não pode apagar a escola que a
 * pessoa usava antes. A última volta a ser a anterior.
 */
export function esquecerEscola(slug: string): void {
  try {
    if (localStorage.getItem(CHAVE_ULTIMA_ESCOLA) !== slug) return;

    const anterior = localStorage.getItem(CHAVE_ESCOLA_ANTERIOR);
    localStorage.removeItem(CHAVE_ESCOLA_ANTERIOR);
    if (anterior && anterior !== slug) localStorage.setItem(CHAVE_ULTIMA_ESCOLA, anterior);
    else localStorage.removeItem(CHAVE_ULTIMA_ESCOLA);
  } catch {
    /* idem */
  }
}

function ultimaEscola(): string | null {
  try {
    const guardada = localStorage.getItem(CHAVE_ULTIMA_ESCOLA);
    return guardada && FORMA_DO_SLUG.test(guardada) ? guardada : null;
  } catch {
    return null;
  }
}

/** Nome de armazenamento local desta escola: `diadeles.sessao` → `diadeles.sessao.cantinho-feliz`. */
export function daEscola(nome: string, escola = ESCOLA): string {
  return `${nome}.${escola}`;
}

/**
 * A sessão de antes da escola no endereço era uma chave só, `diadeles.sessao`,
 * e pertencia à única escola que aquele build atendia — a inicial. Ela é
 * levada para a chave da inicial uma vez, para quem estava dentro não ter que
 * entrar de novo à toa.
 *
 * Roda na carga deste módulo, antes de a sessão ser lida (`auth/sessao.ts`
 * importa este arquivo).
 */
export function migrarSessaoAntiga(): void {
  try {
    const antiga = localStorage.getItem('diadeles.sessao');
    if (antiga === null) return;

    const nova = daEscola('diadeles.sessao', ESCOLA_INICIAL);
    if (localStorage.getItem(nova) === null) localStorage.setItem(nova, antiga);
    localStorage.removeItem('diadeles.sessao');
  } catch {
    /* sem armazenamento, não há o que migrar */
  }
}

migrarSessaoAntiga();
