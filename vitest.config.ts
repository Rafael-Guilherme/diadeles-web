import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

const alias = { '@': resolve(__dirname, 'src') };

/**
 * Dois projetos porque são dois tipos de teste com necessidades opostas.
 *
 * Os de render precisam de jsdom. O de CSS constrói os apps de verdade, e o
 * esbuild não roda sob jsdom: o `TextEncoder` de lá não devolve um `Uint8Array`
 * legítimo e o esbuild aborta na checagem de ambiente.
 */
export default defineConfig({
  test: {
    projects: [
      {
        plugins: [react()],
        resolve: { alias },
        test: {
          name: 'render',
          environment: 'jsdom',
          globals: true,
          setupFiles: ['./src/testes/preparo.ts'],
          include: ['src/**/*.test.tsx'],
          css: false,
        },
      },
      {
        resolve: { alias },
        test: {
          name: 'css',
          environment: 'node',
          globals: true,
          include: ['src/testes/css.test.ts'],
        },
      },
    ],
  },
});
