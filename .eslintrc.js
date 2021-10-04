module.exports = {
  root: true,
  env: {
    browser: true,
    node: true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    project: 'tsconfig.json',
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: ['plugin:prettier/recommended'],
  rules: {
    'linebreak-style': ['error', 'windows'],
    '@typescript-eslint/array-type': 'off',
    '@typescript-eslint/ban-types': [
      'error',
      {
        types: {
          Object: {
            message: 'Use {} instead.',
            fixWith: '{}'
          },
          '{}': false,
          String: {
            message: 'Use string instead.',
            fixWith: 'string'
          },
          Number: {
            message: 'Use number instead.',
            fixWith: 'number'
          },
          Boolean: {
            message: 'Use boolean instead.',
            fixWith: 'boolean'
          },
          Function: false
        }
      }
    ],
    '@typescript-eslint/consistent-type-assertions': 'error',
    '@typescript-eslint/consistent-type-definitions': 'error',
    '@typescript-eslint/dot-notation': 'error',
    '@typescript-eslint/explicit-member-accessibility': [
      'off',
      {
        accessibility: 'explicit'
      }
    ],
    // '@typescript-eslint/indent': [
    //   'error',
    //   2,
    //   {
    //     'FunctionDeclaration': {
    //       'parameters': 'first'
    //     },
    //     'FunctionExpression': {
    //       'parameters': 'first'
    //     }
    //   }
    // ],
    // '@typescript-eslint/naming-convention': 'error',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-empty-interface': 'error',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/no-for-in-array': 'error',
    '@typescript-eslint/no-inferrable-types': [
      'error',
      {
        ignoreParameters: true,
        ignoreProperties: true
      }
    ],
    '@typescript-eslint/no-misused-new': 'error',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-shadow': [
      'error',
      {
        hoist: 'all'
      }
    ],
    '@typescript-eslint/no-this-alias': 'error',
    '@typescript-eslint/no-unused-expressions': 0,
    '@typescript-eslint/prefer-function-type': 'error',
    '@typescript-eslint/type-annotation-spacing': 'error',
    '@typescript-eslint/unified-signatures': 'error',
    'arrow-body-style': 'error',
    'brace-style': ['error', '1tbs'],
    'comma-dangle': 'error',
    'constructor-super': 'error',
    curly: 'error',
    'eol-last': 'error',
    eqeqeq: ['error', 'smart'],
    'id-blacklist': [
      'error',
      'any',
      'Number',
      'number',
      'String',
      'string',
      'Boolean',
      'boolean',
      'Undefined',
      'undefined'
    ],
    'id-match': 'error',
    'new-parens': 'error',
    'no-bitwise': 'off',
    'no-caller': 'error',
    'no-cond-assign': 'error',
    'no-console': [
      'error',
      {
        allow: [
          'log',
          'warn',
          'dir',
          'timeLog',
          'assert',
          'clear',
          'count',
          'countReset',
          'group',
          'groupEnd',
          'table',
          'dirxml',
          'error',
          'groupCollapsed',
          'Console',
          'profile',
          'profileEnd',
          'timeStamp',
          'context'
        ]
      }
    ],
    'no-debugger': 'error',
    'no-duplicate-imports': 'error',
    'no-empty': 'off',
    'no-eval': 'error',
    'no-fallthrough': 'error',
    'no-invalid-this': 'error',
    'no-irregular-whitespace': 'error',
    'no-magic-numbers': 'off',
    'no-multiple-empty-lines': 'error',
    'no-new-wrappers': 'error',
    'no-redeclare': 'warn',
    'no-sparse-arrays': 'error',
    'no-throw-literal': 'error',
    'no-trailing-spaces': 'error',
    'no-undef-init': 'error',
    'no-underscore-dangle': 'off',
    'no-unused-labels': 'error',
    'no-var': 'error',
    'one-var': ['error', 'never'],
    'prefer-const': 'error',
    'prefer-object-spread': 'error',
    radix: 'error',
    'spaced-comment': [
      'error',
      'always',
      {
        markers: ['/']
      }
    ],
    'use-isnan': 'error',
    yoda: 'error'
  }
};
