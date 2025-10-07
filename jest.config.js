module.exports = {
    testEnvironment: 'node',
    coveragePathIgnorePatterns: ['/node_modules/', '/archive/'],
    testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
    collectCoverageFrom: [
        'server/**/*.js',
        '!server/node_modules/**',
        '!archive/**',
    ],
};
