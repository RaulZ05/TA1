const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  {
    ignores: ['node_modules/**', 'dist/**', 'server/node_modules/**']
  },
  js.configs.recommended,
  {
    // Frontend: scripts clásicos que comparten ámbito global (sin modules)
    files: ['js/*.js'],
    languageOptions: {
      sourceType: 'script',
      globals: globals.browser
    },
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'no-empty': 'off'
    }
  },
  {
    // Backend y tests: CommonJS / Node
    files: ['server/**/*.js', 'tests/**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        fetch: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': 'off',
      'no-empty': 'off'
    }
  },
  {
    // Script de build: ESM
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      sourceType: 'module',
      globals: globals.node
    },
    rules: {
      'no-empty': 'off'
    }
  }
];