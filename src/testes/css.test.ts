import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { build, type Rollup } from 'vite';
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * Guarda contra CSS que não aplica.
 *
 * Dois bugs reais escaparam de tudo que existia aqui — o typecheck passou, os
 * testes de render passaram, o build passou, e mesmo assim metade da interface
 * saía sem cor, sem raio e sem espaçamento:
 *
 *   1. `bg-[--cor-acao]` embrulhava em var() no Tailwind v3, mas no v4 emite
 *      `background-color: --cor-acao` — valor inválido, declaração descartada.
 *   2. `src/shared/**` ficava fora da varredura do Tailwind (a detecção
 *      automática parte do `root` do Vite, que é `src/apps/<app>`), então
 *      nenhuma classe usada só nos componentes compartilhados era gerada.
 *
 * Os dois são invisíveis para quem lê o código: a classe está escrita, o
 * componente renderiza, e o CSS simplesmente não existe. A única prova é a
 * folha construída — por isso este arquivo constrói de verdade em vez de
 * inspecionar o fonte.
 */

const RAIZ = resolve(__dirname, '../..');
const APPS = ['educador', 'responsavel', 'site'] as const;

/** Classes do projeto que não vêm do Tailwind e por isso não têm regra gerada. */
const NAO_SAO_UTILITARIAS = new Set([
  'display',
  'numerico',
  'area-segura-topo',
  'area-segura-base',
  'amostra-familia',
  'group',
]);

async function construirCss(app: (typeof APPS)[number]): Promise<string> {
  const saida = await build({
    configFile: resolve(RAIZ, `vite.config.${app}.ts`),
    logLevel: 'silent',
    build: { write: false, sourcemap: false, reportCompressedSize: false },
  });

  // `build` devolve um objeto por entrada; o plugin de PWA adiciona os seus.
  const pacotes = (Array.isArray(saida) ? saida : [saida]) as Rollup.RollupOutput[];
  const css = pacotes
    .flatMap((pacote) => pacote.output)
    .filter((arquivo) => arquivo.type === 'asset' && arquivo.fileName.endsWith('.css'))
    .map((arquivo) => String((arquivo as Rollup.OutputAsset).source))
    .join('\n');

  if (!css) throw new Error(`nenhum CSS emitido para ${app}`);
  return css;
}

/** Classes simples escritas nos componentes compartilhados. */
function classesDoCompartilhado(): string[] {
  const encontradas = new Set<string>();

  const varrer = (dir: string) => {
    for (const entrada of readdirSync(dir, { withFileTypes: true })) {
      const caminho = resolve(dir, entrada.name);
      if (entrada.isDirectory()) varrer(caminho);
      else if (entrada.name.endsWith('.tsx')) {
        const fonte = readFileSync(caminho, 'utf8');
        for (const [, bloco] of fonte.matchAll(/class(?:Name)?=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
          for (const classe of (bloco ?? '').split(/\s+/)) {
            // Só as simples: as de valor arbitrário e as com variante exigiriam
            // reproduzir o escape do Tailwind, e não é isso que está sob teste.
            if (/^[a-z][a-z0-9-]*$/.test(classe) && !NAO_SAO_UTILITARIAS.has(classe)) {
              encontradas.add(classe);
            }
          }
        }
      }
    }
  };

  varrer(resolve(RAIZ, 'src/shared'));
  return [...encontradas].sort();
}

describe('css construído', () => {
  const folhas = new Map<string, string>();

  beforeAll(async () => {
    for (const app of APPS) folhas.set(app, await construirCss(app));
  }, 120_000);

  it.each(APPS)('%s não emite declaração com valor de token cru', (app) => {
    // `cor: --token` em vez de `cor: var(--token)`: o navegador descarta a
    // declaração inteira e a regra some sem nenhum aviso.
    const cruas = [...folhas.get(app)!.matchAll(/[\w-]+:\s*--[a-zA-Z][\w-]*\s*[;}]/g)].map(
      ([trecho]) => trecho.trim(),
    );

    expect([...new Set(cruas)]).toEqual([]);
  });

  it.each(APPS)('%s gera as classes usadas em src/shared', (app) => {
    const css = folhas.get(app)!;
    const ausentes = classesDoCompartilhado().filter((classe) => {
      // O seletor pode ser composto (`.space-y-2>:not(:last-child)`), então o
      // que importa é o nome terminar ali — sem isso, `space-y-2` casaria com
      // `space-y-20` e a checagem passaria por acidente.
      const temRegra = new RegExp(`\\.${classe}(?![\\w-])`);
      return !temRegra.test(css);
    });

    expect(ausentes).toEqual([]);
  });
});
