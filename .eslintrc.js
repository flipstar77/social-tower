module.exports = {
    env: {
        node: true,
        es2021: true,
        jest: true,
    },
    extends: [
        'eslint:recommended',
        'prettier',
    ],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    rules: {
        'no-console': 'warn', // Warn on console.log (should use logger)
        'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        'prefer-const': 'error',
        'no-var': 'error',
    },
};
