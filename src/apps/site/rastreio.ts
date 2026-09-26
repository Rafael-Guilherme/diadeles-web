/**
 * O que os visitantes fazem no site: se abrem as demonstrações, se chegam aos
 * preços, que pergunta abrem.
 *
 * **Só o site.** Os apps do educador e da família não carregam analytics
 * nenhum — são telas com dado de criança, e a CSP deles continua fechada
 * (nginx-seguranca.inc).
 *
 * A ferramenta é o Umami, self-hosted: sem cookie e sem dado pessoal, então não
 * pede banner de consentimento, e os números ficam num servidor nosso. Tudo o
 * que fala com ele está neste arquivo — trocar de ferramenta é trocar `enviar`.
 *
 * Sem `VITE_ANALYTICS_URL` e `VITE_ANALYTICS_SITE` no build, nada é carregado
 * e nada é enviado.
 *
 * **Como marcar um clique:** `data-evento="nome"` no elemento, e cada
 * `data-evento-<campo>="valor"` vira um dado do evento. Não é preciso importar
 * nada no componente.
 */

type Dados = Record<string, string>;

declare global {
  interface Window {
    umami?: { track: (evento: string, dados?: Dados) => void };
  }
}

const URL_ANALYTICS = import.meta.env.VITE_ANALYTICS_URL || '';
const SITE_ANALYTICS = import.meta.env.VITE_ANALYTICS_SITE || '';

/** Eventos disparados antes de o script do Umami terminar de carregar. */
const fila: Array<[string, Dados | undefined]> = [];

export function rastreioLigado(): boolean {
  return Boolean(URL_ANALYTICS && SITE_ANALYTICS);
}

export function rastrear(evento: string, dados?: Dados): void {
  if (!rastreioLigado()) return;
  if (window.umami) enviar(evento, dados);
  else fila.push([evento, dados]);
}

function enviar(evento: string, dados?: Dados): void {
  try {
    window.umami?.track(evento, dados);
  } catch {
    // Analytics nunca pode quebrar a página.
  }
}

/** `data-evento-plano="Essencial"` → `{ plano: 'Essencial' }` */
export function dadosDoElemento(elemento: HTMLElement): Dados | undefined {
  const dados: Dados = {};
  for (const [chave, valor] of Object.entries(elemento.dataset)) {
    if (chave.startsWith('evento') && chave !== 'evento' && valor !== undefined) {
      const campo = chave.slice('evento'.length);
      dados[campo.charAt(0).toLowerCase() + campo.slice(1)] = valor;
    }
  }
  return Object.keys(dados).length > 0 ? dados : undefined;
}

export function iniciarRastreio(): void {
  if (!rastreioLigado()) return;

  const script = document.createElement('script');
  script.defer = true;
  script.src = `${URL_ANALYTICS.replace(/\/$/, '')}/script.js`;
  script.dataset.websiteId = SITE_ANALYTICS;
  // Quem pediu ao navegador para não ser rastreado não é.
  script.dataset.doNotTrack = 'true';
  script.onload = () => {
    for (const [evento, dados] of fila.splice(0)) enviar(evento, dados);
  };
  document.head.appendChild(script);

  // Um ouvinte só, no documento: pega também o que o React desenhar depois.
  document.addEventListener(
    'click',
    (evento) => {
      const alvo = (evento.target as HTMLElement | null)?.closest<HTMLElement>('[data-evento]');
      if (alvo?.dataset.evento) rastrear(alvo.dataset.evento, dadosDoElemento(alvo));
    },
    { capture: true },
  );

  // As perguntas frequentes são <details>. Conta o clique de quem abre — e não
  // o evento `toggle`, que dispara também para a primeira pergunta, que já
  // nasce aberta sem ninguém ter pedido.
  document.addEventListener(
    'click',
    (evento) => {
      const resumo = (evento.target as HTMLElement | null)?.closest('#perguntas summary');
      const detalhes = resumo?.parentElement;
      if (!(detalhes instanceof HTMLDetailsElement) || detalhes.open) return;
      const pergunta = resumo?.textContent?.trim();
      if (pergunta) rastrear('pergunta-abrir', { pergunta });
    },
    { capture: true },
  );

  observarSecoes((secao) => rastrear('secao-vista', { secao }));
}

/**
 * Até onde a pessoa rolou: cada seção com `id` conta uma vez por visita
 * quando aparece pela metade na tela. É o que responde "quantos chegaram aos
 * preços" sem precisar de clique.
 */
export function observarSecoes(aoVer: (secao: string) => void): void {
  if (typeof IntersectionObserver === 'undefined') return;

  const vistas = new Set<string>();
  const observador = new IntersectionObserver(
    (entradas) => {
      for (const entrada of entradas) {
        const id = (entrada.target as HTMLElement).id;
        if (!entrada.isIntersecting || vistas.has(id)) continue;
        vistas.add(id);
        aoVer(id);
        observador.unobserve(entrada.target);
      }
    },
    { threshold: 0.5 },
  );

  // As seções nascem depois do primeiro render do React, que não é síncrono:
  // tenta de novo até elas existirem (e desiste em cinco segundos — uma página
  // legal, por exemplo, não tem seção nenhuma).
  let tentativas = 0;
  const observar = () => {
    const secoes = document.querySelectorAll('main section[id]');
    if (secoes.length === 0 && tentativas++ < 50) {
      setTimeout(observar, 100);
      return;
    }
    secoes.forEach((secao) => observador.observe(secao));
  };
  observar();
}
