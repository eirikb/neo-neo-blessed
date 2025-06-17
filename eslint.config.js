import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  // Base config for all files
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2018,
      sourceType: 'module',
      globals: {
        __: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    rules: {
      // ESLint recommended rules
      ...js.configs.recommended.rules,

      // Custom rules - lenient for legacy codebase
      'accessor-pairs': 'error',
      'array-bracket-spacing': ['error', 'never'],
      'arrow-spacing': ['error', { after: true, before: true }],
      'block-scoped-var': 'off', // Legacy code has some violations
      'block-spacing': 'error',
      'brace-style': 'off',
      camelcase: 'off',
      'comma-dangle': 'off',
      'comma-spacing': 'off',
      'comma-style': 'off', // Too many violations in legacy code
      complexity: 'off', // Disabled for legacy code
      'computed-property-spacing': ['error', 'never'],
      'consistent-return': 'off',
      curly: 'off',
      'default-case': 'off',
      'dot-location': ['error', 'property'],
      'dot-notation': 'off',
      'eol-last': 'off',
      eqeqeq: 'off', // Too many violations in legacy code
      'func-call-spacing': 'error',
      'func-names': 'off',
      'linebreak-style': ['error', 'unix'],
      'max-depth': 'off',
      'max-len': 'off',
      'no-alert': 'error',
      'no-array-constructor': 'error',
      'no-bitwise': 'off',
      'no-caller': 'error',
      'no-console': 'off',
      'no-continue': 'off',
      'no-debugger': 'warn',
      'no-duplicate-imports': 'error',
      'no-else-return': 'off',
      'no-empty-function': 'off',
      'no-eval': 'off',
      'no-extend-native': 'error',
      'no-extra-bind': 'error',
      'no-extra-parens': 'off',
      'no-implicit-coercion': 'off',
      'no-magic-numbers': 'off',
      'no-mixed-operators': 'off',
      'no-multi-spaces': 'off',
      'no-multiple-empty-lines': 'error',
      'no-nested-ternary': 'off',
      'no-new': 'error',
      'no-new-func': 'error',
      'no-new-object': 'error',
      'no-param-reassign': 'off',
      'no-plusplus': 'off',
      'no-proto': 'off',
      'no-prototype-builtins': 'off',
      'no-return-assign': 'off',
      'no-shadow': 'off',
      'no-tabs': 'error',
      'no-trailing-spaces': 'off',
      'no-undef-init': 'error',
      'no-undefined': 'off',
      'no-underscore-dangle': 'off',
      'no-unused-expressions': 'off',
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'no-use-before-define': 'off',
      'no-useless-computed-key': 'error',
      'no-useless-concat': 'off', // Some concatenations are intentional for readability
      'no-useless-constructor': 'error',
      'no-useless-escape': 'off',
      'no-var': 'off',
      'no-void': 'error',
      'no-warning-comments': 'off',
      'no-whitespace-before-property': 'error',
      'no-with': 'error',
      'object-curly-spacing': 'off',
      'one-var': 'off',
      'operator-linebreak': 'off',
      'padded-blocks': 'off',
      'prefer-const': 'off',
      quotes: 'off',
      radix: 'off',
      'require-await': 'off',
      semi: 'off',
      'semi-spacing': 'off',
      'space-in-parens': 'off',
      'space-infix-ops': 'off',
      'space-unary-ops': 'off',
      strict: 'off',
      'valid-jsdoc': 'off',
      yoda: 'off',
      'no-control-regex': 'off',
      'no-cond-assign': 'off',
      'no-extra-semi': 'off',
      'no-empty': 'off', // Legacy code has many empty catch blocks
      'no-new-func': 'off', // Legacy terminfo compilation uses Function constructor
      'no-self-assign': 'off', // Some intentional assignments in legacy code
      'no-fallthrough': 'off', // Legacy switch statements
      'no-global-assign': 'off', // Some intentional global modifications
    },
  },

  // TypeScript-specific config
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2018,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // TypeScript specific rules (lenient for migration)
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',

      // Disable base ESLint rules that conflict with TypeScript
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'no-redeclare': 'off',
    },
  },

  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'test-dist/**',
      'coverage/**',
      'build/**',
      '*.min.js',
      'vendor/**',
    ],
  },
];
