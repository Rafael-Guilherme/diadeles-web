import { defineConfig, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'node:path';

export interface OpcoesApp {
  app: 'educador' | 'responsavel' | 'site';
  porta: number;
  nome: string;
  nomeCurto: string;
  descricao: string;
  corTema: string;
  corFundo: string;
  atalhos: { name: string; url: string }[];
  /**
   * O site institucional não é instalável: ninguém quer um ícone de página de
   * vendas na tela de início, e um service worker ali só serviria para servir
   * preço desatualizado.
   */
  pwa?: boolean;
}

/**
 * Um repositório, três builds: dois PWAs e o site.
 *
 * Os dois PWAs saem da mesma base (`src/shared`) mas têm manifests, ícones,
 * service worker e bundles próprios — porque as duas experiências são
 * opostas: o educador precisa de offline agressivo e o responsável não deve
 * cachear dado de criança sem necessidade (docs/plano-produto.md §5, §8).
 */
export function configurarApp(opcoes: OpcoesApp): UserConfig {
  const raiz = resolve(__dirname, 'src/apps', opcoes.app);
  const comPwa = opcoes.pwa ?? true;

  return defineConfig({
    root: raiz,
    publicDir: resolve(__dirname, 'public', opcoes.app),
    envDir: __dirname,
    resolve: {
      alias: { '@': resolve(__dirname, 'src') },
    },
    server: {
      port: opcoes.porta,
      strictPort: true,
    },
    preview: {
      port: opcoes.porta,
      strictPort: true,
    },
    build: {
      outDir: resolve(__dirname, 'dist', opcoes.app),
      emptyOutDir: true,
      sourcemap: true,
    },
    plugins: [
      react(),
      tailwind(),
      ...(!comPwa
        ? []
        : [
      VitePWA({
        // injectManifest, não generateSW: a fila de sincronização e o push são
        // nossos, não dá para delegar ao gerador padrão.
        strategies: 'injectManifest',
        srcDir: resolve(__dirname, 'src/sw'),
        // Uma entrada por app, sobre o mesmo corpo em `src/sw/base.ts`. É o que
        // dá ao service worker a identidade do build sem depender de `define`,
        // que não chega ao worker servido em desenvolvimento (src/sw/base.ts).
        filename: `sw.${opcoes.app}.ts`,
        // 'prompt' e nunca 'autoUpdate': recarregar por baixo de um educador no
        // meio da chamada perde trabalho e queima a confiança no app.
        registerType: 'prompt',
        injectRegister: 'auto',
        injectManifest: {
          globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        },
        devOptions: {
          enabled: true,
          type: 'module',
          navigateFallback: 'index.html',
        },
        manifest: {
          id: `/?app=${opcoes.app}`,
          name: opcoes.nome,
          short_name: opcoes.nomeCurto,
          description: opcoes.descricao,
          start_url: '/?origem=pwa',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait',
          lang: 'pt-BR',
          dir: 'ltr',
          theme_color: opcoes.corTema,
          background_color: opcoes.corFundo,
          categories: ['education', 'productivity'],
          icons: [
            { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            {
              src: 'pwa-maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          shortcuts: opcoes.atalhos,
        },
      }),
          ]),
    ],
  });
}
