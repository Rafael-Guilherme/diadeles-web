// @ts-check
import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';

/**
 * O `pnpm lint` existia no package.json sem nenhum arquivo de configuração ao
 * lado — o comando falhava antes de olhar uma linha de código. Isto é o que
 * faltava.
 *
 * O que justifica o arquivo é `react-hooks`: as regras de hooks pegam classes
 * de bug que nem o typecheck nem os testes de render alcançam — dependência
 * faltando num `useEffect`, hook dentro de condicional. São bugs que aparecem
 * só na terceira interação do usuário, e o educador com pressa é justamente
 * quem chega lá.
 */
export default [
  { ignores: ['dist/**', 'dev-dist/**', 'node_modules/**', 'src/shared/api/schema.d.ts'] },

  js.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2023,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: { '@typescript-eslint': tseslint, 'react-hooks': reactHooks },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      // O prefixo `_` é a convenção para parâmetro que existe só por posição.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // `const X` ao lado de `type X` ocupa espaços diferentes em TypeScript, e
      // o compilador já rejeita a redeclaração de verdade.
      'no-redeclare': 'off',

      // Estas duas não conhecem os globais do navegador nem os tipos globais do
      // TypeScript, e acusariam `window`, `Response` e nomes que só existem em
      // tempo de tipo. Identificador inexistente é trabalho do `tsc`, que faz
      // isso com muito mais precisão — inclusive dentro do service worker, que
      // roda em outro escopo global.
      'no-undef': 'off',
      'no-unused-vars': 'off',
    },
  },
];
