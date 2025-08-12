// @ts-check

import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import stylistic from '@stylistic/eslint-plugin'

const style = stylistic.configs.customize({
    arrowParens: true,
    blockSpacing: true,
    braceStyle: 'stroustrup',
    commaDangle: 'always-multiline',
    indent: 4,
    jsx: false,
    quoteProps: 'consistent-as-needed',
    // semi: true,
})

export default tseslint.config(
    {
        ignores: ['**/out', '**/dist', '**/*.d.ts'],
    },
    // _eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    eslint.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                ecmaVersion: 6,
                project: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        plugins: {
            '@stylistic': stylistic,
        },
        rules: {
            'curly': 'error',
            'eqeqeq': 'error',
            'no-throw-literal': 'error',
            ...style.rules,
            '@typescript-eslint/prefer-string-starts-ends-with': ['warn'],
            '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
            '@stylistic/max-statements-per-line': ['error', { max: 2 }], // mainly for arrow funcs not returning a value
            '@stylistic/indent': ['error', 4, { ignoredNodes: ['ConditionalExpression'], SwitchCase: 1 }],
            '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
            '@stylistic/wrap-iife': ['error', 'inside', { functionPrototypeMethods: true }],
        },
    },
)
